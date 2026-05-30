# HuCo -- Application de recommandation de films

> *"Qu'est-ce qu'on regarde ce soir ?"*
> Notez les films que vous avez vus, constituez votre bibliotheque et envoyez des recommandations personnalisees a vos amis et cercles.

---

## Sommaire

1. [Fonctionnalites](#fonctionnalites)
2. [Prerequis](#prerequis)
3. [Installation](#installation)
4. [Configuration des APIs](#configuration-des-apis)
5. [Lancer l'application](#lancer-lapplication)
6. [Architecture](#architecture)
7. [Stack technique](#stack-technique)
8. [Variables d'environnement](#variables-denvironnement)

---

## Fonctionnalites

| Ecran | Description |
|---|---|
| **Accueil** | Hero film en avant-scene, tendances TMDB de la semaine, reseau, pull-to-refresh |
| **Recherche** | Recherche temps reel + 8 chips de genre (Action, Comedie, Thriller...) |
| **Detail film** | Synopsis, casting (6 noms), plateformes streaming FR, trailer YouTube, partage natif |
| **Bibliotheque** | Films vus, triables par date / note / A-Z, modifiables |
| **Watchlist** | Films a voir avec l'avis de l'expediteur ; marquer comme vu declenche la notation |
| **Inbox** | Gerer les recommandations recues (Watchlist / Bibliotheque / Ignorer) |
| **Envoi de reco** | Flux 3 etapes : noter le film -> choisir contacts/cercles -> envoyer |
| **Profil** | Contacts, cercles (creation & suppression), statistiques (6 indicateurs) |
| **Parametres** | Notifications push, Confidentialite, CGU, deconnexion |
| **Compte** | Modifier nom / username / avatar, suppression de compte |
| **Connexion** | Login / Inscription + reinitialisation de mot de passe |
| **Aide** | FAQ accordeon (8 questions), liens vers le feedback |
| **Feedback** | Signalement de bug / suggestion envoye par e-mail |
| **Creer un cercle** | Nommer + selectionner des contacts -> cercle reutilisable |

**Mode hors-ligne :** sans cle API ni Supabase, l'application est 100% fonctionnelle avec 6 films de demonstration, des contacts mockes et une persistance locale (AsyncStorage).

---

## Prerequis

| Outil | Version minimale | Installation |
|---|---|---|
| Node.js | 18 LTS | [nodejs.org](https://nodejs.org) |
| npm | 9+ | inclus avec Node |
| Expo CLI | latest | `npm i -g expo-cli` |
| Expo Go (mobile) | latest | App Store / Google Play |

Pour le build natif (optionnel) :
- **iOS** -- macOS + Xcode 15+
- **Android** -- Android Studio + SDK 34

---

## Installation

```bash
# 1. Cloner le depot
git clone https://github.com/markrode/huco-app-ui_mark.git
cd huco-app-ui_mark

# 2. Installer les dependances
npm install

# 3. Creer le fichier d'environnement
cp .env.example .env
# Editez .env avec vos cles (voir section suivante)

# 4. Demarrer
npm start          # Expo Dev Tools -> scanner le QR avec Expo Go
```

---

## Configuration des APIs

### TMDB -- Films reels (optionnel mais recommande)

Sans cle TMDB, l'app affiche 6 films de demonstration. Avec une cle :
- Tendances de la semaine (home)
- Recherche de films reels
- Providers streaming pour la France
- Trailers YouTube

**Obtenir une cle gratuitement :**

1. Creer un compte sur [themoviedb.org](https://www.themoviedb.org/signup)
2. Parametres -> API -> Creer une cle (v3)
3. Copier la **Cle API (v3 auth)**
4. Dans `.env` :

```env
EXPO_PUBLIC_TMDB_API_KEY=votre_cle_tmdb_ici
```

---

### Supabase -- Authentification & synchronisation (optionnel)

Sans Supabase, l'authentification est mockee (n'importe quel e-mail/mot de passe fonctionne) et les donnees sont sauvegardees localement. Avec Supabase :
- Authentification reelle par e-mail
- Reinitialisation de mot de passe par e-mail
- Synchronisation des donnees entre appareils

#### Etape 1 -- Creer un projet Supabase

1. Aller sur [supabase.com](https://supabase.com) -> **New project**
2. Choisir une region (Europe West recommande)
3. Noter le **Project URL** et la **anon public key**
   (Settings -> API -> Project URL + Project API keys -> anon public)

#### Etape 2 -- Deployer le schema SQL

Ouvrir **SQL Editor -> New query**, coller le contenu de [`supabase/schema.sql`](./supabase/schema.sql) et cliquer **Run**.

Ce script cree :

| Table | Role |
|---|---|
| `public.profiles` | Profil utilisateur (etend `auth.users`) |
| `public.user_data` | Etat complet de l'app en JSONB (bibliotheque, watchlist, inbox...) |

Politiques RLS : chaque utilisateur ne peut lire/ecrire que ses propres donnees.

#### Etape 3 -- Activer l'authentification par e-mail

**Authentication -> Providers -> Email** -> activer *Enable Email provider*.

> Pour la reinitialisation de mot de passe, verifiez que l'URL de redirection dans
> *Authentication -> URL Configuration -> Redirect URLs* correspond a votre schema Expo
> (`exp://` en dev, `huco://` en prod).

#### Etape 4 -- Renseigner les variables d'environnement

Dans `.env` :

```env
EXPO_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

L'application detecte automatiquement la presence de ces variables et bascule en mode Supabase.
**Aucune modification du code source n'est necessaire.**

---

## Lancer l'application

```bash
npm start          # Expo Go -- scanner le QR code avec l'app Expo Go
npm run android    # Emulateur Android (Android Studio requis)
npm run ios        # Simulateur iOS (Xcode requis -- macOS uniquement)
npm run web        # Navigateur (fonctionnalites limitees)
```

**Verification TypeScript :**

```bash
npx tsc --noEmit   # doit retourner sans erreur
```

---

## Architecture

```
huco-app-ui_mark/
|-- App.tsx                        # Providers + notification listener
|-- .env.example                   # Template des variables d'environnement
|-- supabase/
|   `-- schema.sql                 # Schema SQL a deployer sur Supabase
`-- src/
    |-- types/
    |   `-- index.ts               # Interfaces TypeScript (Movie, Contact, Circle...)
    |-- components/
    |   |-- theme.ts               # Design tokens (COLORS, SPACING, RADIUS, SHADOWS)
    |   |-- Avatar.tsx             # Avatar initiales avec hash couleur
    |   |-- MovieCard.tsx          # Carte film (poster + badge note TMDB)
    |   |-- StarRating.tsx         # Composant notation interactif
    |   |-- RatingModal.tsx        # Modal notation + commentaire
    |   |-- Toast.tsx              # Toasts non-bloquants (success / info / error)
    |   `-- OnboardingTour.tsx     # Guide de demarrage superpose
    |-- context/
    |   |-- AuthContext.tsx        # Auth (Supabase + fallback mock)
    |   `-- AppContext.tsx         # Etat global via useReducer + sync AsyncStorage/Supabase
    |-- navigation/
    |   `-- AppNavigator.tsx       # Tabs (5) + Stack (9 ecrans modaux/stack)
    |-- screens/
    |   |-- HomeScreen.tsx
    |   |-- SearchScreen.tsx
    |   |-- FilmDetailsScreen.tsx
    |   |-- LibraryScreen.tsx
    |   |-- WatchlistScreen.tsx
    |   |-- InboxScreen.tsx
    |   |-- SendRecommendationScreen.tsx
    |   |-- ProfileScreen.tsx
    |   |-- SettingsScreen.tsx
    |   |-- AccountScreen.tsx
    |   |-- OnboardingScreen.tsx
    |   |-- HelpScreen.tsx
    |   |-- FeedbackScreen.tsx
    |   `-- CreateCircleScreen.tsx
    |-- services/
    |   `-- tmdbService.ts         # TMDB API (search, trending, details, streaming, trailers)
    |-- lib/
    |   |-- supabase.ts            # Client Supabase (null si non configure)
    |   `-- notifications.ts       # Expo Notifications (permissions, push token, listeners)
    `-- data/
        `-- mockData.ts            # Films, contacts et recommandations de demonstration
```

### Flux de donnees

```
Action utilisateur
       |
  AppContext (useReducer)
       |
  AsyncStorage  <-- immediat, synchrone
       |
  Supabase upsert  <-- differe 2s, si configure
```

**Hydratation au demarrage :** Supabase (si session active) -> AsyncStorage -> donnees mock.

---

## Stack technique

| Categorie | Librairie | Version |
|---|---|---|
| Framework | React Native + Expo | 0.81 / ~54 |
| Langage | TypeScript strict | 5.9 |
| Navigation | React Navigation (tabs + stack) | v7 |
| UI Icons | @expo/vector-icons (Ionicons) | -- |
| Gradients | expo-linear-gradient | -- |
| Persistance locale | @react-native-async-storage | -- |
| Backend | @supabase/supabase-js | v2 |
| Push notifications | expo-notifications | -- |
| Device info | expo-device | -- |
| Films | TMDB API v3 | -- |

---

## Variables d'environnement

| Variable | Obligatoire | Description |
|---|---|---|
| `EXPO_PUBLIC_TMDB_API_KEY` | Non | Cle API TMDB v3 -- active les films reels |
| `EXPO_PUBLIC_SUPABASE_URL` | Non | URL du projet Supabase |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Non | Cle publique anonyme Supabase |

Toutes les variables sont prefixees `EXPO_PUBLIC_` et sont exposees dans le bundle client.
**N'utilisez jamais la cle `service_role` dans le code React Native.**

Copier `.env.example` -> `.env` et remplir les valeurs. Le fichier `.env` est ignore par git.

---

## Backoffice Supabase

Apres deploiement du schema, le tableau de bord Supabase vous donne acces a :

| Section | Usage |
|---|---|
| **Authentication -> Users** | Liste des comptes crees, sessions actives, invitations |
| **Table Editor -> profiles** | Visualiser / editer les profils utilisateurs |
| **Table Editor -> user_data** | Inspecter les donnees JSONB de chaque utilisateur |
| **SQL Editor** | Requetes ad-hoc, migrations, statistiques |
| **Authentication -> Logs** | Logs d'authentification (echecs, connexions) |
| **Settings -> API** | Cles API, URL du projet |

**Requete utile -- statistiques globales :**

```sql
select
  count(*)                                      as total_users,
  avg(jsonb_array_length(library))::numeric(4,1) as avg_library_size,
  sum(jsonb_array_length(sent_recs))            as total_recs_sent
from public.user_data;
```

---

## Licence

Projet prive -- tous droits reserves.
