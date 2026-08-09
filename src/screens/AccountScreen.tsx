import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useToast } from '../components/Toast';
import Avatar from '../components/Avatar';
import { COLORS, SPACING, RADIUS } from '../components/theme';

export default function AccountScreen() {
  const navigation = useNavigation<any>();
  const { user, updateProfile } = useAuth();
  const { showToast } = useToast();

  const [name, setName] = useState(user?.name || '');
  const [username, setUsername] = useState(user?.username?.replace('@', '') || '');
  const [editing, setEditing] = useState(false);

  const [pwdModal, setPwdModal] = useState(false);
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);

  async function handleSave() {
    if (!name.trim()) {
      showToast('Le nom ne peut pas être vide.', 'error');
      return;
    }
    const newAvatar = name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
    try {
      await updateProfile({
        name: name.trim(),
        username: `@${(username.trim() || name.toLowerCase().replace(/\s+/g, '')).replace('@', '')}`,
        avatar: newAvatar,
      });
      setEditing(false);
      showToast('Profil mis à jour', 'success');
    } catch (e: any) {
      showToast(e.message || 'Impossible de mettre à jour le profil.', 'error');
    }
  }

  function handleCancel() {
    setName(user?.name || '');
    setUsername(user?.username?.replace('@', '') || '');
    setEditing(false);
  }

  async function handlePasswordChange() {
    if (newPwd.length < 8) {
      showToast('Le mot de passe doit faire au moins 8 caractères.', 'error');
      return;
    }
    if (newPwd !== confirmPwd) {
      showToast('Les mots de passe ne correspondent pas.', 'error');
      return;
    }
    setPwdLoading(true);
    try {
      if (isSupabaseConfigured && supabase) {
        const { error } = await supabase.auth.updateUser({ password: newPwd });
        if (error) {
          showToast(error.message, 'error');
        } else {
          setPwdModal(false);
          setNewPwd('');
          setConfirmPwd('');
          showToast('Mot de passe mis à jour', 'success');
        }
      } else {
        showToast('Configurez Supabase pour activer cette fonctionnalité.', 'info');
        setPwdModal(false);
      }
    } finally {
      setPwdLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => (editing ? handleCancel() : navigation.goBack())}
        >
          <Ionicons name={editing ? 'close' : 'arrow-back'} size={22} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Mon compte</Text>
        <TouchableOpacity
          onPress={() => (editing ? handleSave() : setEditing(true))}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={[styles.editBtn, editing && { color: COLORS.success }]}>
            {editing ? 'Enregistrer' : 'Modifier'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.avatarSection}>
          <View style={styles.avatarWrap}>
            <Avatar initials={user?.avatar || 'ME'} size={84} />
            {editing && (
              <View style={styles.avatarEditBadge}>
                <Ionicons name="pencil" size={12} color={COLORS.text} />
              </View>
            )}
          </View>
          <Text style={styles.avatarName}>{user?.name}</Text>
          <Text style={styles.avatarHandle}>{user?.username}</Text>
          {isSupabaseConfigured && (
            <View style={styles.syncBadge}>
              <Ionicons name="cloud-done-outline" size={12} color={COLORS.success} />
              <Text style={styles.syncBadgeText}>Synchronisé</Text>
            </View>
          )}
        </View>

        <View style={styles.form}>
          <FormField
            label="Nom complet"
            icon="person-outline"
            value={name}
            onChangeText={setName}
            editable={editing}
            autoCapitalize="words"
          />
          <FormField
            label="Nom d'utilisateur"
            icon="at-outline"
            value={username}
            onChangeText={setUsername}
            editable={editing}
            autoCapitalize="none"
            prefix="@"
          />
          <FormField
            label="Email"
            icon="mail-outline"
            value={user?.email || ''}
            onChangeText={() => {}}
            editable={false}
            hint="Non modifiable directement — géré via Supabase."
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Sécurité</Text>
          <TouchableOpacity
            style={styles.securityRow}
            onPress={() => setPwdModal(true)}
            activeOpacity={0.7}
          >
            <View style={[styles.securityIcon, { backgroundColor: COLORS.info + '22' }]}>
              <Ionicons name="lock-closed-outline" size={16} color={COLORS.info} />
            </View>
            <View style={styles.securityContent}>
              <Text style={styles.securityLabel2}>Changer le mot de passe</Text>
              <Text style={styles.securitySub}>Minimum 8 caractères</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
          </TouchableOpacity>
        </View>

        <View style={styles.dangerZone}>
          <Text style={styles.dangerTitle}>Zone de danger</Text>
          <TouchableOpacity
            style={styles.dangerRow}
            onPress={() =>
              showToast(
                'Suppression de compte bientôt disponible. Contactez feedback@huco.app.',
                'info'
              )
            }
            activeOpacity={0.7}
          >
            <Ionicons name="trash-outline" size={16} color={COLORS.primary} />
            <Text style={styles.dangerRowText}>Supprimer mon compte</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: SPACING.xxl }} />
      </ScrollView>

      <Modal visible={pwdModal} transparent animationType="slide">
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Changer le mot de passe</Text>
            <PwdField label="Nouveau mot de passe" value={newPwd} onChangeText={setNewPwd} />
            <PwdField label="Confirmer le mot de passe" value={confirmPwd} onChangeText={setConfirmPwd} />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => { setPwdModal(false); setNewPwd(''); setConfirmPwd(''); }}
              >
                <Text style={styles.modalCancelText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalConfirm, pwdLoading && { opacity: 0.5 }]}
                onPress={handlePasswordChange}
                disabled={pwdLoading}
              >
                <Text style={styles.modalConfirmText}>{pwdLoading ? '…' : 'Confirmer'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

function PwdField({
  label,
  value,
  onChangeText,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
}) {
  const [show, setShow] = useState(false);
  return (
    <View style={fieldStyles.wrap}>
      <Text style={fieldStyles.label}>{label}</Text>
      <View style={fieldStyles.field}>
        <Ionicons name="lock-closed-outline" size={16} color={COLORS.textMuted} />
        <TextInput
          style={fieldStyles.input}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={!show}
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="••••••••"
          placeholderTextColor={COLORS.textMuted}
        />
        <TouchableOpacity
          onPress={() => setShow((s) => !s)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name={show ? 'eye-off-outline' : 'eye-outline'} size={16} color={COLORS.textMuted} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function FormField({
  label,
  icon,
  value,
  onChangeText,
  editable,
  autoCapitalize,
  prefix,
  hint,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  value: string;
  onChangeText: (t: string) => void;
  editable: boolean;
  autoCapitalize?: any;
  prefix?: string;
  hint?: string;
}) {
  return (
    <View style={fieldStyles.wrap}>
      <Text style={fieldStyles.label}>{label}</Text>
      <View style={[fieldStyles.field, !editable && fieldStyles.fieldDisabled]}>
        <Ionicons name={icon} size={16} color={COLORS.textMuted} />
        {prefix ? <Text style={fieldStyles.prefix}>{prefix}</Text> : null}
        <TextInput
          style={fieldStyles.input}
          value={value}
          onChangeText={onChangeText}
          editable={editable}
          autoCapitalize={autoCapitalize || 'sentences'}
          autoCorrect={false}
          placeholderTextColor={COLORS.textMuted}
        />
      </View>
      {hint ? <Text style={fieldStyles.hint}>{hint}</Text> : null}
    </View>
  );
}

const fieldStyles = StyleSheet.create({
  wrap: { gap: 6 },
  label: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  fieldDisabled: { opacity: 0.55 },
  prefix: { color: COLORS.textMuted, fontSize: 15 },
  input: { flex: 1, color: COLORS.text, fontSize: 15 },
  hint: { color: COLORS.textMuted, fontSize: 12, fontStyle: 'italic' },
});

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
  editBtn: { color: COLORS.primary, fontSize: 15, fontWeight: '600' },
  avatarSection: { alignItems: 'center', paddingVertical: SPACING.xl, gap: SPACING.sm },
  avatarWrap: { position: 'relative' },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.background,
  },
  avatarName: { color: COLORS.text, fontSize: 20, fontWeight: '700' },
  avatarHandle: { color: COLORS.textMuted, fontSize: 14 },
  syncBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.success + '18',
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: 4,
  },
  syncBadgeText: { color: COLORS.success, fontSize: 11, fontWeight: '600' },
  form: { paddingHorizontal: SPACING.md, gap: SPACING.md, paddingBottom: SPACING.xl },
  section: {
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  sectionLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  securityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: 13,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  securityIcon: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  securityContent: { flex: 1 },
  securityLabel2: { color: COLORS.text, fontSize: 15 },
  securitySub: { color: COLORS.textMuted, fontSize: 12, marginTop: 1 },
  dangerZone: {
    margin: SPACING.md,
    padding: SPACING.md,
    backgroundColor: COLORS.primary + '0D',
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.primary + '33',
    gap: SPACING.md,
  },
  dangerTitle: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  dangerRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  dangerRowText: { color: COLORS.primary, fontSize: 14 },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.7)' },
  modalSheet: {
    backgroundColor: COLORS.surfaceElevated,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
    gap: SPACING.md,
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.border,
    alignSelf: 'center',
    marginBottom: SPACING.sm,
  },
  modalTitle: { color: COLORS.text, fontSize: 18, fontWeight: '700', textAlign: 'center' },
  modalActions: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.sm },
  modalCancel: {
    flex: 1,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  modalCancelText: { color: COLORS.textSecondary, fontWeight: '600' },
  modalConfirm: {
    flex: 1,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
  },
  modalConfirmText: { color: COLORS.text, fontWeight: '700' },
});
