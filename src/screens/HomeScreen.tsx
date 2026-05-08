import React from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useApp } from '../context/AppContext';
import MovieCard from '../components/MovieCard';
import { COLORS, SPACING, RADIUS } from '../components/theme';
import { MOCK_MOVIES } from '../data/mockData';
import { Movie } from '../types';

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const { state } = useApp();
  const pendingRecs = state.inbox.filter((r) => r.status === 'pending');
  const featuredRec = pendingRecs[0];
  const featuredMovie: Movie | null = featuredRec ? featuredRec.movie : MOCK_MOVIES[0];
  const networkMovies = MOCK_MOVIES.slice(1, 6);
  function goToMovie(movie: Movie) { navigation.navigate('FilmDetails', { movie }); }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.logo}>HuCo</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Inbox')}>
            <View style={styles.inboxBtn}>
              <Ionicons name="mail" size={22} color={COLORS.text} />
              {pendingRecs.length > 0 && (
                <View style={styles.badge}><Text style={styles.badgeText}>{pendingRecs.length}</Text></View>
              )}
            </View>
          </TouchableOpacity>
        </View>
        {featuredMovie && (
          <TouchableOpacity style={styles.hero} onPress={() => goToMovie(featuredMovie)} activeOpacity={0.9}>
            {featuredMovie.backdrop
              ? <Image source={{ uri: featuredMovie.backdrop }} style={styles.heroImage} />
              : <View style={[styles.heroImage, styles.heroPlaceholder]} />}
            <View style={styles.heroOverlay}>
              {featuredRec && (
                <View style={styles.heroBadge}>
                  <Ionicons name="heart" size={12} color={COLORS.text} />
                  <Text style={styles.heroBadgeText}>Recommandé par {featuredRec.sender.name.split(' ')[0]}</Text>
                </View>
              )}
              <Text style={styles.heroTitle}>{featuredMovie.title}</Text>
              <Text style={styles.heroGenres}>{featuredMovie.genres.slice(0, 3).join(' · ')}</Text>
              <View style={styles.heroMeta}>
                <Ionicons name="star" size={14} color={COLORS.accent} />
                <Text style={styles.heroRating}>{featuredMovie.rating.toFixed(1)}</Text>
                <Text style={styles.heroDot}>·</Text>
                <Text style={styles.heroYear}>{featuredMovie.releaseDate.split('-')[0]}</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
        {pendingRecs.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recommandations reçues</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Inbox')}>
                <Text style={styles.seeAll}>Voir tout</Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
              {pendingRecs.map((rec) => <MovieCard key={rec.id} movie={rec.movie} onPress={() => goToMovie(rec.movie)} />)}
            </ScrollView>
          </View>
        )}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Appréciés par votre réseau</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
            {networkMovies.map((movie) => <MovieCard key={movie.id} movie={movie} onPress={() => goToMovie(movie)} />)}
          </ScrollView>
        </View>
        {state.library.length > 0 && (
          <View style={[styles.section, { marginBottom: SPACING.xl }]}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Votre bibliothèque</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Library')}>
                <Text style={styles.seeAll}>Voir tout</Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
              {state.library.map((entry) => <MovieCard key={entry.movie.id} movie={entry.movie} onPress={() => goToMovie(entry.movie)} />)}
            </ScrollView>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SPACING.md, paddingTop: 52, paddingBottom: SPACING.md },
  logo: { color: COLORS.primary, fontSize: 28, fontWeight: '900', letterSpacing: 2 },
  inboxBtn: { position: 'relative' },
  badge: { position: 'absolute', top: -6, right: -6, backgroundColor: COLORS.primary, borderRadius: RADIUS.full, minWidth: 16, height: 16, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 3 },
  badgeText: { color: COLORS.text, fontSize: 10, fontWeight: '700' },
  hero: { marginHorizontal: SPACING.md, borderRadius: RADIUS.lg, overflow: 'hidden', height: 220, marginBottom: SPACING.lg },
  heroImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  heroPlaceholder: { backgroundColor: COLORS.surface },
  heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end', padding: SPACING.md },
  heroBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.primary, alignSelf: 'flex-start', borderRadius: RADIUS.full, paddingHorizontal: SPACING.sm, paddingVertical: 3, marginBottom: SPACING.sm, gap: 4 },
  heroBadgeText: { color: COLORS.text, fontSize: 11, fontWeight: '600' },
  heroTitle: { color: COLORS.text, fontSize: 22, fontWeight: '800', lineHeight: 26 },
  heroGenres: { color: COLORS.textSecondary, fontSize: 12, marginTop: 2 },
  heroMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 4 },
  heroRating: { color: COLORS.accent, fontSize: 13, fontWeight: '700' },
  heroDot: { color: COLORS.textMuted, fontSize: 13 },
  heroYear: { color: COLORS.textMuted, fontSize: 13 },
  section: { marginBottom: SPACING.lg },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SPACING.md, marginBottom: SPACING.sm },
  sectionTitle: { color: COLORS.text, fontSize: 16, fontWeight: '700' },
  seeAll: { color: COLORS.primary, fontSize: 13, fontWeight: '600' },
  row: { paddingHorizontal: SPACING.md },
});
