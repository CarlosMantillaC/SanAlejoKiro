import React from 'react';
import { View, Text, Image, Pressable, StyleSheet } from 'react-native';
import { Objeto } from '../db/objetoRepository';
import { Colors, Radii, Spacing, Typography } from '../theme';

interface ObjetoItemProps {
  objeto: Objeto;
  onEdit: () => void;
  onDelete: () => void;
}

export function ObjetoItem({ objeto, onEdit, onDelete }: ObjetoItemProps) {
  return (
    <View style={styles.container}>
      {objeto.foto_uri !== null ? (
        <Image
          source={{ uri: objeto.foto_uri }}
          style={styles.foto}
          accessibilityLabel={`Foto de ${objeto.nombre}`}
        />
      ) : (
        <View style={styles.fotoPlaceholder}>
          <Text style={styles.fotoPlaceholderIcon}>📦</Text>
        </View>
      )}

      <View style={styles.textContainer}>
        <Text style={styles.nombre} numberOfLines={1}>{objeto.nombre}</Text>
        {objeto.descripcion ? (
          <Text style={styles.descripcion} numberOfLines={2}>{objeto.descripcion}</Text>
        ) : null}
      </View>

      <View style={styles.actions}>
        <Pressable
          style={({ pressed }) => [styles.editBtn, pressed && styles.editBtnPressed]}
          onPress={onEdit}
          accessibilityRole="button"
          accessibilityLabel={`Editar ${objeto.nombre}`}
        >
          <Text style={styles.editBtnText}>Editar</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.deleteBtn, pressed && styles.deleteBtnPressed]}
          onPress={onDelete}
          accessibilityRole="button"
          accessibilityLabel={`Eliminar ${objeto.nombre}`}
        >
          <Text style={styles.deleteBtnText}>Eliminar</Text>
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
    backgroundColor: Colors.bgSurface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
  },
  foto: {
    width: 52,
    height: 52,
    borderRadius: Radii.md,
    marginRight: Spacing.md,
  },
  fotoPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: Radii.md,
    backgroundColor: Colors.bgMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  fotoPlaceholderIcon: {
    fontSize: 22,
  },
  textContainer: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  nombre: {
    fontSize: Typography.base,
    fontWeight: Typography.semibold,
    color: Colors.textPrimary,
    marginBottom: 3,
  },
  descripcion: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    lineHeight: Typography.sm * Typography.normal,
  },
  actions: {
    gap: Spacing.xs,
    alignItems: 'flex-end',
  },
  editBtn: {
    paddingVertical: 5,
    paddingHorizontal: Spacing.md,
    borderRadius: Radii.sm,
    borderWidth: 1,
    borderColor: Colors.accent,
  },
  editBtnPressed: {
    backgroundColor: Colors.accentMuted,
  },
  editBtnText: {
    fontSize: Typography.sm,
    color: Colors.accentLight,
    fontWeight: Typography.medium,
  },
  deleteBtn: {
    paddingVertical: 5,
    paddingHorizontal: Spacing.md,
    borderRadius: Radii.sm,
    backgroundColor: Colors.dangerMuted,
  },
  deleteBtnPressed: {
    backgroundColor: Colors.danger,
  },
  deleteBtnText: {
    fontSize: Typography.sm,
    color: Colors.danger,
    fontWeight: Typography.medium,
  },
});
