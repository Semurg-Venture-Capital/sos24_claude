import { Injectable, Logger } from '@nestjs/common';
import { EuroParticipant, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { MyidService, type MyIdUserData } from '../myid/myid.service';
import { NappService } from '../napp/napp.service';

@Injectable()
export class EuroprotocolService {
  private readonly logger = new Logger(EuroprotocolService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly myid: MyidService,
    private readonly napp: NappService,
  ) {}

  /**
   * Шаг-ап инициатора: подтверждаем, что физически присутствует владелец аккаунта.
   * MyID-лицо → сверяем ПИНФЛ с аккаунтом. Несовпадение → not ok.
   */
  async stepUp(userId: string, code: string): Promise<{ ok: boolean; pinfl: string }> {
    const profile = await this.myid.fetchProfileByCode(code);
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { pinfl: true } });
    const ok = !!user?.pinfl && user.pinfl === profile.pinfl;
    if (!ok) this.logger.warn(`step-up mismatch: account=${user?.pinfl} myid=${profile.pinfl}`);
    return { ok, pinfl: profile.pinfl };
  }

  /**
   * Верификация второго участника: MyID-профиль → find-or-create EuroParticipant
   * по ПИНФЛ. Возвращает запись участника (без сырого myidRaw).
   */
  async verifyParticipant(code: string): Promise<Omit<EuroParticipant, 'myidRaw'>> {
    const d = await this.myid.fetchProfileByCode(code);
    const { seria, number } = splitPassport(d.passportData);

    const data = {
      name: d.name || null,
      surname: d.surname || null,
      patronymic: d.patronymic || null,
      nameEn: d.nameEn,
      surnameEn: d.surnameEn,
      birthDate: d.birthDate ?? null,
      birthPlace: d.birthPlace,
      gender: d.gender,
      nationality: d.nationality,
      citizenship: d.citizenship,
      address: d.permanentAddress,
      passportSeria: seria,
      passportNumber: number,
      myidRaw: d.raw ? (d.raw as Prisma.InputJsonValue) : Prisma.JsonNull,
    };

    const participant = await this.prisma.euroParticipant.upsert({
      where: { pinfl: d.pinfl },
      create: { pinfl: d.pinfl, ...data },
      update: data,
    });

    const { myidRaw, ...safe } = participant;
    void myidRaw;
    return safe;
  }

  /**
   * Валидация полиса ОСАГО второго участника по серии+номеру через НАПП.
   */
  async validatePolicy(seria: string, number: string): Promise<{ valid: boolean; message: string; result: unknown }> {
    const env = await this.napp.getOsagoPolicyBySeriaNumber(seria, number);
    return {
      valid: env.error === 0 && !!env.result,
      message: env.error_message || '',
      result: env.result ?? null,
    };
  }
}

// "AA4587213" → seria "AA" + number "4587213"
function splitPassport(passportData: string | null | undefined): { seria: string | null; number: string | null } {
  if (!passportData) return { seria: null, number: null };
  const m = passportData.trim().match(/^([A-Za-zА-Яа-я]{2})\s*([0-9]{5,9})$/);
  if (!m) return { seria: null, number: passportData.trim() || null };
  return { seria: m[1].toUpperCase(), number: m[2] };
}
