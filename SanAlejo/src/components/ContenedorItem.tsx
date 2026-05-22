import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Contenedor } from '../db/contenedorRepository';
import { Radii, Shadows, Spacing, Typography } from '../theme';
import { useTheme } from '../context/ThemeContext';

interface ContenedorItemProps {
  contenedor: Contenedor;
  onPress: () => void;
  onDelete: () => void;
}

export function ContenedorItem({ contenedor, onPress, onDelete }: ContenedorItemProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.card, { backgroundColor: colors.bgSurface }]}>
      {/* Accent bar */}
      <View style={[styles.accentBar, { backgroundColor: colors.accent }]} />

      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.mainArea, pressed && styles.mainAreaPressed]}
        accessibilityRole="button"
        accessibilityLabel={`Ver contenedor ${contenedor.nombre}`}
      >
        <Text style={[styles.nombre, { color: colors.textPrimary }]} numberOfLines={1}>
          {contenedor.nombre}
        </Text>
        {contenedor.descripcion ? (
          <Text style={[styles.descripcion, { color: colors.textSecondary }]} numberOfLines={2}>
            {contenedor.descripcion}
          </Text>
        ) : null}
        <View style={styles.ubicacionRow}>
          <Ionicons name="location-outline" size={12} color={colors.textMuted} />
          <Text style={[styles.ubicacion, { color: colors.textMuted }]} numberOfLines={1}>
            {contenedor.ubicacion}
          </Text>
        </View>
      </Pressable>

      <Pressable
        onPress={onDelete}
        style={({ pressed }) => [
          styles.deleteButton,
          { borderLeftColor: colors.borderSubtle },
          pressed && { backgroundColor: colors.dangerMuted },
        ]}
        accessibilityRole="button"
        accessibilityLabel={`Eliminar contenedor ${contenedor.nombre}`}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name="trash-outline" size={18} color={colors.textMuted} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radii.lg,
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.sm - 2,
    overflow: 'hidden',
    ...Shadows.sm,
  },
  accentBar: {
    width: 4,
    alignSelf: 'stretch',
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
    marginBottom: 3,
  },
  descripcion: {
    fontSize: Typography.sm,
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
    flex: 1,
  },
  deleteButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    alignSelf: 'stretch',
    justifyContent: 'center',
    borderLeftWidth: 1,
  },
});
