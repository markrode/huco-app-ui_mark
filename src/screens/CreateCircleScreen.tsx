import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useApp } from '../context/AppContext';
import Avatar from '../components/Avatar';
import { useToast } from '../components/Toast';
import { COLORS, SPACING, RADIUS } from '../components/theme';
import { Circle } from '../types';

export default function CreateCircleScreen() {
  const navigation = useNavigation<any>();
  const { state, dispatch } = useApp();
  const { showToast } = useToast();
  const [name, setName] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  function toggleContact(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function handleCreate() {
    const trimmed = name.trim();
    if (!trimmed || selectedIds.length === 0) return;
    const members = state.contacts.filter((c) => selectedIds.includes(c.id));
    const circle: Circle = {
      id: Date.now().toString(),
      name: trimmed,
      members,
    };
    dispatch({ type: 'ADD_CIRCLE', circle });
    showToast(`Cercle "${trimmed}" créé avec succès.`, 'success');
    navigation.goBack();
  }

  const canCreate = name.trim().length > 0 && selectedIds.length > 0;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={22} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Nouveau cercle</Text>
        <TouchableOpacity
          onPress={handleCreate}
          disabled={!canCreate}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={[styles.createBtn, !canCreate && styles.createBtnDisabled]}>Créer</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Circle name */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Nom du cercle</Text>
          <View style={styles.nameField}>
            <View style={styles.nameIcon}>
              <Ionicons name="people" size={18} color={COLORS.primary} />
            </View>
            <TextInput
              style={styles.nameInput}
              placeholder="Ex : Famille, Collègues, Cinéphiles…"
              placeholderTextColor={COLORS.textMuted}
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              autoFocus
              maxLength={40}
              returnKeyType="done"
            />
            {name.length > 0 && (
              <TouchableOpacity onPress={() => setName('')}>
                <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Members */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>
            Membres{selectedIds.length > 0 ? ` · ${selectedIds.length} sélectionné${selectedIds.length > 1 ? 's' : ''}` : ''}
          </Text>

          {state.contacts.length === 0 ? (
            <View style={styles.noContacts}>
              <Ionicons name="people-outline" size={40} color={COLORS.textMuted} />
              <Text style={styles.noContactsText}>Aucun contact disponible</Text>
              <Text style={styles.noContactsSub}>
                Ajoutez des contacts depuis l'onglet Profil avant de créer un cercle.
              </Text>
              <TouchableOpacity
                style={styles.goToProfile}
                onPress={() => navigation.goBack()}
              >
                <Text style={styles.goToProfileText}>Retour au profil</Text>
              </TouchableOpacity>
            </View>
          ) : (
            state.contacts.map((contact) => {
              const selected = selectedIds.includes(contact.id);
              return (
                <TouchableOpacity
                  key={contact.id}
                  style={[styles.contactRow, selected && styles.contactRowSelected]}
                  onPress={() => toggleContact(contact.id)}
                  activeOpacity={0.7}
                >
                  <Avatar initials={contact.avatar} size={44} />
                  <View style={styles.contactInfo}>
                    <Text style={styles.contactName}>{contact.name}</Text>
                    <Text style={styles.contactUsername}>{contact.username}</Text>
                  </View>
                  <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
                    {selected && <Ionicons name="checkmark" size={14} color="#fff" />}
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>

        {/* Create button */}
        {state.contacts.length > 0 && (
          <View style={styles.bottomSection}>
            <TouchableOpacity
              style={[styles.createFullBtn, !canCreate && styles.createFullBtnDisabled]}
              onPress={handleCreate}
              disabled={!canCreate}
              activeOpacity={0.8}
            >
              <Ionicons name="people" size={18} color="#fff" />
              <Text style={styles.createFullBtnText}>Créer le cercle</Text>
            </TouchableOpacity>
            {!canCreate && (
              <Text style={styles.createHint}>
                {!name.trim() ? 'Donnez un nom au cercle' : 'Sélectionnez au moins un membre'}
              </Text>
            )}
          </View>
        )}

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
  createBtn: { color: COLORS.primary, fontSize: 16, fontWeight: '700' },
  createBtnDisabled: { color: COLORS.textMuted },
  section: { padding: SPACING.md, gap: SPACING.sm },
  sectionLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  nameField: {
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
  nameIcon: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nameInput: { flex: 1, color: COLORS.text, fontSize: 15 },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.sm,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  contactRowSelected: {
    backgroundColor: COLORS.primary + '10',
    borderColor: COLORS.primary + '40',
  },
  contactInfo: { flex: 1 },
  contactName: { color: COLORS.text, fontSize: 15, fontWeight: '600' },
  contactUsername: { color: COLORS.textMuted, fontSize: 13, marginTop: 2 },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  noContacts: {
    alignItems: 'center',
    gap: SPACING.sm,
    padding: SPACING.xl,
  },
  noContactsText: { color: COLORS.text, fontSize: 16, fontWeight: '600' },
  noContactsSub: { color: COLORS.textMuted, fontSize: 13, textAlign: 'center', lineHeight: 19 },
  goToProfile: {
    marginTop: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  goToProfileText: { color: COLORS.text, fontSize: 14, fontWeight: '600' },
  bottomSection: { paddingHorizontal: SPACING.md, gap: SPACING.sm },
  createFullBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingVertical: 14,
  },
  createFullBtnDisabled: { opacity: 0.4 },
  createFullBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  createHint: { color: COLORS.textMuted, fontSize: 12, textAlign: 'center' },
});
