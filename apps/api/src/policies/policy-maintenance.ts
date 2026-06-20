import { InjectQueue, Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Job, Queue } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

export const POLICY_MAINT_QUEUE = 'policy-maintenance';

const TYPE_LABEL: Record<string, string> = {
  OSAGO: 'ОСАГО',
  KASKO: 'КАСКО',
  HEALTH: 'Медицинский полис',
  HOME: 'Полис на имущество',
  FINANCE: 'Финансовый полис',
  LIFE: 'Полис страхования жизни',
  TRAVEL: 'Туристический полис',
  OTHER: 'Полис',
};

// Пороги напоминания об истечении (в днях). Точное совпадение по целым дням +
// ежедневный запуск → каждое напоминание уходит ровно один раз, без дублей.
const REMIND_DAYS = [7, 3, 1];

// Планировщик: при старте регистрирует ежедневный repeatable-job (идемпотентно).
@Injectable()
export class PolicyMaintenanceScheduler implements OnModuleInit {
  private readonly logger = new Logger(PolicyMaintenanceScheduler.name);
  constructor(@InjectQueue(POLICY_MAINT_QUEUE) private readonly queue: Queue) {}

  async onModuleInit(): Promise<void> {
    try {
      // Каждый день в 09:00 — скан полисов, истекающих через 7/3/1 дней.
      await this.queue.add('expiry-scan', {}, { repeat: { pattern: '0 9 * * *' } });
      this.logger.log('Запланирован ежедневный скан истекающих полисов (09:00)');
    } catch (e) {
      this.logger.warn(`не удалось запланировать скан: ${(e as Error).message}`);
    }
  }
}

// Воркер: сканирует истекающие полисы и шлёт напоминания.
@Processor(POLICY_MAINT_QUEUE)
export class PolicyMaintenanceProcessor extends WorkerHost {
  private readonly logger = new Logger(PolicyMaintenanceProcessor.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {
    super();
  }

  async process(_job: Job): Promise<void> {
    const now = new Date();
    const horizon = new Date(now);
    horizon.setDate(horizon.getDate() + Math.max(...REMIND_DAYS) + 1);

    const policies = await this.prisma.policy.findMany({
      where: { status: 'ACTIVE', endDate: { gte: now, lte: horizon } },
      include: { vehicle: { select: { brand: true, model: true } } },
    });

    let sent = 0;
    for (const p of policies) {
      const daysLeft = Math.ceil((new Date(p.endDate).getTime() - now.getTime()) / 86_400_000);
      if (!REMIND_DAYS.includes(daysLeft)) continue;
      const label = TYPE_LABEL[p.type] ?? 'Полис';
      const forV = p.vehicle ? ` (${p.vehicle.brand} ${p.vehicle.model})` : '';
      await this.notifications.send(p.userId, {
        type: 'POLICY_EXPIRING',
        title: 'Срок полиса истекает',
        body: `${label}${forV} истекает через ${daysLeft} ${plural(daysLeft)}`,
        data: { screen: 'PolicyDetail', id: p.id },
      });
      sent++;
    }
    if (sent) this.logger.log(`Отправлено напоминаний об истечении: ${sent}`);
  }
}

function plural(n: number): string {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return 'день';
  if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return 'дня';
  return 'дней';
}
