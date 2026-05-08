import React, { useState } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useApp } from '../context/AppContext';
import StarRating from '../components/StarRating';
import Avatar from '../components/Avatar';
import RatingModal from '../components/RatingModal';
import { COLORS, SPACING, RADIUS } from '../components/theme';
import { WatchlistEntry, UserRating } from '../types';

export default function WatchlistScreen() {
  const navigation = useNavigation<any>();
  const { state, dispatch } = useApp();
  const [markingEntry, setMarkingEntry] = useState<WatchlistEntry | null>(null);

  function confirmMarkWatched(rating: UserRating) {
    if (!markingEntry) return;
    dispatch({ type: 'MARK_WATCHED', movieId: markingEntry.movie.id, rating });
    setMarkingEntry(null);
    Alert.alert('Bravo !', `"${markingEntry.movie.title}" a été ajouté à votre bibliothèque.`);
  }

  function handleRemove(entry: WatchlistEntry) {
    Alert.alert('Retirer', `Retirer "${entry.movie.title}" de votre Watchlist ?`, [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Retirer', style: 'destructive', onPress: () => dispatch({ type: 'REMOVE_FROM_WATCHLIST', movieId: entry.movie.id }) },
    ]);
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Watchlist</Text>
        <Text style={styles.count}>{state.watchlist.length} film{state.watchlist.length !== 1 ? 's' : ''}</Text>
      </View>
      <FlatList
        data={state.watchlist}
        keyExtractor={(item) => String(item.movie.id)}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.item} onPress={() => navigation.navigate('FilmDetails', { movie: item.movie })} activeOpacity={0.8}>
            {item.movie.poster ? <Image source={{ uri: item.movie.poster }} style={styles.poster} /> : <View style={[styles.poster, styles.posterPlaceholder]}><Text style={{ fontSize: 28 }}>🎬</Text></View>}
            <View style={styles.info}>
              <Text style={styles.title} numberOfLines={2}>{item.movie.title}</Text>
              <Text style={styles.year}>{item.movie.releaseDate.split('-')[0]}</Text>
              {item.recommendations.length > 0 && (
                <View style={styles.recsSection}>
                  {item.recommendations.map((rec) => (
                    <View key={rec.id} style={styles.recRow}>
                      <Avatar initials={rec.sender.avatar} size={24} />
                      <View style={styles.recInfo}>
                        <Text style={styles.recName}>{rec.sender.name.split(' ')[0]}</Text>
                        <StarRating value={rec.senderRating.stars} readonly size={12} />
                        {rec.senderRating.comment ? <Text style={styles.recComment} numberOfLines={2}>"{rec.senderRating.comment}"</Text> : null}
                      </View>
                    </View>
                  ))}
                </View>
              )}
              <Text style={styles.date}>Ajouté le {new Date(item.addedAt).toLocaleDateString('fr-FR')}</Text>
            </View>
            <View style={styles.itemActions}>
              <TouchableOpacity style={styles.watchedBtn} onPress={() => setMarkingEntry(item)}>
                <Ionicons name="eye-outline" size={18} color={COLORS.success} />
                <Text style={styles.watchedText}>Vu</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleRemove(item)}><Ionicons name="close-circle-outline" size={22} color={COLORS.textMuted} /></TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="bookmark-outline" size={56} color={COLORS.textMuted} />
            <Text style={styles.emptyTitle}>Watchlist vide</Text>
            <Text style={styles.emptyText}>Ajoutez des films à regarder plus tard depuis la recherche ou vos recommandations reçues.</Text>
            <TouchableOpacity style={styles.searchBtn} onPress={() => navigation.navigate('Search')}><Text style={styles.searchBtnText}>Explorer des films</Text></TouchableOpacity>
          </View>
        }
        contentContainerStyle={state.watchlist.length === 0 ? styles.emptyContainer : { paddingBottom: SPACING.xl }}
        showsVerticalScrollIndicator={false}
      />
      <RatingModal visible={!!markingEntry} title={`Comment avez-vous trouvé "${markingEntry?.movie.title}" ?`} onConfirm={confirmMarkWatched} onCancel={() => setMarkingEntry(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', paddingTop: 52, paddingHorizontal: SPACING.md, paddingBottom: SPACING.md },
  headerTitle: { color: COLORS.text, fontSize: 28, fontWeight: '800' },
  count: { color: COLORS.textMuted, fontSize: 14 },
  item: { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: SPACING.md, paddingVertical: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.border, gap: SPACING.md },
  poster: { width: 70, height: 105, borderRadius: RADIUS.sm, backgroundColor: COLORS.surface },
  posterPlaceholder: { justifyContent: 'center', alignItems: 'center' },
  info: { flex: 1, gap: 4 },
  title: { color: COLORS.text, fontSize: 15, fontWeight: '600', lineHeight: 20 },
  year: { color: COLORS.textMuted, fontSize: 12 },
  recsSection: { gap: SPACING.sm, marginTop: SPACING.xs },
  recRow: { flexDirection: 'row', gap: SPACING.sm, alignItems: 'flex-start' },
  recInfo: { flex: 1 },
  recName: { color: COLORS.textSecondary, fontSize: 12, fontWeight: '600' },
  recComment: { color: COLORS.textMuted, fontSize: 12, fontStyle: 'italic', marginTop: 2, lineHeight: 16 },
  date: { color: COLORS.textMuted, fontSize: 11, marginTop: 4 },
  itemActions: { alignItems: 'center', gap: SPACING.sm },
  watchedBtn: { alignItems: 'center', gap: 2 },
  watchedText: { color: COLORS.success, fontSize: 11, fontWeight: '600' },
  emptyContainer: { flex: 1 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.xl, gap: SPACING.md },
  emptyTitle: { color: COLORS.text, fontSize: 20, fontWeight: '700' },
  emptyText: { color: COLORS.textMuted, fontSize: 14, textAlign: 'center', lineHeight: 20 },
  searchBtn: { backgroundColor: COLORS.primary, borderRadius: RADIUS.md, paddingHorizontal: SPACING.xl, paddingVertical: SPACING.md },
  searchBtnText: { color: COLORS.text, fontWeight: '700' },
});
