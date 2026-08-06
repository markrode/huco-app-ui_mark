import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Switch,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { COLORS, SPACING, RADIUS } from '../components/theme';

const PURPLE = '#8E44AD';

export default function SettingsScreen() {
  const navigation = useNavigation<any>();
  const { user, settings, updateSettings, logout } = useAuth();
  const { showToast } = useToast();

  function handleLogout() {
    Alert.alert(
      'Se déconnecter',
      'Votre bibliothèque et watchlist locales seront conservées sur cet appareil.',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Se déconnecter', style: 'destructive', onPress: logout },
      ]
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Paramètres</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <SectionLabel label="Compte" />
        <TouchableOpacity style={styles.row} onPress={() => navigation.navigate('Account')} activeOpacity={0.7}>
          <RowIcon name="person" color={COLORS.primary} />
          <View style={styles.rowContent}>
            <Text style={styles.rowLabel}>Modifier le profil</Text>
            <Text style={styles.rowValue}>{user?.name || '—'}</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
        </TouchableOpacity>
        <RowItem icon="mail-outline" iconColor={COLORS.info} label="Email" value={user?.email || '—'} />
        <RowItem icon="at-outline" iconColor={COLORS.accent} label="Nom d'utilisateur" value={user?.username || '—'} />

        <SectionLabel label="Notifications" />
        <ToggleRow
          icon="notifications"
          iconColor={COLORS.success}
          label="Notifications activées"
          value={settings.notificationsEnabled}
          onChange={(v) => updateSettings({ notificationsEnabled: v })}
        />
        <ToggleRow
          icon="paper-plane"
          iconColor={COLORS.primary}
          label="Nouvelles recommandations"
          value={settings.recommendationAlerts}
          onChange={(v) => updateSettings({ recommendationAlerts: v })}
        />
        <ToggleRow
          icon="calendar"
          iconColor={COLORS.accent}
          label="Résumé hebdomadaire"
          value={settings.weeklyDigest}
          onChange={(v) => updateSettings({ weeklyDigest: v })}
        />

        <SectionLabel label="Aide & Support" />
        <TouchableOpacity style={styles.row} onPress={() => navigation.navigate('Help')} activeOpacity={0.7}>
          <RowIcon name="help-circle" color={COLORS.info} />
          <View style={styles.rowContent}>
            <Text style={styles.rowLabel}>Centre d'aide</Text>
            <Text style={styles.rowValue}>FAQ et guides</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.row} onPress={() => navigation.navigate('Feedback')} activeOpacity={0.7}>
          <RowIcon name="bug" color={COLORS.primary} />
          <View style={styles.rowContent}>
            <Text style={styles.rowLabel}>Signaler un bug</Text>
            <Text style={styles.rowValue}>ou suggérer une amélioration</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
        </TouchableOpacity>

        <SectionLabel label="Application" />
        <RowItem icon="shield-checkmark-outline" iconColor={PURPLE} label="Confidentialité" tappable onPress={() => showToast('Politique de confidentialité bientôt disponible.', 'info')} />
        <RowItem icon="document-text-outline" iconColor={COLORS.info} label="Conditions d'utilisation" tappable onPress={() => showToast("Conditions d'utilisation bientôt disponibles.", 'info')} />
        <RowItem icon="information-circle-outline" iconColor={COLORS.textMuted} label="Version" value="1.0.0" />

        <SectionLabel label="" />
        <TouchableOpacity style={[styles.row, styles.logoutRow]} onPress={handleLogout} activeOpacity={0.7}>
          <RowIcon name="log-out" color={COLORS.primary} />
          <Text style={[styles.rowLabel, { color: COLORS.primary }]}>Se déconnecter</Text>
        </TouchableOpacity>

        <View style={{ height: SPACING.xxl }} />
      </ScrollView>
    </View>
  );
}

function SectionLabel({ label }: { label: string }) {
  return <Text style={styles.sectionLabel}>{label}</Text>;
}

function RowIcon({ name, color }: { name: keyof typeof Ionicons.glyphMap; color: string }) {
  return (
    <View style={[styles.rowIconWrap, { backgroundColor: color + '22' }]}>
      <Ionicons name={name} size={17} color={color} />
    </View>
  );
}

function RowItem({
  icon,
  iconColor,
  label,
  value,
  tappable,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  label: string;
  value?: string;
  tappable?: boolean;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} disabled={!tappable && !onPress} activeOpacity={0.7}>
      <RowIcon name={icon} color={iconColor} />
      <View style={styles.rowContent}>
        <Text style={styles.rowLabel}>{label}</Text>
        {value ? <Text style={styles.rowValue}>{value}</Text> : null}
      </View>
      {(tappable || onPress) && <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />}
    </TouchableOpacity>
  );
}

function ToggleRow({
  icon,
  iconColor,
  label,
  value,
  onChange,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <View style={styles.row}>
      <RowIcon name={icon} color={iconColor} />
      <View style={styles.rowContent}>
        <Text style={styles.rowLabel}>{label}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: COLORS.border, true: COLORS.primary }}
        thumbColor={COLORS.text}
        ios_backgroundColor={COLORS.border}
      />
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
  sectionLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: 13,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: SPACING.md,
  },
  logoutRow: { marginTop: SPACING.sm },
  rowIconWrap: {
    width: 34,
    height: 34,
    borderRadius: RADIUS.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rowContent: { flex: 1 },
  rowLabel: { color: COLORS.text, fontSize: 15 },
  rowValue: { color: COLORS.textMuted, fontSize: 13, marginTop: 1 },
});
