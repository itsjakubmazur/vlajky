/**
 * Nejmenší možný klient Supabase – přihlášení e-mailem a jeden řádek s postupem.
 *
 * Proč ne oficiální `@supabase/supabase-js`: aplikace má čtyři běhové
 * závislosti a jde o PWA, která se celá stahuje do offline cache. SDK by
 * přibalilo stovky kilobajtů kvůli třem požadavkům. Tohle je `fetch` a nic
 * víc, a hlavně to jde celé otestovat bez serveru.
 *
 * Bezpečnost stojí na RLS v databázi (viz `supabase/schema.sql`): veřejný
 * klíč `anon` nikomu nic neumožní, protože každý řádek vidí jen jeho
 * vlastník. Proto smí být klíč v kódu aplikace.
 */

/** Odpověď, která nespadne: chyba je hodnota, ne výjimka. */
export type SyncResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: SyncError };

export type SyncError =
  | { kind: 'offline' }
  | { kind: 'auth' }
  | { kind: 'server'; status: number }
  | { kind: 'bad' };

export interface Session {
  accessToken: string;
  refreshToken: string;
  userId: string;
  /** Kdy vyprší přístupový token (ms od epochy). */
  expiresAt: number;
  email: string;
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  /** Vlastní `fetch` – kvůli testům. */
  fetch?: typeof fetch;
}

/** Jak dlouho před vypršením se token obnoví. */
const REFRESH_BEFORE_MS = 60_000;

export class SupabaseClient {
  private readonly url: string;
  private readonly anonKey: string;
  private readonly http: typeof fetch;

  constructor(config: SupabaseConfig) {
    this.url = config.url.replace(/\/$/, '');
    this.anonKey = config.anonKey;
    this.http = config.fetch ?? ((input, init) => fetch(input, init));
  }

  /**
   * Pošle přihlašovací odkaz na e-mail. Heslo schválně žádné: na tabletu
   * ho osmiletý zadává hůř než klepnutí na odkaz v mailu a zapomenuté
   * heslo by znamenalo další obrazovku.
   */
  async sendMagicLink(email: string, redirectTo: string): Promise<SyncResult<null>> {
    const result = await this.request('/auth/v1/otp', {
      method: 'POST',
      body: JSON.stringify({ email, create_user: true, options: { email_redirect_to: redirectTo } }),
    });
    return result.ok ? { ok: true, value: null } : result;
  }

  /** Vymění obnovovací token za nový přístupový. */
  async refresh(refreshToken: string): Promise<SyncResult<Session>> {
    const result = await this.request('/auth/v1/token?grant_type=refresh_token', {
      method: 'POST',
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    if (!result.ok) return result;
    return toSession(result.value);
  }

  /** Odhlášení na serveru. Místní stav se maže tak jako tak. */
  async signOut(accessToken: string): Promise<SyncResult<null>> {
    const result = await this.request('/auth/v1/logout', { method: 'POST' }, accessToken);
    return result.ok ? { ok: true, value: null } : result;
  }

  /** Přečte uložený postup. `null` = uživatel ještě nic nenahrál. */
  async pull(session: Session): Promise<SyncResult<{ progress: unknown; updatedAt: string } | null>> {
    const result = await this.request(
      `/rest/v1/progress?select=progress,updated_at&user_id=eq.${encodeURIComponent(session.userId)}`,
      { method: 'GET' },
      session.accessToken,
    );
    if (!result.ok) return result;
    const rows = result.value;
    if (!Array.isArray(rows) || rows.length === 0) return { ok: true, value: null };
    const row = rows[0] as { progress?: unknown; updated_at?: string };
    if (row.progress === undefined) return { ok: false, error: { kind: 'bad' } };
    return { ok: true, value: { progress: row.progress, updatedAt: row.updated_at ?? '' } };
  }

  /** Zapíše postup. Řádek je jeden na uživatele, takže se přepisuje. */
  async push(session: Session, progress: unknown): Promise<SyncResult<null>> {
    const result = await this.request(
      '/rest/v1/progress?on_conflict=user_id',
      {
        method: 'POST',
        headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
        body: JSON.stringify({
          user_id: session.userId,
          progress,
          updated_at: new Date().toISOString(),
        }),
      },
      session.accessToken,
    );
    return result.ok ? { ok: true, value: null } : result;
  }

  private async request(
    path: string,
    init: RequestInit & { headers?: Record<string, string> },
    accessToken?: string,
  ): Promise<SyncResult<unknown>> {
    let response: Response;
    try {
      response = await this.http(`${this.url}${path}`, {
        ...init,
        headers: {
          apikey: this.anonKey,
          Authorization: `Bearer ${accessToken ?? this.anonKey}`,
          'Content-Type': 'application/json',
          ...(init.headers ?? {}),
        },
      });
    } catch {
      // Letadlo, tunel, vypnutá wifi. Není to chyba, jen se teď nedá ven.
      return { ok: false, error: { kind: 'offline' } };
    }
    if (response.status === 401 || response.status === 403) {
      return { ok: false, error: { kind: 'auth' } };
    }
    if (!response.ok) return { ok: false, error: { kind: 'server', status: response.status } };
    if (response.status === 204) return { ok: true, value: null };
    try {
      const text = await response.text();
      return { ok: true, value: text ? JSON.parse(text) : null };
    } catch {
      return { ok: false, error: { kind: 'bad' } };
    }
  }
}

/**
 * Přihlašovací odkaz vrátí tokeny v části adresy za mřížkou. Prohlížeč ji
 * neposílá na server, takže se token nikam nezaloguje – proto je to tak
 * udělané i v oficiálním SDK.
 */
export function sessionFromUrlHash(hash: string): Session | null {
  const params = new URLSearchParams(hash.replace(/^#/, ''));
  const accessToken = params.get('access_token');
  const refreshToken = params.get('refresh_token');
  if (!accessToken || !refreshToken) return null;
  const expiresIn = Number(params.get('expires_in') ?? '3600');
  const claims = readClaims(accessToken);
  if (!claims) return null;
  return {
    accessToken,
    refreshToken,
    userId: claims.sub,
    email: claims.email,
    expiresAt: Date.now() + expiresIn * 1000,
  };
}

export function needsRefresh(session: Session, now = Date.now()): boolean {
  return session.expiresAt - now < REFRESH_BEFORE_MS;
}

function toSession(value: unknown): SyncResult<Session> {
  const body = value as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    user?: { id?: string; email?: string };
  };
  if (!body?.access_token || !body.refresh_token) return { ok: false, error: { kind: 'bad' } };
  const claims = readClaims(body.access_token);
  const userId = body.user?.id ?? claims?.sub;
  if (!userId) return { ok: false, error: { kind: 'bad' } };
  return {
    ok: true,
    value: {
      accessToken: body.access_token,
      refreshToken: body.refresh_token,
      userId,
      email: body.user?.email ?? claims?.email ?? '',
      expiresAt: Date.now() + (body.expires_in ?? 3600) * 1000,
    },
  };
}

/** Přečte `sub` a `email` z JWT. Podpis neověřujeme – to dělá server. */
function readClaims(token: string): { sub: string; email: string } | null {
  const payload = token.split('.')[1];
  if (!payload) return null;
  try {
    const json = decodeBase64Url(payload);
    const claims = JSON.parse(json) as { sub?: string; email?: string };
    if (!claims.sub) return null;
    return { sub: claims.sub, email: claims.email ?? '' };
  } catch {
    return null;
  }
}

function decodeBase64Url(value: string): string {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}
