import React, { useState, useEffect } from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, StyleSheet, Linking, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useApp } from '../context/AppContext';
import StarRating from '../components/StarRating';
import Avatar from '../components/Avatar';
import RatingModal from '../components/RatingModal';
import { COLORS, SPACING, RADIUS } from '../components/theme';
import { Movie, UserRating } from '../types';
import { getMovieDetails } from '../services/tmdbService';

export default function FilmDetailsScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { state, dispatch } = useApp();
  const [movie, setMovie] = useState<Movie>(route.params.movie);
  const [ratingModal, setRatingModal] = useState<'library' | null>(null);

  useEffect(() => { getMovieDetails(movie.id).then((d) => { if (d) setMovie(d); }); }, [movie.id]);

  const inLibrary = state.library.some((e) => e.movie.id === movie.id);
  const inWatchlist = state.watchlist.some((e) => e.movie.id === movie.id);
  const libraryEntry = state.library.find((e) => e.movie.id === movie.id);
  const contactRatings = state.inbox.filter((r) => r.movie.id === movie.id);

  function addToLibrary(rating: UserRating) { dispatch({ type: 'ADD_TO_LIBRARY', movie, rating }); setRatingModal(null); }
  function addToWatchlist() { dispatch({ type: 'ADD_TO_WATCHLIST', movie }); Alert.alert('Ajouté !', `"${movie.title}" a été ajouté à votre Watchlist.`); }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.backdropContainer}>
          {movie.backdrop ? <Image source={{ uri: movie.backdrop }} style={styles.backdrop} />
            : movie.poster ? <Image source={{ uri: movie.poster }} style={styles.backdrop} blurRadius={5} />
            : <View style={[styles.backdrop, { backgroundColor: COLORS.surface }]} />}
          <View style={styles.backdropOverlay} />
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color={COLORS.text} />
          </TouchableOpacity>
        </View>
        <View style={styles.infoRow}>
          {movie.poster
            ? <Image source={{ uri: movie.poster }} style={styles.poster} />
            : <View style={[styles.poster, { backgroundColor: COLORS.surface, justifyContent: 'center', alignItems: 'center' }]}><Text style={{ fontSize: 40 }}>🎬</Text></View>}
          <View style={styles.infoText}>
            <Text style={styles.title}>{movie.title}</Text>
            {movie.originalTitle !== movie.title && <Text style={styles.originalTitle}>{movie.originalTitle}</Text>}
            <View style={styles.metaRow}>
              <Ionicons name="star" size={14} color={COLORS.accent} />
              <Text style={styles.rating}>{movie.rating.toFixed(1)}</Text>
            </View>
            <Text style={styles.meta}>{movie.releaseDate.split('-')[0]}{movie.runtime > 0 ? ` · ${movie.runtime} min` : ''}</Text>
            <Text style={styles.genres}>{movie.genres.join(' · ')}</Text>
          </View>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity style={[styles.actionBtn, inLibrary && styles.actionBtnActive]} onPress={() => !inLibrary && setRatingModal('library')}>
            <Ionicons name={inLibrary ? 'checkmark-circle' : 'add-circle-outline'} size={20} color={inLibrary ? COLORS.success : COLORS.text} />
            <Text style={[styles.actionText, inLibrary && { color: COLORS.success }]}>{inLibrary ? 'Dans ma biblio' : 'Bibliothèque'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, inWatchlist && styles.actionBtnActive]} onPress={() => !inWatchlist && addToWatchlist()}>
            <Ionicons name={inWatchlist ? 'bookmark' : 'bookmark-outline'} size={20} color={inWatchlist ? COLORS.accent : COLORS.text} />
            <Text style={[styles.actionText, inWatchlist && { color: COLORS.accent }]}>{inWatchlist ? 'Watchlist' : 'À voir'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('SendRecommendation', { movie })}>
            <Ionicons name="paper-plane-outline" size={20} color={COLORS.primary} />
            <Text style={[styles.actionText, { color: COLORS.primary }]}>Recommander</Text>
          </TouchableOpacity>
        </View>
        {libraryEntry && (
          <TouchableOpacity style={styles.section} onPress={() => setRatingModal('library')}>
            <Text style={styles.sectionTitle}>Ma note</Text>
            <StarRating value={libraryEntry.userRating.stars} readonly size={20} />
            {libraryEntry.userRating.comment ? <Text style={styles.myComment}>{libraryEntry.userRating.comment}</Text> : null}
          </TouchableOpacity>
        )}
        {movie.overview ? <View style={styles.section}><Text style={styles.sectionTitle}>Synopsis</Text><Text style={styles.overview}>{movie.overview}</Text></View> : null}
        {movie.cast.length > 0 && <View style={styles.section}><Text style={styles.sectionTitle}>Casting</Text><Text style={styles.cast}>{movie.cast.join(', ')}</Text></View>}
        {movie.streaming.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Disponible sur</Text>
            <View style={styles.streamingRow}>
              {movie.streaming.map((s) => (
                <TouchableOpacity key={s.id} style={styles.streamingBtn} onPress={() => Linking.openURL(s.url)}>
                  <Text style={styles.streamingName}>{s.name}</Text>
                  <Ionicons name="open-outline" size={12} color={COLORS.textMuted} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
        {contactRatings.length > 0 && (
          <View style={[styles.section, { marginBottom: SPACING.xl }]}>
            <Text style={styles.sectionTitle}>Avis de vos contacts</Text>
            {contactRatings.map((rec) => (
              <View key={rec.id} style={styles.contactRec}>
                <Avatar initials={rec.sender.avatar} size={36} />
                <View style={styles.contactRecInfo}>
                  <Text style={styles.contactName}>{rec.sender.name}</Text>
                  <StarRating value={rec.senderRating.stars} readonly size={14} />
                  {rec.senderRating.comment ? <Text style={styles.contactComment}>{rec.senderRating.comment}</Text> : null}
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
      <RatingModal visible={ratingModal === 'library'} title="Évaluez ce film" onConfirm={addToLibrary} onCancel={() => setRatingModal(null)} initialRating={libraryEntry?.userRating} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  backdropContainer: { height: 200, position: 'relative' },
  backdrop: { width: '100%', height: '100%', resizeMode: 'cover' },
  backdropOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },
  backBtn: { position: 'absolute', top: 48, left: SPACING.md, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: RADIUS.full, padding: SPACING.sm },
  infoRow: { flexDirection: 'row', padding: SPACING.md, marginTop: -60, gap: SPACING.md },
  poster: { width: 100, height: 150, borderRadius: RADIUS.md, borderWidth: 2, borderColor: COLORS.border },
  infoText: { flex: 1, paddingTop: 70 },
  title: { color: COLORS.text, fontSize: 20, fontWeight: '800', lineHeight: 24 },
  originalTitle: { color: COLORS.textMuted, fontSize: 13, fontStyle: 'italic', marginTop: 2 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  rating: { color: COLORS.accent, fontSize: 15, fontWeight: '700' },
  meta: { color: COLORS.textMuted, fontSize: 13, marginTop: 2 },
  genres: { color: COLORS.textSecondary, fontSize: 12, marginTop: 2 },
  actions: { flexDirection: 'row', paddingHorizontal: SPACING.md, gap: SPACING.sm, marginBottom: SPACING.md },
  actionBtn: { flex: 1, alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: RADIUS.md, paddingVertical: SPACING.sm, gap: 4, borderWidth: 1, borderColor: COLORS.border },
  actionBtnActive: { borderColor: COLORS.success + '66' },
  actionText: { color: COLORS.text, fontSize: 11, fontWeight: '600' },
  section: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.md, borderTopWidth: 1, borderTopColor: COLORS.border },
  sectionTitle: { color: COLORS.text, fontSize: 15, fontWeight: '700', marginBottom: SPACING.sm },
  overview: { color: COLORS.textSecondary, fontSize: 14, lineHeight: 20 },
  cast: { color: COLORS.textSecondary, fontSize: 14 },
  myComment: { color: COLORS.textMuted, fontSize: 13, marginTop: SPACING.xs, fontStyle: 'italic' },
  streamingRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  streamingBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: RADIUS.sm, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, gap: 6, borderWidth: 1, borderColor: COLORS.border },
  streamingName: { color: COLORS.text, fontSize: 13, fontWeight: '600' },
  contactRec: { flexDirection: 'row', gap: SPACING.md, marginBottom: SPACING.md },
  contactRecInfo: { flex: 1 },
  contactName: { color: COLORS.text, fontSize: 14, fontWeight: '600', marginBottom: 4 },
  contactComment: { color: COLORS.textMuted, fontSize: 13, marginTop: 4, fontStyle: 'italic' },
});
