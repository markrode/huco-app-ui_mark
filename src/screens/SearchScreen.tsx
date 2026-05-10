import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  StatusBar,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { COLORS, SPACING, RADIUS } from '../components/theme';
import { Movie } from '../types';
import { searchMovies, getTrendingMovies, searchMoviesByGenre, POPULAR_GENRES } from '../services/tmdbService';
import { MOCK_MOVIES } from '../data/mockData';

export default function SearchScreen() {
  const navigation = useNavigation<any>();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Movie[]>([]);
  const [trending, setTrending] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeGenre, setActiveGenre] = useState<number | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    getTrendingMovies().then((data) => {
      if (data.length > 0) setTrending(data);
    });
  }, []);

  const handleSearch = useCallback((text: string) => {
    setQuery(text);
    setActiveGenre(null);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!text.trim()) {
      setResults([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      const apiResults = await searchMovies(text);
      if (apiResults.length > 0) {
        setResults(apiResults);
      } else {
        const filtered = MOCK_MOVIES.filter(
          (m) =>
            m.title.toLowerCase().includes(text.toLowerCase()) ||
            m.originalTitle.toLowerCase().includes(text.toLowerCase())
        );
        setResults(filtered);
      }
      setLoading(false);
    }, 350);
  }, []);

  async function handleGenre(genreId: number) {
    if (activeGenre === genreId) {
      setActiveGenre(null);
      setResults([]);
      return;
    }
    setActiveGenre(genreId);
    setQuery('');
    setLoading(true);
    const data = await searchMoviesByGenre(genreId);
    setResults(data.length > 0 ? data : MOCK_MOVIES);
    setLoading(false);
  }

  function clearSearch() {
    setQuery('');
    setResults([]);
    setActiveGenre(null);
  }

  function goToMovie(movie: Movie) {
    navigation.navigate('FilmDetails', { movie });
  }

  const showIdle = !query.trim() && activeGenre === null;
  const displayList = showIdle ? [] : results;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Rechercher</Text>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={COLORS.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.input}
            placeholder="Titre, acteur, réalisateur…"
            placeholderTextColor={COLORS.textMuted}
            value={query}
            onChangeText={handleSearch}
            autoCorrect={false}
            autoCapitalize="none"
            returnKeyType="search"
          />
          {(query.length > 0 || activeGenre !== null) && (
            <TouchableOpacity onPress={clearSearch} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.genreRow}
          style={styles.genreScroll}
        >
          {POPULAR_GENRES.map((genre) => {
            const active = activeGenre === genre.id;
            return (
              <TouchableOpacity
                key={genre.id}
                style={[styles.genreChip, active && styles.genreChipActive]}
                onPress={() => handleGenre(genre.id)}
                activeOpacity={0.75}
              >
                <Text style={[styles.genreChipText, active && styles.genreChipTextActive]}>
                  {genre.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {loading && (
        <View style={styles.loader}>
          <ActivityIndicator color={COLORS.primary} size="large" />
        </View>
      )}

      {showIdle && !loading && (
        <View style={styles.idleSection}>
          {trending.length > 0 ? (
            <>
              <View style={styles.idleSectionHeader}>
                <Ionicons name="trending-up" size={16} color={COLORS.accent} />
                <Text style={styles.sectionTitle}>Tendances</Text>
              </View>
              <FlatList
                data={trending}
                keyExtractor={(item) => String(item.id)}
                renderItem={({ item }) => <MovieRow movie={item} onPress={() => goToMovie(item)} />}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: SPACING.xl }}
              />
            </>
          ) : (
            <>
              <View style={styles.idleSectionHeader}>
                <Text style={styles.sectionTitle}>Films populaires</Text>
              </View>
              <FlatList
                data={MOCK_MOVIES}
                keyExtractor={(item) => String(item.id)}
                renderItem={({ item }) => <MovieRow movie={item} onPress={() => goToMovie(item)} />}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: SPACING.xl }}
              />
            </>
          )}
        </View>
      )}

      {!showIdle && !loading && (
        <FlatList
          data={displayList}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => <MovieRow movie={item} onPress={() => goToMovie(item)} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="film-outline" size={52} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>Aucun film trouvé</Text>
              <Text style={styles.emptySubtext}>Essayez un autre titre ou genre</Text>
            </View>
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: SPACING.xl }}
        />
      )}
    </View>
  );
}

