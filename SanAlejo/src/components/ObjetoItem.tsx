import React from 'react';
import { View, Text, Image, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ObjetoConPortada } from '../db/objetoRepository';
import { Radii, Spacing, Typography } from '../theme';
import { useTheme } from '../context/ThemeContext';

interface ObjetoItemProps {
  objeto: ObjetoConPortada;
  onEdit: () => void;
  onDelete: () => void;
  onPressFoto?: () => void;
}

export function ObjetoItem({ objeto, onEdit, onDelete, onPressFoto }: ObjetoItemProps) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.bgSurface, borderBottomColor: colors.borderSubtle },
      ]}
    >
      {objeto.portada_uri !== null ? (
        onPressFoto ? (
          <Pressable
            onPress={onPressFoto}
            accessibilityRole="button"
            accessibilityLabel={`Ver foto de ${objeto.nombre}`}
            style={({ pressed }) => [pressed && styles.fotoPressed]}
          >
            <Image
              source={{ uri: objeto.portada_uri }}
              style={styles.foto}
              accessibilityLabel={`Foto de ${objeto.nombre}`}
            />
          </Pressable>
        ) : (
          <Image
            source={{ uri: objeto.portada_uri }}
            style={styles.foto}
            accessibilityLabel={`Foto de ${objeto.nombre}`}
          />
        )
      ) : (
        <View style={[styles.fotoPlaceholder, { backgroundColor: colors.bgMuted }]}>
          <Ionicons name="cube-outline" size={24} color={colors.textMuted} />
        </View>
      )}

      <View style={styles.textContainer}>
        <Text style={[styles.nombre, { color: colors.textPrimary }]} numberOfLines={1}>
          {objeto.nombre}
        </Text>
        {objeto.descripcion ? (
          <Text style={[styles.descripcion, { color: colors.textSecondary }]} numberOfLines={2}>
            {objeto.descripcion}
          </Text>
        ) : null}
      </View>

      <View style={styles.actions}>
        <Pressable
          style={({ pressed }) => [
            styles.editBtn,
            { borderColor: colors.accent },
            pressed && { backgroundColor: colors.accentDark },
          ]}
          onPress={onEdit}
          accessibilityRole="button"
          accessibilityLabel={`Editar ${objeto.nombre}`}
        >
          {({ pressed }) => (
            <Ionicons
              name="pencil-outline"
              size={15}
              color={pressed ? colors.textOnAccent : colors.accentLight}
            />
          )}
        </Pressable>
        <Pressable
          style={({ pressed }) => [
            styles.deleteBtn,
            { backgroundColor: pressed ? colors.dangerDark : colors.dangerMuted },
          ]}
          onPress={onDelete}
          accessibilityRole="button"
          accessibilityLabel={`Eliminar ${objeto.nombre}`}
        >
          {({ pressed }) => (
            <Ionicons
              name="trash-outline"
              size={15}
              color={pressed ? colors.textOnDanger : colors.danger}
            />
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
  },
  foto: {
    width: 52,
    height: 52,
    borderRadius: Radii.md,
    marginRight: Spacing.md,
  },
  fotoPressed: {
    opacity: 0.85,
  },
  fotoPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: Radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  textContainer: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  nombre: {
    fontSize: Typography.base,
    fontWeight: Typography.semibold,
    marginBottom: 3,
  },
  descripcion: {
    fontSize: Typography.sm,
    lineHeight: Typography.sm * Typography.normal,
  },
  actions: {
    gap: Spacing.xs,
    alignItems: 'flex-end',
  },
  editBtn: {
    padding: Spacing.sm,
    borderRadius: Radii.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtn: {
    padding: Spacing.sm,
    borderRadius: Radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
