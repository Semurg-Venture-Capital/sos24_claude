import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { PrismaService } from '../prisma/prisma.service';

// Все поля которые возвращает MyID SDK после верификации.
// Структура: profile.common_data + profile.doc_data + profile.address + profile.contacts
// + служебные: comparison_value (liveness score), job_id, reuid.
// Документация: https://docs.myid.uz/#/
interface MyIdUserData {
  // common_data
  pinfl: string;
  name: string;              // first_name (кириллица)
  surname: string;           // last_name (кириллица)
  patronymic: string;        // middle_name (кириллица)
  nameEn: string | null;     // first_name_en (латиница)
  surnameEn: string | null;  // last_name_en (латиница)
  birthDate: Date;
  birthPlace: string | null;
  gender: string | null;     // 'M' | 'F'
  nationality: string | null;
  citizenship: string | null;

  // doc_data (паспорт)
  passportData: string;       // pass_data = "AA4587213"
  passportIssuedBy: string | null;
  passportIssuedAt: Date | null;
  passportExpiresAt: Date | null;

  // address
  permanentAddress: string | null;

  // служебные
  comparisonValue: number | null;  // liveness score 0.0–1.0
  jobId: string | null;

  // полный сырой ответ API — для myidRaw JSONB
  raw: Record<string, unknown>;
}

// Мок-данные соответствуют seed-пользователю (+998993286330 Азиз Каримов).
const MOCK_USER_DATA: MyIdUserData = {
  pinfl: '12345678901234',
  name: 'Азиз',
  surname: 'Каримов',
  patronymic: 'Эркинович',
  nameEn: 'Aziz',
  surnameEn: 'Karimov',
  birthDate: new Date('1990-05-14'),
  birthPlace: 'Тошкент шаҳри',
  gender: 'M',
  nationality: 'UZB',
  citizenship: 'UZB',
  passportData: 'AA4587213',
  passportIssuedBy: 'УВД ЮНУСАБАДСКОГО Р-НА',
  passportIssuedAt: new Date('2020-03-15'),
  passportExpiresAt: new Date('2030-03-15'),
  permanentAddress: 'Тошкент шаҳри, Юнусобод тумани',
  comparisonValue: 0.98,
  jobId: 'mock-job-id',
  raw: { _mock: true },
};

export interface MyIdSessionResult {
  sessionId: string;
  clientHash: string;
  clientHashId: string;
  environment: string;
}

