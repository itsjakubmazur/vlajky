-- Schéma pro synchronizaci postupu mezi zařízeními.
--
-- Spustit jednou v Supabase: SQL Editor → New query → vložit → Run.
--
-- Celý postup je jeden řádek na uživatele v jednom sloupci `jsonb`. Rozkládat
-- karty do tabulek by nic nepřineslo: aplikace čte vždycky celý postup naráz
-- a nic se nad ním na serveru nepočítá. Spojování dvou zařízení dělá klient
-- (`src/store/merge.ts`), protože tam je k tomu potřeba znalost dat.

create table if not exists public.progress (
  user_id uuid primary key references auth.users (id) on delete cascade,
  progress jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.progress enable row level security;

-- Jediné pravidlo, na kterém stojí bezpečnost: každý vidí a mění jen svůj
-- řádek. Díky tomu smí být veřejný klíč `anon` přímo v aplikaci.
drop policy if exists "vlastní postup – čtení" on public.progress;
create policy "vlastní postup – čtení"
  on public.progress for select
  using (auth.uid() = user_id);

drop policy if exists "vlastní postup – zápis" on public.progress;
create policy "vlastní postup – zápis"
  on public.progress for insert
  with check (auth.uid() = user_id);

drop policy if exists "vlastní postup – změna" on public.progress;
create policy "vlastní postup – změna"
  on public.progress for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
