import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { NappAuthService } from './napp-auth.service';

// NAPP-сервис: живой вызов sandbox/prod + мок-фолбэк.
//
// Контракт (DTO + конверт { error, error_message, result } с TechPassportInfo)
// одинаков для мока и живого НАПП — мобильный клиент и контроллер не зависят
// от того, откуда пришли данные.
//
// Режимы (env):
//   NAPP_MOCK=true            → всегда мок (offline/demo, без сети)
//   NAPP_MOCK=false (default) → живой POST /api/provider/osago/vehicle
//   NAPP_MOCK_FALLBACK=true   → если живой НАПП вернул "не найдено"/ошибку сети,
//                               подставить детерминированный мок (удобно для демо,
//                               пока в sandbox нет наших тест-авто). Каждый фолбэк логируется.
//
// POST /api/provider/osago/vehicle (см. docs/integrations/NAPP_ENDPOINTS.md).

// Соответствует TechPassportInfo из НАПП OpenAPI.
export interface TechPassportInfo {
  techPassportIssueDate: string; // Дата выдачи техпаспорта
  issueYear: number;             // Год выпуска авто
  vehicleTypeId: number;         // Тип ТС (справочник /api/references/vehicle-types-osago)
  bodyNumber: string;            // Номер кузова
  engineNumber: string;          // Номер двигателя
  pVehicleId: string;            // Уникальный идентификатор ТС в гос. реестре
  govNumber: string;             // Госномер
  modelName: string;             // Марка + модель ("CHEVROLET COBALT")
  vehicleColor: string;          // Цвет
  division: string;              // Отдел регистрации ТС при УВДД
  fullWeight: string;            // Полная масса (кг)
  emptyWeight: string;           // Масса без нагрузки (кг)
  fuelType: string;              // Тип горючего
  seats: string;                 // Количество сидячих мест с водителем
  stands: string;                // Количество стоячих мест
  comment: string;               // Особые отметки
  pinfl: string;                 // ПИНФЛ владельца
  inn: string;                   // ИНН (если владелец — юрлицо)
  owner: string;                 // ФИО владельца
  horsePowers: string;           // Лошадиные силы
}

// Личные данные физлица (passport-birth-date-v2 / pinfl-v2).
export interface PersonInfoV2 {
  currentPinfl: string;
  pinfls: string[];
  currentDocument: string;
  documents: Array<{
    document: string;
    type: string;
    docgiveplace: string;
    docgiveplaceid: number;
    datebegin: string;
    dateend: string | null;
    status: number;
  }>;
  lastNameLatin: string;
  firstNameLatin: string;
  middleNameLatin: string;
  engName?: string;
  engSurname?: string;
  birthDate: string;
  birthPlace: string;
  birthCountry: string;
  gender: string;
  address: string;
  regionId: number;
  districtId: number;
}

// Карточка организации (/provider/inn) — основные поля.
export interface OrgInfo {
  name: string;
  nameShort: string;
  gdFullName: string;        // ФИО директора
  inn?: string;
  oked: string;
  okedTitle: string;
  bankName: string;
  bankMfo: string;
  account: string;
  address: string;
  regCertificate: string;
  regCertificateIssueDate: string;
  phone: string;
  fund: number;
  [k: string]: unknown;
}

// Водительское удостоверение (driver-license).
export interface DriverLicenseInfo {
  licenseNumber: string;
  licenseSeria: string;
  issueDate: string;
  pOwner: string;
  pOwnerDate: string;
  modelDLNew: string;
  [k: string]: unknown;
}

// Сводка по водителю (driver-summary-v2): личные данные + ВУ + КБМ.
export interface DriverSummaryInfo {
  DriverPersonInfo: PersonInfoV2 | null;
  DriverInfo: DriverLicenseInfo | null;
  DiscountInfo: unknown;
  coefficient: string | null; // КБМ
  [k: string]: unknown;
}

// Иностранное ТС (gtk-vehicle).
export interface ForeignVehicleInfo {
  citizenshipCode: string;
  passportNumber: string;
  passportSeria: string;
  vehicleType: string;
  firstName: string;
  lastName: string;
  [k: string]: unknown;
}

