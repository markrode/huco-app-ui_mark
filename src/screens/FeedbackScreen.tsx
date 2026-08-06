import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Linking,
  Alert,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { COLORS, SPACING, RADIUS } from '../components/theme';

type FeedbackType = 'bug' | 'suggestion' | 'other';

const TYPES: { key: FeedbackType; label: string; icon: keyof typeof Ionicons.glyphMap; color: string }[] = [
  { key: 'bug', label: 'Bug', icon: 'bug', color: COLORS.primary },
  { key: 'suggestion', label: 'Suggestion', icon: 'bulb', color: COLORS.accent },
  { key: 'other', label: 'Autre', icon: 'chatbubble', color: COLORS.info },
];

const SUBJECTS: Record<FeedbackType, string> = {
  bug: '[HuCo] Signalement de bug',
  suggestion: "[HuCo] Suggestion d'amélioration",
  other: '[HuCo] Feedback',
};

export default function FeedbackScreen() {
  const navigation = useNavigation<any>();
  const [type, setType] = useState<FeedbackType>('suggestion');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedType = TYPES.find((t) => t.key === type)!;

  async function handleSend() {
    if (!message.trim()) {
      setError('Veuillez écrire un message avant d\'envoyer.');
      return;
    }
    setError(null);
    setSending(true);
    const subject = encodeURIComponent(SUBJECTS[type]);
    const body = encodeURIComponent(
      `Type : ${SUBJECTS[type].replace('[HuCo] ', '')}\n\nMessage :\n${message.trim()}\n\n---\nPlateforme : ${Platform.OS} ${Platform.Version}\nVersion app : 1.0.0`
    );
    const url = `mailto:feedback@huco.app?subject=${subject}&body=${body}`;
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert(
          'Email non configuré',
          'Aucune application email n\'est installée.\n\nVous pouvez écrire directement à : feedback@huco.app'
        );
      }
    } catch {
      Alert.alert('Erreur', 'Impossible d\'ouvrir l\'application email.');
    }
    setSending(false);
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Feedback</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.content}
      >
        {/* Intro */}
        <View style={styles.intro}>
          <View style={[styles.introIcon, { backgroundColor: selectedType.color + '20' }]}>
            <Ionicons name={selectedType.icon} size={32} color={selectedType.color} />
          </View>
          <View style={styles.introText}>
            <Text style={styles.introTitle}>Votre avis compte</Text>
            <Text style={styles.introSub}>
              Bug, idée d'amélioration ou simple retour — tout est bienvenu.
            </Text>
          </View>
        </View>

        {/* Type selector */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Type de feedback</Text>
          <View style={styles.typeRow}>
            {TYPES.map((t) => {
              const active = type === t.key;
              return (
                <TouchableOpacity
                  key={t.key}
                  style={[
                    styles.typeChip,
                    active && { backgroundColor: t.color + '20', borderColor: t.color },
                  ]}
                  onPress={() => setType(t.key)}
                  activeOpacity={0.75}
                >
                  <Ionicons name={t.icon} size={16} color={active ? t.color : COLORS.textMuted} />
                  <Text style={[styles.typeLabel, active && { color: t.color }]}>{t.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Message */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>
            {type === 'bug' ? 'Décrivez le bug' : type === 'suggestion' ? 'Votre idée' : 'Votre message'}
          </Text>
          <TextInput
            style={styles.textarea}
            placeholder={
              type === 'bug'
                ? "Que s'est-il passé ? Comment reproduire le problème ?"
                : type === 'suggestion'
                ? "Décrivez votre idée d'amélioration…"
                : 'Votre message…'
            }
            placeholderTextColor={COLORS.textMuted}
            value={message}
            onChangeText={(t) => { setMessage(t); if (error) setError(null); }}
            multiline
            textAlignVertical="top"
            autoCorrect
            maxLength={2000}
          />
          <Text style={styles.charCount}>{message.length} / 2000</Text>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </View>

        {/* Send */}
        <View style={styles.section}>
          <TouchableOpacity
            style={[
              styles.sendBtn,
              { backgroundColor: selectedType.color },
              (!message.trim() || sending) && styles.disabledBtn,
            ]}
            onPress={handleSend}
            disabled={sending || !message.trim()}
            activeOpacity={0.8}
          >
            <Ionicons name="mail" size={18} color="#fff" />
            <Text style={styles.sendBtnText}>
              {sending ? 'Ouverture…' : 'Envoyer par email'}
            </Text>
          </TouchableOpacity>
          <Text style={styles.hint}>
            Votre client email s'ouvrira avec les champs pré-remplis.
          </Text>
        </View>

        {/* Alternative */}
        <View style={styles.alternative}>
          <Text style={styles.altText}>Vous pouvez aussi écrire directement à</Text>
          <TouchableOpacity onPress={() => Linking.openURL('mailto:feedback@huco.app')}>
            <Text style={[styles.altEmail, { color: selectedType.color }]}>feedback@huco.app</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: SPACING.xxl }} />
      </ScrollView>
    </KeyboardAvoidingView>
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
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: { color: COLORS.text, fontSize: 17, fontWeight: '700' },
  content: { padding: SPACING.md, gap: SPACING.lg },
  intro: {
    flexDirection: 'row',
    gap: SPACING.md,
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  introIcon: {
    width: 56,
    height: 56,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  introText: { flex: 1, gap: 4 },
  introTitle: { color: COLORS.text, fontSize: 16, fontWeight: '700' },
  introSub: { color: COLORS.textSecondary, fontSize: 13, lineHeight: 19 },
  section: { gap: SPACING.sm },
  sectionLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  typeRow: { flexDirection: 'row', gap: SPACING.sm },
  typeChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  typeLabel: { color: COLORS.textSecondary, fontSize: 13, fontWeight: '600' },
  textarea: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    color: COLORS.text,
    fontSize: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    minHeight: 140,
    lineHeight: 22,
  },
  charCount: { color: COLORS.textMuted, fontSize: 11, textAlign: 'right' },
  errorText: { color: COLORS.primary, fontSize: 12, marginTop: 2 },
  sendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: 14,
    borderRadius: RADIUS.md,
  },
  disabledBtn: { opacity: 0.4 },
  sendBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  hint: { color: COLORS.textMuted, fontSize: 12, textAlign: 'center' },
  alternative: { alignItems: 'center', gap: 4 },
  altText: { color: COLORS.textMuted, fontSize: 13 },
  altEmail: { fontSize: 13, fontWeight: '600' },
});
