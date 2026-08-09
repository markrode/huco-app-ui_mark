import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import StarRating from './StarRating';
import { COLORS, SPACING, RADIUS } from './theme';
import { UserRating } from '../types';

interface Props {
  visible: boolean;
  title: string;
  onConfirm: (rating: UserRating) => void;
  onCancel: () => void;
  initialRating?: UserRating;
}

export default function RatingModal({ visible, title, onConfirm, onCancel, initialRating }: Props) {
  const [stars, setStars] = useState(initialRating?.stars ?? 0);
  const [comment, setComment] = useState(initialRating?.comment ?? '');

  // The modal stays mounted across movies (consumers only toggle `visible`),
  // so state must re-seed on every open or the previous film's rating leaks in.
  useEffect(() => {
    if (visible) {
      setStars(initialRating?.stars ?? 0);
      setComment(initialRating?.comment ?? '');
    }
  }, [visible, initialRating]);

  function handleConfirm() {
    if (stars === 0) return;
    onConfirm({ stars, comment, date: new Date().toISOString() });
  }

  return (
    <Modal visible={visible} transparent animationType="slide">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <View style={styles.sheet}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.label}>Votre note</Text>
          <StarRating value={stars} onChange={setStars} size={36} />
          <Text style={[styles.label, { marginTop: SPACING.md }]}>Commentaire (optionnel)</Text>
          <TextInput
            style={styles.input}
            placeholder="Vos impressions sur le film..."
            placeholderTextColor={COLORS.textMuted}
            value={comment}
            onChangeText={setComment}
            multiline
            numberOfLines={3}
          />
          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
              <Text style={styles.cancelText}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.confirmBtn, stars === 0 && styles.disabled]}
              onPress={handleConfirm}
              disabled={stars === 0}
            >
              <Text style={styles.confirmText}>Confirmer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: COLORS.overlay },
  sheet: {
    backgroundColor: COLORS.surfaceElevated,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    padding: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  title: { color: COLORS.text, fontSize: 18, fontWeight: '700', textAlign: 'center', marginBottom: SPACING.lg },
  label: { color: COLORS.textSecondary, fontSize: 14, marginBottom: SPACING.sm },
  input: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    color: COLORS.text,
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  actions: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.lg },
  cancelBtn: { flex: 1, padding: SPACING.md, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center' },
  cancelText: { color: COLORS.textSecondary, fontWeight: '600' },
  confirmBtn: { flex: 1, padding: SPACING.md, borderRadius: RADIUS.md, backgroundColor: COLORS.primary, alignItems: 'center' },
  confirmText: { color: COLORS.text, fontWeight: '700' },
  disabled: { opacity: 0.4 },
});
