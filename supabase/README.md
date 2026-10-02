# Synchronizace postupu – co je potřeba nastavit

Bez tohohle nastavení aplikace funguje jako dřív: postup je jen v prohlížeči
a ven nejde jediný požadavek. Přihlášení se v Nastavení ani neukáže.

Je to na deset minut a zdarma (Supabase má free tarif).

## 1. Založit projekt

1. [supabase.com](https://supabase.com) → **Start your project** → přihlásit se
   (jde to přes GitHub).
2. **New project**. Region **Frankfurt** nebo **London** – je to nejblíž, takže
   nejrychlejší. Heslo k databázi si ulož, i když ho aplikace nepotřebuje.
3. Chvíli se to zřizuje.

## 2. Vytvořit tabulku

V projektu: **SQL Editor** → **New query** → vložit celý obsah souboru
[`schema.sql`](./schema.sql) → **Run**.

Tím vznikne tabulka `progress` a pravidla, která každému pustí jen jeho vlastní
řádek. Na tom stojí celá bezpečnost – proto smí být veřejný klíč přímo
v aplikaci.

## 3. Povolit přihlašovací odkazy

**Authentication → Sign In / Providers → Email**:

- **Enable Email provider** zapnuto
- **Confirm email** zapnuto
- heslo není potřeba; přihlašuje se klepnutím na odkaz v e-mailu

**Authentication → URL Configuration**:

- **Site URL** = adresa, na které aplikace běží (třeba `https://vlajky.example`)
- do **Redirect URLs** přidat tutéž adresu; při vývoji i `http://localhost:3000`

Bez tohohle kroku odkaz z e-mailu skončí na špatné adrese.

## 4. Vložit klíče do aplikace

**Project Settings → API**, zkopírovat **Project URL** a **anon public** klíč:

```bash
# .env.local (nepatří do gitu)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
```

Když aplikace běží na hostingu (Vercel a podobně), patří obě proměnné do jeho
nastavení. **Service role** klíč nikam nedávej – ten obchází všechna pravidla.

## 5. Hotovo

V Nastavení přibude panel **Přihlášení**. Zadáš e-mail, přijde odkaz, klepneš
na něj **na tom zařízení, kde chceš hrát**, a je to. Na druhém zařízení totéž.

Při přihlášení se postup ze zařízení a ze serveru **spojí** – u každé vlajky
vyhraje novější stav, u bodů a rekordů vyšší hodnota. Nic se nepřepisuje, takže
se nedá přihlásit „špatně“ a o něco přijít.
