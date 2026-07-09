import { Global, Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { LlmService } from './llm.service';

// Глобальный модуль доступа к LLM (Gemini) с логированием использования (AiUsageLog).
@Global()
@Module({
  imports: [PrismaModule],
  providers: [LlmService],
  exports: [LlmService],
})
export class LlmModule {}
