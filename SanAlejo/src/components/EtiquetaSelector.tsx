import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Keyboard,
} from 'react-native';
import { Spacing, Radii, Typography } from '../theme';
import { useTheme } from '../context/ThemeContext';

export interface Etiqueta {
  id: number;
  nombre: string;
}

interface Props {
  etiquetas: Etiqueta[];
  selectedIds: number[];
  onToggle: (id: number) => void;
  onCreate: (nombre: string) => void;
}

export function EtiquetaSelector({ etiquetas, selectedIds, onToggle, onCreate }: Props) {
  const { colors } = useTheme();
  const [query, setQuery] = useState('');

  const normalizedQuery = query.trim().toLowerCase();

  const suggestions = useMemo(
    () => etiquetas.filter((etiqueta) => {
      if (selectedIds.includes(etiqueta.id)) return false;
      return etiqueta.nombre.toLowerCase().includes(normalizedQuery);
    }),
    [etiquetas, normalizedQuery, selectedIds]
  );

  const canCreate = normalizedQuery.length > 0 && !etiquetas.some((et) => et.nombre.toLowerCase() === normalizedQuery);

  return (
    <View style={styles.container}>
      <TextInput
        style={[styles.input, { backgroundColor: colors.bgElevated, color: colors.textPrimary, borderColor: colors.borderSubtle }]}
        value={query}
        onChangeText={setQuery}
        placeholder="Buscar o crear etiqueta..."
        placeholderTextColor={colors.textMuted}
        returnKeyType="done"
        onSubmitEditing={() => {
          if (canCreate) {
            onCreate(query.trim());
            setQuery('');
            Keyboard.dismiss();
          }
        }}
        accessibilityLabel="Buscar o crear etiqueta"
      />

      <View style={styles.selectedContainer}>
        {etiquetas
          .filter((etiqueta) => selectedIds.includes(etiqueta.id))
          .map((etiqueta) => (
            <Pressable
              key={etiqueta.id}
              onPress={() => onToggle(etiqueta.id)}
              style={[styles.selectedTag, { backgroundColor: colors.accentMuted }]}
              accessibilityRole="button"
              accessibilityLabel={`Quitar etiqueta ${etiqueta.nombre}`}
            >
              <Text style={[styles.selectedText, { color: colors.accentDark }]}>{etiqueta.nombre}</Text>
            </Pressable>
          ))}
      </View>

      {canCreate ? (
        <Pressable
          onPress={() => {
            onCreate(query.trim());
            setQuery('');
            Keyboard.dismiss();
          }}
          style={({ pressed }) => [
            styles.createButton,
            { backgroundColor: pressed ? colors.accentDark : colors.accent },
          ]}
          accessibilityRole="button"
          accessibilityLabel={`Crear etiqueta ${query.trim()}`}
        >
          <Text style={[styles.createText, { color: colors.textOnAccent }]}>Crear etiqueta "{query.trim()}"</Text>
        </Pressable>
      ) : null}

      <View style={styles.suggestionsContainer}>
        {suggestions.map((etiqueta) => (
          <Pressable
            key={etiqueta.id}
            onPress={() => onToggle(etiqueta.id)}
            style={({ pressed }) => [
              styles.suggestion,
              {
                backgroundColor: pressed ? colors.accentMuted : colors.bgElevated,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel={`Agregar etiqueta ${etiqueta.nombre}`}
          >
            <Text style={[styles.suggestionText, { color: colors.textPrimary }]}>{etiqueta.nombre}</Text>
          </Pressable>
        ))}
        {suggestions.length === 0 && query.trim().length === 0 ? (
          <Text style={[styles.hintText, { color: colors.textSecondary }]}>Toca una etiqueta o escribe para crear una nueva.</Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderRadius: Radii.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: Typography.sm,
  },
  selectedContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  selectedTag: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radii.full,
    marginBottom: Spacing.xs,
  },
  selectedText: {
    fontSize: Typography.xs,
    fontWeight: Typography.medium,
  },
  createButton: {
    borderRadius: Radii.lg,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    alignItems: 'center',
  },
  createText: {
    fontSize: Typography.sm,
    fontWeight: Typography.semibold,
  },
  suggestionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  suggestion: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radii.full,
    marginBottom: Spacing.xs,
  },
  suggestionText: {
    fontSize: Typography.sm,
  },
  hintText: {
    fontSize: Typography.xs,
    marginTop: Spacing.sm,
  },
});
