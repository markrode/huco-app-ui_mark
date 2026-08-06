import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  StatusBar,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import MovieCard from '../components/MovieCard';
import { COLORS, SPACING, RADIUS } from '../components/theme';
import { MOCK_MOVIES } from '../data/mockData';
import { Movie } from '../types';
import { getTrendingMovies, getPopularMovies } from '../services/tmdbService';

const { width } = Dimensions.get('window');

function formatRuntime(min: number): string {
  if (!min) return '';
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h > 0 ? `${h}h${m > 0 ? String(m).padStart(2, '0') : ''}` : `${m}min`;
}

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const { state } = useApp();
  const { user } = useAuth();
  const [trending, setTrending] = useState<Movie[]>([]);
  const [network, setNetwork] = useState<Movie[]>(MOCK_MOVIES.slice(1, 7));
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    const [trendData, popData] = await Promise.all([
      getTrendingMovies(),
      getPopularMovies(),
    ]);
    if (trendData.length > 0) setTrending(trendData);
    if (popData.length > 0) setNetwork(popData.slice(0, 6));
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const pendingRecs = state.inbox.filter((r) => r.status === 'pending');
  const featuredRec = pendingRecs[0];
  const featuredMovie: Movie | null = featuredRec
    ? featuredRec.movie
    : trending[0] || MOCK_MOVIES[0];

  function goToMovie(movie: Movie) {
    navigation.navigate('FilmDetails', { movie });
  }

  const firstName = user?.name?.split(' ')[0] || '';
  const hour = new Date().getHours();
  const salutation = hour >= 18 || hour < 5 ? 'Bonsoir' : 'Bonjour';

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.logo}>HuCo</Text>
            {firstName ? (
              <Text style={styles.greeting}>{salutation}, {firstName}</Text>
            ) : null}
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('Inbox')}>
            <View style={styles.inboxBtn}>
              <Ionicons name="mail-outline" size={24} color={COLORS.text} />
              {pendingRecs.length > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{pendingRecs.length}</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        </View>

        {/* Hero */}
        {featuredMovie && (
          <TouchableOpacity
            style={styles.hero}
            onPress={() => goToMovie(featuredMovie)}
            activeOpacity={0.9}
          >
            {featuredMovie.backdrop ? (
              <Image source={{ uri: featuredMovie.backdrop }} style={styles.heroImage} />
            ) : (
              <View style={[styles.heroImage, { backgroundColor: COLORS.surface }]} />
            )}
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.55)', 'rgba(0,0,0,0.92)']}
              style={StyleSheet.absoluteFillObject}
            />
            <View style={styles.heroContent}>
              {featuredRec ? (
                <View style={styles.heroBadge}>
                  <Ionicons name="heart" size={11} color="#fff" />
                  <Text style={styles.heroBadgeText}>
                    Recommandé par {featuredRec.sender.name.split(' ')[0]}
                  </Text>
                </View>
              ) : trending.length > 0 ? (
                <View style={[styles.heroBadge, { backgroundColor: COLORS.accent }]}>
                  <Ionicons name="trending-up" size={11} color="#000" />
                  <Text style={[styles.heroBadgeText, { color: '#000' }]}>Tendance</Text>
                </View>
              ) : null}
              <Text style={styles.heroTitle} numberOfLines={2}>{featuredMovie.title}</Text>
              {featuredMovie.genres.length > 0 && (
                <Text style={styles.heroGenres}>{featuredMovie.genres.slice(0, 3).join(' · ')}</Text>
              )}
              <View style={styles.heroMeta}>
                <Ionicons name="star" size={13} color={COLORS.accent} />
                <Text style={styles.heroRating}>{featuredMovie.rating.toFixed(1)}</Text>
                {featuredMovie.releaseDate ? (
                  <>
                    <Text style={styles.heroDot}>·</Text>
                    <Text style={styles.heroYear}>{featuredMovie.releaseDate.split('-')[0]}</Text>
                  </>
                ) : null}
                {featuredMovie.runtime > 0 && (
                  <>
                    <Text style={styles.heroDot}>·</Text>
                    <Text style={styles.heroYear}>{formatRuntime(featuredMovie.runtime)}</Text>
                  </>
                )}
              </View>
            </View>
          </TouchableOpacity>
        )}

        {/* Pending recommendations */}
        {pendingRecs.length > 0 && (
          <Section
            title="Recommandations reçues"
            onSeeAll={() => navigation.navigate('Inbox')}
          >
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
              {pendingRecs.map((rec) => (
                <MovieCard key={rec.id} movie={rec.movie} onPress={() => goToMovie(rec.movie)} />
              ))}
            </ScrollView>
          </Section>
        )}

        {/* Trending */}
        {trending.length > 0 && (
          <Section title="Tendances cette semaine" icon="trending-up">
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
              {trending.slice(0, 8).map((movie) => (
                <MovieCard key={movie.id} movie={movie} onPress={() => goToMovie(movie)} />
              ))}
            </ScrollView>
          </Section>
        )}

        {/* Network */}
        <Section title="Appréciés par votre réseau">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
            {network.map((movie) => (
              <MovieCard key={movie.id} movie={movie} onPress={() => goToMovie(movie)} />
            ))}
          </ScrollView>
        </Section>

        {/* Library preview */}
        {state.library.length > 0 && (
          <Section
            title="Votre bibliothèque"
            onSeeAll={() => navigation.navigate('Library')}
          >
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
              {state.library.slice(0, 6).map((entry) => (
                <MovieCard key={entry.movie.id} movie={entry.movie} onPress={() => goToMovie(entry.movie)} />
              ))}
            </ScrollView>
          </Section>
        )}

        <View style={{ height: SPACING.xl }} />
      </ScrollView>
    </View>
  );
}

