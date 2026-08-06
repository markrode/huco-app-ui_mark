import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../components/theme';

type Mode = 'login' | 'register';

export default function OnboardingScreen() {
  const { login, register, resetPassword } = useAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  function switchMode(m: Mode) {
    setMode(m);
    setName('');
    setUsername('');
    setEmail('');
    setPassword('');
  }

  async function handleForgotPassword() {
    if (!email.trim()) {
      Alert.alert('Email requis', 'Saisissez votre adresse email ci-dessus puis réessayez.');
      return;
    }
    setLoading(true);
    try {
      await resetPassword(email.trim());
      Alert.alert(
        'Email envoyé',
        `Si un compte existe pour ${email.trim()}, vous recevrez un lien de réinitialisation.`
      );
    } catch (e: any) {
      Alert.alert('Erreur', e.message || "Impossible d'envoyer l'email de réinitialisation.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit() {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Champs requis', 'Email et mot de passe obligatoires.');
      return;
    }
    if (mode === 'register' && !name.trim()) {
      Alert.alert('Champs requis', 'Votre nom complet est obligatoire.');
      return;
    }
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(email.trim(), password);
      } else {
        const uname = username.trim() || email.split('@')[0];
        await register(name.trim(), uname, email.trim(), password);
      }
    } catch (e: any) {
      Alert.alert('Erreur', e.message || 'Une erreur est survenue.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Branding */}
        <View style={styles.brand}>
          <Text style={styles.logo}>HuCo</Text>
          <Text style={styles.tagline}>Qu'est-ce qu'on regarde ce soir ?</Text>
        </View>

        {/* Form card */}
        <View style={[styles.card, SHADOWS.md]}>
          {/* Mode toggle */}
          <View style={styles.modeTabs}>
            <TouchableOpacity
              style={[styles.modeTab, mode === 'login' && styles.modeTabActive]}
              onPress={() => switchMode('login')}
            >
              <Text style={[styles.modeTabText, mode === 'login' && styles.modeTabTextActive]}>
                Connexion
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modeTab, mode === 'register' && styles.modeTabActive]}
              onPress={() => switchMode('register')}
            >
              <Text style={[styles.modeTabText, mode === 'register' && styles.modeTabTextActive]}>
                Créer un compte
              </Text>
            </TouchableOpacity>
          </View>

          {/* Register-only fields */}
          {mode === 'register' && (
            <>
              <Field
                icon="person-outline"
                placeholder="Nom complet"
                value={name}
                onChangeText={setName}
              />
              <Field
                icon="at-outline"
                placeholder="Nom d'utilisateur"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
              />
            </>
          )}

          <Field
            icon="mail-outline"
            placeholder="Adresse email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          {/* Password field with reveal toggle */}
          <View style={styles.field}>
            <Ionicons name="lock-closed-outline" size={18} color={COLORS.textMuted} style={styles.fieldIcon} />
            <TextInput
              style={styles.fieldInput}
              placeholder="Mot de passe"
              placeholderTextColor={COLORS.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={18}
                color={COLORS.textMuted}
              />
            </TouchableOpacity>
          </View>

          {/* Submit */}
          <TouchableOpacity
            style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.text} />
            ) : (
              <Text style={styles.submitText}>
                {mode === 'login' ? 'Se connecter' : "S'inscrire"}
              </Text>
            )}
          </TouchableOpacity>

          {mode === 'login' && (
            <TouchableOpacity style={styles.forgotBtn} onPress={handleForgotPassword} activeOpacity={0.7}>
              <Text style={styles.forgotText}>Mot de passe oublié ?</Text>
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.legal}>
          En continuant, vous acceptez les conditions d'utilisation et la politique de confidentialité de HuCo.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({
  icon,
  placeholder,
  value,
  onChangeText,
  keyboardType,
  autoCapitalize,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  placeholder: string;
  value: string;
  onChangeText: (t: string) => void;
  keyboardType?: any;
  autoCapitalize?: any;
}) {
  return (
    <View style={styles.field}>
      <Ionicons name={icon} size={18} color={COLORS.textMuted} style={styles.fieldIcon} />
      <TextInput
        style={styles.fieldInput}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textMuted}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize || 'sentences'}
        autoCorrect={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xxl,
  },
  brand: { alignItems: 'center', marginBottom: SPACING.xl },
  logo: {
    color: COLORS.primary,
    fontSize: 52,
    fontWeight: '900',
    letterSpacing: 4,
  },
  tagline: {
    color: COLORS.textMuted,
    fontSize: 15,
    marginTop: SPACING.sm,
    fontStyle: 'italic',
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: SPACING.md,
  },
  modeTabs: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    padding: 3,
    gap: 3,
  },
  modeTab: {
    flex: 1,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    borderRadius: RADIUS.sm,
  },
  modeTabActive: { backgroundColor: COLORS.primary },
  modeTabText: { color: COLORS.textMuted, fontSize: 14, fontWeight: '600' },
  modeTabTextActive: { color: COLORS.text },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
  },
  fieldIcon: { marginRight: SPACING.sm },
  fieldInput: {
    flex: 1,
    color: COLORS.text,
    fontSize: 15,
    paddingVertical: 14,
  },
  submitBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingVertical: 15,
    alignItems: 'center',
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitText: { color: COLORS.text, fontSize: 16, fontWeight: '700' },
  forgotBtn: { alignItems: 'center', paddingVertical: SPACING.xs },
  forgotText: { color: COLORS.textMuted, fontSize: 13 },
  legal: {
    color: COLORS.textMuted,
    fontSize: 11,
    textAlign: 'center',
    marginTop: SPACING.xl,
    lineHeight: 16,
    paddingHorizontal: SPACING.lg,
  },
});
