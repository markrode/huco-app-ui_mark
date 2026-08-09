import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from './theme';

interface Props {
  value: number;
  onChange?: (v: number) => void;
  size?: number;
  readonly?: boolean;
}

export default function StarRating({ value, onChange, size = 24, readonly = false }: Props) {
  return (
    <View
      style={styles.row}
      accessibilityRole={readonly ? 'text' : undefined}
      accessibilityLabel={readonly ? `Note : ${value} étoile${value > 1 ? 's' : ''} sur 5` : undefined}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <TouchableOpacity
          key={star}
          onPress={() => !readonly && onChange?.(star)}
          disabled={readonly}
          style={{ marginRight: 2 }}
          hitSlop={{ top: 8, bottom: 8, left: 2, right: 2 }}
          accessibilityRole="button"
          accessibilityLabel={`${star} étoile${star > 1 ? 's' : ''}`}
          accessibilityState={{ selected: star <= value, disabled: readonly }}
        >
          <Ionicons
            name={star <= value ? 'star' : 'star-outline'}
            size={size}
            color={star <= value ? COLORS.accent : COLORS.textMuted}
          />
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
});
