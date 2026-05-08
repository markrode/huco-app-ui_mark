import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import Avatar from '../components/Avatar';
import { COLORS, SPACING, RADIUS } from '../components/theme';

export default function AccountScreen() {
  const navigation = useNavigation<any>();
  const { user, updateProfile } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [username, setUsername] = useState(user?.username?.replace('@', '') || '');
  const [editing, setEditing] = useState(false);

  async function handleSave() {
    if (!name.trim()) { Alert.alert('Erreur', 'Le nom ne peut pas être vide.'); return; }
    const newAvatar = name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
    await updateProfile({
      name: name.trim(),
      username: `@${(username.trim() || name.toLowerCase().replace(/\s+/g, '')).replace('@', '')}`,
      avatar: newAvatar,
    });
    setEditing(false);
    Alert.alert('Enregistré !', 'Votre profil a été mis à jour.');
  }

  function handleCancel() {
    setName(user?.name || '');
    setUsername(user?.username?.replace('@', '') || '');
    setEditing(false);
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => editing ? handleCancel() : navigation.goBack()}>
          <Ionicons name={editing ? 'close' : 'arrow-back'} size={22} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Mon compte</Text>
        <TouchableOpacity onPress={() => editing ? handleSave() : setEditing(true)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={styles.editBtn}>{editing ? 'Enregistrer' : 'Modifier'}</Text>
        </TouchableOpacity>
      </View>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.avatarSection}>
          <Avatar initials={user?.avatar || 'ME'} size={84} />
          <Text style={styles.avatarName}>{user?.name}</Text>
          <Text style={styles.avatarHandle}>{user?.username}</Text>
        </View>
        <View style={styles.form}>
          <FormField label="Nom complet" icon="person-outline" value={name} onChangeText={setName} editable={editing} autoCapitalize="words" />
          <FormField label="Nom d’utilisateur" icon="at-outline" value={username} onChangeText={setUsername} editable={editing} autoCapitalize="none" prefix="@" />
          <FormField label="Email" icon="mail-outline" value={user?.email || ''} onChangeText={() => {}} editable={false} hint="Modifiable uniquement depuis les paramètres de sécurité." />
        </View>
        <View style={styles.dangerZone}>
          <Text style={styles.dangerTitle}>Zone de danger</Text>
          <TouchableOpacity style={styles.dangerRow} onPress={() => Alert.alert('Supprimer le compte', 'Cette action est irréversible.', [{ text: 'Annuler', style: 'cancel' }, { text: 'Supprimer', style: 'destructive', onPress: () => {} }])} activeOpacity={0.7}>
            <Ionicons name="trash-outline" size={16} color={COLORS.primary} />
            <Text style={styles.dangerRowText}>Supprimer mon compte</Text>
          </TouchableOpacity>
        </View>
        <View style={{ height: SPACING.xxl }} />
      </ScrollView>
    </View>
  );
}

function FormField({ label, icon, value, onChangeText, editable, autoCapitalize, prefix, hint }: { label: string; icon: keyof typeof Ionicons.glyphMap; value: string; onChangeText: (t: string) => void; editable: boolean; autoCapitalize?: any; prefix?: string; hint?: string; }) {
  return (
    <View style={f.wrap}>
      <Text style={f.label}>{label}</Text>
      <View style={[f.field, !editable && f.fieldDisabled]}>
        <Ionicons name={icon} size={16} color={COLORS.textMuted} />
        {prefix ? <Text style={f.prefix}>{prefix}</Text> : null}
        <TextInput style={f.input} value={value} onChangeText={onChangeText} editable={editable} autoCapitalize={autoCapitalize || 'sentences'} autoCorrect={false} placeholderTextColor={COLORS.textMuted} />
      </View>
      {hint ? <Text style={f.hint}>{hint}</Text> : null}
    </View>
  );
}

const f = StyleSheet.create({
  wrap: { gap: 6 },
  label: { color: COLORS.textMuted, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  field: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, backgroundColor: COLORS.surface, borderRadius: RADIUS.md, paddingHorizontal: SPACING.md, paddingVertical: 12, borderWidth: 1, borderColor: COLORS.border },
  fieldDisabled: { opacity: 0.55 },
  prefix: { color: COLORS.textMuted, fontSize: 15 },
  input: { flex: 1, color: COLORS.text, fontSize: 15 },
  hint: { color: COLORS.textMuted, fontSize: 12, fontStyle: 'italic' },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 52, paddingHorizontal: SPACING.md, paddingBottom: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  backBtn: { width: 38, height: 38, borderRadius: RADIUS.full, backgroundColor: COLORS.surface, justifyContent: 'center', alignItems: 'center' },
  title: { color: COLORS.text, fontSize: 17, fontWeight: '700' },
  editBtn: { color: COLORS.primary, fontSize: 15, fontWeight: '600' },
  avatarSection: { alignItems: 'center', paddingVertical: SPACING.xl, gap: SPACING.sm },
  avatarName: { color: COLORS.text, fontSize: 20, fontWeight: '700' },
  avatarHandle: { color: COLORS.textMuted, fontSize: 14 },
  form: { paddingHorizontal: SPACING.md, gap: SPACING.md, paddingBottom: SPACING.xl },
  dangerZone: { margin: SPACING.md, padding: SPACING.md, backgroundColor: COLORS.primary + '0D', borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.primary + '33', gap: SPACING.md },
  dangerTitle: { color: COLORS.primary, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 },
  dangerRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  dangerRowText: { color: COLORS.primary, fontSize: 14 },
});
