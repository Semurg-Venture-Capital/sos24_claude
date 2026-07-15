import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { decryptJson, encryptJson } from '../common/crypto/field-cipher';
import { AssistantProvider } from './assistant.provider';
import type { AssistantMessage, AssistantTurn } from './assistant.types';

@Injectable()
export class AssistantService {
  private readonly logger = new Logger(AssistantService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly provider: AssistantProvider,
  ) {}

  // Последняя сессия пользователя (для восстановления диалога).
  async getSession(userId: string): Promise<{ sessionId: string | null; messages: AssistantMessage[] }> {
    const s = await this.prisma.assistantSession.findFirst({ where: { userId }, orderBy: { updatedAt: 'desc' } });
    if (!s) return { sessionId: null, messages: [] };
    return { sessionId: s.id, messages: decryptJson<AssistantMessage[]>(s.messages) ?? [] };
  }

  // Новая пустая сессия («Начать сначала»).
  async reset(userId: string): Promise<{ sessionId: string }> {
    const s = await this.prisma.assistantSession.create({ data: { userId } });
    return { sessionId: s.id };
  }

  // Отправка сообщения пользователя → ответ ассистента. Персист диалога.
  async sendMessage(
    userId: string,
    text: string,
    sessionId?: string,
  ): Promise<AssistantTurn & { sessionId: string }> {
    // Найти/создать сессию.
    let session =
      (sessionId ? await this.prisma.assistantSession.findFirst({ where: { id: sessionId, userId } }) : null) ??
      (await this.prisma.assistantSession.findFirst({ where: { userId }, orderBy: { updatedAt: 'desc' } }));
    if (!session) session = await this.prisma.assistantSession.create({ data: { userId } });

    const messages = decryptJson<AssistantMessage[]>(session.messages) ?? [];
    messages.push({ role: 'user', text, at: new Date().toISOString() });

    let turn: AssistantTurn;
    try {
      turn = await this.provider.route(messages, userId);
    } catch (e) {
      this.logger.warn(`assistant route failed: ${(e as Error)?.message}`);
      turn = {
        reply: 'Не удалось обработать запрос. Попробуйте ещё раз или позвоните диспетчеру 1024.',
        category: 'other',
        urgency: 'low',
        actions: [{ type: 'emergency_call', label: 'Позвонить диспетчеру', hint: '1024' }],
        quickReplies: [],
      };
    }

    messages.push({
      role: 'ai',
      text: turn.reply,
      at: new Date().toISOString(),
      actions: turn.actions,
      quickReplies: turn.quickReplies,
    });

    await this.prisma.assistantSession.update({
      where: { id: session.id },
      data: { messages: encryptJson(messages), category: turn.category, urgency: turn.urgency },
    });

    return { ...turn, sessionId: session.id };
  }
}
