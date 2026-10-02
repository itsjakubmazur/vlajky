/**
 * Nastavení synchronizace.
 *
 * Bez obou proměnných aplikace běží přesně jako dřív: jen místně, bez
 * jediného požadavku ven. Přihlášení se v Nastavení ani neukáže. Pravidlo
 * „žádné externí požadavky za běhu“ tím zůstává v platnosti pro každého,
 * kdo se nepřihlásí.
 *
 * Klíč `anon` je veřejný schválně – sám o sobě neumožňuje nic, protože
 * každý řádek vidí jen jeho vlastník (RLS, viz `supabase/schema.sql`).
 */
export interface SyncConfig {
  url: string;
  anonKey: string;
}

export function syncConfig(): SyncConfig | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  return { url, anonKey };
}
