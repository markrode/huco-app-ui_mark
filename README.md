# HuCo — Application de recommandation de films

HuCo est une application mobile (React Native / Expo) qui permet de découvrir et partager des recommandations de films entre amis.

## Fonctionnalités

- **Accueil** : Films recommandés par votre réseau, hero dynamique, raccourci vers l'inbox
- **Recherche** : Recherche en temps réel (TMDB API + fallback mock), résultats avec streaming
- **Détails film** : Synopsis, casting, plateformes, avis des contacts, ajout biblio/watchlist/recommandation
- **Bibliothèque personnelle** : Films vus avec note (1–5 ⭐) et commentaire
- **Watchlist** : Films à voir, avis de l'expéditeur, marquage "vu" → biblio
- **Inbox recommandations** : Accepter / ajouter à la watchlist / ignorer
- **Envoi de recommandations** : Flux 3 étapes (note → destinataires → récapitulatif)
- **Profil** : Contacts, cercles (groupes), statistiques

## Démarrage

```bash
npm install
npm start          # Expo Go (QR code)
npm run android    # Emulateur Android
npm run ios        # Simulateur iOS (macOS requis)
```

## API TMDB (optionnel)

Pour activer la recherche TMDB réelle, créez un fichier `.env` :

```
EXPO_PUBLIC_TMDB_API_KEY=votre_clé_api
```

Sans clé, la recherche fonctionne avec les données mock intégrées.

## Structure

```
src/
  screens/      # Tous les écrans
  components/   # Composants réutilisables (StarRating, RatingModal, Avatar, MovieCard)
  context/      # AppContext (état global + AsyncStorage)
  navigation/   # AppNavigator (tabs + stacks)
  services/     # tmdbService (API TMDB)
  data/         # mockData (films, contacts, cercles)
  types/        # Types TypeScript
```
