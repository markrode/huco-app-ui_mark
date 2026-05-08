import React, { useState, useCallback, useRef } from 'react';
import { View, Text, TextInput, FlatList, Image, TouchableOpacity, StyleSheet, ActivityIndicator, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { COLORS, SPACING, RADIUS } from '../components/theme';
import { Movie } from '../types';
import { searchMovies } from '../services/tmdbService';
import { MOCK_MOVIES } from '../data/mockData';

export default function SearchScreen() {
  const navigation = useNavigation<any>();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearch = useCallback((text: string) => {
    setQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!text.trim()) { setResults([]); return; }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      const apiResults = await searchMovies(text);
      if (apiResults.length > 0) {
        setResults(apiResults);
      } else {
        setResults(MOCK_MOVIES.filter((m) => m.title.toLowerCase().includes(text.toLowerCase()) || m.originalTitle.toLowerCase().includes(text.toLowerCase())));
      }
      setLoading(false);
    }, 350);
  }, []);

  function goToMovie(movie: Movie) { navigation.navigate('FilmDetails', { movie }); }
  function clearSearch() { setQuery(''); setResults([]); }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Rechercher</Text>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={COLORS.textMuted} style={styles.searchIcon} />
          <TextInput style={styles.input} placeholder="Titre en français ou original..." placeholderTextColor={COLORS.textMuted} value={query} onChangeText={handleSearch} autoCorrect={false} autoCapitalize="none" />
          {query.length > 0 && <TouchableOpacity onPress={clearSearch}><Ionicons name="close-circle" size={18} color={COLORS.textMuted} /></TouchableOpacity>}
        </View>
      </View>
      {loading && <View style={styles.loader}><ActivityIndicator color={COLORS.primary} size="large" /></View>}
      {!query.trim() && !loading && (
        <View style={styles.popularSection}>
          <Text style={styles.sectionTitle}>Films populaires</Text>
          <FlatList data={MOCK_MOVIES} keyExtractor={(item) => String(item.id)} renderItem={({ item }) => <MovieRow movie={item} onPress={() => goToMovie(item)} />} showsVerticalScrollIndicator={false} />
        </View>
      )}
      {!!query.trim() && !loading && (
        <FlatList
          data={results}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => <MovieRow movie={item} onPress={() => goToMovie(item)} />}
          ListEmptyComponent={<View style={styles.empty}><Ionicons name="film-outline" size={48} color={COLORS.textMuted} /><Text style={styles.emptyText}>Aucun film trouvé</Text></View>}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: SPACING.xl }}
        />
      )}
    </View>
  );
}

function MovieRow({ movie, onPress }: { movie: Movie; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
      {movie.poster
        ? <Image source={{ uri: movie.poster }} style={styles.rowPoster} />
        : <View style={[styles.rowPoster, styles.rowPosterPlaceholder]}><Text style={{ fontSize: 24 }}>🎬</Text></View>}
      <View style={styles.rowInfo}>
        <Text style={styles.rowTitle} numberOfLines={2}>{movie.title}</Text>
        <Text style={styles.rowOriginal} numberOfLines={1}>{movie.originalTitle}</Text>
        <View style={styles.rowMeta}>
          <Text style={styles.rowGenre}>{movie.genres.slice(0, 2).join(' · ')}</Text>
          {movie.runtime > 0 && <Text style={styles.rowRuntime}>{movie.runtime} min</Text>}
        </View>
        {movie.streaming.length > 0 && (
          <View style={styles.streamingRow}>
            {movie.streaming.map((s) => <View key={s.id} style={styles.streamingBadge}><Text style={styles.streamingText}>{s.name}</Text></View>)}
          </View>
        )}
      </View>
      <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingTop: 52, paddingHorizontal: SPACING.md, paddingBottom: SPACING.md },
  headerTitle: { color: COLORS.text, fontSize: 28, fontWeight: '800', marginBottom: SPACING.md },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: RADIUS.md, paddingHorizontal: SPACING.md, borderWidth: 1, borderColor: COLORS.border },
  searchIcon: { marginRight: SPACING.sm },
  input: { flex: 1, color: COLORS.text, fontSize: 15, paddingVertical: 12 },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  popularSection: { flex: 1 },
  sectionTitle: { color: COLORS.text, fontSize: 16, fontWeight: '700', paddingHorizontal: SPACING.md, marginBottom: SPACING.sm },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  rowPoster: { width: 56, height: 84, borderRadius: RADIUS.sm, backgroundColor: COLORS.surface, marginRight: SPACING.md },
  rowPosterPlaceholder: { justifyContent: 'center', alignItems: 'center' },
  rowInfo: { flex: 1, marginRight: SPACING.sm },
  rowTitle: { color: COLORS.text, fontSize: 15, fontWeight: '600', lineHeight: 20 },
  rowOriginal: { color: COLORS.textMuted, fontSize: 12, marginTop: 2, fontStyle: 'italic' },
  rowMeta: { flexDirection: 'row', gap: SPACING.sm, marginTop: 4 },
  rowGenre: { color: COLORS.textSecondary, fontSize: 12 },
  rowRuntime: { color: COLORS.textMuted, fontSize: 12 },
  streamingRow: { flexDirection: 'row', gap: 4, marginTop: 4, flexWrap: 'wrap' },
  streamingBadge: { backgroundColor: COLORS.primary + '33', borderRadius: RADIUS.sm, paddingHorizontal: 6, paddingVertical: 2 },
  streamingText: { color: COLORS.primary, fontSize: 10, fontWeight: '600' },
  empty: { alignItems: 'center', marginTop: 60, gap: SPACING.md },
  emptyText: { color: COLORS.textMuted, fontSize: 16 },
});
