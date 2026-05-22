import React from 'react';
import { View, Text, Image, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
          <Ionicons name="cube-outline" size={24} color={Colors.textMuted} />
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
          <Ionicons name="pencil-outline" size={15} color={Colors.accentLight} />
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.deleteBtn, pressed && styles.deleteBtnPressed]}
          onPress={onDelete}
          accessibilityRole="button"
          accessibilityLabel={`Eliminar ${objeto.nombre}`}
        >
          <Ionicons name="trash-outline" size={15} color={Colors.danger} />
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
    padding: Spacing.sm,
    borderRadius: Radii.sm,
    borderWidth: 1,
    borderColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editBtnPressed: {
    backgroundColor: Colors.accentMuted,
  },
  deleteBtn: {
    padding: Spacing.sm,
    borderRadius: Radii.sm,
    backgroundColor: Colors.dangerMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtnPressed: {
    backgroundColor: Colors.danger,
  },
});
