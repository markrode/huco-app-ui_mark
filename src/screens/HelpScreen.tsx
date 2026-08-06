import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { COLORS, SPACING, RADIUS } from '../components/theme';

const FAQ = [
  {
    q: 'Comment ajouter un film à ma bibliothèque ?',
    a: "Ouvrez la page de détail d'un film puis appuyez sur « Bibliothèque ». Vous devrez le noter sur 5 étoiles pour valider l'ajout.",
  },
  {
    q: 'Comment recommander un film à un ami ?',
    a: "Depuis la page détail d'un film, appuyez sur « Recommander ». Choisissez votre note, sélectionnez un contact ou un cercle, puis envoyez.",
  },
  {
    q: "Qu'est-ce que la Watchlist ?",
    a: "La Watchlist est votre liste de films à voir. Ajoutez-y un film depuis sa page détail et marquez-le comme vu une fois regardé pour le déplacer vers votre bibliothèque.",
  },
  {
    q: 'Comment créer un cercle ?',
    a: "Dans l'onglet Profil → Cercles, appuyez sur « Créer un cercle ». Donnez-lui un nom et sélectionnez vos contacts.",
  },
  {
    q: 'Où voir les recommandations que j\'ai envoyées ?',
    a: "Dans l'écran Recommandations (icône courrier en haut de l'accueil), appuyez sur l'onglet « Envoyées » pour retrouver l'historique de vos recommandations.",
  },
  {
    q: 'Les données sont-elles sauvegardées ?',
    a: "Vos données sont sauvegardées localement sur votre appareil. Une synchronisation cloud via Supabase est prévue dans une prochaine mise à jour.",
  },
  {
    q: "Comment configurer l'API TMDB ?",
    a: "Sans clé API, l'app utilise des données de démonstration. Pour les films réels, créez un compte gratuit sur themoviedb.org, obtenez une clé API et ajoutez-la dans un fichier .env à la racine du projet.",
  },
  {
    q: 'Le trailer ne s\'ouvre pas. Que faire ?',
    a: "Vérifiez que YouTube est installé sur votre appareil. Si le bouton lecture n'apparaît pas, c'est que ce film n'a pas de trailer disponible dans la base TMDB.",
  },
];

export default function HelpScreen() {
  const navigation = useNavigation<any>();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Aide</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Quick actions */}
        <View style={styles.quickSection}>
          <Text style={styles.quickTitle}>Besoin d'aide ?</Text>
          <View style={styles.quickRow}>
            <TouchableOpacity
              style={styles.quickCard}
              onPress={() => navigation.navigate('Feedback', { initialType: 'bug' })}
              activeOpacity={0.75}
            >
              <View style={[styles.quickIcon, { backgroundColor: COLORS.primary + '20' }]}>
                <Ionicons name="bug" size={24} color={COLORS.primary} />
              </View>
              <Text style={styles.quickLabel}>Signaler un bug</Text>
              <Text style={styles.quickSub}>Quelque chose ne fonctionne pas</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickCard}
              onPress={() => navigation.navigate('Feedback', { initialType: 'suggestion' })}
              activeOpacity={0.75}
            >
              <View style={[styles.quickIcon, { backgroundColor: COLORS.accent + '20' }]}>
                <Ionicons name="bulb" size={24} color={COLORS.accent} />
              </View>
              <Text style={styles.quickLabel}>Suggérer</Text>
              <Text style={styles.quickSub}>Une idée d'amélioration</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* FAQ */}
        <Text style={styles.faqHeader}>Questions fréquentes</Text>

        {FAQ.map((item, i) => {
          const open = openIndex === i;
          return (
            <TouchableOpacity
              key={i}
              style={[styles.faqItem, open && styles.faqItemOpen]}
              onPress={() => setOpenIndex(open ? null : i)}
              activeOpacity={0.7}
            >
              <View style={styles.faqQuestion}>
                <View style={[styles.faqNum, open && { backgroundColor: COLORS.primary + '20' }]}>
                  <Text style={[styles.faqNumText, open && { color: COLORS.primary }]}>
                    {String(i + 1).padStart(2, '0')}
                  </Text>
                </View>
                <Text style={[styles.faqQ, open && { color: COLORS.text }]}>{item.q}</Text>
                <Ionicons
                  name={open ? 'chevron-up' : 'chevron-down'}
                  size={16}
                  color={open ? COLORS.primary : COLORS.textMuted}
                />
              </View>
              {open && <Text style={styles.faqA}>{item.a}</Text>}
            </TouchableOpacity>
          );
        })}

        {/* Version */}
        <View style={styles.versionRow}>
          <Ionicons name="information-circle-outline" size={16} color={COLORS.textMuted} />
          <Text style={styles.versionText}>HuCo v1.0.0 · React Native + Expo</Text>
        </View>

        <View style={{ height: SPACING.xxl }} />
      </ScrollView>
    </View>
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
  quickSection: { padding: SPACING.md, gap: SPACING.sm },
  quickTitle: { color: COLORS.text, fontSize: 18, fontWeight: '700' },
  quickRow: { flexDirection: 'row', gap: SPACING.sm },
  quickCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: SPACING.sm,
  },
  quickIcon: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickLabel: { color: COLORS.text, fontSize: 14, fontWeight: '700' },
  quickSub: { color: COLORS.textMuted, fontSize: 12, lineHeight: 17 },
  faqHeader: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
    paddingTop: SPACING.sm,
  },
  faqItem: {
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
  },
  faqItemOpen: { backgroundColor: COLORS.card },
  faqQuestion: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  faqNum: {
    width: 28,
    height: 28,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  faqNumText: { color: COLORS.textMuted, fontSize: 11, fontWeight: '700' },
  faqQ: {
    flex: 1,
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  faqA: {
    color: COLORS.textSecondary,
    fontSize: 14,
    lineHeight: 22,
    marginTop: SPACING.sm,
    paddingLeft: 36,
  },
  versionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: SPACING.lg,
  },
  versionText: { color: COLORS.textMuted, fontSize: 12 },
});
