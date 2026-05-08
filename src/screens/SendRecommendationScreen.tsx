import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useApp } from '../context/AppContext';
import StarRating from '../components/StarRating';
import Avatar from '../components/Avatar';
import RatingModal from '../components/RatingModal';
import { COLORS, SPACING, RADIUS } from '../components/theme';
import { Movie, Contact, Circle, UserRating } from '../types';

type Recipient = { type: 'contact'; data: Contact } | { type: 'circle'; data: Circle };

export default function SendRecommendationScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { state, dispatch } = useApp();
  const movie: Movie = route.params.movie;
  const libraryEntry = state.library.find((e) => e.movie.id === movie.id);
  const [step, setStep] = useState<'rate' | 'recipients' | 'recap'>('rate');
  const [rating, setRating] = useState<UserRating | null>(libraryEntry?.userRating ?? null);
  const [selectedRecipients, setSelectedRecipients] = useState<Recipient[]>([]);
  const [ratingModal, setRatingModal] = useState(!libraryEntry);

  function toggleRecipient(recipient: Recipient) {
    const id = recipient.data.id;
    const exists = selectedRecipients.some((r) => r.data.id === id);
    if (exists) setSelectedRecipients(selectedRecipients.filter((r) => r.data.id !== id));
    else setSelectedRecipients([...selectedRecipients, recipient]);
  }

  function handleSend() {
    if (!rating) return;
    if (!libraryEntry) dispatch({ type: 'ADD_TO_LIBRARY', movie, rating });
    Alert.alert('Recommandation envoyée !', `Votre recommandation de "${movie.title}" a été envoyée à ${selectedRecipients.length} destinataire(s).`, [{ text: 'OK', onPress: () => navigation.goBack() }]);
  }

  if (step === 'rate') return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}><Ionicons name="arrow-back" size={22} color={COLORS.text} /></TouchableOpacity>
        <Text style={styles.headerTitle}>Recommander</Text>
        <View style={{ width: 38 }} />
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.moviePreview}>
          {movie.poster && <Image source={{ uri: movie.poster }} style={styles.previewPoster} />}
          <View style={styles.previewInfo}>
            <Text style={styles.previewTitle}>{movie.title}</Text>
            <Text style={styles.previewYear}>{movie.releaseDate.split('-')[0]}</Text>
          </View>
        </View>
        <View style={styles.rateSection}>
          <Text style={styles.label}>Votre note pour ce film</Text>
          {rating ? (
            <View style={styles.ratingDisplay}>
              <StarRating value={rating.stars} readonly size={28} />
              <TouchableOpacity onPress={() => setRatingModal(true)} style={styles.editRatingBtn}><Text style={styles.editRatingText}>Modifier</Text></TouchableOpacity>
              {rating.comment ? <Text style={styles.ratingComment}>"{rating.comment}"</Text> : null}
            </View>
          ) : (
            <TouchableOpacity style={styles.addRatingBtn} onPress={() => setRatingModal(true)}>
              <Ionicons name="star-outline" size={24} color={COLORS.accent} />
              <Text style={styles.addRatingText}>Ajouter ma note</Text>
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity style={[styles.nextBtn, !rating && styles.disabledBtn]} onPress={() => rating && setStep('recipients')} disabled={!rating}>
          <Text style={styles.nextBtnText}>Choisir les destinataires</Text>
          <Ionicons name="arrow-forward" size={18} color={COLORS.text} />
        </TouchableOpacity>
      </ScrollView>
      <RatingModal visible={ratingModal} title="Votre note pour ce film" onConfirm={(r) => { setRating(r); setRatingModal(false); }} onCancel={() => setRatingModal(false)} initialRating={rating ?? undefined} />
    </View>
  );

  if (step === 'recipients') return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setStep('rate')} style={styles.backBtn}><Ionicons name="arrow-back" size={22} color={COLORS.text} /></TouchableOpacity>
        <Text style={styles.headerTitle}>Destinataires</Text>
        <TouchableOpacity onPress={() => selectedRecipients.length > 0 && setStep('recap')} disabled={selectedRecipients.length === 0}>
          <Text style={[styles.nextText, selectedRecipients.length === 0 && styles.disabledText]}>Suivant</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.sectionLabel}>Contacts ({state.contacts.length})</Text>
      {state.contacts.map((contact) => <RecipientRow key={contact.id} title={contact.name} subtitle={contact.username} avatar={contact.avatar} selected={selectedRecipients.some((r) => r.data.id === contact.id)} onPress={() => toggleRecipient({ type: 'contact', data: contact })} />)}
      <Text style={styles.sectionLabel}>Cercles ({state.circles.length})</Text>
      {state.circles.map((circle) => <RecipientRow key={circle.id} title={circle.name} subtitle={`${circle.members.length} membres`} avatar={circle.name.charAt(0)} selected={selectedRecipients.some((r) => r.data.id === circle.id)} onPress={() => toggleRecipient({ type: 'circle', data: circle })} isCircle />)}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setStep('recipients')} style={styles.backBtn}><Ionicons name="arrow-back" size={22} color={COLORS.text} /></TouchableOpacity>
        <Text style={styles.headerTitle}>Récapitulatif</Text>
        <View style={{ width: 38 }} />
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.moviePreview}>
          {movie.poster && <Image source={{ uri: movie.poster }} style={styles.previewPoster} />}
          <View style={styles.previewInfo}>
            <Text style={styles.previewTitle}>{movie.title}</Text>
            {rating && <StarRating value={rating.stars} readonly size={18} />}
            {rating?.comment ? <Text style={styles.recapComment} numberOfLines={3}>"{rating.comment}"</Text> : null}
          </View>
        </View>
        <Text style={styles.label}>À envoyer à :</Text>
        {selectedRecipients.map((r) => (
          <View key={r.data.id} style={styles.recipientChip}>
            <Avatar initials={r.type === 'contact' ? r.data.avatar : r.data.name.charAt(0)} size={28} />
            <Text style={styles.chipName}>{r.data.name}</Text>
            {r.type === 'circle' && <Text style={styles.chipMeta}>· cercle</Text>}
          </View>
        ))}
        <TouchableOpacity style={styles.sendBtn} onPress={handleSend}>
          <Ionicons name="paper-plane" size={20} color={COLORS.text} />
          <Text style={styles.sendBtnText}>Envoyer la recommandation</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function RecipientRow({ title, subtitle, avatar, selected, onPress, isCircle = false }: { title: string; subtitle: string; avatar: string; selected: boolean; onPress: () => void; isCircle?: boolean }) {
  return (
    <TouchableOpacity style={styles.recipientRow} onPress={onPress} activeOpacity={0.7}>
      {isCircle ? <View style={styles.circleAvatar}><Ionicons name="people" size={18} color={COLORS.text} /></View> : <Avatar initials={avatar} size={40} />}
      <View style={styles.recipientInfo}><Text style={styles.recipientTitle}>{title}</Text><Text style={styles.recipientSubtitle}>{subtitle}</Text></View>
      <Ionicons name={selected ? 'checkmark-circle' : 'ellipse-outline'} size={24} color={selected ? COLORS.primary : COLORS.textMuted} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 52, paddingHorizontal: SPACING.md, paddingBottom: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  backBtn: { backgroundColor: COLORS.surface, borderRadius: RADIUS.full, padding: SPACING.sm },
  headerTitle: { color: COLORS.text, fontSize: 18, fontWeight: '700' },
  nextText: { color: COLORS.primary, fontSize: 16, fontWeight: '700' },
  disabledText: { color: COLORS.textMuted },
  scrollContent: { padding: SPACING.md, gap: SPACING.lg },
  moviePreview: { flexDirection: 'row', gap: SPACING.md, backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: SPACING.md, borderWidth: 1, borderColor: COLORS.border },
  previewPoster: { width: 70, height: 100, borderRadius: RADIUS.sm },
  previewInfo: { flex: 1, gap: SPACING.xs, justifyContent: 'center' },
  previewTitle: { color: COLORS.text, fontSize: 16, fontWeight: '700', lineHeight: 20 },
  previewYear: { color: COLORS.textMuted, fontSize: 13 },
  rateSection: { gap: SPACING.sm },
  label: { color: COLORS.text, fontSize: 15, fontWeight: '700' },
  ratingDisplay: { gap: SPACING.sm },
  editRatingBtn: { alignSelf: 'flex-start' },
  editRatingText: { color: COLORS.primary, fontSize: 13, fontWeight: '600' },
  ratingComment: { color: COLORS.textMuted, fontSize: 13, fontStyle: 'italic' },
  addRatingBtn: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, backgroundColor: COLORS.surface, borderRadius: RADIUS.md, padding: SPACING.md, borderWidth: 1, borderColor: COLORS.border },
  addRatingText: { color: COLORS.accent, fontSize: 15, fontWeight: '600' },
  nextBtn: { flexDirection: 'row', backgroundColor: COLORS.primary, borderRadius: RADIUS.md, padding: SPACING.md, alignItems: 'center', justifyContent: 'center', gap: SPACING.sm },
  nextBtnText: { color: COLORS.text, fontSize: 16, fontWeight: '700' },
  disabledBtn: { opacity: 0.4 },
  sectionLabel: { color: COLORS.textMuted, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, backgroundColor: COLORS.background },
  recipientRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.md, paddingVertical: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.border, gap: SPACING.md },
  circleAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.surface, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  recipientInfo: { flex: 1 },
  recipientTitle: { color: COLORS.text, fontSize: 15, fontWeight: '600' },
  recipientSubtitle: { color: COLORS.textMuted, fontSize: 12, marginTop: 2 },
  recipientChip: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, backgroundColor: COLORS.surface, borderRadius: RADIUS.md, padding: SPACING.md, borderWidth: 1, borderColor: COLORS.border },
  chipName: { color: COLORS.text, fontSize: 14, fontWeight: '600' },
  chipMeta: { color: COLORS.textMuted, fontSize: 12 },
  recapComment: { color: COLORS.textMuted, fontSize: 13, fontStyle: 'italic', marginTop: 4, lineHeight: 18 },
  sendBtn: { flexDirection: 'row', backgroundColor: COLORS.primary, borderRadius: RADIUS.md, padding: SPACING.md, alignItems: 'center', justifyContent: 'center', gap: SPACING.sm, marginTop: SPACING.md },
  sendBtnText: { color: COLORS.text, fontSize: 16, fontWeight: '700' },
});
