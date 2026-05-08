# HuCo — Application de recommandation de films

> *“Qu’est-ce qu’on regarde ce soir ?”* — Partagez des recommandations de films avec vos amis.

---

## Fonctionnalités

| Écran | Description |
|---|---|
| **Accueil** | Films tendance (TMDB), recommandations reçues, pull-to-refresh |
| **Recherche** | Recherche temps réel + filtres par genre (8 chips), films tendance |
| **Détail film** | Synopsis, casting, streaming, partage natif, bouton trailer YouTube |
| **Bibliothèque** | Films vus avec note ⭐ et commentaire |
| **Watchlist** | Films à voir avec avis de l’expéditeur |
| **Inbox** | Gérer les recommandations reçues |
| **Envoi reco** | Flux 3 étapes : noter → destinataires → envoyer |
| **Profil** | Contacts, cercles, statistiques |
| **Paramètres** | Notifications, compte, déconnexion |
| **Compte** | Modifier nom/username, zone de danger |
| **Connexion** | Login / Inscription (mock → Supabase-ready) |

---

## Installation rapide

```bash
git clone <repo>
cd huco-app-ui_mark
npm install
npm start          # Expo Go (QR code)
npm run android    # Émulateur Android
npm run ios        # Simulateur iOS (macOS)
```

### API TMDB (optionnel mais recommandé)

Sans clé, l’app fonctionne avec les données mock intégrées (6 films de démonstration).

1. Créez un compte gratuit sur [themoviedb.org](https://www.themoviedb.org/signup)
2. Générez une clé API dans *Paramètres → API*
3. Créez `.env` à la racine :

```
EXPO_PUBLIC_TMDB_API_KEY=votre_cle_api_tmdb
```

Fonctionnalités débloquées : films tendance, recherche réelle, providers streaming, trailers YouTube.

---

## Base de données — Guide Supabase

Supabase est gratuit jusqu’à 500 MB de données et 50 000 utilisateurs actifs/mois.

### 1. Créer un projet Supabase

1. Allez sur [supabase.com](https://supabase.com) → *New project*
2. Notez votre **Project URL** et **anon public key** (Settings → API)

### 2. Installer le SDK

```bash
npm install @supabase/supabase-js
```

### 3. Créer le fichier de config

`src/lib/supabase.ts` :

```typescript
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
```

Ajoutez dans `.env` :

```
EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

### 4. Schéma SQL

Copiez-collez ce SQL dans l’éditeur SQL de Supabase (*SQL Editor → New query*) :

```sql
-- Profils utilisateurs (étend auth.users de Supabase)
create table public.profiles (
  id           uuid references auth.users on delete cascade primary key,
  name         text not null,
  username     text unique not null,
  avatar       text default 'ME',
  created_at   timestamptz default now()
);
alter table public.profiles enable row level security;
create policy "Lecture publique des profils" on public.profiles for select using (true);
create policy "Modification de son propre profil" on public.profiles for update using (auth.uid() = id);

-- Trigger : créer le profil automatiquement à l’inscription
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, username, avatar)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'avatar', 'ME')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Films (cache TMDB)
create table public.movies (
  id             integer primary key,
  title          text not null,
  original_title text,
  poster         text,
  backdrop       text,
  overview       text,
  release_date   text,
  runtime        integer default 0,
  genres         text[] default '{}',
  rating         numeric(3,1) default 0,
  cast           text[] default '{}',
  created_at     timestamptz default now()
);

-- Bibliothèque
create table public.library (
  id         uuid default gen_random_uuid() primary key,
  user_id    uuid references public.profiles on delete cascade not null,
  movie_id   integer references public.movies not null,
  stars      integer not null check (stars between 1 and 5),
  comment    text default '',
  added_at   timestamptz default now(),
  unique(user_id, movie_id)
);
alter table public.library enable row level security;
create policy "Biblio privée" on public.library using (auth.uid() = user_id);

-- Watchlist
create table public.watchlist (
  id         uuid default gen_random_uuid() primary key,
  user_id    uuid references public.profiles on delete cascade not null,
  movie_id   integer references public.movies not null,
  added_at   timestamptz default now(),
  unique(user_id, movie_id)
);
alter table public.watchlist enable row level security;
create policy "Watchlist privée" on public.watchlist using (auth.uid() = user_id);

