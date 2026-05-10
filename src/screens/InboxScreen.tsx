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
import { useToast } from '../components/Toast';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useApp } from '../context/AppContext';
import StarRating from '../components/StarRating';
import Avatar from '../components/Avatar';
import RatingModal from '../components/RatingModal';
import { COLORS, SPACING, RADIUS } from '../components/theme';
import { ReceivedRecommendation, SentRecommendation, UserRating } from '../types';

type Tab = 'recues' | 'envoyees';

export default function InboxScreen() {
  const navigation = useNavigation<any>();
  const { state, dispatch } = useApp();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<Tab>('recues');
  const [addingToLibrary, setAddingToLibrary] = useState<ReceivedRecommendation | null>(null);

  const pending = state.inbox.filter((r) => r.status === 'pending');
  const handled = state.inbox.filter((r) => r.status !== 'pending');
  const sentRecs: SentRecommendation[] = state.sentRecs || [];

  function handleAction(rec: ReceivedRecommendation, action: 'watchlist' | 'library' | 'ignore') {
    if (action === 'library') {
      setAddingToLibrary(rec);
      return;
    }
    if (action === 'ignore') {
      Alert.alert('Ignorer', `Ignorer la recommandation de "${rec.movie.title}" ?`, [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Ignorer', onPress: () => dispatch({ type: 'HANDLE_RECOMMENDATION', recId: rec.id, action: 'ignore' }) },
      ]);
      return;
    }
    dispatch({ type: 'HANDLE_RECOMMENDATION', recId: rec.id, action });
    showToast(
      `"${rec.movie.title}" ${action === 'watchlist' ? 'ajouté à la Watchlist' : 'ajouté à la bibliothèque'}.`,
      'success'
    );
  }

  function confirmAddToLibrary(rating: UserRating) {
    if (!addingToLibrary) return;
    const title = addingToLibrary.movie.title;
    dispatch({ type: 'HANDLE_RECOMMENDATION', recId: addingToLibrary.id, action: 'library', rating });
    setAddingToLibrary(null);
    showToast(`"${title}" ajouté à votre bibliothèque.`, 'success');
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Recommandations</Text>
        <View style={{ width: 38 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'recues' && styles.tabActive]}
          onPress={() => setActiveTab('recues')}
        >
          <Text style={[styles.tabText, activeTab === 'recues' && styles.tabTextActive]}>
            Reçues
          </Text>
          {pending.length > 0 && (
            <View style={styles.tabBadge}>
              <Text style={styles.tabBadgeText}>{pending.length}</Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'envoyees' && styles.tabActive]}
          onPress={() => setActiveTab('envoyees')}
        >
          <Text style={[styles.tabText, activeTab === 'envoyees' && styles.tabTextActive]}>
            Envoyées
          </Text>
          {sentRecs.length > 0 && (
            <View style={[styles.tabBadge, { backgroundColor: COLORS.success }]}>
              <Text style={styles.tabBadgeText}>{sentRecs.length}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Reçues tab */}
      {activeTab === 'recues' && (
        <FlatList
          data={[...pending, ...handled]}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <RecCard
              rec={item}
              onPress={() => navigation.navigate('FilmDetails', { movie: item.movie })}
              onAction={(action) => handleAction(item, action)}
            />
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="mail-outline" size={56} color={COLORS.textMuted} />
              <Text style={styles.emptyTitle}>Aucune recommandation</Text>
              <Text style={styles.emptyText}>
                Vos contacts peuvent vous recommander des films depuis l'application.
              </Text>
            </View>
          }
          contentContainerStyle={state.inbox.length === 0 ? styles.emptyContainer : { paddingBottom: SPACING.xl }}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            pending.length > 0 && handled.length > 0 ? (
              <Text style={styles.sectionLabel}>En attente ({pending.length})</Text>
            ) : null
          }
        />
      )}

      {/* Envoyées tab */}
      {activeTab === 'envoyees' && (
        <FlatList
          data={sentRecs}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <SentCard
              rec={item}
              onPress={() => navigation.navigate('FilmDetails', { movie: item.movie })}
            />
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="paper-plane-outline" size={56} color={COLORS.textMuted} />
              <Text style={styles.emptyTitle}>Aucune recommandation envoyée</Text>
              <Text style={styles.emptyText}>
                Recommandez des films à vos contacts depuis la page détail d'un film.
              </Text>
            </View>
          }
          contentContainerStyle={sentRecs.length === 0 ? styles.emptyContainer : { paddingBottom: SPACING.xl }}
          showsVerticalScrollIndicator={false}
        />
      )}

      <RatingModal
        visible={!!addingToLibrary}
        title={`Évaluez "${addingToLibrary?.movie.title}"`}
        onConfirm={confirmAddToLibrary}
        onCancel={() => setAddingToLibrary(null)}
      />
    </View>
  );
}

