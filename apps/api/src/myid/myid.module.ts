import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { UsersModule } from '../users/users.module';
import { MyidController } from './myid.controller';
import { MyidService } from './myid.service';

@Module({
  imports: [PrismaModule, UsersModule],
  controllers: [MyidController],
  providers: [MyidService],
})
export class MyidModule {}
