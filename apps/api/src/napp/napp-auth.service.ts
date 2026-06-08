import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

// Ответ OAuth-эндпоинта НАПП завёрнут в стандартный конверт { error, error_message, result }.
interface NappTokenResult {
  access_token: string;
  refresh_token: string;
  token_type: string; // "Bearer"
  expires_in: number; // секунды (~12 дней в sandbox)
  scope: string;
}
interface NappTokenEnvelope {
  error: number;
  error_message: string;
  result: NappTokenResult | null;
}

/**
 * Менеджер OAuth2-токена НАПП (password grant).
 *
 * - Кэширует access_token в памяти до истечения (с буфером 60 c).
 * - Авто-обновляет: пробует refresh_token, при неудаче — полный password grant.
 * - Single-flight: параллельные запросы ждут один in-flight запрос токена,
 *   чтобы не дёргать НАПП лишний раз и не словить rate-limit.
 *
 * POST /oauth/v2/token  (см. docs/integrations/NAPP.md §2)
 */
@Injectable()
export class NappAuthService {
  private readonly logger = new Logger(NappAuthService.name);

  private readonly baseUrl: string;
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly username: string;
  private readonly password: string;

  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private expiresAt = 0; // epoch ms, когда токен протухает (уже с учётом буфера)
  private inFlight: Promise<string> | null = null;

  constructor(private readonly config: ConfigService) {
    this.baseUrl = (this.config.get<string>('NAPP_BASE_URL') ?? 'https://sandboxerspapiv2.e-osgo.uz').replace(/\/+$/, '');
    this.clientId = this.config.get<string>('NAPP_CLIENT_ID') ?? '';
    this.clientSecret = this.config.get<string>('NAPP_CLIENT_SECRET') ?? '';
    this.username = this.config.get<string>('NAPP_USERNAME') ?? '';
    this.password = this.config.get<string>('NAPP_PASSWORD') ?? '';
  }

  /** Действующий Bearer-токен; запрашивает/обновляет при необходимости. */
  async getToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.expiresAt) {
      return this.accessToken;
    }
    // single-flight: если кто-то уже запрашивает токен — ждём его
    if (this.inFlight) return this.inFlight;

    this.inFlight = this.fetchToken().finally(() => {
      this.inFlight = null;
    });
    return this.inFlight;
  }

  /** Принудительно сбросить кэш (например, после 401 от НАПП). */
  invalidate(): void {
    this.accessToken = null;
    this.expiresAt = 0;
  }

  private async fetchToken(): Promise<string> {
    // 1) пробуем refresh, если есть refresh_token
    if (this.refreshToken) {
      try {
        return await this.requestToken({
          grant_type: 'refresh_token',
          refresh_token: this.refreshToken,
        });
      } catch (e) {
        this.logger.warn(`NAPP refresh_token не сработал, делаю password grant: ${(e as Error).message}`);
        this.refreshToken = null;
      }
    }
    // 2) полный password grant
    return this.requestToken({
      grant_type: 'password',
      username: this.username,
      password: this.password,
    });
  }

  private async requestToken(grant: Record<string, string>): Promise<string> {
    if (!this.clientId || !this.clientSecret) {
      throw new InternalServerErrorException('NAPP credentials не сконфигурированы (NAPP_CLIENT_ID / NAPP_CLIENT_SECRET)');
    }
    try {
      const { data } = await axios.post<NappTokenEnvelope>(
        `${this.baseUrl}/oauth/v2/token`,
        {
          client_id: this.clientId,
          client_secret: this.clientSecret,
          ...grant,
        },
        { headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, timeout: 20_000 },
      );

      if (data.error !== 0 || !data.result?.access_token) {
        throw new Error(data.error_message || `NAPP token error ${data.error}`);
      }

      const r = data.result;
      this.accessToken = r.access_token;
      this.refreshToken = r.refresh_token ?? null;
      // буфер 60 c, чтобы не использовать токен на грани истечения
      this.expiresAt = Date.now() + Math.max(0, r.expires_in - 60) * 1000;
      this.logger.log(`NAPP token получен (grant=${grant.grant_type}, expires_in=${r.expires_in}s)`);
      return this.accessToken;
    } catch (e) {
      const msg = axios.isAxiosError(e)
        ? `HTTP ${e.response?.status ?? '???'} ${JSON.stringify(e.response?.data ?? e.message)}`
        : (e as Error).message;
      this.logger.error(`NAPP token запрос провалился: ${msg}`);
      throw new InternalServerErrorException('Не удалось получить токен НАПП');
    }
  }
}
