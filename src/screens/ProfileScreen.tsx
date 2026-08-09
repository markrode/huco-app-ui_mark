import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  TextInput,
  Modal,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import Avatar from '../components/Avatar';
import { useToast } from '../components/Toast';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { COLORS, SPACING, RADIUS } from '../components/theme';
import { Contact } from '../types';

type Tab = 'contacts' | 'circles' | 'stats';

export default function ProfileScreen() {
  const navigation = useNavigation<any>();
  const { state, dispatch } = useApp();
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>('contacts');
  const { showToast } = useToast();
  const [addContactModal, setAddContactModal] = useState(false);
  // Supabase search mode
  const [searchQuery, setSearchQuery] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResult, setSearchResult] = useState<null | false | {
    id: string; name: string; username: string; avatar: string;
  }>(null);
  // Manual entry mode (no Supabase)
  const [newContactName, setNewContactName] = useState('');
  const [newContactUsername, setNewContactUsername] = useState('');

  async function handleSearchContact() {
    const q = searchQuery.trim().replace(/^@/, '');
    if (!q || !supabase) return;
    setSearchLoading(true);
    setSearchResult(null);
    try {
      const { data } = await supabase
        .from('profiles_public')
        .select('id, name, username, avatar')
        .ilike('username', `@${q}`)
        .limit(1)
        .maybeSingle();
      setSearchResult(data || false);
    } catch {
      setSearchResult(false);
    } finally {
      setSearchLoading(false);
    }
  }

  function handleAddLinkedContact() {
    if (!searchResult) return;
    if (state.contacts.some((c) => c.userId === searchResult.id)) {
      showToast('Ce contact est déjà dans votre liste.', 'info');
      return;
    }
    dispatch({
      type: 'ADD_CONTACT',
      contact: {
        id: Date.now().toString(),
        userId: searchResult.id,
        name: searchResult.name,
        username: searchResult.username,
        avatar: searchResult.avatar || searchResult.name.slice(0, 2).toUpperCase(),
      },
    });
    resetModal();
  }

  function handleAddManualContact() {
    if (!newContactName.trim()) return;
    const initials = newContactName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
    dispatch({
      type: 'ADD_CONTACT',
      contact: {
        id: Date.now().toString(),
        name: newContactName.trim(),
        avatar: initials,
        username: newContactUsername.trim()
          ? `@${newContactUsername.trim().replace('@', '')}`
          : `@${newContactName.toLowerCase().replace(/\s+/g, '')}`,
      },
    });
    resetModal();
  }

  function resetModal() {
    setAddContactModal(false);
    setSearchQuery('');
    setSearchResult(null);
    setNewContactName('');
    setNewContactUsername('');
  }

  function handleRemoveContact(id: string, name: string) {
    Alert.alert('Retirer', `Retirer ${name} de vos contacts ?`, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Retirer',
        style: 'destructive',
        onPress: () => dispatch({ type: 'REMOVE_CONTACT', contactId: id }),
      },
    ]);
  }

  function handleDeleteCircle(id: string, name: string) {
    Alert.alert('Supprimer', `Supprimer le cercle "${name}" ?`, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: () => dispatch({ type: 'REMOVE_CIRCLE', circleId: id }),
      },
    ]);
  }

  const avgRating =
    state.library.length > 0
      ? (state.library.reduce((acc, e) => acc + e.userRating.stars, 0) / state.library.length).toFixed(1)
      : '-';

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.profileRow}>
          <Avatar initials={user?.avatar || 'ME'} size={56} />
          <View style={styles.profileInfo}>
            <Text style={styles.userName}>{user?.name || 'Mon profil'}</Text>
            <Text style={styles.userHandle}>{user?.username || '@moi'}</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.settingsBtn}
          onPress={() => navigation.navigate('Settings')}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="settings-outline" size={22} color={COLORS.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Stat strip */}
      <View style={styles.statStrip}>
        <StatPill label="Films vus" value={state.library.length} />
        <View style={styles.statDivider} />
        <StatPill label="Watchlist" value={state.watchlist.length} />
        <View style={styles.statDivider} />
        <StatPill label="Reçues" value={state.inbox.filter(r => r.status === 'pending').length} />
        <View style={styles.statDivider} />
        <StatPill label="Note moy." value={avgRating} />
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {(['contacts', 'circles', 'stats'] as Tab[]).map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tab, tab === t && styles.tabActive]}
            onPress={() => setTab(t)}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === 'contacts' ? 'Contacts' : t === 'circles' ? 'Cercles' : 'Statistiques'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Contacts tab */}
      {tab === 'contacts' && (
        <View style={{ flex: 1 }}>
          <TouchableOpacity style={styles.addBtn} onPress={() => setAddContactModal(true)} activeOpacity={0.7}>
            <Ionicons name="person-add-outline" size={18} color={COLORS.primary} />
            <Text style={styles.addBtnText}>Ajouter un contact</Text>
          </TouchableOpacity>
          <FlatList
            data={state.contacts}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.contactRow}>
                <Avatar initials={item.avatar} size={44} />
                <View style={styles.contactInfo}>
                  <Text style={styles.contactName}>{item.name}</Text>
                  <Text style={styles.contactUsername}>{item.username}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => handleRemoveContact(item.id, item.name)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="person-remove-outline" size={20} color={COLORS.textMuted} />
                </TouchableOpacity>
              </View>
            )}
            ListEmptyComponent={
              <EmptyState icon="people-outline" text="Aucun contact pour l'instant" />
            }
            showsVerticalScrollIndicator={false}
          />
        </View>
      )}

      {/* Circles tab */}
      {tab === 'circles' && (
        <ScrollView showsVerticalScrollIndicator={false}>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => navigation.navigate('CreateCircle')}
            activeOpacity={0.7}
          >
            <Ionicons name="add-circle-outline" size={18} color={COLORS.primary} />
            <Text style={styles.addBtnText}>Créer un cercle</Text>
          </TouchableOpacity>
          {state.circles.map((circle) => (
            <View key={circle.id} style={styles.circleCard}>
              <View style={styles.circleHeader}>
                <View style={styles.circleIconWrap}>
                  <Ionicons name="people" size={18} color={COLORS.primary} />
                </View>
                <Text style={styles.circleName}>{circle.name}</Text>
                <Text style={styles.circleCount}>{circle.members.length} membre{circle.members.length !== 1 ? 's' : ''}</Text>
                <TouchableOpacity
                  onPress={() => handleDeleteCircle(circle.id, circle.name)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="trash-outline" size={17} color={COLORS.textMuted} />
                </TouchableOpacity>
              </View>
              <View style={styles.circleMembers}>
                {circle.members.map((m) => (
                  <View key={m.id} style={styles.memberChip}>
                    <Avatar initials={m.avatar} size={22} />
                    <Text style={styles.memberName}>{m.name.split(' ')[0]}</Text>
                  </View>
                ))}
              </View>
            </View>
          ))}
          {state.circles.length === 0 && (
            <EmptyState icon="people-circle-outline" text="Aucun cercle créé" />
          )}
        </ScrollView>
      )}

      {/* Stats tab */}
      {tab === 'stats' && (
        <ScrollView contentContainerStyle={styles.statsGrid} showsVerticalScrollIndicator={false}>
          <StatCard icon="library" label="Films vus" value={state.library.length} color={COLORS.success} />
          <StatCard icon="bookmark" label="Watchlist" value={state.watchlist.length} color={COLORS.accent} />
          <StatCard icon="mail" label="Reco reçues" value={state.inbox.length} color={COLORS.primary} />
          <StatCard icon="star" label="Note moyenne" value={avgRating} color={COLORS.accent} />
          <StatCard icon="people" label="Contacts" value={state.contacts.length} color={COLORS.info} />
          <StatCard icon="paper-plane" label="Reco envoyées" value={state.sentRecs.length} color={COLORS.success} />
        </ScrollView>
      )}

      {/* Add contact modal */}
      <Modal visible={addContactModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Ajouter un contact</Text>

            {isSupabaseConfigured ? (
              <>
                <View style={styles.searchRow}>
                  <TextInput
                    style={[styles.modalInput, { flex: 1 }]}
                    placeholder="@username HuCo"
                    placeholderTextColor={COLORS.textMuted}
                    value={searchQuery}
                    onChangeText={(t) => { setSearchQuery(t); setSearchResult(null); }}
                    autoCapitalize="none"
                    returnKeyType="search"
                    onSubmitEditing={handleSearchContact}
                  />
                  <TouchableOpacity
                    style={[styles.searchBtn, !searchQuery.trim() && { opacity: 0.4 }]}
                    onPress={handleSearchContact}
                    disabled={!searchQuery.trim()}
                  >
                    <Ionicons name="search" size={18} color={COLORS.text} />
                  </TouchableOpacity>
                </View>

                {searchLoading && (
                  <ActivityIndicator color={COLORS.primary} style={{ marginVertical: SPACING.sm }} />
                )}

                {searchResult === false && (
                  <Text style={styles.searchEmpty}>Aucun compte HuCo trouvé pour ce username.</Text>
                )}

                {searchResult && (
                  <View style={styles.searchResultRow}>
                    <Avatar initials={searchResult.avatar || searchResult.name.slice(0, 2).toUpperCase()} size={40} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.contactName}>{searchResult.name}</Text>
                      <Text style={styles.contactUsername}>{searchResult.username}</Text>
                    </View>
                    <Ionicons name="checkmark-circle" size={22} color={COLORS.success} />
                  </View>
                )}

                <View style={styles.modalActions}>
                  <TouchableOpacity style={styles.modalCancel} onPress={resetModal}>
                    <Text style={styles.modalCancelText}>Annuler</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalConfirm, !searchResult && { opacity: 0.4 }]}
                    onPress={handleAddLinkedContact}
                    disabled={!searchResult}
                  >
                    <Text style={styles.modalConfirmText}>Ajouter</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Nom complet"
                  placeholderTextColor={COLORS.textMuted}
                  value={newContactName}
                  onChangeText={setNewContactName}
                  autoCapitalize="words"
                />
                <TextInput
                  style={styles.modalInput}
                  placeholder="@username (optionnel)"
                  placeholderTextColor={COLORS.textMuted}
                  value={newContactUsername}
                  onChangeText={setNewContactUsername}
                  autoCapitalize="none"
                />
                <View style={styles.modalActions}>
                  <TouchableOpacity style={styles.modalCancel} onPress={resetModal}>
                    <Text style={styles.modalCancelText}>Annuler</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalConfirm, !newContactName.trim() && { opacity: 0.4 }]}
                    onPress={handleAddManualContact}
                    disabled={!newContactName.trim()}
                  >
                    <Text style={styles.modalConfirmText}>Ajouter</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

