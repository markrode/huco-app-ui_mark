# HuCo — Guide préprod : build de test, serveur & téléphone

Objectif : tester l'app complète (auth réelle, sync, recos cross-comptes, Realtime) sur votre téléphone avant la mise en production.

---

## 0. Faut-il installer quelque chose sur votre VPS ?

**Non, pas nécessairement.** Le « serveur » de HuCo est Supabase (base Postgres + auth + Realtime). Deux options :

| Option | Coût | Effort | Recommandé pour |
|---|---|---|---|
| **A. Supabase Cloud** (supabase.com) | Gratuit (tier free : 500 Mo DB, 50k utilisateurs) | 10 min | **Préprod ET prod — recommandé** |
| B. Supabase self-hosted sur votre VPS | Coût du VPS | 1-2 h + maintenance | Souveraineté des données, pas de dépendance cloud |

> Pour la préprod, prenez l'option A. L'option B est documentée en fin de guide si vous voulez utiliser votre VPS.

---

## 1. Option A — Backend Supabase Cloud (10 minutes)

1. **Créer le projet** : supabase.com → New project → région *West EU (Paris/Frankfurt)*
2. **Déployer le schéma** : SQL Editor → New query → coller tout `supabase/schema.sql` → Run
   (idempotent : ré-exécutable sans risque)
3. **Activer l'auth e-mail** : Authentication → Providers → Email → *Enable Email provider*
4. **Redirect URLs** : Authentication → URL Configuration → ajouter `huco://` et `exp://`
5. **Activer Realtime** : Database → Replication → cocher la table `recommendations`
   *(sans ça, pas de réception instantanée des recos)*
6. **Récupérer les clés** : Settings → API → copier *Project URL* + *anon public key*

**Vérification backend** — dans SQL Editor :

```sql
-- Doit lister 3 tables : profiles, user_data, recommendations
select tablename from pg_tables where schemaname = 'public';

-- Doit montrer rowsecurity = true sur les 3
select tablename, rowsecurity from pg_tables where schemaname = 'public';
```

---

## 2. Configurer le projet en local

```bash
git clone https://github.com/markrode/huco-app-ui_mark.git
cd huco-app-ui_mark
npm install

cp .env.example .env
```

Éditer `.env` :

```env
EXPO_PUBLIC_TMDB_API_KEY=votre_cle_tmdb        # themoviedb.org → Settings → API
EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
```

> `.env` est ignoré par git — vos clés ne partent jamais sur GitHub.

---

## 3. Test rapide sur téléphone — Expo Go (5 minutes)

Le chemin le plus rapide, sans build :

1. Installer **Expo Go** sur votre téléphone (App Store / Google Play)
2. Sur le PC : `npm start`
3. Scanner le QR code affiché (appareil photo iOS, ou app Expo Go Android)
4. L'app se lance avec vos vraies clés — auth réelle, sync, Realtime fonctionnels

**Limites d'Expo Go** : les notifications push distantes ne fonctionnent pas (SDK 53+), et l'icône/splash sont ceux d'Expo Go. Pour tester ça, passez au build préprod ci-dessous.

**Test à deux comptes (validation du social) :**
1. Créez le compte A sur votre téléphone, le compte B sur un second appareil (ou Expo Go + simulateur)
2. Compte A : Profil → Ajouter un contact → rechercher le @username du compte B → badge « HuCo »
3. Compte A : envoyer une reco à B
4. Compte B : la reco apparaît dans l'Inbox en quelques secondes (Realtime) + notification locale

---

## 4. Build préprod installable — EAS `preview`

Le profil `preview` est déjà configuré dans `eas.json` : il produit un **APK Android installable directement** (pas besoin de Google Play) et un build iOS *internal distribution*.

### 4.1 Prérequis (une fois)

```bash
npm install -g eas-cli
eas login                        # compte expo.dev gratuit
eas init                         # lie le projet à votre compte (génère le projectId)
```

> `eas init` écrit le `projectId` dans `app.json` → nécessaire pour les notifications push en build standalone (le code le lit automatiquement via `expo-constants`).

Configurer les variables pour les builds (les mêmes que `.env`) :

```bash
eas env:create --environment preview --name EXPO_PUBLIC_TMDB_API_KEY --value "..."
eas env:create --environment preview --name EXPO_PUBLIC_SUPABASE_URL --value "https://xxxx.supabase.co"
eas env:create --environment preview --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "eyJ..."
```

### 4.2 Android — APK sur votre téléphone (recommandé pour la préprod)

```bash
eas build --platform android --profile preview
```

- Durée : ~10-15 min (build sur les serveurs Expo, gratuit)
- À la fin : un **QR code + lien de téléchargement**
- Sur le téléphone : scanner le QR → télécharger l'APK → autoriser « installer des apps inconnues » → installer

C'est une vraie app standalone : icône HuCo, splash, notifications push, tout est testable.

### 4.3 iOS — TestFlight

