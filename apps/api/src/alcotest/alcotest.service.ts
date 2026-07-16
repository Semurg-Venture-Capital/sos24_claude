import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MinioService } from '../files/minio.service';

// Приём данных алкотестера Alcostop 8000S (SOAP AddData). См. память
// project-alcostop-integration: поля, фото base64, ACK.
@Injectable()
export class AlcoTestService {
  private readonly logger = new Logger(AlcoTestService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly minio: MinioService,
  ) {}

  // Один SOAP-конверт от прибора → запись AlcoTest (+ фото в MinIO).
  async ingest(xml: string): Promise<void> {
    if (!xml || !xml.includes('AddData')) {
      this.logger.warn('alcotest: пустой/невалидный SOAP');
      return;
    }
    const deviceType = this.field(xml, 'DEVICETYPE');
    const carLicense = this.field(xml, 'CARLICENSE');
    const checkValue = this.field(xml, 'CHECKVALUE');
    const checkDateTime = this.parseDate(this.field(xml, 'CHECKDATETIME'));
    const uploadTime = this.parseDate(this.field(xml, 'UPLOADTIME'));
    const driverName = this.field(xml, 'DRIVERNAME');
    const officerName = this.field(xml, 'OFFICERNAME');
    const officerId = this.field(xml, 'OFFICERID');
    const officerUnit = this.field(xml, 'OFFICERUNITNAME');
    const address = this.field(xml, 'ADDRESS');

    // Значение: либо число («0.000»), либо фраза («Нет алкоголя»).
    const norm = checkValue.replace(',', '.');
    const checkValueNum = /^-?\d+(\.\d+)?$/.test(norm) ? parseFloat(norm) : null;
    const positive = checkValueNum != null ? checkValueNum > 0 : false;

    // Фото испытуемого (AUTOGRAPH2, base64 JPEG) — опционально.
    let photoKey: string | null = null;
    const b64 = this.field(xml, 'AUTOGRAPH2');
    if (b64 && b64.length > 100) {
      try {
        const buf = Buffer.from(b64, 'base64');
        photoKey = await this.minio.put(buf, 'image/jpeg', undefined, 'alcotest');
      } catch (e) {
        this.logger.warn(`alcotest: фото не сохранено: ${(e as Error).message}`);
      }
    }

    await this.prisma.alcoTest.create({
      data: {
        deviceType: deviceType || null,
        carLicense: carLicense || null,
        checkValue: checkValue || null,
        checkValueNum,
        positive,
        checkDateTime,
        uploadTime,
        driverName: driverName || null,
        officerName: officerName || null,
        officerId: officerId || null,
        officerUnit: officerUnit || null,
        address: address || null,
        photoKey,
        raw: xml.length < 400_000 ? xml : null,
      },
    });
    this.logger.log(
      `alcotest: принят тест ${deviceType} value="${checkValue}" plate="${carLicense}" фото=${photoKey ? 'да' : 'нет'}`,
    );
  }

  // Значение тега из SOAP + раскодировка XML-сущностей (не-ASCII приходит как &#NNN;).
  private field(xml: string, tag: string): string {
    const m = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`));
    return m ? this.decodeEntities(m[1]).trim() : '';
  }

  private decodeEntities(s: string): string {
    return s
      .replace(/&#(\d+);/g, (_, n) => this.safeChar(Number(n)))
      .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => this.safeChar(parseInt(h, 16)))
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/&amp;/g, '&');
  }

  private safeChar(code: number): string {
    try {
      return String.fromCodePoint(code);
    } catch {
      return '';
    }
  }

  // «2026/07/16 17:16:29» → Date. Прибор шлёт местное время (Узбекистан, UTC+5,
  // без перехода на летнее) — трактуем как Asia/Tashkent и храним в UTC.
  private parseDate(s: string): Date | null {
    if (!s) return null;
    const iso = s.trim().replace(/\//g, '-').replace(' ', 'T');
    const d = new Date(`${iso}+05:00`);
    return isNaN(d.getTime()) ? null : d;
  }
}