function MovieRow({ movie, onPress }: { movie: Movie; onPress: () => void }) {
  const year = movie.releaseDate ? movie.releaseDate.split('-')[0] : null;
  const genres = movie.genres.slice(0, 2);

  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
      {movie.poster ? (
        <Image source={{ uri: movie.poster }} style={styles.rowPoster} />
      ) : (
        <View style={[styles.rowPoster, styles.rowPosterPlaceholder]}>
          <Text style={{ fontSize: 28 }}>🎦</Text>
        </View>
      )}
      <View style={styles.rowInfo}>
        <Text style={styles.rowTitle} numberOfLines={2}>{movie.title}</Text>
        {movie.originalTitle !== movie.title && (
          <Text style={styles.rowOriginal} numberOfLines={1}>{movie.originalTitle}</Text>
        )}

        <View style={styles.rowMeta}>
          {year ? <Text style={styles.rowYear}>{year}</Text> : null}
          {year && movie.runtime > 0 ? <Text style={styles.metaDot}>·</Text> : null}
          {movie.runtime > 0 ? <Text style={styles.rowRuntime}>{movie.runtime} min</Text> : null}
        </View>

        {genres.length > 0 && (
          <View style={styles.genreChipsRow}>
            {genres.map((g) => (
              <View key={g} style={styles.movieGenreChip}>
                <Text style={styles.movieGenreChipText}>{g}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.bottomRow}>
          {movie.rating > 0 && (
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={11} color="#FFD700" />
              <Text style={styles.ratingText}>{movie.rating.toFixed(1)}</Text>
              <Text style={styles.ratingMax}>/10</Text>
            </View>
          )}
          {movie.streaming.slice(0, 2).map((s) => (
            <View key={s.id} style={styles.streamingBadge}>
              <Text style={styles.streamingText}>{s.name}</Text>
            </View>
          ))}
        </View>
      </View>
      <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    paddingTop: 52,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    color: COLORS.text,
    fontSize: 28,
    fontWeight: '800',
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    marginHorizontal: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchIcon: { marginRight: SPACING.sm },
  input: {
    flex: 1,
    color: COLORS.text,
    fontSize: 15,
    paddingVertical: 12,
  },
  genreScroll: { marginTop: SPACING.md },
  genreRow: { paddingHorizontal: SPACING.md, gap: SPACING.sm },
  genreChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 7,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  genreChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  genreChipText: { color: COLORS.textSecondary, fontSize: 13, fontWeight: '600' },
  genreChipTextActive: { color: COLORS.text },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  idleSection: { flex: 1 },
  idleSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
  },
  sectionTitle: { color: COLORS.text, fontSize: 16, fontWeight: '700' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: SPACING.md,
  },
  rowPoster: {
    width: 66,
    height: 99,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.surface,
  },
  rowPosterPlaceholder: { justifyContent: 'center', alignItems: 'center' },
  rowInfo: { flex: 1, gap: 5 },
  rowTitle: { color: COLORS.text, fontSize: 15, fontWeight: '700', lineHeight: 20 },
  rowOriginal: { color: COLORS.textMuted, fontSize: 12, fontStyle: 'italic', marginTop: -2 },
  rowMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaDot: { color: COLORS.textMuted, fontSize: 12 },
  rowYear: { color: COLORS.textMuted, fontSize: 12 },
  rowRuntime: { color: COLORS.textMuted, fontSize: 12 },
  genreChipsRow: { flexDirection: 'row', gap: 5, flexWrap: 'wrap' },
  movieGenreChip: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xs,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  movieGenreChipText: { color: COLORS.textSecondary, fontSize: 11, fontWeight: '600' },
  bottomRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FFD70018',
    borderRadius: RADIUS.xs,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: '#FFD70040',
  },
  ratingText: { color: '#FFD700', fontSize: 12, fontWeight: '700' },
  ratingMax: { color: COLORS.textMuted, fontSize: 10 },
  streamingBadge: {
    backgroundColor: COLORS.primary + '22',
    borderRadius: RADIUS.xs,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: COLORS.primary + '44',
  },
  streamingText: { color: COLORS.primary, fontSize: 10, fontWeight: '600' },
  empty: { alignItems: 'center', marginTop: 60, gap: SPACING.sm },
  emptyText: { color: COLORS.textMuted, fontSize: 16, fontWeight: '600' },
  emptySubtext: { color: COLORS.textMuted, fontSize: 13 },
});
