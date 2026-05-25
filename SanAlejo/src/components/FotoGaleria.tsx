import React from 'react';
import { View, Image, ScrollView, Pressable, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Spacing, Radii, Typography } from '../theme';
import { useTheme } from '../context/ThemeContext';

interface FotoGaleriaProps {
  fotos: string[];
  onAdd?: () => void;
  onRemove?: (index: number) => void;
  onPress?: (index: number) => void;
}

export function FotoGaleria({ fotos, onAdd, onRemove, onPress }: FotoGaleriaProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {fotos.map((uri, idx) => (
          <View key={uri + idx} style={styles.item}>
            <Pressable onPress={() => onPress && onPress(idx)}>
              <Image source={{ uri }} style={styles.image} />
            </Pressable>
            {onRemove ? (
              <Pressable onPress={() => onRemove(idx)} style={[styles.removeBtn, { backgroundColor: colors.dangerMuted }]}>
                <Ionicons name="trash-outline" size={14} color={colors.danger} />
              </Pressable>
            ) : null}
          </View>
        ))}

        {onAdd ? (
          <Pressable onPress={onAdd} style={[styles.addBtn, { borderColor: colors.border }] }>
            <Ionicons name="camera-outline" size={20} color={colors.textMuted} />
            <Text style={[styles.addText, { color: colors.textMuted }]}>Agregar</Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: Spacing.sm,
  },
  item: {
    marginRight: Spacing.sm,
    position: 'relative',
  },
  image: {
    width: 84,
    height: 84,
    borderRadius: Radii.md,
  },
  removeBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    padding: 6,
    borderRadius: 12,
  },
  addBtn: {
    width: 84,
    height: 84,
    borderRadius: Radii.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  addText: {
    fontSize: Typography.xs,
    marginTop: 4,
  },
});