function RecCard({
  rec,
  onPress,
  onAction,
}: {
  rec: ReceivedRecommendation;
  onPress: () => void;
  onAction: (action: 'watchlist' | 'library' | 'ignore') => void;
}) {
  const handled = rec.status !== 'pending';

  const statusLabel: Record<string, string> = {
    watchlisted: 'Ajouté à la Watchlist',
    seen: 'Ajouté à la bibliothèque',
    ignored: 'Ignoré',
  };

  return (
    <View style={[styles.card, handled && styles.cardDimmed]}>
      <TouchableOpacity style={styles.cardTop} onPress={onPress} activeOpacity={0.8}>
        {rec.movie.poster ? (
          <Image source={{ uri: rec.movie.poster }} style={styles.poster} />
        ) : (
          <View style={[styles.poster, styles.posterPlaceholder]}>
            <Text style={{ fontSize: 32 }}>🎬</Text>
          </View>
        )}
        <View style={styles.cardInfo}>
          <View style={styles.senderRow}>
            <Avatar initials={rec.sender.avatar} size={28} />
            <View>
              <Text style={styles.senderName}>{rec.sender.name}</Text>
              <Text style={styles.receivedAt}>{new Date(rec.receivedAt).toLocaleDateString('fr-FR')}</Text>
            </View>
          </View>
          <Text style={styles.movieTitle} numberOfLines={2}>{rec.movie.title}</Text>
          <StarRating value={rec.senderRating.stars} readonly size={16} />
          {rec.senderRating.comment ? (
            <Text style={styles.comment} numberOfLines={3}>"{rec.senderRating.comment}"</Text>
          ) : null}
        </View>
      </TouchableOpacity>

      {handled ? (
        <View style={styles.handledBadge}>
          <Ionicons
            name={rec.status === 'ignored' ? 'close-circle-outline' : 'checkmark-circle-outline'}
            size={14}
            color={rec.status === 'ignored' ? COLORS.textMuted : COLORS.success}
          />
          <Text style={[styles.handledText, rec.status === 'ignored' && { color: COLORS.textMuted }]}>
            {statusLabel[rec.status]}
          </Text>
        </View>
      ) : (
        <View style={styles.actions}>
          <TouchableOpacity style={[styles.actionBtn, styles.watchlistBtn]} onPress={() => onAction('watchlist')}>
            <Ionicons name="bookmark-outline" size={16} color={COLORS.accent} />
            <Text style={[styles.actionText, { color: COLORS.accent }]}>Watchlist</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, styles.libraryBtn]} onPress={() => onAction('library')}>
            <Ionicons name="add-circle-outline" size={16} color={COLORS.success} />
            <Text style={[styles.actionText, { color: COLORS.success }]}>Déjà vu</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, styles.ignoreBtn]} onPress={() => onAction('ignore')}>
            <Ionicons name="close-outline" size={16} color={COLORS.textMuted} />
            <Text style={[styles.actionText, { color: COLORS.textMuted }]}>Ignorer</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

