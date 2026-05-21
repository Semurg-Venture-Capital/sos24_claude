import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { PrismaService } from '../prisma/prisma.service';

interface MyIdUserData {
  pinfl: string;
  surname: string;
  name: string;
  patronymic: string;
  birthDate: Date;
  passportSeries: string;
  passportNumber: string;
}

// Данные для mock-режима (соответствуют seed-пользователю).
const MOCK_USER_DATA: MyIdUserData = {
  pinfl: '12345678901234',
  surname: 'Каримов',
  name: 'Азиз',
  patronymic: 'Эркинович',
  birthDate: new Date('1990-05-14'),
  passportSeries: 'AA',
  passportNumber: '4587213',
};

@Injectable()
export class MyidService {
  private readonly isMock: boolean;
  private readonly baseUrl: string;
  private readonly clientId: string;
  private readonly clientSecret: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    this.isMock = this.config.get<string>('MYID_MOCK') === 'true';
    this.baseUrl = this.config.get<string>('MYID_BASE_URL') ?? 'https://myid.uz';
    this.clientId = this.config.get<string>('MYID_CLIENT_ID') ?? '';
    this.clientSecret = this.config.get<string>('MYID_CLIENT_SECRET') ?? '';
  }

  // Шаг 1: создать сессию на стороне MyID → вернуть sessionId мобильному приложению.
  async createSession(): Promise<{ sessionId: string }> {
    if (this.isMock) {
      return { sessionId: 'mock-session-id' };
    }

    const accessToken = await this.getAccessToken();
    const { data } = await axios.post<{ session_id: string }>(
      `${this.baseUrl}/api/v2/sdk/sessions`,
      { residency: 'RESIDENT' },
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
    return { sessionId: data.session_id };
  }

  // Шаг 2: SDK вернул code → получаем данные пользователя → обновляем юзера в БД.
  async verifyCode(userId: string, code: string): Promise<void> {
    const userData = this.isMock
      ? MOCK_USER_DATA
      : await this.fetchUserData(code);

    await this.applyVerification(userId, userData);
  }

  private async applyVerification(userId: string, data: MyIdUserData): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: {
          name: data.name,
          surname: data.surname,
          patronymic: data.patronymic,
          birthDate: data.birthDate,
          pinfl: data.pinfl,
          verificationStatus: 'MYID_VERIFIED',
        },
      }),
      this.prisma.document.upsert({
        where: { userId_kind: { userId, kind: 'PASSPORT' } },
        create: {
          userId,
          kind: 'PASSPORT',
          series: data.passportSeries,
          number: data.passportNumber,
          pinfl: data.pinfl,
          issuedAt: new Date('2020-01-01'), // MyID API вернёт реальную дату
          status: 'VERIFIED',
        },
        update: {
          series: data.passportSeries,
          number: data.passportNumber,
          pinfl: data.pinfl,
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

  private async fetchUserData(code: string): Promise<MyIdUserData> {
    const accessToken = await this.getAccessToken();
    const { data } = await axios.get<Record<string, string>>(
      `${this.baseUrl}/api/v1/sdk/data`,
      {
        params: { code },
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    );
    return {
      pinfl: data['pinfl'],
      surname: data['sur_name'] ?? data['surname'],
      name: data['first_name'] ?? data['name'],
      patronymic: data['mid_name'] ?? data['patronymic'] ?? '',
      birthDate: new Date(data['birth_date']),
      passportSeries: data['doc_series'] ?? data['passportSeries'] ?? '',
      passportNumber: data['doc_number'] ?? data['passportNumber'] ?? '',
    };
  }
}
