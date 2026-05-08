import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Movie } from '../types';
import { COLORS } from './theme';

interface Props {
  movie: Movie;
  onPress: () => void;
  size?: 'small' | 'medium' | 'large';
}

export default function MovieCard({ movie, onPress, size = 'medium' }: Props) {
  const width = size === 'small' ? 100 : size === 'large' ? 160 : 130;
  const height = width * 1.5;

  return (
    <TouchableOpacity onPress={onPress} style={[styles.container, { width }]}>
      {movie.poster ? (
        <Image source={{ uri: movie.poster }} style={[styles.poster, { width, height }]} />
      ) : (
        <View style={[styles.placeholder, { width, height }]}>
          <Text style={styles.placeholderText}>🎬</Text>
        </View>
      )}
      <Text style={styles.title} numberOfLines={2}>
        {movie.title}
      </Text>
      <Text style={styles.genre} numberOfLines={1}>
        {movie.genres.slice(0, 2).join(' · ')}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { marginRight: 12 },
  poster: { borderRadius: 10, backgroundColor: COLORS.surface },
  placeholder: {
    borderRadius: 10,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: { fontSize: 36 },
  title: { color: COLORS.text, fontSize: 12, fontWeight: '600', marginTop: 6, lineHeight: 16 },
  genre: { color: COLORS.textMuted, fontSize: 11, marginTop: 2 },
});