-- Contacts (amitiés)
create table public.friendships (
  id         uuid default gen_random_uuid() primary key,
  user_id    uuid references public.profiles on delete cascade not null,
  friend_id  uuid references public.profiles on delete cascade not null,
  created_at timestamptz default now(),
  unique(user_id, friend_id)
);
alter table public.friendships enable row level security;
create policy "Mes contacts" on public.friendships using (auth.uid() = user_id);

-- Cercles
create table public.circles (
  id         uuid default gen_random_uuid() primary key,
  owner_id   uuid references public.profiles on delete cascade not null,
  name       text not null,
  created_at timestamptz default now()
);
alter table public.circles enable row level security;
create policy "Mes cercles" on public.circles using (auth.uid() = owner_id);

create table public.circle_members (
  circle_id  uuid references public.circles on delete cascade not null,
  user_id    uuid references public.profiles on delete cascade not null,
  primary key (circle_id, user_id)
);
alter table public.circle_members enable row level security;
create policy "Membres de mes cercles" on public.circle_members
  using (exists (select 1 from public.circles where id = circle_id and owner_id = auth.uid()));

-- Recommandations
create table public.recommendations (
  id           uuid default gen_random_uuid() primary key,
  sender_id    uuid references public.profiles on delete cascade not null,
  recipient_id uuid references public.profiles on delete cascade not null,
  movie_id     integer references public.movies not null,
  stars        integer check (stars between 1 and 5),
  comment      text default '',
  status       text default 'pending' check (status in ('pending','watchlisted','seen','ignored')),
  sent_at      timestamptz default now()
);
alter table public.recommendations enable row level security;
create policy "Voir mes recommandations" on public.recommendations
  using (auth.uid() = sender_id or auth.uid() = recipient_id);
create policy "Envoyer une recommandation" on public.recommendations
  for insert with check (auth.uid() = sender_id);
create policy "Mettre à jour le statut" on public.recommendations
  for update using (auth.uid() = recipient_id);
```

### 5. Activer l’authentification par email

Dans Supabase : *Authentication → Providers → Email* → activez "Enable Email provider".

### 6. Brancher AuthContext sur Supabase

Les commentaires `// TODO: swap with Supabase →` dans `src/context/AuthContext.tsx` indiquent exactement où remplacer le mock.

Exemple pour `login` :

```typescript
import { supabase } from '../lib/supabase';

async function login(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', data.user.id)
    .single();
  setUser(profile);
  await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(profile));
}
```

### 7. Variables d’environnement complètes

```
EXPO_PUBLIC_TMDB_API_KEY=votre_cle_tmdb
EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

---

## Architecture

```
src/
  context/
    AppContext.tsx     # État global (biblio, watchlist, inbox, contacts)
    AuthContext.tsx    # Auth (mock → swap Supabase)
  navigation/
    AppNavigator.tsx   # Tabs + Stack + Auth flow
  screens/
    HomeScreen.tsx     # Tendances + recommandations
    SearchScreen.tsx   # Recherche + filtres genre
    FilmDetailsScreen  # Détail + share + trailer
    LibraryScreen.tsx
    WatchlistScreen.tsx
    InboxScreen.tsx
    SendRecommendationScreen.tsx
    ProfileScreen.tsx  # Contacts + cercles + stats
    SettingsScreen.tsx # Paramètres app
    AccountScreen.tsx  # Gestion compte
    OnboardingScreen   # Login / Inscription
  components/
    theme.ts           # Tokens design (COLORS, SPACING, RADIUS, SHADOWS)
    MovieCard.tsx
    StarRating.tsx
    Avatar.tsx
    RatingModal.tsx
  services/
    tmdbService.ts     # TMDB API (search, trending, genres, details)
  data/
    mockData.ts        # Données de démonstration
  types/
    index.ts           # Types TypeScript
  lib/
    supabase.ts        # ← À créer lors de l’intégration Supabase
```

---

## Stack technique

- **React Native** 0.81 + **Expo** ~54
- **TypeScript** strict
- **React Navigation** v7 (bottom tabs + native stack)
- **AsyncStorage** (persistance locale)
- **expo-linear-gradient** (overlays hero)
- **TMDB API** gratuite (trending, search, genres, providers, trailers)
- **Supabase** (BDD PostgreSQL + Auth — optionnel)
