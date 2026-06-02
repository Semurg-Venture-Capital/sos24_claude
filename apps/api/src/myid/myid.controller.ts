import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { JwtPayload } from '../auth/jwt.strategy';
import { UsersService } from '../users/users.service';
import { CreateMyIdSessionDto } from './dto/create-myid-session.dto';
import { VerifyMyIdDto } from './dto/verify-myid.dto';
import { MyidService } from './myid.service';

@ApiTags('myid')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('myid')
export class MyidController {
  constructor(
    private readonly myidService: MyidService,
    private readonly usersService: UsersService,
  ) {}

  @Post('session')
  @ApiOperation({
    summary: 'Создать сессию MyID.',
    description:
      'Возвращает sessionId + clientHash + clientHashId для инициализации нативного SDK. ' +
      'Опционально принимает pinfl — тогда SDK пропускает экран ввода паспорта.',
  })
  async createSession(@Body() dto: CreateMyIdSessionDto) {
    return this.myidService.createSession(dto.pinfl);
  }

  @Post('verify')
  @ApiOperation({
    summary: 'Верифицировать пользователя по code от MyID SDK.',
    description: 'code живёт 5 минут и одноразовый. Возвращает обновлённый профиль пользователя.',
  })
  async verify(@CurrentUser() user: JwtPayload, @Body() dto: VerifyMyIdDto) {
    await this.myidService.verifyCode(user.sub, dto.code);
    return this.usersService.findById(user.sub);
  }
}