function StatPill({ label, value }: { label: string; value: any }) {
  return (
    <View style={styles.statPill}>
      <Text style={styles.statPillValue}>{value}</Text>
      <Text style={styles.statPillLabel}>{label}</Text>
    </View>
  );
}

function StatCard({ icon, label, value, color }: { icon: any; label: string; value: any; color: string }) {
  return (
    <View style={styles.statCard}>
      <View style={[styles.statCardIcon, { backgroundColor: color + '22' }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <Text style={styles.statCardValue}>{value}</Text>
      <Text style={styles.statCardLabel}>{label}</Text>
    </View>
  );
}

function EmptyState({ icon, text }: { icon: any; text: string }) {
  return (
    <View style={styles.empty}>
      <Ionicons name={icon} size={48} color={COLORS.textMuted} />
      <Text style={styles.emptyText}>{text}</Text>
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
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  profileInfo: {},
  userName: { color: COLORS.text, fontSize: 19, fontWeight: '700' },
  userHandle: { color: COLORS.textMuted, fontSize: 14, marginTop: 2 },
  settingsBtn: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statStrip: {
    flexDirection: 'row',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  statPill: { flex: 1, alignItems: 'center', gap: 3 },
  statPillValue: { color: COLORS.text, fontSize: 20, fontWeight: '800' },
  statPillLabel: { color: COLORS.textMuted, fontSize: 11 },
  statDivider: { width: 1, backgroundColor: COLORS.border },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tab: { flex: 1, paddingVertical: SPACING.md, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: COLORS.primary },
  tabText: { color: COLORS.textMuted, fontSize: 14, fontWeight: '600' },
  tabTextActive: { color: COLORS.text },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  addBtnText: { color: COLORS.primary, fontSize: 15, fontWeight: '600' },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: SPACING.md,
  },
  contactInfo: { flex: 1 },
  contactName: { color: COLORS.text, fontSize: 15, fontWeight: '600' },
  contactUsername: { color: COLORS.textMuted, fontSize: 13, marginTop: 2 },
  circleCard: {
    margin: SPACING.md,
    marginBottom: 0,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: SPACING.md,
  },
  circleHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  circleIconWrap: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.primary + '22',
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleName: { color: COLORS.text, fontSize: 16, fontWeight: '700', flex: 1 },
  circleCount: { color: COLORS.textMuted, fontSize: 13 },
  circleMembers: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  memberChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.full,
    paddingVertical: 4,
    paddingHorizontal: SPACING.sm,
  },
  memberName: { color: COLORS.textSecondary, fontSize: 12, fontWeight: '600' },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
    padding: SPACING.md,
  },
  statCard: {
    width: '46%',
    flex: 1,
    minWidth: 140,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    alignItems: 'center',
    gap: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statCardIcon: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statCardValue: { color: COLORS.text, fontSize: 28, fontWeight: '800' },
  statCardLabel: { color: COLORS.textMuted, fontSize: 13 },
  empty: { alignItems: 'center', marginTop: 60, gap: SPACING.md, padding: SPACING.lg },
  emptyText: { color: COLORS.textMuted, fontSize: 14 },
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
  modalInput: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    color: COLORS.text,
    fontSize: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modalActions: { flexDirection: 'row', gap: SPACING.sm },
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
  info: { color: COLORS.info },
  searchRow: { flexDirection: 'row', gap: SPACING.sm, alignItems: 'center' },
  searchBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchEmpty: { color: COLORS.textMuted, fontSize: 14, textAlign: 'center', marginVertical: SPACING.sm },
  searchResultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.success + '44',
  },
});
