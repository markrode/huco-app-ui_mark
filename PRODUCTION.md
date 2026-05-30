# HuCo — Production Deployment Guide

Step-by-step guide to build and ship HuCo to the App Store (iOS) and Google Play (Android).

---

## Table of contents

1. [Prerequisites](#1-prerequisites)
2. [Supabase — production project](#2-supabase--production-project)
3. [TMDB API key](#3-tmdb-api-key)
4. [EAS Build setup](#4-eas-build-setup)
5. [Environment variables in EAS](#5-environment-variables-in-eas)
6. [iOS — build and App Store submission](#6-ios--build-and-app-store-submission)
7. [Android — build and Google Play submission](#7-android--build-and-google-play-submission)
8. [Push notifications — production](#8-push-notifications--production)
9. [Post-launch monitoring](#9-post-launch-monitoring)
10. [Security audit summary](#10-security-audit-summary)

---

## 1. Prerequisites

| Tool | Version | How to install |
|---|---|---|
| Node.js | 18 LTS | nodejs.org |
| npm | 9+ | included with Node |
| EAS CLI | latest | `npm install -g eas-cli` |
| Expo account | — | expo.dev (free) |
| Apple Developer account | — | developer.apple.com ($99/year) — required for iOS |
| Google Play Console account | — | play.google.com/console ($25 one-time) — required for Android |

Verify your EAS CLI installation:

```bash
eas --version          # should print 10.x or higher
eas whoami             # should print your Expo username
```

If not logged in:

```bash
eas login
```

---

## 2. Supabase — production project

> Create a **separate** Supabase project for production. Never reuse your development project.

### 2.1 Create the project

1. Go to supabase.com -> **New project**
2. Choose region: **West EU** (or closest to your users)
3. Set a strong database password — save it in a password manager
4. Wait for the project to provision (~2 minutes)

### 2.2 Deploy the schema

1. In the Supabase dashboard -> **SQL Editor -> New query**
2. Paste the entire contents of `supabase/schema.sql`
3. Click **Run** — all statements are idempotent (safe to re-run)

Expected output: no errors. Tables `profiles` and `user_data` appear in the Table Editor.

### 2.3 Enable Email authentication

1. **Authentication -> Providers -> Email**
2. Toggle **Enable Email provider** -> Save

### 2.4 Configure redirect URLs

This is required for password-reset emails to redirect back to the app.

1. **Authentication -> URL Configuration**
2. Add to **Redirect URLs**:
   - `huco://` — production deep link (standalone app)
   - `exp://` — Expo Go development

### 2.5 Configure rate limits (recommended)

1. **Authentication -> Rate Limits**
2. Set **Sign-in attempts**: 10 per hour (default is 30 — reduce to limit brute force)
3. Set **Email sends**: 4 per hour (prevents spam abuse)

### 2.6 Copy your API credentials

1. **Settings -> API**
2. Copy:
   - **Project URL** — looks like `https://xxxxxxxxxxxx.supabase.co`
   - **anon public** key — a long JWT starting with `eyJ...`

> **Never use the `service_role` key in the React Native app.** It bypasses RLS and gives full database access.

---

## 3. TMDB API key

1. Create a free account at themoviedb.org
2. Go to **Settings -> API -> Create -> Developer**
3. Fill in the application form (app name: HuCo, description: personal movie tracker)
4. Copy the **API Key (v3 auth)** — a 32-character hex string

---

## 4. EAS Build setup

### 4.1 Configure your app identifiers

Edit `app.json` to set production-ready values:

```json
{
  "expo": {
    "name": "HuCo",
    "slug": "huco-app",
    "version": "1.0.0",
    "ios": {
      "bundleIdentifier": "com.yourname.huco",
      "buildNumber": "1"
    },
    "android": {
      "package": "com.yourname.huco",
      "versionCode": 1
    }
  }
}
```

Rules:
- `bundleIdentifier` / `package`: reverse-domain format, all lowercase, no hyphens — must match what you register on App Store Connect / Google Play Console
- `version`: user-visible version (e.g. `1.0.0`)
- `buildNumber` / `versionCode`: increment on every new submission

### 4.2 Initialize EAS

```bash
eas build:configure
```

This creates `eas.json` in the project root. Replace its content with:

```json
{
  "cli": {
    "version": ">= 10.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {
      "autoIncrement": true
    }
  },
  "submit": {
    "production": {}
  }
}
```

---

## 5. Environment variables in EAS

EAS Secrets store sensitive variables server-side — they are injected at build time and never appear in source control.

```bash
# TMDB key
eas secret:create --scope project --name EXPO_PUBLIC_TMDB_API_KEY --value "your_tmdb_key_here"

# Supabase URL
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value "https://xxxxxxxxxxxx.supabase.co"

# Supabase anon key
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "eyJhbGci..."
```

Verify:

```bash
eas secret:list
```

You should see all three secrets listed with the `project` scope.

> **Local development**: keep a `.env` file at the project root with the same variables. This file is `.gitignore`d and is only used locally.

---

## 6. iOS — build and App Store submission

### 6.1 Register your app on App Store Connect

1. Go to appstoreconnect.apple.com -> **My Apps -> +**
2. Fill in:
   - **Platform**: iOS
   - **Name**: HuCo
   - **Primary Language**: French
   - **Bundle ID**: the same identifier as in `app.json` (`com.yourname.huco`)
   - **SKU**: any unique string (e.g. `huco-2024`)
3. Save

### 6.2 Build for iOS

EAS handles provisioning profiles and certificates automatically:

```bash
eas build --platform ios --profile production
```

- On first run, EAS will ask to create a distribution certificate and provisioning profile — choose **Let EAS handle it** for the simplest flow
- Build takes ~15-20 minutes
- When complete, a download link and build ID are displayed

### 6.3 Submit to App Store

```bash
eas submit --platform ios --latest
```

EAS will ask for your Apple ID and app-specific password:
- Generate an app-specific password at appleid.apple.com -> Security -> App-Specific Passwords
- Use this password (not your Apple ID password) when prompted

### 6.4 Complete the App Store listing

In App Store Connect -> your app:

| Section | Required content |
|---|---|
| App Preview & Screenshots | Screenshots for iPhone 6.9" and 6.7" minimum |
| Description | French app description |
| Keywords | films, cinema, recommandation, watchlist |
| Support URL | your support/contact page |
| Privacy Policy URL | required — link to your privacy policy |
| Age Rating | complete the questionnaire (likely 4+) |
| Pricing | Free |

### 6.5 Submit for review

Once all metadata is filled in and the build is attached:
1. App Store Connect -> **Prepare for Submission** -> **Submit to App Review**
2. Review typically takes 1-3 business days

---

## 7. Android — build and Google Play submission

### 7.1 Create the app on Google Play Console

1. Go to play.google.com/console -> **Create app**
2. Fill in:
   - **App name**: HuCo
   - **Default language**: French
   - **App type**: App
   - **Free or paid**: Free
3. Accept policies -> **Create app**

### 7.2 Build for Android

```bash
eas build --platform android --profile production
```

- EAS generates a keystore automatically on first run — **download and back up this keystore** — you cannot update the app on Google Play without it
- Build takes ~10-15 minutes
- Output is an `.aab` (Android App Bundle) file

### 7.3 Set up signing

When prompted about the keystore:
- Choose **Generate new keystore** (first time)
- EAS stores it securely on Expo servers
- Also download a local backup: `eas credentials` -> select your Android app -> **Download keystore**
- Store this `.jks` file and its passwords in a secure location (password manager or encrypted storage)

### 7.4 Submit to Google Play

```bash
eas submit --platform android --latest
```

Follow the prompts — EAS uploads the `.aab` to the internal testing track by default.

### 7.5 Promote to production

In Google Play Console:
1. **Testing -> Internal testing** — verify the build loads correctly
2. **Testing -> Closed testing (Alpha)** — test with a small group
3. **Production -> Releases -> Create new release** — promote when ready
4. Complete the store listing, content rating questionnaire, and privacy policy

---

## 8. Push notifications — production

HuCo uses Expo's push notification service, which handles both APNs (iOS) and FCM (Android) behind a single API.

### 8.1 iOS — APNs key

1. In your Apple Developer account -> **Certificates, IDs & Profiles -> Keys -> +**
2. Enable **Apple Push Notifications service (APNs)**
3. Download the `.p8` key file — **this can only be downloaded once**
4. Note the **Key ID** and **Team ID**

Upload to EAS:

```bash
eas credentials
# Select: iOS -> production -> push notification key -> Add
# Enter the key file path, Key ID, and Team ID when prompted
```

### 8.2 Android — FCM

EAS handles FCM automatically for Expo-managed push notifications — no manual Firebase setup is required if you use `getExpoPushTokenAsync()` (which HuCo does).

If you need a custom FCM sender ID (for advanced use cases):
1. Create a Firebase project at console.firebase.google.com
2. Add an Android app with the same package name as in `app.json`
3. Download `google-services.json`
4. Upload the FCM server key to EAS: `eas credentials` -> Android -> FCM

### 8.3 How push notifications work in HuCo

The current implementation uses local scheduled notifications (triggered on the device). To add **server-sent push notifications** (e.g., notify a user when they receive a recommendation from another user):

1. Store the user's Expo push token in `profiles.push_token` (column already exists in the schema)
2. After registration/login, call `getExpoPushToken()` and save it to Supabase:

```typescript
// After successful auth:
const token = await getExpoPushToken();
if (token) {
  await supabase.from('profiles').update({ push_token: token }).eq('id', userId);
}
```

3. From a backend (Supabase Edge Function or external server), send to Expo's push API:

```bash
POST https://exp.host/--/api/v2/push/send
Content-Type: application/json

{
  "to": "<recipient_expo_push_token>",
  "title": "Nouveau film recommande",
  "body": "Quelqu'un vous a envoye une recommandation"
}
```

---

## 9. Post-launch monitoring

### 9.1 Supabase dashboard

| Section | What to check |
|---|---|
| **Authentication -> Users** | New signups, active sessions |
| **Authentication -> Logs** | Failed login attempts, auth errors |
| **Table Editor -> user_data** | Data integrity, unexpected nulls |
| **API -> Logs** | Slow queries, RLS rejections |

Useful admin query:

```sql
select
  count(*)                                        as total_users,
  avg(jsonb_array_length(library))::numeric(4,1)  as avg_library,
  sum(jsonb_array_length(sent_recs))              as total_recs_sent,
  max(updated_at)                                 as last_activity
from public.user_data;
```

### 9.2 Expo dashboard

- expo.dev -> your project -> **Builds**: build history, logs, artifacts
- expo.dev -> your project -> **Submissions**: submission status per platform

### 9.3 App Store / Google Play

- **App Store Connect -> Analytics**: downloads, active devices, crashes, ratings
- **Google Play Console -> Android Vitals**: ANRs, crash rate, slow rendering

### 9.4 Over-the-air updates (OTA)

For JavaScript-only changes (no native module changes), you can ship updates instantly without a new store review:

```bash
eas update --branch production --message "fix: watchlist sort order"
```

Users receive the update the next time they open the app. Native changes (new Expo SDK version, new native packages) always require a full `eas build` + store submission.

---

## 10. Security audit summary

Audit performed on all source files before this production release. Results:

| Check | Status | Notes |
|---|---|---|
| No `console.log` statements | PASS | Zero found across all source files |
| No hardcoded secrets | PASS | All keys via `EXPO_PUBLIC_*` env vars |
| All URLs use HTTPS | PASS | No plain `http://` URLs in source |
| `Linking.openURL` guarded | PASS | Trailer: `startsWith('https://')` check; mailto: `canOpenURL()` guard |
| No XSS vectors | PASS | No `eval`, `innerHTML`, `dangerouslySetInnerHTML` |
| AsyncStorage — no sensitive data | PASS | State only (movies, ratings, contacts); no tokens, no passwords |
| Password minimum length enforced | PASS | 8 chars enforced in AccountScreen before API call |
| Password confirm match enforced | PASS | Checked client-side in AccountScreen |
| Supabase RLS enabled | PASS | Both tables: `auth.uid() = id/user_id` policies |
| Push token — not exposed | PASS | Token stored only in Supabase profiles table (server-side) |
| Share API — no sensitive data | PASS | Shares only movie title and TMDB rating |
| Input sanitization | PASS | `.trim()` on all text inputs before use or storage |
| Session check before Supabase write | PASS | `getSession()` called before every `upsert` in AppContext |

**No critical security issues found.** The app is ready for production deployment following the steps above.

---

## Quick-start production checklist

- [ ] Supabase production project created with fresh credentials
- [ ] Schema deployed (`supabase/schema.sql`) on production project
- [ ] Email auth enabled, redirect URLs configured (`huco://`)
- [ ] TMDB API key obtained
- [ ] `app.json` updated: `bundleIdentifier`, `package`, `version`
- [ ] `eas.json` configured with `production` profile
- [ ] EAS secrets created for all three env vars
- [ ] App Store Connect app registered (iOS)
- [ ] Google Play Console app created (Android)
- [ ] `eas build --platform ios --profile production` completed
- [ ] `eas build --platform android --profile production` completed
- [ ] Keystore backed up securely (Android)
- [ ] APNs key uploaded to EAS (iOS push)
- [ ] `eas submit` completed for both platforms
- [ ] Store listings filled in (screenshots, description, privacy policy)
- [ ] Submitted for review