// Лицензия пассажироперевозчика (passenger-license).
export interface PassengerLicenseInfo {
  pSery: string;
  pNumber: string;
  pBeginDate: string;
  pEndDate: string;
  pTypeCode: string;
  [k: string]: unknown;
}

// Недвижимость по кадастру (cadaster).
export interface CadasterInfo {
  shortAddress: string;
  address: string;
  region: string;
  district: string;
  objectArea: string;
  cost: string;
  subjects: unknown;
  [k: string]: unknown;
}

// Конверт ответа НАПП (одинаков для всех эндпоинтов).
export interface NappEnvelope<T> {
  error: number;          // 0 = успех, иначе код ошибки
  error_message: string;  // текст ошибки
  result: T | null;
}

// Пул заготовленных авто (формат TechPassportInfo, без govNumber/pVehicleId — они генерируются).
const POOL: Array<Omit<TechPassportInfo, 'govNumber' | 'pVehicleId'>> = [
  {
    modelName: 'CHEVROLET COBALT', issueYear: 2021, vehicleTypeId: 1,
    bodyNumber: 'KL1JF6862MB123456', engineNumber: 'F15S3M789012',
    vehicleColor: 'Белый', horsePowers: '105', fullWeight: '1560', emptyWeight: '1180',
    fuelType: 'Бензин', seats: '5', stands: '0', division: 'УВД Юнусабадского района',
    comment: '', techPassportIssueDate: '2021-03-15', pinfl: '31905901234567', inn: '', owner: 'КАРИМОВ АЗИЗ ЭРКИНОВИЧ',
  },
  {
    modelName: 'CHEVROLET LACETTI', issueYear: 2018, vehicleTypeId: 1,
    bodyNumber: 'KL1NF35Z18K456789', engineNumber: 'F16D3K456123',
    vehicleColor: 'Серебристый', horsePowers: '109', fullWeight: '1610', emptyWeight: '1240',
    fuelType: 'Бензин', seats: '5', stands: '0', division: 'УВД Мирзо-Улугбекского района',
    comment: '', techPassportIssueDate: '2018-07-20', pinfl: '32001855512345', inn: '', owner: 'ЮСУПОВ САНЖАР ОДИЛОВИЧ',
  },
  {
    modelName: 'CHEVROLET SPARK', issueYear: 2019, vehicleTypeId: 1,
    bodyNumber: 'KL8MM5GA9JC789012', engineNumber: 'B10D1J789456',
    vehicleColor: 'Красный', horsePowers: '68', fullWeight: '1280', emptyWeight: '950',
    fuelType: 'Бензин', seats: '5', stands: '0', division: 'УВД Чиланзарского района',
    comment: '', techPassportIssueDate: '2019-05-10', pinfl: '41506901112233', inn: '', owner: 'РАХИМОВА НИЛУФАР БОБУРОВНА',
  },
  {
    modelName: 'CHEVROLET CAPTIVA', issueYear: 2020, vehicleTypeId: 2,
    bodyNumber: 'KL3CD2DA2LB345678', engineNumber: 'Z24SED345678',
    vehicleColor: 'Чёрный', horsePowers: '167', fullWeight: '2280', emptyWeight: '1720',
    fuelType: 'Бензин', seats: '7', stands: '0', division: 'УВД Яккасарайского района',
    comment: '', techPassportIssueDate: '2020-11-02', pinfl: '30708851234567', inn: '', owner: 'ТОШМАТОВ АЛИШЕР ФАРХОДОВИЧ',
  },
  {
    modelName: 'HYUNDAI SONATA', issueYear: 2019, vehicleTypeId: 1,
    bodyNumber: 'KMHE241ABKA654321', engineNumber: 'G4KDH654321',
    vehicleColor: 'Графитовый', horsePowers: '150', fullWeight: '1990', emptyWeight: '1470',
    fuelType: 'Бензин', seats: '5', stands: '0', division: 'УВД Шайхантахурского района',
    comment: '', techPassportIssueDate: '2019-09-18', pinfl: '31204901555666', inn: '', owner: 'ХАСАНОВ ДАВРОНБЕК ШУХРАТОВИЧ',
  },
  {
    modelName: 'HYUNDAI TUCSON', issueYear: 2022, vehicleTypeId: 2,
    bodyNumber: 'KMHJ381AANU222333', engineNumber: 'G4NAU222333',
    vehicleColor: 'Серый', horsePowers: '155', fullWeight: '2140', emptyWeight: '1560',
    fuelType: 'Бензин', seats: '5', stands: '0', division: 'УВД Сергелийского района',
    comment: '', techPassportIssueDate: '2022-02-28', pinfl: '32511921778899', inn: '', owner: 'МИРЗАЕВ ШЕРЗОД ГАЙРАТОВИЧ',
  },
  {
    modelName: 'KIA K5', issueYear: 2021, vehicleTypeId: 1,
    bodyNumber: 'KNALD4AJ7M5444555', engineNumber: 'G4KPM444555',
    vehicleColor: 'Синий', horsePowers: '180', fullWeight: '2010', emptyWeight: '1490',
    fuelType: 'Бензин', seats: '5', stands: '0', division: 'УВД Алмазарского района',
    comment: '', techPassportIssueDate: '2021-06-12', pinfl: '30902881223344', inn: '', owner: 'АБДУЛЛАЕВ ЖАСУР ИКРОМОВИЧ',
  },
  {
    modelName: 'TOYOTA CAMRY', issueYear: 2020, vehicleTypeId: 1,
    bodyNumber: 'JTNB11HK7L3666777', engineNumber: 'A25AL666777',
    vehicleColor: 'Белый', horsePowers: '181', fullWeight: '2065', emptyWeight: '1530',
    fuelType: 'Бензин', seats: '5', stands: '0', division: 'УВД Бектемирского района',
    comment: '', techPassportIssueDate: '2020-08-25', pinfl: '31107901334455', inn: '', owner: 'ИСМОИЛОВ ФАРРУХ БАХТИЁРОВИЧ',
  },
];

