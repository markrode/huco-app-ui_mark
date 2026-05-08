import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
  StatusBar,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, RADIUS } from './theme';

const ONBOARDING_KEY = '@huco_onboarding_done';
const { width } = Dimensions.get('window');

const SLIDES = [
  {
    icon: 'film' as const,
    color: COLORS.primary,
    title: 'Bienvenue sur HuCo',
    subtitle: '"Qu\'est-ce qu\'on regarde ce soir ?"',
    description:
      'Partagez des recommandations de films avec vos amis et découvrez les tendances de la semaine.',
  },
  {
    icon: 'search' as const,
    color: COLORS.info,
    title: 'Cherchez & explorez',
    subtitle: 'Des milliers de films à portée',
    description:
      'Recherchez par titre ou filtrez par genre. Accédez aux bandes-annonces YouTube et aux plateformes de streaming disponibles.',
  },
  {
    icon: 'library' as const,
    color: COLORS.success,
    title: 'Votre bibliothèque',
    subtitle: 'Notez, commentez, organisez',
    description:
      'Ajoutez les films vus à votre bibliothèque avec une note sur 5 étoiles. Gérez votre watchlist des films à voir.',
  },
  {
    icon: 'paper-plane' as const,
    color: COLORS.accent,
    title: 'Recommandez',
    subtitle: 'Partagez avec vos proches',
    description:
      'Envoyez vos coups de cœur à vos contacts ou à des cercles entiers. Recevez leurs recommandations dans votre inbox.',
  },
];

export default function OnboardingTour() {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_KEY).then((done) => {
      if (!done) setVisible(true);
    });
  }, []);

  async function finish() {
    await AsyncStorage.setItem(ONBOARDING_KEY, '1');
    setVisible(false);
  }

  const slide = SLIDES[step];
  const isLast = step === SLIDES.length - 1;

  if (!visible) return null;

  return (
    <Modal visible animationType="fade" statusBarTranslucent>
      <LinearGradient colors={[COLORS.background, '#12122A']} style={styles.root}>
        <StatusBar barStyle="light-content" />

        {/* Skip */}
        <TouchableOpacity style={styles.skip} onPress={finish} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={styles.skipText}>Passer</Text>
        </TouchableOpacity>

        {/* Slide counter */}
        <Text style={styles.counter}>{step + 1} / {SLIDES.length}</Text>

        {/* Icon */}
        <View style={[styles.iconWrap, { backgroundColor: slide.color + '20' }]}>
          <View style={[styles.iconInner, { backgroundColor: slide.color + '35' }]}>
            <Ionicons name={slide.icon} size={60} color={slide.color} />
          </View>
        </View>

        {/* Text */}
        <View style={styles.textWrap}>
          <Text style={styles.title}>{slide.title}</Text>
          <Text style={[styles.subtitle, { color: slide.color }]}>{slide.subtitle}</Text>
          <Text style={styles.description}>{slide.description}</Text>
        </View>

        {/* Progress dots */}
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <TouchableOpacity key={i} onPress={() => setStep(i)}>
              <View
                style={[
                  styles.dot,
                  i === step
                    ? { backgroundColor: slide.color, width: 24, borderRadius: 4 }
                    : { backgroundColor: COLORS.border },
                ]}
              />
            </TouchableOpacity>
          ))}
        </View>

        {/* CTA */}
        <TouchableOpacity
          style={[styles.btn, { backgroundColor: slide.color }]}
          onPress={() => (isLast ? finish() : setStep((s) => s + 1))}
          activeOpacity={0.85}
        >
          <Text style={styles.btnText}>{isLast ? 'Commencer' : 'Suivant'}</Text>
          <Ionicons name={isLast ? 'checkmark' : 'arrow-forward'} size={18} color="#fff" />
        </TouchableOpacity>

        {/* Previous */}
        {step > 0 && (
          <TouchableOpacity onPress={() => setStep((s) => s - 1)} style={styles.prevBtn}>
            <Text style={styles.prevText}>Précédent</Text>
          </TouchableOpacity>
        )}
      </LinearGradient>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
    gap: SPACING.lg,
  },
  skip: { position: 'absolute', top: 56, right: SPACING.lg },
  skipText: { color: COLORS.textMuted, fontSize: 15, fontWeight: '600' },
  counter: { position: 'absolute', top: 60, left: SPACING.lg, color: COLORS.textMuted, fontSize: 13 },
  iconWrap: {
    width: 160,
    height: 160,
    borderRadius: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconInner: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textWrap: { alignItems: 'center', gap: SPACING.sm, paddingHorizontal: SPACING.sm },
  title: {
    color: COLORS.text,
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 32,
  },
  subtitle: { fontSize: 15, fontWeight: '600', textAlign: 'center' },
  description: {
    color: COLORS.textSecondary,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 23,
  },
  dots: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  dot: { width: 8, height: 8, borderRadius: 4 },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.xl,
    paddingVertical: 14,
    borderRadius: RADIUS.full,
    minWidth: 200,
    justifyContent: 'center',
  },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  prevBtn: { marginTop: -SPACING.sm },
  prevText: { color: COLORS.textMuted, fontSize: 14 },
});
