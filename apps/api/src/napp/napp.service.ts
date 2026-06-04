import { Injectable } from '@nestjs/common';

// MOCK NAPP-сервис.
//
// Структура запроса/ответа повторяет реальный эндпоинт НАПП
// POST /api/provider/osago/vehicle (см. docs/integrations/NAPP_ENDPOINTS.md).
// Когда подключим реальный НАПП — заменим только внутренности getVehicleByTechPassport(),
// контракт (DTO + формат ответа) останется неизменным.
//
// Реальный ответ НАПП оборачивается в конверт { error, error_message, result }.

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
  /**
   * Имитирует POST /api/provider/osago/vehicle.
   * Возвращает данные ТС из гос. реестра по серии+номеру техпаспорта и госномеру.
   *
   * Тестовые сценарии:
   *  - techPassportNumber === '0000000' → "не найдено" (для проверки ветки ошибки)
   *  - иначе → детерминированно одно из заготовленных авто
   */
  getVehicleByTechPassport(
    techPassportSeria: string,
    techPassportNumber: string,
    govNumber: string,
  ): NappEnvelope<TechPassportInfo> {
    const seria = techPassportSeria.trim().toUpperCase();
    const number = techPassportNumber.trim();
    const gov = govNumber.trim().toUpperCase();

    // Тестовый кейс "не найдено"
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
}
