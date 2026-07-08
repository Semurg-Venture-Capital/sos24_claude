import { Module } from '@nestjs/common';
import { LegalController } from './legal.controller';

// Публичные юридические страницы (политика конфиденциальности и т.п.).
@Module({
  controllers: [LegalController],
})
export class LegalModule {}
