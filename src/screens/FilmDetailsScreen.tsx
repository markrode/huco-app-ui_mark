import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Linking,
  Share,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useApp } from '../context/AppContext';
import StarRating from '../components/StarRating';
import Avatar from '../components/Avatar';
import RatingModal from '../components/RatingModal';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../components/theme';
import { useToast } from '../components/Toast';
import { Movie, UserRating } from '../types';
import { getMovieDetails } from '../services/tmdbService';

const { width } = Dimensions.get('window');
const BACKDROP_HEIGHT = 260;

function formatRuntime(min: number): string {
  if (!min) return '';
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h > 0 ? `${h}h${m > 0 ? String(m).padStart(2, '0') : ''}` : `${m}min`;
}

export default function FilmDetailsScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { state, dispatch } = useApp();
  const { showToast } = useToast();
  const [movie, setMovie] = useState<Movie | null>(route.params?.movie ?? null);
  const [ratingModal, setRatingModal] = useState(false);

  useEffect(() => {
    const id = movie?.id;
    if (!id) return;
    let active = true;
    getMovieDetails(id).then((details) => {
      if (active && details) setMovie(details);
    });
    return () => { active = false; };
  }, [movie?.id]);

  if (!movie) return null;

  const inLibrary = state.library.some((e) => e.movie.id === movie.id);
  const inWatchlist = state.watchlist.some((e) => e.movie.id === movie.id);
  const libraryEntry = state.library.find((e) => e.movie.id === movie.id);
  const contactRatings = state.inbox.filter((r) => r.movie.id === movie.id);

  function addToLibrary(rating: UserRating) {
    if (!movie) return;
    dispatch({ type: 'ADD_TO_LIBRARY', movie, rating });
    setRatingModal(false);
  }

  function toggleWatchlist() {
    if (!movie || inWatchlist) return;
    dispatch({ type: 'ADD_TO_WATCHLIST', movie });
    showToast(`"${movie.title}" ajouté à la Watchlist.`, 'success');
  }

  async function handleShare() {
    if (!movie) return;
    try {
      await Share.share({
        message: `Je recommande "${movie.title}" sur HuCo ! Note TMDB : ${movie.rating.toFixed(1)}/10`,
        title: movie.title,
      });
    } catch {}
  }

  function openTrailer() {
    if (movie?.trailerUrl?.startsWith('https://')) {
      Linking.openURL(movie.trailerUrl);
    }
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Backdrop */}
        <View style={styles.backdropContainer}>
          {movie.backdrop ? (
            <Image source={{ uri: movie.backdrop }} style={styles.backdrop} />
          ) : movie.poster ? (
            <Image source={{ uri: movie.poster }} style={styles.backdrop} blurRadius={8} />
          ) : (
            <View style={[styles.backdrop, { backgroundColor: COLORS.surface }]} />
          )}
          <LinearGradient
            colors={['rgba(0,0,0,0.2)', 'transparent', COLORS.background]}
            locations={[0, 0.45, 1]}
            style={StyleSheet.absoluteFillObject}
          />
          {/* Back & Share */}
          <View style={styles.backdropActions}>
            <TouchableOpacity style={styles.circleBtn} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={20} color={COLORS.text} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.circleBtn} onPress={handleShare}>
              <Ionicons name="share-outline" size={20} color={COLORS.text} />
            </TouchableOpacity>
          </View>
          {/* Trailer button overlay */}
          {movie.trailerUrl && (
            <TouchableOpacity style={styles.trailerBtn} onPress={openTrailer} activeOpacity={0.85}>
              <Ionicons name="play-circle" size={52} color="rgba(255,255,255,0.9)" />
            </TouchableOpacity>
          )}
        </View>

        {/* Poster + info row */}
        <View style={styles.infoRow}>
          <View style={[styles.posterWrap, SHADOWS.md]}>
            {movie.poster ? (
              <Image source={{ uri: movie.poster }} style={styles.poster} />
            ) : (
              <View style={[styles.poster, styles.posterPlaceholder]}>
                <Text style={{ fontSize: 40 }}>🎬</Text>
              </View>
            )}
          </View>
          <View style={styles.infoText}>
            <Text style={styles.title}>{movie.title}</Text>
            {movie.originalTitle !== movie.title && (
              <Text style={styles.originalTitle}>{movie.originalTitle}</Text>
            )}
            <View style={styles.metaRow}>
              <Ionicons name="star" size={13} color={COLORS.accent} />
              <Text style={styles.rating}>{movie.rating.toFixed(1)}</Text>
              {movie.releaseDate && (
                <>
                  <Text style={styles.dot}>·</Text>
                  <Text style={styles.meta}>{movie.releaseDate.split('-')[0]}</Text>
                </>
              )}
              {movie.runtime > 0 && (
                <>
                  <Text style={styles.dot}>·</Text>
                  <Text style={styles.meta}>{formatRuntime(movie.runtime)}</Text>
                </>
              )}
            </View>
            {movie.genres.length > 0 && (
              <Text style={styles.genres}>{movie.genres.join(' · ')}</Text>
            )}
          </View>
        </View>

        {/* Action buttons */}
        <View style={styles.actions}>
          <ActionBtn
            icon={inLibrary ? 'checkmark-circle' : 'add-circle-outline'}
            label={inLibrary ? 'Dans ma biblio' : 'Bibliothèque'}
            color={inLibrary ? COLORS.success : COLORS.text}
            active={inLibrary}
            activeColor={COLORS.success + '22'}
            onPress={() => !inLibrary && setRatingModal(true)}
          />
          <ActionBtn
            icon={inWatchlist ? 'bookmark' : 'bookmark-outline'}
            label={inWatchlist ? 'Watchlist ✓' : 'À voir'}
            color={inWatchlist ? COLORS.accent : COLORS.text}
            active={inWatchlist}
            activeColor={COLORS.accent + '22'}
            onPress={toggleWatchlist}
          />
          <ActionBtn
            icon="paper-plane-outline"
            label="Recommander"
            color={COLORS.primary}
            onPress={() => navigation.navigate('SendRecommendation', { movie })}
          />
        </View>

        {/* My rating */}
        {libraryEntry && (
          <TouchableOpacity style={styles.section} onPress={() => setRatingModal(true)}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Ma note</Text>
              <View style={styles.editHint}>
                <Ionicons name="pencil-outline" size={13} color={COLORS.textMuted} />
                <Text style={styles.editHintText}>Modifier</Text>
              </View>
            </View>
            <StarRating value={libraryEntry.userRating.stars} readonly size={20} />
            {libraryEntry.userRating.comment ? (
              <Text style={styles.myComment}>"{libraryEntry.userRating.comment}"</Text>
            ) : null}
          </TouchableOpacity>
        )}

        {/* Synopsis */}
        {movie.overview ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Synopsis</Text>
            <Text style={styles.overview}>{movie.overview}</Text>
          </View>
        ) : null}

        {/* Cast */}
        {movie.cast.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Casting</Text>
            <View style={styles.castRow}>
              {movie.cast.map((name) => (
                <View key={name} style={styles.castChip}>
                  <Text style={styles.castName}>{name}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Streaming */}
        {movie.streaming.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Disponible sur</Text>
            <View style={styles.streamingRow}>
              {movie.streaming.map((s) => (
                <TouchableOpacity
                  key={s.id}
                  style={styles.streamingBtn}
                  onPress={() => s.url.startsWith('https://') && Linking.openURL(s.url)}
                  activeOpacity={0.75}
                >
                  <Text style={styles.streamingName}>{s.name}</Text>
                  <Ionicons name="open-outline" size={12} color={COLORS.textMuted} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Contact ratings */}
        {contactRatings.length > 0 && (
          <View style={[styles.section, { marginBottom: SPACING.xl }]}>
            <Text style={styles.sectionTitle}>Avis de vos contacts</Text>
            {contactRatings.map((rec) => (
              <View key={rec.id} style={styles.contactRec}>
                <Avatar initials={rec.sender.avatar} size={38} />
                <View style={styles.contactRecInfo}>
                  <Text style={styles.contactName}>{rec.sender.name}</Text>
                  <StarRating value={rec.senderRating.stars} readonly size={14} />
                  {rec.senderRating.comment ? (
                    <Text style={styles.contactComment}>"{rec.senderRating.comment}"</Text>
                  ) : null}
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <RatingModal
        visible={ratingModal}
        title={`Évaluer — ${movie.title}`}
        onConfirm={addToLibrary}
        onCancel={() => setRatingModal(false)}
        initialRating={libraryEntry?.userRating}
      />
    </View>
  );
}

function ActionBtn({
  icon,
  label,
  color,
  active,
  activeColor,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  color: string;
  active?: boolean;
  activeColor?: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[
        styles.actionBtn,
        active && activeColor ? { backgroundColor: activeColor, borderColor: color + '55' } : null,
      ]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <Ionicons name={icon} size={20} color={color} />
      <Text style={[styles.actionText, { color }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  backdropContainer: { height: BACKDROP_HEIGHT, position: 'relative' },
  backdrop: { width: '100%', height: '100%', resizeMode: 'cover' },
  backdropActions: {
    position: 'absolute',
    top: 52,
    left: SPACING.md,
    right: SPACING.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  circleBtn: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  trailerBtn: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoRow: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    marginTop: -70,
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  posterWrap: { borderRadius: RADIUS.md },
  poster: {
    width: 110,
    height: 165,
    borderRadius: RADIUS.md,
    borderWidth: 2,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  posterPlaceholder: { justifyContent: 'center', alignItems: 'center' },
  infoText: { flex: 1, paddingTop: 72 },
  title: { color: COLORS.text, fontSize: 19, fontWeight: '800', lineHeight: 24 },
  originalTitle: { color: COLORS.textMuted, fontSize: 12, fontStyle: 'italic', marginTop: 3 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6, flexWrap: 'wrap' },
  rating: { color: COLORS.accent, fontSize: 14, fontWeight: '700' },
  dot: { color: COLORS.textMuted, fontSize: 13 },
  meta: { color: COLORS.textMuted, fontSize: 13 },
  genres: { color: COLORS.textSecondary, fontSize: 12, marginTop: 4, lineHeight: 18 },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  actionBtn: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.sm,
    gap: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
    minHeight: 64,
    justifyContent: 'center',
  },
  actionText: { fontSize: 11, fontWeight: '600', textAlign: 'center' },
  section: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm },
  sectionTitle: { color: COLORS.text, fontSize: 15, fontWeight: '700', marginBottom: SPACING.sm },
  editHint: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  editHintText: { color: COLORS.textMuted, fontSize: 12 },
  overview: { color: COLORS.textSecondary, fontSize: 14, lineHeight: 21 },
  myComment: { color: COLORS.textMuted, fontSize: 13, marginTop: SPACING.sm, fontStyle: 'italic', lineHeight: 18 },
  castRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  castChip: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  castName: { color: COLORS.textSecondary, fontSize: 13 },
  streamingRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  streamingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    gap: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  streamingName: { color: COLORS.text, fontSize: 13, fontWeight: '600' },
  contactRec: { flexDirection: 'row', gap: SPACING.md, marginBottom: SPACING.md },
  contactRecInfo: { flex: 1, gap: 4 },
  contactName: { color: COLORS.text, fontSize: 14, fontWeight: '600' },
  contactComment: { color: COLORS.textMuted, fontSize: 13, fontStyle: 'italic', lineHeight: 18 },
});
