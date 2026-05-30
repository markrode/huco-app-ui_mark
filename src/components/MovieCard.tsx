import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Movie } from '../types';
import { COLORS, RADIUS, SPACING } from './theme';

interface Props {
  movie: Movie;
  onPress: () => void;
  size?: 'small' | 'medium' | 'large';
}

export default function MovieCard({ movie, onPress, size = 'medium' }: Props) {
  const width = size === 'small' ? 100 : size === 'large' ? 160 : 130;
  const height = width * 1.5;

  return (
    <TouchableOpacity onPress={onPress} style={[styles.container, { width }]} activeOpacity={0.8}>
      <View style={{ width, height }}>
        {movie.poster ? (
          <Image source={{ uri: movie.poster }} style={[styles.poster, { width, height }]} />
        ) : (
          <View style={[styles.placeholder, { width, height }]}>
            <Text style={styles.placeholderText}>🎬</Text>
          </View>
        )}
        {movie.rating > 0 && (
          <View style={styles.ratingBadge}>
            <Ionicons name="star" size={9} color="#FFD700" />
            <Text style={styles.ratingText}>{movie.rating.toFixed(1)}</Text>
          </View>
        )}
      </View>
      <Text style={styles.title} numberOfLines={2}>
        {movie.title}
      </Text>
      {movie.genres.length > 0 && (
        <Text style={styles.genre} numberOfLines={1}>
          {movie.genres.slice(0, 2).join(' · ')}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {},
  poster: { borderRadius: RADIUS.md, backgroundColor: COLORS.surface },
  placeholder: {
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: { fontSize: 36 },
  ratingBadge: {
    position: 'absolute',
    bottom: SPACING.xs,
    right: SPACING.xs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: 'rgba(0,0,0,0.72)',
    borderRadius: RADIUS.xs,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  ratingText: { color: '#FFD700', fontSize: 10, fontWeight: '700' },
  title: { color: COLORS.text, fontSize: 12, fontWeight: '600', marginTop: SPACING.xs, lineHeight: 16 },
  genre: { color: COLORS.textMuted, fontSize: 11, marginTop: 2 },
});
