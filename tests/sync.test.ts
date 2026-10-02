import { describe, expect, it } from 'vitest';
import { SupabaseClient, sessionFromUrlHash, needsRefresh, type Session } from '@/sync/supabase';
import { SyncEngine } from '@/sync/SyncEngine';
import { MemoryStore } from '@/store/MemoryStore';
import { emptyProgress, type Progress } from '@/store/ProgressStore';
import { applyAnswer, emptyCardState } from '@/domain/srs/scheduler';

const URL_BASE = 'https://test.supabase.co';
const USER = '11111111-2222-3333-4444-555555555555';

function jwt(sub: string, email: string): string {
  const payload = Buffer.from(JSON.stringify({ sub, email })).toString('base64url');
  return `fake.${payload}.signature`;
}

function session(overrides: Partial<Session> = {}): Session {
  return {
    accessToken: jwt(USER, 'rodic@example.com'),
    refreshToken: 'r1',
    userId: USER,
    email: 'rodic@example.com',
    expiresAt: Date.now() + 3_600_000,
    ...overrides,
  };
}

/** Falešný Supabase: drží jeden řádek na uživatele a umí selhat na povel. */
class FakeBackend {
  row: { progress: unknown; updated_at: string } | null = null;
  offline = false;
  unauthorized = false;
  pushes = 0;
  mails: string[] = [];

  fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    if (this.offline) throw new TypeError('Failed to fetch');
    const url = String(input);
    const path = url.slice(URL_BASE.length);
    if (this.unauthorized) return new Response('{}', { status: 401 });

    if (path.startsWith('/auth/v1/otp')) {
      const body = JSON.parse(String(init?.body)) as { email: string };
      this.mails.push(body.email);
      return new Response('{}', { status: 200 });
    }
    if (path.startsWith('/auth/v1/token')) {
      return Response.json({
        access_token: jwt(USER, 'rodic@example.com'),
        refresh_token: 'r2',
        expires_in: 3600,
        user: { id: USER, email: 'rodic@example.com' },
      });
    }
    if (path.startsWith('/auth/v1/logout')) return new Response(null, { status: 204 });
    if (path.startsWith('/rest/v1/progress')) {
      if (init?.method === 'GET') return Response.json(this.row ? [this.row] : []);
      const body = JSON.parse(String(init?.body)) as { progress: unknown; updated_at: string };
      this.row = { progress: body.progress, updated_at: body.updated_at };
      this.pushes += 1;
      return new Response(null, { status: 204 });
    }
    return new Response('{}', { status: 404 });
  };
}

function engineWith(backend: FakeBackend, store = new MemoryStore(), start: Session | null = session()) {
  let saved: Session | null = start;
  const pending: (() => void)[] = [];
  const engine = new SyncEngine({
    store,
    client: new SupabaseClient({ url: URL_BASE, anonKey: 'anon', fetch: backend.fetch }),
    redirectTo: 'https://vlajky.example/',
    loadSession: () => saved,
    saveSession: (next) => {
      saved = next;
    },
    schedule: (fn) => {
      pending.push(fn);
      return () => {
        const i = pending.indexOf(fn);
        if (i >= 0) pending.splice(i, 1);
      };
    },
  });
  return { engine, store, runPending: () => pending.splice(0).forEach((fn) => fn()), session: () => saved };
}

function withCard(code: string, at: string): Progress {
  const progress = emptyProgress();
  const now = new Date(at);
  progress.cards[code] = applyAnswer(
    emptyCardState(code, now),
    { correct: true, elapsedMs: 2000, mode: 'classic' },
    now,
  );
  progress.savedAt = at;
  return progress;
}

describe('klient Supabase', () => {
  it('přečte přihlášení z odkazu v e-mailu', () => {
    const hash = `#access_token=${jwt(USER, 'a@b.cz')}&refresh_token=r&expires_in=3600&type=magiclink`;
    const parsed = sessionFromUrlHash(hash);
    expect(parsed?.userId).toBe(USER);
    expect(parsed?.email).toBe('a@b.cz');
  });

  it('odkaz bez tokenů není přihlášení', () => {
    expect(sessionFromUrlHash('#error=access_denied')).toBeNull();
    expect(sessionFromUrlHash('')).toBeNull();
  });

  it('token se obnoví, až když se blíží konec', () => {
    expect(needsRefresh(session({ expiresAt: Date.now() + 600_000 }))).toBe(false);
    expect(needsRefresh(session({ expiresAt: Date.now() + 10_000 }))).toBe(true);
  });

  it('vypnutá síť je stav, ne výjimka', async () => {
    const backend = new FakeBackend();
    backend.offline = true;
    const client = new SupabaseClient({ url: URL_BASE, anonKey: 'anon', fetch: backend.fetch });
    const result = await client.pull(session());
    expect(result).toEqual({ ok: false, error: { kind: 'offline' } });
  });
});

