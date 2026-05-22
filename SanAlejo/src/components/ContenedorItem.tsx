import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Contenedor } from '../db/contenedorRepository';
import { Colors, Radii, Shadows, Spacing, Typography } from '../theme';

interface ContenedorItemProps {
  contenedor: Contenedor;
  onPress: () => void;
  onDelete: () => void;
}

export function ContenedorItem({ contenedor, onPress, onDelete }: ContenedorItemProps) {
  return (
    <View style={styles.card}>
      {/* Accent bar */}
      <View style={styles.accentBar} />

      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.mainArea, pressed && styles.mainAreaPressed]}
        accessibilityRole="button"
        accessibilityLabel={`Ver contenedor ${contenedor.nombre}`}
      >
        <Text style={styles.nombre} numberOfLines={1}>{contenedor.nombre}</Text>
        {contenedor.descripcion ? (
          <Text style={styles.descripcion} numberOfLines={2}>{contenedor.descripcion}</Text>
        ) : null}
        <View style={styles.ubicacionRow}>
          <Ionicons name="location-outline" size={12} color={Colors.textMuted} />
          <Text style={styles.ubicacion} numberOfLines={1}>{contenedor.ubicacion}</Text>
        </View>
      </Pressable>

      <Pressable
        onPress={onDelete}
        style={({ pressed }) => [styles.deleteButton, pressed && styles.deleteButtonPressed]}
        accessibilityRole="button"
        accessibilityLabel={`Eliminar contenedor ${contenedor.nombre}`}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name="trash-outline" size={18} color={Colors.textMuted} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgSurface,
    borderRadius: Radii.lg,
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.sm - 2,
    overflow: 'hidden',
    ...Shadows.sm,
  },
  accentBar: {
    width: 4,
    alignSelf: 'stretch',
    backgroundColor: Colors.accent,
    borderTopLeftRadius: Radii.lg,
    borderBottomLeftRadius: Radii.lg,
  },
  mainArea: {
    flex: 1,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  mainAreaPressed: {
    opacity: 0.75,
  },
  nombre: {
    fontSize: Typography.md,
    fontWeight: Typography.semibold,
    color: Colors.textPrimary,
    marginBottom: 3,
  },
  descripcion: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    marginBottom: 5,
    lineHeight: Typography.sm * Typography.normal,
  },
  ubicacionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  ubicacion: {
    fontSize: Typography.xs,
    color: Colors.textMuted,
    flex: 1,
  },
  deleteButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    alignSelf: 'stretch',
    justifyContent: 'center',
    borderLeftWidth: 1,
    borderLeftColor: Colors.borderSubtle,
  },
  deleteButtonPressed: {
    backgroundColor: Colors.dangerMuted,
  },
});
