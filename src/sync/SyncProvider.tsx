'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { syncConfig } from '@/config/sync';
import { useProgress } from '@/store/StoreProvider';
import { SyncEngine, type SyncState } from './SyncEngine';
import { SupabaseClient, sessionFromUrlHash, type Session } from './supabase';

const SESSION_KEY = 'vlajky.sync.session';

interface SyncContextValue {
  state: SyncState;
  signIn: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  syncNow: () => Promise<void>;
}

const SyncContext = createContext<SyncContextValue | null>(null);

function loadSession(): Session | null {
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Session;
    return parsed.refreshToken ? parsed : null;
  } catch {
    return null;
  }
}

function saveSession(session: Session | null): void {
  try {
    if (session) window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    else window.localStorage.removeItem(SESSION_KEY);
  } catch {
    // Zablokované úložiště – přihlášení pak platí jen do zavření karty.
  }
}

/**
 * Drží synchronizaci naživu po dobu běhu aplikace.
 *
 * Tři okamžiky, kdy se posílá nebo stahuje, a každý má svůj důvod:
 * po změně postupu se zpožděním (během kola přijde změna po každé
 * odpovědi), při odchodu z aplikace hned (zavřená karta už nic nepošle)
 * a po návratu online (do té doby se to nedalo).
 */
export function SyncProvider({ children }: { children: ReactNode }) {
  const { store } = useProgress();
  const [state, setState] = useState<SyncState>({ kind: 'off' });
  const engineRef = useRef<SyncEngine | null>(null);

  useEffect(() => {
    const config = syncConfig();
    if (!config) return;

    const engine = new SyncEngine({
      store,
      client: new SupabaseClient(config),
      redirectTo: window.location.origin,
      loadSession,
      saveSession,
    });
    engineRef.current = engine;
    setState(engine.getState());
    const unsubscribeState = engine.subscribe(() => setState(engine.getState()));

    // Návrat z e-mailového odkazu: tokeny jsou za mřížkou v adrese.
    const fromLink = sessionFromUrlHash(window.location.hash);
    if (fromLink) {
      // Adresa se hned uklidí, ať token nezůstane v historii prohlížeče.
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
      void engine.signedInAs(fromLink);
    } else {
      void engine.sync();
    }

    const unsubscribeStore = store.subscribe(() => engine.changed());
    const onOnline = () => void engine.sync();
    const onHidden = () => {
      if (document.visibilityState === 'hidden') void engine.pushNow();
    };
    window.addEventListener('online', onOnline);
    document.addEventListener('visibilitychange', onHidden);

    return () => {
      unsubscribeState();
      unsubscribeStore();
      window.removeEventListener('online', onOnline);
      document.removeEventListener('visibilitychange', onHidden);
      engineRef.current = null;
    };
  }, [store]);

  const signIn = useCallback(async (email: string) => {
    await engineRef.current?.signIn(email);
  }, []);
  const signOut = useCallback(async () => {
    await engineRef.current?.signOut();
  }, []);
  const syncNow = useCallback(async () => {
    await engineRef.current?.sync();
  }, []);

  const value = useMemo(
    () => ({ state, signIn, signOut, syncNow }),
    [state, signIn, signOut, syncNow],
  );
  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>;
}

export function useSync(): SyncContextValue {
  const ctx = useContext(SyncContext);
  if (!ctx) throw new Error('useSync musí být uvnitř SyncProvider');
  return ctx;
}
