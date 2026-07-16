import { Controller, Get, Header, HttpCode, Post, Req } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';
import { AlcoTestService } from './alcotest.service';

// Успешный SOAP-ответ (.NET ASMX-стиль) — прибор Alcostop ждёт именно его,
// иначе store-and-forward ретраит очередь. Проверено на устройстве.
const SOAP_ACK =
  '<?xml version="1.0" encoding="utf-8"?>' +
  '<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" ' +
  'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" ' +
  'xmlns:xsd="http://www.w3.org/2001/XMLSchema">' +
  '<soap:Body><AddDataResponse xmlns="http://tempuri.org/">' +
  '<AddDataResult>1</AddDataResult>' +
  '</AddDataResponse></soap:Body></soap:Envelope>';

// Приёмник данных алкотестера Alcostop 8000S. ПУБЛИЧНЫЙ (прибор не умеет авторизацию).
// Прибор шлёт POST text/xml (SOAP AddData). См. память project-alcostop-integration.
@ApiTags('alcotest')
@Controller('alcotest')
export class AlcoTestController {
  constructor(private readonly service: AlcoTestService) {}

  @Post()
  @HttpCode(200)
  @Header('Content-Type', 'text/xml; charset=utf-8')
  @ApiOperation({ summary: 'Приём SOAP-теста от алкотестера Alcostop 8000S.' })
  async receive(@Req() req: RawBodyRequest<Request>): Promise<string> {
    const body = req.body;
    const xml = typeof body === 'string' ? body : req.rawBody?.toString('utf8') ?? '';
    try {
      await this.service.ingest(xml);
    } catch {
      // даже при ошибке отвечаем ACK: иначе прибор будет бесконечно ретраить.
      // проблемные записи видны в логах сервиса.
    }
    return SOAP_ACK;
  }

  @Get('ping')
  @Header('Content-Type', 'text/plain; charset=utf-8')
  @ApiOperation({ summary: 'Проверка доступности приёмника (для настройки Server Info).' })
  ping(): string {
    return 'alcostop receiver ok';
  }
}
