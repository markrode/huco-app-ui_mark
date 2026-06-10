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
9. [Mise en production -- pas a pas](#mise-en-production----pas-a-pas)
10. [Promotion & lancement](#promotion--lancement)

---

## Fonctionnalites

| Ecran | Description |
|---|---|
| **Accueil** | Hero film en avant-scene, tendances TMDB de la semaine, reseau, pull-to-refresh |
| **Recherche** | Recherche temps reel + 8 chips de genre (Action, Comedie, Thriller...) |
| **Detail film** | Synopsis, casting (6 noms), plateformes streaming FR, trailer YouTube, partage natif |
| **Bibliotheque** | Films vus, triables par date / note / A-Z, modifiables |
| **Watchlist** | Films a voir avec l'avis de l'expediteur ; marquer comme vu declenche la notation |
| **Inbox** | Recommandations recues en temps reel (Supabase Realtime) -- Watchlist / Bibliotheque / Ignorer |
| **Envoi de reco** | Flux 3 etapes : noter -> choisir contacts/cercles -> envoyer. Livraison reelle aux comptes HuCo lies |
| **Profil** | Recherche de comptes HuCo par @username, cercles, statistiques (6 indicateurs) |
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
- Livraison des recommandations entre comptes + reception en temps reel

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
| `public.recommendations` | Recommandations entre comptes (expediteur -> destinataire) |

Politiques RLS : chaque utilisateur ne peut lire/ecrire que ses propres donnees.

#### Etape 3 -- Activer l'authentification par e-mail

**Authentication -> Providers -> Email** -> activer *Enable Email provider*.

> Pour la reinitialisation de mot de passe, verifiez que l'URL de redirection dans
> *Authentication -> URL Configuration -> Redirect URLs* correspond a votre schema Expo
> (`exp://` en dev, `huco://` en prod).

#### Etape 4 -- Activer Realtime

**Database -> Replication** -> activer la replication sur la table `recommendations`.
C'est ce qui permet la reception instantanee des recos dans l'Inbox.

#### Etape 5 -- Renseigner les variables d'environnement

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
    |   |-- AuthContext.tsx        # Auth (Supabase + fallback mock) + push token
    |   `-- AppContext.tsx         # Etat global + sync AsyncStorage/Supabase + Realtime
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

Reco entrante (autre utilisateur)
       |
  Supabase Realtime (INSERT sur recommendations)
       |
  Inbox + notification locale
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
| Backend + Realtime | @supabase/supabase-js | v2 |
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
| **Table Editor -> recommendations** | Suivre les recos echangees entre comptes |
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

## Mise en production -- pas a pas

> Guide technique complet : [PRODUCTION.md](./PRODUCTION.md)

Resume des etapes, dans l'ordre :

### Etape 1 -- Comptes et outils

| Action | Ou | Cout |
|---|---|---|
| Installer EAS CLI | `npm install -g eas-cli` puis `eas login` | gratuit |
| Compte Apple Developer | developer.apple.com | 99 $/an (iOS) |
| Compte Google Play Console | play.google.com/console | 25 $ une fois (Android) |

### Etape 2 -- Backend de production

1. Creer un **nouveau** projet Supabase dedie a la prod (jamais celui de dev)
2. Executer `supabase/schema.sql` dans le SQL Editor (idempotent, re-executable)
3. Activer **Authentication -> Providers -> Email**
4. Ajouter `huco://` dans **Authentication -> URL Configuration -> Redirect URLs**
5. **Database -> Replication** : activer Realtime sur la table `recommendations`
   (necessaire pour la reception instantanee des recos)
6. Recuperer Project URL + anon key (Settings -> API)

### Etape 3 -- Identifiants de l'app

Dans `app.json`, remplacer `com.yourname.huco` par votre identifiant reel
(ex. `com.markrode.huco`) dans `ios.bundleIdentifier` ET `android.package`.

### Etape 4 -- Secrets EAS

```bash
eas secret:create --scope project --name EXPO_PUBLIC_TMDB_API_KEY --value "..."
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value "https://xxxx.supabase.co"
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "eyJ..."
eas secret:list   # verifier les 3 secrets
```

### Etape 5 -- Builds

```bash
eas build:configure                              # genere eas.json
eas build --platform ios --profile production    # ~20 min
eas build --platform android --profile production # ~15 min
```

> **Android** : sauvegarder le keystore genere (`eas credentials` -> Download keystore).
> Sans lui, aucune mise a jour de l'app ne sera possible sur Google Play.

### Etape 6 -- Soumission aux stores

```bash
eas submit --platform ios --latest
eas submit --platform android --latest
```

Puis completer les fiches stores :
- [ ] Screenshots (iPhone 6.9" minimum + Android)
- [ ] Description FR + mots-cles
- [ ] **Politique de confidentialite** (URL obligatoire sur les deux stores)
- [ ] Questionnaire age rating
- [ ] Soumettre en review (1-3 jours iOS, quelques heures Android)

### Etape 7 -- Apres le lancement

- Surveiller Supabase (Authentication -> Logs, API -> Logs)
- Mises a jour JS sans re-review : `eas update --branch production`
- Crashs et notes : App Store Connect Analytics / Google Play Android Vitals

---

## Promotion & lancement

Le plan complet (positionnement, plan social media TikTok/Instagram/Shorts,
ASO, presse, influence, KPIs et feuille de route 90 jours) est dans
**[MARKETING.md](./MARKETING.md)**.

En bref :

| Levier | Priorite |
|---|---|
| TikTok + Reels + Shorts (4 contenus/semaine) | n.1 |
| ASO : titre, mots-cles, screenshots annotes | n.2 |
| Product Hunt + Reddit + Discord cine FR | lancement |
| Micro-influence cine (5k-50k abonnes) | croissance |
| Viralite produit : invitations, deep links, recap partageable | V1.1 / V2 |

---

## Licence

Projet prive -- tous droits reserves.
