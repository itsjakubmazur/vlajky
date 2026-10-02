import type { Progress, ProgressStore } from '@/store/ProgressStore';
import { migrate } from '@/store/ProgressStore';
import { mergeProgress } from '@/store/merge';
import {
  needsRefresh,
  type Session,
  type SupabaseClient,
  type SyncError,
} from './supabase';

export type SyncState =
  /** Není kam synchronizovat – aplikace běží jen místně. */
  | { kind: 'off' }
  | { kind: 'signedOut' }
  /** Odkaz odešel na e-mail, čeká se na klepnutí. */
  | { kind: 'linkSent'; email: string }
  | { kind: 'syncing'; email: string }
  | { kind: 'synced'; email: string; at: string }
  | { kind: 'failed'; email: string; error: SyncError };

/** Jak dlouho se po změně čeká, než se postup pošle na server. */
export const PUSH_DELAY_MS = 4000;

export interface SyncEngineOptions {
  store: ProgressStore;
  client: SupabaseClient;
  /** Kam se má vrátit přihlašovací odkaz z e-mailu. */
  redirectTo: string;
  loadSession: () => Session | null;
  saveSession: (session: Session | null) => void;
  now?: () => number;
  /** Odložený běh – v testech se dá nahradit okamžitým. */
  schedule?: (fn: () => void, ms: number) => () => void;
}

/**
 * Synchronizace postupu mezi zařízeními.
 *
 * Pravidlo, ze kterého se odvíjí všechno ostatní: **místní postup je ten
 * hlavní**. Server je jen kopie navíc. Aplikace funguje offline, takže
 * čekat na síť by znamenalo nehrát – a hlavně by stačil jeden nepovedený
 * požadavek, aby dítě přišlo o rozehrané kolo.
 *
 * Proto se nikdy nic nepřepisuje: při přihlášení se stáhne, co je na
 * serveru, **spojí** se s tím, co je v zařízení (`mergeProgress`), a výsledek
 * se uloží na obě strany. Tablet s telefonem tak nejsou „ten správný“ a „ten
 * druhý“ – obě strany přispějí tím, co mají navíc.
 */
export class SyncEngine {
  private readonly options: Required<Pick<SyncEngineOptions, 'now' | 'schedule'>> &
    SyncEngineOptions;
  private session: Session | null;
  private state: SyncState;
  private listeners = new Set<() => void>();
  private cancelPush: (() => void) | null = null;
  private pushing = false;
  /** Změnilo se něco, zatímco se posílalo? Pak se pošle ještě jednou. */
  private dirty = false;

  constructor(options: SyncEngineOptions) {
    this.options = {
      now: () => Date.now(),
      schedule: (fn, ms) => {
        const id = setTimeout(fn, ms);
        return () => clearTimeout(id);
      },
      ...options,
    };
    this.session = options.loadSession();
    this.state = this.session
      ? { kind: 'syncing', email: this.session.email }
      : { kind: 'signedOut' };
  }

  getState(): SyncState {
    return this.state;
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /** Pošle přihlašovací odkaz na e-mail. */
  async signIn(email: string): Promise<void> {
    const clean = email.trim();
    const result = await this.options.client.sendMagicLink(clean, this.options.redirectTo);
    this.setState(
      result.ok ? { kind: 'linkSent', email: clean } : { kind: 'failed', email: clean, error: result.error },
    );
  }

  /** Dokončí přihlášení z odkazu v e-mailu. */
  async signedInAs(session: Session): Promise<void> {
    this.session = session;
    this.options.saveSession(session);
    await this.sync();
  }

  async signOut(): Promise<void> {
    const session = this.session;
    this.session = null;
    this.options.saveSession(null);
    this.cancelPush?.();
    this.cancelPush = null;
    this.setState({ kind: 'signedOut' });
    // Postup v zařízení zůstává. Odhlášení není mazání.
    if (session) await this.options.client.signOut(session.accessToken);
  }

  /** Stáhne, spojí a pošle zpátky. Volá se po přihlášení a po návratu online. */
  async sync(): Promise<void> {
    const session = await this.validSession();
    if (!session) return;
    this.setState({ kind: 'syncing', email: session.email });

    const pulled = await this.options.client.pull(session);
    if (!pulled.ok) return this.fail(session, pulled.error);

    let merged: Progress | null = null;
    if (pulled.value) {
      const remote = migrate(pulled.value.progress as Progress);
      merged = await this.options.store.update((draft) => {
        const next = mergeProgress(draft, remote);
        draft.cards = next.cards;
        draft.meta = next.meta;
        draft.log = next.log;
      });
    } else {
      merged = await this.options.store.load();
    }

    const pushed = await this.options.client.push(session, merged);
    if (!pushed.ok) return this.fail(session, pushed.error);
    this.setState({ kind: 'synced', email: session.email, at: new Date(this.options.now()).toISOString() });
  }

  /**
   * Oznámení, že se postup změnil. Posílá se se zpožděním – během kola
   * přijde změna po každé odpovědi a posílat deset požadavků za minutu
   * nemá smysl.
   */
  changed(): void {
    if (!this.session) return;
    this.dirty = true;
    this.cancelPush?.();
    this.cancelPush = this.options.schedule(() => {
      void this.pushNow();
    }, PUSH_DELAY_MS);
  }

  /** Pošle hned – při zavření karty nebo přepnutí na pozadí. */
  async pushNow(): Promise<void> {
    if (this.pushing) {
      this.dirty = true;
      return;
    }
    const session = await this.validSession();
    if (!session) return;
    this.cancelPush?.();
    this.cancelPush = null;
    this.pushing = true;
    this.dirty = false;
    try {
      const progress = await this.options.store.load();
      const result = await this.options.client.push(session, progress);
      if (!result.ok) return this.fail(session, result.error);
      this.setState({
        kind: 'synced',
        email: session.email,
        at: new Date(this.options.now()).toISOString(),
      });
    } finally {
      this.pushing = false;
    }
    if (this.dirty) this.changed();
  }

  /** Obnoví token, když je potřeba. `null` = nejsme přihlášení. */
  private async validSession(): Promise<Session | null> {
    const session = this.session;
    if (!session) return null;
    if (!needsRefresh(session, this.options.now())) return session;

    const refreshed = await this.options.client.refresh(session.refreshToken);
    if (refreshed.ok) {
      this.session = refreshed.value;
      this.options.saveSession(refreshed.value);
      return refreshed.value;
    }
    if (refreshed.error.kind === 'auth') {
      // Platnost přihlášení vypršela nadobro. Postup v zařízení zůstává.
      this.session = null;
      this.options.saveSession(null);
      this.setState({ kind: 'signedOut' });
      return null;
    }
    this.fail(session, refreshed.error);
    return null;
  }

  private fail(session: Session, error: SyncError): void {
    this.setState({ kind: 'failed', email: session.email, error });
  }

  private setState(state: SyncState): void {
    this.state = state;
    for (const listener of this.listeners) listener();
  }
}
