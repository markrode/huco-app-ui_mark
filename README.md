# HuCo — Application de recommandation de films

> *"Ça qu'est-ce qu'on regarde ce soir ?"*  
> Notez les films que vous avez vus, constituez votre bibliothèque et envoyez des recommandations personnalisées à vos amis et cercles.

---

## Sommaire

1. [Fonctionnalités](#fonctionnalités)
2. [Prérequis](#prérequis)
3. [Installation](#installation)
4. [Configuration des APIs](#configuration-des-apis)
   - [TMDB — Films réels](#tmdb--films-réels-optionnel-mais-recommandé)
   - [Supabase — Authentification & synchronisation](#supabase--authentification--synchronisation-optionnel)
5. [Lancer l'application](#lancer-lapplication)
6. [Architecture](#architecture)
7. [Stack technique](#stack-technique)
8. [Variables d'environnement](#variables-denvironnement)

---

## Fonctionnalités

| Écran | Description |
|---|---|
| **Accueil** | Hero film en avant-scène, tendances TMDB de la semaine, réseau, pull-to-refresh |
| **Recherche** | Recherche temps réel + 8 chips de genre (Action, Comédie, Thriller…) |
| **Détail film** | Synopsis, casting (6 noms), plateformes streaming FR, trailer YouTube, partage natif |
| **Bibliothèque** | Films vus, triables par date / note / A–Z, modifiables |
| **Watchlist** | Films à voir avec l'avis de l'expéditeur ; marquer comme vu déclenche la notation |
| **Inbox** | Gérer les recommandations reçues (Watchlist / Bibliothèque / Ignorer) |
| **Envoi de reco** | Flux 3 étapes : noter le film → choisir contacts/cercles → envoyer |
| **Profil** | Contacts, cercles (création & suppression), statistiques (6 indicateurs) |
| **Paramètres** | Notifications push, Confidentialité, CGU, déconnexion |
| **Compte** | Modifier nom / username / avatar, suppression de compte |
| **Connexion** | Login / Inscription + réinitialisation de mot de passe |
| **Aide** | FAQ accordéon (8 questions), liens vers le feedback |
| **Feedback** | Signalement de bug / suggestion envoyé par e-mail |
| **Créer un cercle** | Nommer + sélectionner des contacts → cercle réutilisable |

**Mode hors-ligne :** sans clé API ni Supabase, l'application est 100 % fonctionnelle avec 6 films de démonstration, des contacts mockés et une persistance locale (AsyncStorage).

---

## Prérequis

| Outil | Version minimale | Installation |
|---|---|---|
| Node.js | 18 LTS | [nodejs.org](https://nodejs.org) |
| npm | 9+ | inclus avec Node |
| Expo CLI | latest | `npm i -g expo-cli` |
| Expo Go (mobile) | latest | App Store / Google Play |

Pour le build natif (optionnel) :
- **iOS** — macOS + Xcode 15+
- **Android** — Android Studio + SDK 34

---

## Installation

```bash
# 1. Cloner le dépôt
git clone https://github.com/markrode/huco-app-ui_mark.git
cd huco-app-ui_mark

# 2. Installer les dépendances
npm install

# 3. Créer le fichier d'environnement
cp .env.example .env
# → éditez .env avec vos clés (voir section suivante)

# 4. Démarrer
npm start          # Expo Dev Tools → scanner le QR avec Expo Go
```

---

## Configuration des APIs

### TMDB — Films réels *(optionnel mais recommandé)*

Sans clé TMDB, l'app affiche 6 films de démonstration. Avec une clé :
- Tendances de la semaine (home)
- Recherche de films réels
- Providers streaming pour la France
- Trailers YouTube

**Obtenir une clé gratuitement :**

1. Créer un compte sur [themoviedb.org](https://www.themoviedb.org/signup)
2. *Paramètres → API → Créer une clé (v3)*
3. Copier la **Clé API (v3 auth)**
4. Dans `.env` :

```env
EXPO_PUBLIC_TMDB_API_KEY=votre_cle_tmdb_ici
```

---

### Supabase — Authentification & synchronisation *(optionnel)*

Sans Supabase, l'authentification est mockée (n'importe quel e-mail/mot de passe fonctionne) et les données sont sauvegardées localement. Avec Supabase :
- Authentification réelle par e-mail
- Réinitialisation de mot de passe par e-mail
- Synchronisation des données entre appareils

#### Étape 1 — Créer un projet Supabase

1. Aller sur [supabase.com](https://supabase.com) → **New project**
2. Choisir une région (Europe West recommandé)
3. Noter le **Project URL** et la **anon public key**  
   *(Settings → API → Project URL + Project API keys → anon public)*

#### Étape 2 — Déployer le schéma SQL

Ouvrir **SQL Editor → New query**, coller le contenu de [`supabase/schema.sql`](./supabase/schema.sql) et cliquer **Run**.

Ce script crée :

| Table | Rôle |
|---|---|
| `public.profiles` | Profil utilisateur (étend `auth.users`) |
| `public.user_data` | État complet de l'app en JSONB (bibliothèque, watchlist, inbox…) |

Politiques RLS : chaque utilisateur ne peut lire/écrire que ses propres données.

#### Étape 3 — Activer l'authentification par e-mail

**Authentication → Providers → Email** → activer *Enable Email provider*.

> Pour la réinitialisation de mot de passe, vérifiez que l'URL de redirection dans *Authentication → URL Configuration → Redirect URLs* correspond à votre schéma Expo (`exp://` en dev, `huco://` en prod).

#### Étape 4 — Renseigner les variables d'environnement

Dans `.env` :

```env
EXPO_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

L'application détecte automatiquement la présence de ces variables et bascule en mode Supabase. **Aucune modification du code source n'est nécessaire.**

---

## Lancer l'application

```bash
npm start          # Expo Go — scanner le QR code avec l'app Expo Go
npm run android    # Émulateur Android (Android Studio requis)
npm run ios        # Simulateur iOS (Xcode requis — macOS uniquement)
npm run web        # Navigateur (fonctionnalités limitées)
```

**Vérification TypeScript :**

```bash
npx tsc --noEmit   # doit retourner sans erreur
```

---

## Architecture

```
huco-app-ui_mark/
├── App.tsx                        # Providers + notification listener
├── .env.example                   # Template des variables d'environnement
├── supabase/
│   └── schema.sql                 # Schéma SQL à déployer sur Supabase
└── src/
    ├── types/
    │   └── index.ts               # Interfaces TypeScript (Movie, Contact, Circle…)
    ├── components/
    │   ├── theme.ts               # Design tokens (COLORS, SPACING, RADIUS, SHADOWS)
    │   ├── Avatar.tsx             # Avatar initiales avec hash couleur
    │   ├── MovieCard.tsx          # Carte film (poster + badge note TMDB)
    │   ├── StarRating.tsx         # Composant notation ⭐ interactif
    │   ├── RatingModal.tsx        # Modal notation + commentaire
    │   ├── Toast.tsx              # Toasts non-bloquants (success / info / error)
    │   └── OnboardingTour.tsx     # Guide de démarrage superposé
    ├── context/
    │   ├── AuthContext.tsx        # Auth (Supabase + fallback mock)
    │   └── AppContext.tsx         # État global via useReducer + sync AsyncStorage/Supabase
    ├── navigation/
    │   └── AppNavigator.tsx       # Tabs (5) + Stack (9 écrans modaux/stack)
    ├── screens/
    │   ├── HomeScreen.tsx
    │   ├── SearchScreen.tsx
    │   ├── FilmDetailsScreen.tsx
    │   ├── LibraryScreen.tsx
    │   ├── WatchlistScreen.tsx
    │   ├── InboxScreen.tsx
    │   ├── SendRecommendationScreen.tsx
    │   ├── ProfileScreen.tsx
    │   ├── SettingsScreen.tsx
    │   ├── AccountScreen.tsx
    │   ├── OnboardingScreen.tsx
    │   ├── HelpScreen.tsx
    │   ├── FeedbackScreen.tsx
    │   └── CreateCircleScreen.tsx
    ├── services/
    │   └── tmdbService.ts         # TMDB API (search, trending, details, streaming, trailers)
    ├── lib/
    │   ├── supabase.ts            # Client Supabase (null si non configuré)
    │   └── notifications.ts       # Expo Notifications (permissions, push token, listeners)
    └── data/
        └── mockData.ts            # Films, contacts et recommandations de démonstration
```

### Flux de données

```
Action utilisateur
       ↓
  AppContext (useReducer)
       ↓
  AsyncStorage ← immédiat, synchrone
       ↓
  Supabase upsert ← différé 2 s, si configuré
```

**Hydratation au démarrage :** Supabase (si session active) → AsyncStorage → données mock.

---

## Stack technique

| Catégorie | Librairie | Version |
|---|---|---|
| Framework | React Native + Expo | 0.81 / ~54 |
| Langage | TypeScript strict | 5.9 |
| Navigation | React Navigation (tabs + stack) | v7 |
| UI Icons | @expo/vector-icons (Ionicons) | — |
| Gradients | expo-linear-gradient | — |
| Persistance locale | @react-native-async-storage | — |
| Backend | @supabase/supabase-js | v2 |
| Push notifications | expo-notifications | — |
| Device info | expo-device | — |
| Films | TMDB API v3 | — |

---

## Variables d'environnement

| Variable | Obligatoire | Description |
|---|---|---|
| `EXPO_PUBLIC_TMDB_API_KEY` | Non | Clé API TMDB v3 — active les films réels |
| `EXPO_PUBLIC_SUPABASE_URL` | Non | URL du projet Supabase |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Non | Clé publique anonyme Supabase |

Toutes les variables sont préfixées `EXPO_PUBLIC_` et sont donc exposées dans le bundle client — **n'utilisez jamais la clé `service_role` dans le code React Native.**

Copier `.env.example` → `.env` et remplir les valeurs. Le fichier `.env` est ignoré par git.

---

## Backoffice Supabase

Après déploiement du schéma, le tableau de bord Supabase vous donne accès à :

| Section | Usage |
|---|---|
| **Authentication → Users** | Liste des comptes créés, sessions actives, invitations |
| **Table Editor → profiles** | Visualiser / éditer les profils utilisateurs |
| **Table Editor → user_data** | Inspecter les données JSONB de chaque utilisateur |
| **SQL Editor** | Requêtes ad-hoc, migrations, statistiques |
| **Authentication → Logs** | Logs d'authentification (échecs, connexions) |
| **Settings → API** | Clés API, URL du projet |

**Requête utile — statistiques globales :**

```sql
select
  count(*)                                      as total_users,
  avg(jsonb_array_length(library))::numeric(4,1) as avg_library_size,
  sum(jsonb_array_length(sent_recs))            as total_recs_sent
from public.user_data;
```

---

## Licence

Projet privé — tous droits réservés.