describe('synchronizace', () => {
  it('při přihlášení spojí obě strany, nepřepíše ani jednu', async () => {
    const backend = new FakeBackend();
    backend.row = { progress: withCard('fr', '2026-05-02T10:00:00.000Z'), updated_at: '2026-05-02T10:00:00.000Z' };

    const store = new MemoryStore();
    await store.update((draft) => {
      const local = withCard('cz', '2026-05-01T10:00:00.000Z');
      draft.cards = local.cards;
      draft.meta.totalPoints = 500;
    });

    const { engine } = engineWith(backend, store);
    await engine.sync();

    const after = await store.load();
    expect(Object.keys(after.cards).sort()).toEqual(['cz', 'fr']);
    // A totéž musí být na serveru, ne jen v zařízení.
    const remote = backend.row?.progress as Progress;
    expect(Object.keys(remote.cards).sort()).toEqual(['cz', 'fr']);
    expect(engine.getState().kind).toBe('synced');
  });

  it('prázdný server nesmaže postup v zařízení', async () => {
    const backend = new FakeBackend();
    const store = new MemoryStore();
    await store.update((draft) => {
      draft.meta.totalPoints = 9000;
    });

    const { engine } = engineWith(backend, store);
    await engine.sync();

    expect((await store.load()).meta.totalPoints).toBe(9000);
    expect((backend.row?.progress as Progress).meta.totalPoints).toBe(9000);
  });

  it('nové zařízení si stáhne postup', async () => {
    const backend = new FakeBackend();
    const remote = withCard('jp', '2026-05-05T10:00:00.000Z');
    remote.meta.totalPoints = 12345;
    backend.row = { progress: remote, updated_at: '2026-05-05T10:00:00.000Z' };

    const { engine, store } = engineWith(backend);
    await engine.sync();

    const after = await store.load();
    expect(after.meta.totalPoints).toBe(12345);
    expect(after.cards['jp']).toBeDefined();
  });

  it('bez sítě to neshodí hru a dá se poznat', async () => {
    const backend = new FakeBackend();
    backend.offline = true;
    const { engine, store } = engineWith(backend);
    await store.update((draft) => {
      draft.meta.totalPoints = 10;
    });

    await engine.sync();
    expect(engine.getState()).toMatchObject({ kind: 'failed', error: { kind: 'offline' } });
    expect((await store.load()).meta.totalPoints).toBe(10);

    // Síť se vrátí – další pokus projde.
    backend.offline = false;
    await engine.sync();
    expect(engine.getState().kind).toBe('synced');
    expect((backend.row?.progress as Progress).meta.totalPoints).toBe(10);
  });

  it('změny se posílají až po chvíli a dohromady', async () => {
    const backend = new FakeBackend();
    const { engine, store, runPending } = engineWith(backend);

    for (let i = 0; i < 10; i++) {
      await store.update((draft) => {
        draft.meta.totalPoints += 100;
      });
      engine.changed();
    }
    expect(backend.pushes).toBe(0);

    runPending();
    await Promise.resolve();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(backend.pushes).toBe(1);
    expect((backend.row?.progress as Progress).meta.totalPoints).toBe(1000);
  });

  it('vypršelé přihlášení odhlásí, ale postup nechá', async () => {
    const backend = new FakeBackend();
    backend.unauthorized = true;
    const store = new MemoryStore();
    await store.update((draft) => {
      draft.meta.totalPoints = 42;
    });

    const { engine, session: current } = engineWith(backend, store, session({ expiresAt: Date.now() }));
    await engine.sync();

    expect(engine.getState().kind).toBe('signedOut');
    expect(current()).toBeNull();
    expect((await store.load()).meta.totalPoints).toBe(42);
  });

  it('platný token se zbytečně neobnovuje', async () => {
    const backend = new FakeBackend();
    const { engine, session: current } = engineWith(backend);
    await engine.sync();
    expect(current()?.refreshToken).toBe('r1');
  });

  it('odhlášení nemaže postup v zařízení', async () => {
    const backend = new FakeBackend();
    const store = new MemoryStore();
    await store.update((draft) => {
      draft.meta.totalPoints = 321;
    });
    const { engine, session: current } = engineWith(backend, store);

    await engine.signOut();
    expect(engine.getState().kind).toBe('signedOut');
    expect(current()).toBeNull();
    expect((await store.load()).meta.totalPoints).toBe(321);
  });

  it('přihlášení pošle odkaz na e-mail', async () => {
    const backend = new FakeBackend();
    const { engine } = engineWith(backend, new MemoryStore(), null);
    await engine.signIn(' Rodic@Example.com ');
    expect(backend.mails).toEqual(['Rodic@Example.com']);
    expect(engine.getState()).toMatchObject({ kind: 'linkSent' });
  });

  it('bez přihlášení se nikam nic neposílá', async () => {
    const backend = new FakeBackend();
    const { engine, runPending } = engineWith(backend, new MemoryStore(), null);
    engine.changed();
    runPending();
    await engine.pushNow();
    expect(backend.pushes).toBe(0);
  });
});