function SentCard({
  rec,
  onPress,
}: {
  rec: SentRecommendation;
  onPress: () => void;
}) {
  const recipientNames = rec.recipients
    .slice(0, 3)
    .map((r) => r.name)
    .join(', ');
  const extra = rec.recipients.length > 3 ? ` +${rec.recipients.length - 3}` : '';

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.cardTop}>
        {rec.movie.poster ? (
          <Image source={{ uri: rec.movie.poster }} style={styles.poster} />
        ) : (
          <View style={[styles.poster, styles.posterPlaceholder]}>
            <Text style={{ fontSize: 32 }}>🎬</Text>
          </View>
        )}
        <View style={styles.cardInfo}>
          <View style={styles.sentBadge}>
            <Ionicons name="paper-plane" size={11} color={COLORS.success} />
            <Text style={styles.sentBadgeText}>
              {new Date(rec.sentAt).toLocaleDateString('fr-FR')}
            </Text>
          </View>
          <Text style={styles.movieTitle} numberOfLines={2}>{rec.movie.title}</Text>
          <StarRating value={rec.userRating.stars} readonly size={16} />
          {rec.userRating.comment ? (
            <Text style={styles.comment} numberOfLines={2}>"{rec.userRating.comment}"</Text>
          ) : null}
          <View style={styles.recipientsRow}>
            <Ionicons name="people-outline" size={13} color={COLORS.textMuted} />
            <Text style={styles.recipientsText} numberOfLines={1}>
              {recipientNames}{extra}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 52,
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
  },
  backBtn: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.full,
    padding: SPACING.sm,
  },
  headerTitle: { color: COLORS.text, fontSize: 20, fontWeight: '700' },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    gap: 6,
  },
  tabActive: { borderBottomWidth: 2, borderBottomColor: COLORS.primary },
  tabText: { color: COLORS.textMuted, fontSize: 14, fontWeight: '600' },
  tabTextActive: { color: COLORS.text },
  tabBadge: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  tabBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  sectionLabel: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontWeight: '600',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: COLORS.card,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardDimmed: { opacity: 0.6 },
  cardTop: { flexDirection: 'row', padding: SPACING.md, gap: SPACING.md },
  poster: { width: 80, height: 120, borderRadius: RADIUS.sm, backgroundColor: COLORS.surface },
  posterPlaceholder: { justifyContent: 'center', alignItems: 'center' },
  cardInfo: { flex: 1, gap: SPACING.xs },
  senderRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: 4 },
  senderName: { color: COLORS.text, fontSize: 13, fontWeight: '700' },
  receivedAt: { color: COLORS.textMuted, fontSize: 11 },
  movieTitle: { color: COLORS.text, fontSize: 16, fontWeight: '700', lineHeight: 20 },
  comment: { color: COLORS.textMuted, fontSize: 13, fontStyle: 'italic', lineHeight: 18 },
  sentBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 },
  sentBadgeText: { color: COLORS.success, fontSize: 11, fontWeight: '600' },
  recipientsRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  recipientsText: { color: COLORS.textMuted, fontSize: 12, flex: 1 },
  actions: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: COLORS.border },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    gap: 4,
  },
  watchlistBtn: { borderRightWidth: 1, borderRightColor: COLORS.border },
  libraryBtn: { borderRightWidth: 1, borderRightColor: COLORS.border },
  ignoreBtn: {},
  actionText: { fontSize: 13, fontWeight: '600' },
  handledBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  handledText: { color: COLORS.success, fontSize: 13, fontWeight: '600' },
  emptyContainer: { flex: 1 },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
    gap: SPACING.md,
    marginTop: 60,
  },
  emptyTitle: { color: COLORS.text, fontSize: 20, fontWeight: '700' },
  emptyText: { color: COLORS.textMuted, fontSize: 14, textAlign: 'center', lineHeight: 20 },
});