iOS ne permet pas le sideload simple. Deux voies :

- **TestFlight (recommandé)** : nécessite le compte Apple Developer (99 $/an)
  ```bash
  eas build --platform ios --profile production
  eas submit --platform ios --latest
  ```
  Puis App Store Connect → TestFlight → s'ajouter comme testeur interne → installer via l'app TestFlight.
- **Ad-hoc** : `eas device:create` (enregistrer l'UDID de votre iPhone) puis `eas build --platform ios --profile preview` → installation via le lien.

### 4.4 Mises à jour OTA en préprod

Le profil `preview` a son canal `preview`. Après un changement JS :

```bash
eas update --branch preview --message "fix: ..."
```

L'APK installé récupère la mise à jour au prochain lancement — pas besoin de re-builder.

---

## 5. Option B — Supabase self-hosted sur votre VPS

À réserver si vous voulez héberger les données vous-même. Prérequis VPS : **2 Go RAM minimum (4 Go conseillé)**, Docker + Docker Compose, un nom de domaine pointant sur le VPS.

```bash
# 1. Sur le VPS
git clone --depth 1 https://github.com/supabase/supabase
cd supabase/docker
cp .env.example .env

# 2. Générer les secrets (OBLIGATOIRE — ne gardez jamais les valeurs d'exemple)
openssl rand -base64 32   # → POSTGRES_PASSWORD
openssl rand -base64 64   # → JWT_SECRET
# ANON_KEY et SERVICE_ROLE_KEY : générez-les depuis le JWT_SECRET avec l'outil officiel :
# https://supabase.com/docs/guides/self-hosting/docker#generate-api-keys

# 3. Éditer .env : POSTGRES_PASSWORD, JWT_SECRET, ANON_KEY, SERVICE_ROLE_KEY,
#    SITE_URL, API_EXTERNAL_URL (https://supabase.votre-domaine.fr),
#    SMTP_* (obligatoire pour les e-mails d'auth : reset password, confirmation)

# 4. Lancer
docker compose up -d

# 5. Reverse proxy HTTPS (Caddy, le plus simple) :
#    supabase.votre-domaine.fr → localhost:8000
#    Caddyfile :
#      supabase.votre-domaine.fr {
#        reverse_proxy localhost:8000
#      }
```

Ensuite :
1. Ouvrir le Studio (`https://supabase.votre-domaine.fr`) → SQL Editor → exécuter `supabase/schema.sql`
2. Activer Realtime sur `recommendations`
3. Dans `.env` de l'app :
   ```env
   EXPO_PUBLIC_SUPABASE_URL=https://supabase.votre-domaine.fr
   EXPO_PUBLIC_SUPABASE_ANON_KEY=<votre ANON_KEY generee>
   ```

**Sécurité VPS — checklist :**
- [ ] HTTPS uniquement (le client Supabase refuse le HTTP en prod)
- [ ] Pare-feu : n'exposer que 80/443 (jamais le port 5432 Postgres)
- [ ] Studio protégé (DASHBOARD_USERNAME / DASHBOARD_PASSWORD dans le .env docker)
- [ ] `SERVICE_ROLE_KEY` jamais dans l'app mobile — serveur uniquement
- [ ] Sauvegardes : `docker exec supabase-db pg_dump -U postgres postgres > backup.sql` en cron quotidien
- [ ] Mises à jour : `docker compose pull && docker compose up -d` régulièrement

---

## 6. Résultats de l'audit (build préprod)

| Point | État |
|---|---|
| `npm install` reproductible (react-native-screens épinglé) | ✅ corrigé |
| `.env` ignoré par git | ✅ corrigé (était absent du .gitignore) |
| Deep link `scheme: huco` (reset password) | ✅ ajouté à app.json |
| Push token avec `projectId` (builds standalone) | ✅ corrigé via expo-constants |
| Hydratation + Realtime après login à froid | ✅ corrigé (onAuthStateChange) |
| Purge des données locales au logout (multi-comptes) | ✅ ajouté |
| Recherche @username insensible à la casse | ✅ corrigé (ilike) |
| RLS sur les 3 tables | ✅ vérifié |
| Pas de secrets en dur, HTTPS partout, pas de XSS | ✅ vérifié |
| TypeScript strict sans erreur | ✅ vérifié |
| `eas.json` avec profils development / preview / production | ✅ créé |

---

## 7. Checklist préprod complète

- [ ] Projet Supabase créé + schéma déployé + Realtime activé sur `recommendations`
- [ ] `.env` local rempli (TMDB + Supabase)
- [ ] Test Expo Go : auth, recherche TMDB, reco entre 2 comptes, Realtime
- [ ] `eas init` exécuté (projectId dans app.json)
- [ ] Variables EAS créées pour l'environnement `preview`
- [ ] `eas build --platform android --profile preview` → APK installé sur téléphone
- [ ] Notifications push testées sur le build standalone
- [ ] (iOS) TestFlight ou build ad-hoc si besoin