function hashCode(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (h << 5) - h + input.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

@Injectable()
export class NappService {
  private readonly logger = new Logger(NappService.name);
  private readonly isMock: boolean;
  private readonly mockFallback: boolean;
  private readonly baseUrl: string;
  private readonly senderPinfl: string;
  private txCounter = 1;

  constructor(
    private readonly config: ConfigService,
    private readonly auth: NappAuthService,
  ) {
    this.isMock = this.config.get<string>('NAPP_MOCK') === 'true';
    this.mockFallback = this.config.get<string>('NAPP_MOCK_FALLBACK') === 'true';
    this.baseUrl = (this.config.get<string>('NAPP_BASE_URL') ?? 'https://sandboxerspapiv2.e-osgo.uz').replace(/\/+$/, '');
    // ПИНФЛ страховой-отправителя для provider-запросов по людям.
    // На проде — реальный ПИНФЛ компании; дефолт — контрольно-валидный плейсхолдер sandbox.
    this.senderPinfl = this.config.get<string>('NAPP_SENDER_PINFL') ?? '31105899999999';
  }

  /** Авторизованный POST к НАПП с конвертом { error, error_message, result }. */
  private async post<T>(path: string, body: Record<string, unknown>): Promise<NappEnvelope<T>> {
    const token = await this.auth.getToken();
    const { data } = await axios.post<NappEnvelope<T>>(`${this.baseUrl}${path}`, body, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      timeout: 25_000,
      validateStatus: (s) => s < 500, // 404 "не найдено"/422 валидация — валидные бизнес-ответы
    });
    return data;
  }

  private async get<T>(path: string): Promise<NappEnvelope<T>> {
    const token = await this.auth.getToken();
    const { data } = await axios.get<NappEnvelope<T>>(`${this.baseUrl}${path}`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      timeout: 25_000,
      validateStatus: (s) => s < 500,
    });
    return data;
  }

  /**
   * Полис ОСАГО по серии+номеру. GET /api/v3/osago/insurance-form-show-by-seria-number.
   * Используется для валидации полиса второго участника европротокола.
   * NAPP_MOCK=true → всегда мок; NAPP_MOCK_FALLBACK=true → мок, если НАПП не нашёл/недоступен.
   */
  async getOsagoPolicyBySeriaNumber(seria: string, number: string): Promise<NappEnvelope<unknown>> {
    const ser = seria.trim();
    const num = number.trim();
    if (this.isMock) return this.mockPolicy(ser, num);

    const q = `seria=${encodeURIComponent(ser)}&number=${encodeURIComponent(num)}`;
    try {
      const env = await this.get(`/api/v3/osago/insurance-form-show-by-seria-number?${q}`);
      if ((env.error !== 0 || !env.result) && this.mockFallback) {
        this.logger.warn(`НАПП полис ${ser} ${num} не найден → NAPP_MOCK_FALLBACK → мок-полис`);
        return this.mockPolicy(ser, num);
      }
      return env;
    } catch (e) {
      this.logger.error(`getOsagoPolicyBySeriaNumber провалился: ${(e as Error).message}`);
      if (this.mockFallback) {
        this.logger.warn('НАПП недоступен → NAPP_MOCK_FALLBACK → мок-полис');
        return this.mockPolicy(ser, num);
      }
      return { error: 1, error_message: 'НАПП недоступен', result: null };
    }
  }

  /** Детерминированный мок-полис (для NAPP_MOCK=true и фолбэка). */
  private mockPolicy(seria: string, number: string): NappEnvelope<Record<string, unknown>> {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    const end = new Date(now.getFullYear(), 11, 31);
    return {
      error: 0,
      error_message: '',
      result: {
        seria: seria || 'OSG',
        number: number || '0000000',
        status: 'active',
        statusName: 'Действует',
        insuranceCompany: 'SOS24 Sugʻurta (mock)',
        startDate: start.toISOString().slice(0, 10),
        endDate: end.toISOString().slice(0, 10),
        isMock: true,
      },
    };
  }

  private nextTxId(): string {
    return String(Date.now()) + String(this.txCounter++);
  }

  /**
   * Данные ТС из гос. реестра по серии+номеру техпаспорта и госномеру.
   * POST /api/provider/osago/vehicle.
   *
   * Мок-режим (NAPP_MOCK=true):
   *  - techPassportNumber === '0000000' → "не найдено" (проверка ветки ошибки)
   *  - иначе → детерминированно одно из заготовленных авто
   */
  async getVehicleByTechPassport(
    techPassportSeria: string,
    techPassportNumber: string,
    govNumber: string,
  ): Promise<NappEnvelope<TechPassportInfo>> {
    const seria = techPassportSeria.trim().toUpperCase();
    const number = techPassportNumber.trim();
    const gov = govNumber.trim().toUpperCase();

    if (this.isMock) {
      return this.mockVehicle(seria, number, gov);
    }

    // Живой вызов НАПП
    try {
      const token = await this.auth.getToken();
      const { data } = await axios.post<NappEnvelope<TechPassportInfo>>(
        `${this.baseUrl}/api/provider/osago/vehicle`,
        { techPassportSeria: seria, techPassportNumber: number, govNumber: gov },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          timeout: 25_000,
          // НАПП на "не найдено" отвечает HTTP 404 с тем же конвертом — это валидный
          // бизнес-ответ, не сетевая ошибка. Принимаем любой <500.
          validateStatus: (s) => s < 500,
        },
      );

      if (data?.error === 0 && data.result) {
        return data;
      }

      // НАПП ответил "не найдено"/бизнес-ошибкой
      this.logger.warn(
        `NAPP vehicle не найден (seria=${seria} num=${number} gov=${gov}): error=${data?.error} "${data?.error_message}"`,
      );
      if (this.mockFallback) {
        this.logger.warn('NAPP_MOCK_FALLBACK=true → подставляю мок-авто');
        return this.mockVehicle(seria, number, gov);
      }
      return {
        error: data?.error ?? 404,
        error_message: data?.error_message || 'Транспортное средство не найдено в государственном реестре',
        result: null,
      };
    } catch (e) {
      const msg = axios.isAxiosError(e)
        ? `HTTP ${e.response?.status ?? 'timeout'} ${JSON.stringify(e.response?.data ?? e.message)}`
        : (e as Error).message;
      this.logger.error(`NAPP vehicle запрос провалился: ${msg}`);

      // 401 → токен мог протухнуть на стороне НАПП, сбрасываем кэш на след. раз
      if (axios.isAxiosError(e) && e.response?.status === 401) {
        this.auth.invalidate();
      }
      if (this.mockFallback) {
        this.logger.warn('NAPP недоступен, NAPP_MOCK_FALLBACK=true → подставляю мок-авто');
        return this.mockVehicle(seria, number, gov);
      }
      return {
        error: -1,
        error_message: 'Сервис НАПП временно недоступен. Заполните данные вручную.',
        result: null,
      };
    }
  }

  /** Детерминированный мок из POOL (для NAPP_MOCK=true и фолбэка). */
  private mockVehicle(seria: string, number: string, gov: string): NappEnvelope<TechPassportInfo> {
    if (number === '0000000') {
      return {
        error: 1,
        error_message: 'Транспортное средство не найдено в государственном реестре',
        result: null,
      };
    }
    const idx = hashCode(seria + number + gov) % POOL.length;
    const pVehicleId = `PV${hashCode(gov).toString().padStart(10, '0').slice(0, 10)}`;
    return {
      error: 0,
      error_message: '',
      result: { govNumber: gov, pVehicleId, ...POOL[idx] },
    };
  }

  /**
   * Карточка организации по ИНН. POST /api/provider/inn.
   * Используется когда владелец ТС — юрлицо.
   */
  async getOrganizationByInn(inn: string): Promise<NappEnvelope<OrgInfo>> {
    if (this.isMock) {
      return { error: 0, error_message: '', result: null };
    }
    try {
      return await this.post<OrgInfo>('/api/provider/inn', { inn: inn.trim() });
    } catch (e) {
      this.logger.error(`NAPP inn ${inn} провалился: ${(e as Error).message}`);
      return { error: -1, error_message: 'Сервис НАПП недоступен', result: null };
    }
  }

  /**
   * Личные данные по паспорту + дате рождения. POST /api/provider/passport-birth-date-v2.
   * @param document серия+номер паспорта ("AC2523171")
   * @param birthDate "YYYY-MM-DD"
   */
  async getPersonByPassport(document: string, birthDate: string): Promise<NappEnvelope<PersonInfoV2>> {
    try {
      return await this.post<PersonInfoV2>('/api/provider/passport-birth-date-v2', {
        transactionId: this.nextTxId(),
        isConsent: 'Y',
        senderPinfl: this.senderPinfl,
        document: document.trim().toUpperCase(),
        birthDate: birthDate.trim(),
      });
    } catch (e) {
      this.logger.error(`NAPP passport ${document} провалился: ${(e as Error).message}`);
      return { error: -1, error_message: 'Сервис НАПП недоступен', result: null };
    }
  }

  /**
   * Личные данные по ПИНФЛ. POST /api/provider/pinfl-v2.
   * @param pinfl ПИНФЛ субъекта
   * @param document любой его документ (серия+номер) — обязателен в запросе
   */
  async getPersonByPinfl(pinfl: string, document: string): Promise<NappEnvelope<PersonInfoV2>> {
    try {
      return await this.post<PersonInfoV2>('/api/provider/pinfl-v2', {
        transactionId: this.nextTxId(),
        isConsent: 'Y',
        senderPinfl: this.senderPinfl,
        document: document.trim().toUpperCase(),
        pinfl: pinfl.trim(),
      });
    } catch (e) {
      this.logger.error(`NAPP pinfl ${pinfl} провалился: ${(e as Error).message}`);
      return { error: -1, error_message: 'Сервис НАПП недоступен', result: null };
    }
  }

  /** Водительское удостоверение по ПИНФЛ. POST /api/provider/driver-license. */
  async getDriverLicense(pinfl: string, passportSeries?: string, passportNumber?: string): Promise<NappEnvelope<DriverLicenseInfo>> {
    return this.safePost<DriverLicenseInfo>('/api/provider/driver-license', {
      pinfl: pinfl.trim(),
      ...(passportSeries?.trim() && { passportSeries: passportSeries.trim().toUpperCase() }),
      ...(passportNumber?.trim() && { passportNumber: passportNumber.trim() }),
    });
  }

  /** Сводка по водителю (личные данные + ВУ + КБМ). POST /api/provider/driver-summary-v2. */
  async getDriverSummary(pinfl: string, document: string): Promise<NappEnvelope<DriverSummaryInfo>> {
    return this.safePost<DriverSummaryInfo>('/api/provider/driver-summary-v2', {
      transactionId: this.nextTxId(),
      isConsent: 'Y',
      senderPinfl: this.senderPinfl,
      document: document.trim().toUpperCase(),
      pinfl: pinfl.trim(),
    });
  }

  /** КБМ (бонус-малус) по ПИНФЛ. POST /api/provider/driver-coefficient. */
  async getDriverCoefficient(pinfl: string): Promise<NappEnvelope<{ coefficient: string }>> {
    return this.safePost<{ coefficient: string }>('/api/provider/driver-coefficient', { pinfl: pinfl.trim() });
  }

  /** Пенсионный статус. POST /api/provider/is-pensioner. */
  async getIsPensioner(pinfl: string, passportSeries: string, passportNumber: string): Promise<NappEnvelope<{ isPensioner: number }>> {
    return this.safePost<{ isPensioner: number }>('/api/provider/is-pensioner', {
      pinfl: pinfl.trim(),
      passportSeries: passportSeries.trim().toUpperCase(),
      passportNumber: passportNumber.trim(),
    });
  }

  /** Уже применённые скидки по паре ПИНФЛ+госномер. POST /api/provider/provided-discounts. */
  async getProvidedDiscounts(pinfl: string, govNumber: string): Promise<NappEnvelope<{ result: string; discounts: unknown[] }>> {
    return this.safePost('/api/provider/provided-discounts', {
      pinfl: pinfl.trim(),
      govNumber: govNumber.replace(/\s+/g, '').toUpperCase(),
    });
  }

  /** Иностранное ТС по госномеру. POST /api/provider/gtk-vehicle. */
  async getForeignVehicle(govNumber: string): Promise<NappEnvelope<ForeignVehicleInfo>> {
    return this.safePost<ForeignVehicleInfo>('/api/provider/gtk-vehicle', {
      govNumber: govNumber.replace(/\s+/g, '').toUpperCase(),
    });
  }

  /** Лицензия пассажироперевозчика по госномеру. POST /api/provider/passenger-license. */
  async getPassengerLicense(govNumber: string): Promise<NappEnvelope<PassengerLicenseInfo>> {
    return this.safePost<PassengerLicenseInfo>('/api/provider/passenger-license', {
      govNumber: govNumber.replace(/\s+/g, '').toUpperCase(),
    });
  }

  /** Недвижимость по кадастровому номеру. POST /api/provider/cadaster. */
  async getCadaster(cadasterNumber: string): Promise<NappEnvelope<CadasterInfo>> {
    return this.safePost<CadasterInfo>('/api/provider/cadaster', { cadasterNumber: cadasterNumber.trim() });
  }

  /** Обёртка post() с единым перехватом ошибок → конверт вместо исключения. */
  private async safePost<T>(path: string, body: Record<string, unknown>): Promise<NappEnvelope<T>> {
    try {
      return await this.post<T>(path, body);
    } catch (e) {
      this.logger.error(`NAPP ${path} провалился: ${(e as Error).message}`);
      return { error: -1, error_message: 'Сервис НАПП недоступен', result: null };
    }
  }
}
