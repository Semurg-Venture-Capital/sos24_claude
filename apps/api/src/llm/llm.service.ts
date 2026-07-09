import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GEMINI_API_KEY, GEMINI_SAFETY, LLM_MODEL, geminiUrl, llmEnabled } from './llm.config';

export interface GeminiPart {
  text?: string;
  inline_data?: { mime_type: string; data: string };
}
export interface GeminiContent {
  role: 'user' | 'model';
  parts: GeminiPart[];
}

interface CallOpts {
  feature: string; // для AI-лога: triage_ask | triage_finalize | euro_voice ...
  userId?: string | null;
  system?: string;
  contents: GeminiContent[];
  schema?: object; // responseSchema → строгий JSON
  model?: string;
  temperature?: number;
}

// Центральная точка всех вызовов к Gemini. Каждый вызов логируется в AiUsageLog
// (фича, модель, токены, время, ok/error) — для отдельного «AI-лога» в админке.
@Injectable()
export class LlmService {
  private readonly logger = new Logger(LlmService.name);

  constructor(private readonly prisma: PrismaService) {}

  get enabled(): boolean {
    return llmEnabled();
  }

  // Универсальный вызов. Возвращает текст ответа модели. При schema — это строгий JSON-текст.
  async generate(opts: CallOpts): Promise<string> {
    const model = opts.model ?? LLM_MODEL;
    const body: any = {
      contents: opts.contents,
      safetySettings: GEMINI_SAFETY,
      generationConfig: { temperature: opts.temperature ?? 0.4 },
    };
    if (opts.system) body.systemInstruction = { parts: [{ text: opts.system }] };
    if (opts.schema) {
      body.generationConfig.responseMimeType = 'application/json';
      body.generationConfig.responseSchema = opts.schema;
    }

    const start = Date.now();
    let ok = true;
    let error: string | null = null;
    let usage = { prompt: 0, output: 0, total: 0 };
    try {
      if (!GEMINI_API_KEY) throw new Error('GEMINI_API_KEY не задан');
      const res = await fetch(geminiUrl(model), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`Gemini ${res.status}: ${(await res.text()).slice(0, 300)}`);
      const data: any = await res.json();
      const u = data?.usageMetadata ?? {};
      usage = {
        prompt: u.promptTokenCount ?? 0,
        output: u.candidatesTokenCount ?? 0,
        total: u.totalTokenCount ?? 0,
      };
      const text = data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).filter(Boolean).join('') ?? '';
      if (!text) throw new Error('Gemini: пустой ответ (возможно, сработал фильтр)');
      return text;
    } catch (e: any) {
      ok = false;
      error = e?.message ?? String(e);
      throw e;
    } finally {
      // Логируем не блокируя запрос (и не роняя его при ошибке записи).
      void this.log(opts.feature, model, usage, Date.now() - start, ok, error, opts.userId ?? null);
    }
  }

  // Вызов со строгим JSON-выводом. Парсит и возвращает объект.
  async generateJson<T = any>(opts: CallOpts & { schema: object }): Promise<T> {
    const text = await this.generate(opts);
    return JSON.parse(text) as T;
  }

  // Транскрибация аудио (base64) + нормализация. Возвращает текст.
  async transcribe(opts: {
    feature: string;
    userId?: string | null;
    audioBase64: string;
    mimeType: string;
    prompt: string;
    model?: string;
  }): Promise<string> {
    const text = await this.generate({
      feature: opts.feature,
      userId: opts.userId,
      model: opts.model,
      temperature: 0.2,
      contents: [
        {
          role: 'user',
          parts: [{ text: opts.prompt }, { inline_data: { mime_type: opts.mimeType, data: opts.audioBase64 } }],
        },
      ],
    });
    return text.trim();
  }

  private async log(
    feature: string,
    model: string,
    usage: { prompt: number; output: number; total: number },
    latencyMs: number,
    ok: boolean,
    error: string | null,
    userId: string | null,
  ): Promise<void> {
    try {
      await this.prisma.aiUsageLog.create({
        data: {
          userId,
          feature,
          model,
          promptTokens: usage.prompt,
          outputTokens: usage.output,
          totalTokens: usage.total,
          latencyMs,
          ok,
          error: error?.slice(0, 1000) ?? null,
        },
      });
    } catch (e: any) {
      this.logger.warn(`AI-лог не записан: ${e?.message}`);
    }
  }
}