function Section({
  title,
  icon,
  onSeeAll,
  children,
}: {
  title: string;
  icon?: keyof typeof Ionicons.glyphMap;
  onSeeAll?: () => void;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleRow}>
          {icon && <Ionicons name={icon} size={15} color={COLORS.accent} />}
          <Text style={styles.sectionTitle}>{title}</Text>
        </View>
        {onSeeAll && (
          <TouchableOpacity onPress={onSeeAll}>
            <Text style={styles.seeAll}>Voir tout</Text>
          </TouchableOpacity>
        )}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: SPACING.md,
    paddingTop: 52,
    paddingBottom: SPACING.md,
  },
  logo: { color: COLORS.primary, fontSize: 28, fontWeight: '900', letterSpacing: 2 },
  greeting: { color: COLORS.textMuted, fontSize: 13, marginTop: 2 },
  inboxBtn: { position: 'relative', marginTop: 4 },
  badge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  badgeText: { color: COLORS.text, fontSize: 10, fontWeight: '700' },
  hero: {
    marginHorizontal: SPACING.md,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    height: 240,
    marginBottom: SPACING.lg,
  },
  heroImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  heroContent: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    padding: SPACING.md,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    alignSelf: 'flex-start',
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    marginBottom: SPACING.sm,
    gap: 4,
  },
  heroBadgeText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  heroTitle: { color: COLORS.text, fontSize: 22, fontWeight: '800', lineHeight: 27 },
  heroGenres: { color: COLORS.textSecondary, fontSize: 12, marginTop: 3 },
  heroMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 4 },
  heroRating: { color: COLORS.accent, fontSize: 13, fontWeight: '700' },
  heroDot: { color: COLORS.textMuted, fontSize: 13 },
  heroYear: { color: COLORS.textMuted, fontSize: 13 },
  section: { marginBottom: SPACING.lg },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
  },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sectionTitle: { color: COLORS.text, fontSize: 16, fontWeight: '700' },
  seeAll: { color: COLORS.primary, fontSize: 13, fontWeight: '600' },
  row: { paddingHorizontal: SPACING.md, gap: SPACING.sm },
});
