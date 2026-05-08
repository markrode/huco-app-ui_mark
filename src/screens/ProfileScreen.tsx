import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, TextInput, Modal, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import Avatar from '../components/Avatar';
import { COLORS, SPACING, RADIUS } from '../components/theme';
import { Contact } from '../types';

type Tab = 'contacts' | 'circles' | 'stats';

export default function ProfileScreen() {
  const { state, dispatch } = useApp();
  const [tab, setTab] = useState<Tab>('contacts');
  const [addContactModal, setAddContactModal] = useState(false);
  const [newContactName, setNewContactName] = useState('');
  const [newContactUsername, setNewContactUsername] = useState('');

  function handleAddContact() {
    if (!newContactName.trim()) return;
    const initials = newContactName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
    const contact: Contact = { id: Date.now().toString(), name: newContactName.trim(), avatar: initials, username: newContactUsername.trim() || `@${newContactName.toLowerCase().replace(/\s/g, '')}` };
    dispatch({ type: 'ADD_CONTACT', contact });
    setNewContactName(''); setNewContactUsername(''); setAddContactModal(false);
  }

  const stats = {
    library: state.library.length,
    watchlist: state.watchlist.length,
    inboxTotal: state.inbox.length,
    avgRating: state.library.length > 0 ? (state.library.reduce((acc, e) => acc + e.userRating.stars, 0) / state.library.length).toFixed(1) : '—',
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.profileInfo}>
          <View style={styles.avatarLarge}><Text style={styles.avatarText}>Moi</Text></View>
          <View><Text style={styles.userName}>Mon profil</Text><Text style={styles.userHandle}>@moi</Text></View>
        </View>
      </View>
      <View style={styles.tabs}>
        {(['contacts', 'circles', 'stats'] as Tab[]).map((t) => (
          <TouchableOpacity key={t} style={[styles.tab, tab === t && styles.tabActive]} onPress={() => setTab(t)}>
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>{t === 'contacts' ? 'Contacts' : t === 'circles' ? 'Cercles' : 'Statistiques'}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {tab === 'contacts' && (
        <View style={{ flex: 1 }}>
          <TouchableOpacity style={styles.addBtn} onPress={() => setAddContactModal(true)}>
            <Ionicons name="person-add-outline" size={18} color={COLORS.primary} />
            <Text style={styles.addBtnText}>Ajouter un contact</Text>
          </TouchableOpacity>
          <FlatList
            data={state.contacts}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.contactRow}>
                <Avatar initials={item.avatar} size={44} />
                <View style={styles.contactInfo}><Text style={styles.contactName}>{item.name}</Text><Text style={styles.contactUsername}>{item.username}</Text></View>
                <TouchableOpacity onPress={() => Alert.alert('Retirer', `Retirer ${item.name} de vos contacts ?`, [{ text: 'Annuler', style: 'cancel' }, { text: 'Retirer', style: 'destructive', onPress: () => dispatch({ type: 'REMOVE_CONTACT', contactId: item.id }) }])}>
                  <Ionicons name="person-remove-outline" size={20} color={COLORS.textMuted} />
                </TouchableOpacity>
              </View>
            )}
            ListEmptyComponent={<View style={styles.empty}><Ionicons name="people-outline" size={48} color={COLORS.textMuted} /><Text style={styles.emptyText}>Aucun contact pour l'instant</Text></View>}
            showsVerticalScrollIndicator={false}
          />
        </View>
      )}
      {tab === 'circles' && (
        <ScrollView showsVerticalScrollIndicator={false}>
          {state.circles.map((circle) => (
            <View key={circle.id} style={styles.circleCard}>
              <View style={styles.circleHeader}><Ionicons name="people" size={20} color={COLORS.primary} /><Text style={styles.circleName}>{circle.name}</Text><Text style={styles.circleCount}>{circle.members.length} membres</Text></View>
              <View style={styles.circleMembers}>
                {circle.members.map((m) => (<View key={m.id} style={styles.memberChip}><Avatar initials={m.avatar} size={24} /><Text style={styles.memberName}>{m.name.split(' ')[0]}</Text></View>))}
              </View>
            </View>
          ))}
          {state.circles.length === 0 && <View style={styles.empty}><Ionicons name="people-circle-outline" size={48} color={COLORS.textMuted} /><Text style={styles.emptyText}>Aucun cercle créé</Text></View>}
        </ScrollView>
      )}
      {tab === 'stats' && (
        <ScrollView contentContainerStyle={styles.statsContainer}>
          {[{ icon: 'library-outline', label: 'Films vus', value: stats.library, color: COLORS.success }, { icon: 'bookmark-outline', label: 'Watchlist', value: stats.watchlist, color: COLORS.accent }, { icon: 'mail-outline', label: 'Reco reçues', value: stats.inboxTotal, color: COLORS.primary }, { icon: 'star-outline', label: 'Note moyenne', value: stats.avgRating, color: COLORS.accent }].map((s) => (
            <View key={s.label} style={styles.statCard}><Ionicons name={s.icon as any} size={28} color={s.color} /><Text style={styles.statValue}>{s.value}</Text><Text style={styles.statLabel}>{s.label}</Text></View>
          ))}
        </ScrollView>
      )}
      <Modal visible={addContactModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Ajouter un contact</Text>
            <TextInput style={styles.modalInput} placeholder="Nom complet" placeholderTextColor={COLORS.textMuted} value={newContactName} onChangeText={setNewContactName} />
            <TextInput style={styles.modalInput} placeholder="@username (optionnel)" placeholderTextColor={COLORS.textMuted} value={newContactUsername} onChangeText={setNewContactUsername} autoCapitalize="none" />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setAddContactModal(false)}><Text style={styles.modalCancelText}>Annuler</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.modalConfirm, !newContactName.trim() && { opacity: 0.4 }]} onPress={handleAddContact} disabled={!newContactName.trim()}><Text style={styles.modalConfirmText}>Ajouter</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingTop: 52, paddingHorizontal: SPACING.md, paddingBottom: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  profileInfo: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  avatarLarge: { width: 60, height: 60, borderRadius: 30, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: COLORS.text, fontWeight: '700', fontSize: 14 },
  userName: { color: COLORS.text, fontSize: 20, fontWeight: '700' },
  userHandle: { color: COLORS.textMuted, fontSize: 14 },
  tabs: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: COLORS.border },
  tab: { flex: 1, paddingVertical: SPACING.md, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: COLORS.primary },
  tabText: { color: COLORS.textMuted, fontSize: 14, fontWeight: '600' },
  tabTextActive: { color: COLORS.text },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, paddingHorizontal: SPACING.md, paddingVertical: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  addBtnText: { color: COLORS.primary, fontSize: 15, fontWeight: '600' },
  contactRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.md, paddingVertical: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.border, gap: SPACING.md },
  contactInfo: { flex: 1 },
  contactName: { color: COLORS.text, fontSize: 15, fontWeight: '600' },
  contactUsername: { color: COLORS.textMuted, fontSize: 13, marginTop: 2 },
  circleCard: { margin: SPACING.md, backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: SPACING.md, borderWidth: 1, borderColor: COLORS.border, gap: SPACING.md },
  circleHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  circleName: { color: COLORS.text, fontSize: 16, fontWeight: '700', flex: 1 },
  circleCount: { color: COLORS.textMuted, fontSize: 13 },
  circleMembers: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  memberChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.card, borderRadius: RADIUS.full, paddingVertical: 4, paddingHorizontal: SPACING.sm },
  memberName: { color: COLORS.textSecondary, fontSize: 12, fontWeight: '600' },
  statsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.md, padding: SPACING.md },
  statCard: { backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: SPACING.lg, alignItems: 'center', gap: SPACING.sm, flex: 1, minWidth: 140, borderWidth: 1, borderColor: COLORS.border },
  statValue: { color: COLORS.text, fontSize: 32, fontWeight: '800' },
  statLabel: { color: COLORS.textMuted, fontSize: 13 },
  empty: { alignItems: 'center', marginTop: 60, gap: SPACING.md, padding: SPACING.lg },
  emptyText: { color: COLORS.textMuted, fontSize: 14 },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.7)' },
  modalSheet: { backgroundColor: COLORS.surfaceElevated, borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl, padding: SPACING.lg, paddingBottom: SPACING.xl, gap: SPACING.md },
  modalTitle: { color: COLORS.text, fontSize: 18, fontWeight: '700', textAlign: 'center' },
  modalInput: { backgroundColor: COLORS.surface, borderRadius: RADIUS.md, padding: SPACING.md, color: COLORS.text, fontSize: 15, borderWidth: 1, borderColor: COLORS.border },
  modalActions: { flexDirection: 'row', gap: SPACING.sm },
  modalCancel: { flex: 1, padding: SPACING.md, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center' },
  modalCancelText: { color: COLORS.textSecondary, fontWeight: '600' },
  modalConfirm: { flex: 1, padding: SPACING.md, borderRadius: RADIUS.md, backgroundColor: COLORS.primary, alignItems: 'center' },
  modalConfirmText: { color: COLORS.text, fontWeight: '700' },
});
