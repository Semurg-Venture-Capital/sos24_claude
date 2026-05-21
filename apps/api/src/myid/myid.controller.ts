import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UsersService } from '../users/users.service';
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
  @ApiOperation({ summary: 'Создать сессию MyID. Возвращает sessionId для SDK.' })
  async createSession() {
    return this.myidService.createSession();
  }

  @Post('verify')
  @ApiOperation({ summary: 'Верифицировать пользователя по code от MyID SDK.' })
  async verify(@CurrentUser() userId: string, @Body() dto: VerifyMyIdDto) {
    await this.myidService.verifyCode(userId, dto.code);
    return this.usersService.findById(userId);
  }
}
