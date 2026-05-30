import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from './theme';

const AVATAR_COLORS = ['#F5A623', '#27AE60', '#2980B9', '#8E44AD', '#E67E22', '#1ABC9C'];

interface Props {
  initials: string;
  size?: number;
}

export default function Avatar({ initials, size = 40 }: Props) {
  const colorIndex = initials.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % AVATAR_COLORS.length;
  const bg = AVATAR_COLORS[colorIndex];

  return (
    <View style={[styles.circle, { width: size, height: size, borderRadius: size / 2, backgroundColor: bg }]}>
      <Text style={[styles.text, { fontSize: size * 0.35 }]}>{initials}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: { justifyContent: 'center', alignItems: 'center' },
  text: { color: COLORS.text, fontWeight: '700' },
});
