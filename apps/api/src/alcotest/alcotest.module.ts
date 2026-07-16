import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AlcoTestController } from './alcotest.controller';
import { AlcoTestService } from './alcotest.service';

// Приём и хранение тестов алкотестера Alcostop 8000S. MinioService — из @Global FilesModule.
@Module({
  imports: [PrismaModule],
  controllers: [AlcoTestController],
  providers: [AlcoTestService],
})
export class AlcoTestModule {}