@Injectable()
export class MyidService {
  private readonly isMock: boolean;
  private readonly baseUrl: string;
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly clientHash: string;
  private readonly clientHashId: string;
  private readonly environment: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    this.isMock = this.config.get<string>('MYID_MOCK') === 'true';
    this.baseUrl = this.config.get<string>('MYID_BASE_URL') ?? 'https://api.myid.uz';
    this.clientId = this.config.get<string>('MYID_CLIENT_ID') ?? '';
    this.clientSecret = this.config.get<string>('MYID_CLIENT_SECRET') ?? '';
    this.clientHash = this.config.get<string>('MYID_CLIENT_HASH') ?? '';
    this.clientHashId = this.config.get<string>('MYID_CLIENT_HASH_ID') ?? '';
    this.environment = this.config.get<string>('MYID_ENVIRONMENT') ?? 'production';
  }

  // Шаг 1: создать сессию MyID → вернуть sessionId + SDK-конфиг мобильному приложению.
  // pinfl опционален: если передан — SDK пропускает экран ввода паспорта.
  async createSession(pinfl?: string): Promise<MyIdSessionResult> {
    const sdkConfig = {
      clientHash: this.clientHash,
      clientHashId: this.clientHashId,
      environment: this.environment,
    };

    if (this.isMock) {
      return { sessionId: 'mock-session-id', ...sdkConfig };
    }

    const accessToken = await this.getAccessToken();
    const body: Record<string, unknown> = { is_resident: true };
    if (pinfl) body['pinfl'] = pinfl;

    const { data } = await axios.post<{ session_id: string }>(
      `${this.baseUrl}/api/v2/sdk/sessions`,
      body,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
    return { sessionId: data.session_id, ...sdkConfig };
  }

  // Шаг 2: SDK вернул code → получаем данные пользователя → обновляем юзера в БД.
  async verifyCode(userId: string, code: string): Promise<void> {
    const userData = this.isMock
      ? MOCK_USER_DATA
      : await this.fetchUserData(code);

    await this.applyVerification(userId, userData);
  }

  private async applyVerification(userId: string, d: MyIdUserData): Promise<void> {
    // Разбиваем passportData "AA4587213" → series "AA" + number "4587213"
    const passportSeries = d.passportData.slice(0, 2);
    const passportNumber = d.passportData.slice(2);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: {
          // Основные поля профиля
          name: d.name,
          surname: d.surname,
          patronymic: d.patronymic,
          birthDate: d.birthDate,
          pinfl: d.pinfl,
          verificationStatus: 'MYID_VERIFIED',
          // Дополнительные поля MyID
          nameEn: d.nameEn,
          surnameEn: d.surnameEn,
          gender: d.gender,
          birthPlace: d.birthPlace,
          nationality: d.nationality,
          citizenship: d.citizenship,
          address: d.permanentAddress,
          myidRaw: d.raw as object,
        },
      }),
      this.prisma.document.upsert({
        where: { userId_kind: { userId, kind: 'PASSPORT' } },
        create: {
          userId,
          kind: 'PASSPORT',
          series: passportSeries,
          number: passportNumber,
          pinfl: d.pinfl,
          issuedAt: d.passportIssuedAt ?? new Date(),
          issuedBy: d.passportIssuedBy,
          expiresAt: d.passportExpiresAt,
          status: 'VERIFIED',
        },
        update: {
          series: passportSeries,
          number: passportNumber,
          pinfl: d.pinfl,
          issuedAt: d.passportIssuedAt ?? new Date(),
          issuedBy: d.passportIssuedBy,
          expiresAt: d.passportExpiresAt,
          status: 'VERIFIED',
        },
      }),
    ]);
  }

  private async getAccessToken(): Promise<string> {
    try {
      const { data } = await axios.post<{ access_token: string }>(
        `${this.baseUrl}/api/v1/auth/clients/access-token`,
        { client_id: this.clientId, client_secret: this.clientSecret },
      );
      return data.access_token;
    } catch {
      throw new InternalServerErrorException('MyID auth failed');
    }
  }

  // Разбирает ответ GET /api/v1/sdk/data (MyID v2 nested format).
  // При подключении реальных ключей адаптировать под фактическую структуру ответа.
  // Полная структура: UserDataResponse.data.profile.{common_data, doc_data, address, contacts}
  private async fetchUserData(code: string): Promise<MyIdUserData> {
    const accessToken = await this.getAccessToken();
    const { data: resp } = await axios.get<Record<string, unknown>>(
      `${this.baseUrl}/api/v1/sdk/data`,
      {
        params: { code },
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    );

    // MyID v2 вернёт вложенную структуру: resp.data.profile.*
    // MyID v1 вернул плоскую структуру: resp.pinfl, resp.sur_name, ...
    // Поддерживаем оба варианта до уточнения версии.
    const d = resp as Record<string, unknown>;
    const profile = (d['data'] as Record<string, unknown>)?.['profile'] as Record<string, unknown> | undefined;
    const common = profile?.['common_data'] as Record<string, unknown> | undefined;
    const doc = profile?.['doc_data'] as Record<string, unknown> | undefined;
    const addr = profile?.['address'] as Record<string, unknown> | undefined;

    // Вложенный v2
    if (common) {
      return {
        pinfl: common['pinfl'] as string,
        name: common['first_name'] as string,
        surname: common['last_name'] as string,
        patronymic: (common['middle_name'] as string | null) ?? '',
        nameEn: (common['first_name_en'] as string | null) ?? null,
        surnameEn: (common['last_name_en'] as string | null) ?? null,
        birthDate: new Date(common['birth_date'] as string),
        birthPlace: (common['birth_place'] as string | null) ?? null,
        gender: (common['gender'] as string | null) ?? null,
        nationality: (common['nationality'] as string | null) ?? null,
        citizenship: (common['citizenship'] as string | null) ?? null,
        passportData: (doc?.['pass_data'] as string) ?? '',
        passportIssuedBy: (doc?.['issued_by'] as string | null) ?? null,
        passportIssuedAt: doc?.['issued_date'] ? new Date(doc['issued_date'] as string) : null,
        passportExpiresAt: doc?.['expiry_date'] ? new Date(doc['expiry_date'] as string) : null,
        permanentAddress: (addr?.['permanent_address'] as string | null) ?? null,
        comparisonValue: ((d['data'] as Record<string, unknown>)?.['comparison_value'] as number | null) ?? null,
        jobId: ((d['data'] as Record<string, unknown>)?.['job_id'] as string | null) ?? null,
        raw: resp,
      };
    }

    // Плоский v1 (старый формат)
    return {
      pinfl: d['pinfl'] as string,
      name: (d['first_name'] ?? d['name']) as string,
      surname: (d['sur_name'] ?? d['surname']) as string,
      patronymic: ((d['mid_name'] ?? d['patronymic']) as string | null) ?? '',
      nameEn: null,
      surnameEn: null,
      birthDate: new Date(d['birth_date'] as string),
      birthPlace: null,
      gender: null,
      nationality: null,
      citizenship: null,
      passportData: ((d['doc_series'] as string) ?? '') + ((d['doc_number'] as string) ?? ''),
      passportIssuedBy: null,
      passportIssuedAt: d['doc_given_date'] ? new Date(d['doc_given_date'] as string) : null,
      passportExpiresAt: d['doc_expiry_date'] ? new Date(d['doc_expiry_date'] as string) : null,
      permanentAddress: (d['permanent_address'] as string | null) ?? null,
      comparisonValue: null,
      jobId: null,
      raw: resp,
    };
  }
}
