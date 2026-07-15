import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AssistantController } from './assistant.controller';
import { AssistantProvider } from './assistant.provider';
import { AssistantService } from './assistant.service';

// SOS-ассистент (ИИ-роутер). LlmService доступен через @Global LlmModule.
@Module({
  imports: [PrismaModule],
  controllers: [AssistantController],
  providers: [AssistantService, AssistantProvider],
})
export class AssistantModule {}
