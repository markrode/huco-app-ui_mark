import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useApp } from '../context/AppContext';
import StarRating from '../components/StarRating';
import RatingModal from '../components/RatingModal';
import { COLORS, SPACING, RADIUS } from '../components/theme';
import { LibraryEntry, UserRating } from '../types';

type SortMode = 'date' | 'rating' | 'title';

const SORT_OPTIONS: { key: SortMode; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'date', label: 'Récent', icon: 'time-outline' },
  { key: 'rating', label: 'Note', icon: 'star-outline' },
  { key: 'title', label: 'A–Z', icon: 'text-outline' },
];

export default function LibraryScreen() {
  const navigation = useNavigation<any>();
  const { state, dispatch } = useApp();
  const [editingEntry, setEditingEntry] = useState<LibraryEntry | null>(null);
  const [sortMode, setSortMode] = useState<SortMode>('date');

  const sorted = [...state.library].sort((a, b) => {
    if (sortMode === 'rating') return b.userRating.stars - a.userRating.stars;
    if (sortMode === 'title') return a.movie.title.localeCompare(b.movie.title, 'fr');
    return new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime();
  });

  function handleUpdateRating(rating: UserRating) {
    if (!editingEntry) return;
    dispatch({ type: 'UPDATE_LIBRARY_RATING', movieId: editingEntry.movie.id, rating });
    setEditingEntry(null);
  }

  function handleRemove(entry: LibraryEntry) {
    Alert.alert(
      'Supprimer',
      `Retirer "${entry.movie.title}" de votre bibliothèque ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => dispatch({ type: 'REMOVE_FROM_LIBRARY', movieId: entry.movie.id }),
        },
      ]
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>Ma Bibliothèque</Text>
          <Text style={styles.count}>{state.library.length} film{state.library.length !== 1 ? 's' : ''}</Text>
        </View>
        {state.library.length > 1 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.sortRow}
          >
            {SORT_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.key}
                style={[styles.sortChip, sortMode === opt.key && styles.sortChipActive]}
                onPress={() => setSortMode(opt.key)}
                activeOpacity={0.75}
              >
                <Ionicons
                  name={opt.icon}
                  size={13}
                  color={sortMode === opt.key ? COLORS.text : COLORS.textMuted}
                />
                <Text style={[styles.sortChipText, sortMode === opt.key && styles.sortChipTextActive]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>

      <FlatList
        data={sorted}
        keyExtractor={(item) => String(item.movie.id)}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.item}
            onPress={() => navigation.navigate('FilmDetails', { movie: item.movie })}
            activeOpacity={0.8}
          >
            {item.movie.poster ? (
              <Image source={{ uri: item.movie.poster }} style={styles.poster} />
            ) : (
              <View style={[styles.poster, styles.posterPlaceholder]}>
                <Text style={{ fontSize: 28 }}>🎬</Text>
              </View>
            )}
            <View style={styles.info}>
              <Text style={styles.title} numberOfLines={2}>
                {item.movie.title}
              </Text>
              <View style={styles.metaRow}>
                {item.movie.releaseDate ? (
                  <Text style={styles.metaText}>{item.movie.releaseDate.split('-')[0]}</Text>
                ) : null}
                {item.movie.releaseDate && item.movie.genres.length > 0 ? (
                  <Text style={styles.metaDot}>·</Text>
                ) : null}
                {item.movie.genres.length > 0 && (
                  <Text style={styles.metaText} numberOfLines={1}>
                    {item.movie.genres.slice(0, 2).join(', ')}
                  </Text>
                )}
              </View>
              <StarRating value={item.userRating.stars} readonly size={16} />
              {item.userRating.comment ? (
                <Text style={styles.comment} numberOfLines={2}>
                  "{item.userRating.comment}"
                </Text>
              ) : null}
              <Text style={styles.date}>
                Ajouté le {new Date(item.addedAt).toLocaleDateString('fr-FR')}
              </Text>
            </View>
            <View style={styles.itemActions}>
              <TouchableOpacity style={styles.editBtn} onPress={() => setEditingEntry(item)}>
                <Ionicons name="pencil-outline" size={18} color={COLORS.textMuted} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.deleteBtn} onPress={() => handleRemove(item)}>
                <Ionicons name="trash-outline" size={18} color={COLORS.primary} />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="library-outline" size={56} color={COLORS.textMuted} />
            <Text style={styles.emptyTitle}>Bibliothèque vide</Text>
            <Text style={styles.emptyText}>
              Ajoutez des films que vous avez vus depuis la recherche ou les détails d'un film.
            </Text>
            <TouchableOpacity style={styles.searchBtn} onPress={() => navigation.navigate('Search')}>
              <Text style={styles.searchBtnText}>Rechercher un film</Text>
            </TouchableOpacity>
          </View>
        }
        contentContainerStyle={state.library.length === 0 ? styles.emptyContainer : { paddingBottom: SPACING.xl }}
        showsVerticalScrollIndicator={false}
      />

      <RatingModal
        visible={!!editingEntry}
        title={`Modifier ma note — ${editingEntry?.movie.title}`}
        onConfirm={handleUpdateRating}
        onCancel={() => setEditingEntry(null)}
        initialRating={editingEntry?.userRating}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    paddingTop: 52,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  headerTitle: { color: COLORS.text, fontSize: 28, fontWeight: '800' },
  count: { color: COLORS.textMuted, fontSize: 14 },
  sortRow: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
    gap: SPACING.sm,
  },
  sortChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: SPACING.md,
    paddingVertical: 7,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sortChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  sortChipText: { color: COLORS.textMuted, fontSize: 13, fontWeight: '600' },
  sortChipTextActive: { color: COLORS.text },
  item: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: SPACING.md,
  },
  poster: {
    width: 70,
    height: 105,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.surface,
  },
  posterPlaceholder: { justifyContent: 'center', alignItems: 'center' },
  info: { flex: 1, gap: 4 },
  title: { color: COLORS.text, fontSize: 15, fontWeight: '600', lineHeight: 20 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, flexWrap: 'wrap' },
  metaText: { color: COLORS.textMuted, fontSize: 12 },
  metaDot: { color: COLORS.textMuted, fontSize: 12 },
  comment: { color: COLORS.textMuted, fontSize: 13, fontStyle: 'italic', lineHeight: 18 },
  date: { color: COLORS.textMuted, fontSize: 11, marginTop: 2 },
  itemActions: { gap: SPACING.sm },
  editBtn: { padding: 4 },
  deleteBtn: { padding: 4 },
  emptyContainer: { flex: 1 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.xl, gap: SPACING.md },
  emptyTitle: { color: COLORS.text, fontSize: 20, fontWeight: '700' },
  emptyText: { color: COLORS.textMuted, fontSize: 14, textAlign: 'center', lineHeight: 20 },
  searchBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
  },
  searchBtnText: { color: COLORS.text, fontWeight: '700' },
});
