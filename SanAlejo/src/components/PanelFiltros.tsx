import React from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Radii, Shadows, Spacing, Typography } from '../theme';
import { useTheme } from '../context/ThemeContext';
import { CriterioOrden } from '../db/contenedorRepository';
import { SortFilterState } from '../hooks/useSortFilter';

interface PanelFiltrosProps {
  visible: boolean;
  onClose: () => void;
  state: SortFilterState;
  ubicaciones: string[];
  onCriterioChange: (criterio: CriterioOrden) => void;
  onUbicacionChange: (ubicacion: string | null) => void;
  onReset: () => void;
  isNonDefault: boolean;
}

interface CriterioOption {
  value: CriterioOrden;
  label: string;
}

const CRITERIOS: CriterioOption[] = [
  { value: 'nombre', label: 'Nombre' },
  { value: 'fecha_creacion', label: 'Fecha de creación' },
  { value: 'cantidad_objetos', label: 'Cantidad de objetos' },
];

export function PanelFiltros({
  visible,
  onClose,
  state,
  ubicaciones,
  onCriterioChange,
  onUbicacionChange,
  onReset,
  isNonDefault,
}: PanelFiltrosProps): JSX.Element {
  const { colors } = useTheme();

  const directionIcon = state.direccionOrden === 'asc' ? '↑' : '↓';
  const directionLabel = state.direccionOrden === 'asc' ? 'ascendente' : 'descendente';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      {/* Overlay — tap outside to close */}
      <Pressable
        style={[styles.overlay, { backgroundColor: colors.overlay }]}
        onPress={onClose}
      >
        {/* Panel sheet — stop propagation so taps inside don't close */}
        <Pressable
          style={[
            styles.sheet,
            { backgroundColor: colors.bgElevated, borderColor: colors.borderSubtle },
          ]}
          onPress={() => {}}
        >
          {/* ── Header ── */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>
              Ordenar y filtrar
            </Text>
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Cerrar panel de filtros"
              style={({ pressed }) => [
                styles.closeBtn,
                { backgroundColor: pressed ? colors.bgMuted : colors.bgSurface },
              ]}
            >
              <Ionicons name="close" size={20} color={colors.textSecondary} />
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* ── Sección: Ordenar por ── */}
            <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>
              Ordenar por
            </Text>
            <View style={styles.criterioList}>
              {CRITERIOS.map((criterio) => {
                const isActive = state.criterioOrden === criterio.value;
                return (
                  <Pressable
                    key={criterio.value}
                    onPress={() => onCriterioChange(criterio.value)}
                    accessibilityRole="button"
                    accessibilityLabel={
                      isActive
                        ? `${criterio.label}, activo, orden ${directionLabel}`
                        : `Ordenar por ${criterio.label}`
                    }
                    style={({ pressed }) => [
                      styles.criterioBtn,
                      {
                        backgroundColor: isActive
                          ? colors.accentMuted
                          : pressed
                          ? colors.bgMuted
                          : colors.bgSurface,
                        borderColor: isActive ? colors.accent : colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.criterioBtnText,
                        { color: isActive ? colors.accent : colors.textPrimary },
                      ]}
                    >
                      {criterio.label}
                    </Text>
                    {isActive && (
                      <Text
                        style={[styles.directionIndicator, { color: colors.accent }]}
                        accessibilityLabel={`dirección ${directionLabel}`}
                      >
                        {directionIcon}
                      </Text>
                    )}
                  </Pressable>
                );
              })}
            </View>

            {/* ── Sección: Filtrar por ubicación (oculta si no hay ubicaciones) ── */}
            {ubicaciones.length > 0 && (
              <>
                <Text
                  style={[
                    styles.sectionLabel,
                    { color: colors.textMuted, marginTop: Spacing.xl },
                  ]}
                >
                  Filtrar por ubicación
                </Text>
                <View style={styles.chipList}>
                  {ubicaciones.map((ubicacion) => {
                    const isSelected = state.filtroUbicacion === ubicacion;
                    return (
                      <Pressable
                        key={ubicacion}
                        onPress={() =>
                          onUbicacionChange(isSelected ? null : ubicacion)
                        }
                        accessibilityRole="button"
                        accessibilityLabel={
                          isSelected
                            ? `Ubicación ${ubicacion}, seleccionada. Toca para quitar el filtro`
                            : `Filtrar por ubicación ${ubicacion}`
                        }
                        style={({ pressed }) => [
                          styles.chip,
                          {
                            backgroundColor: isSelected
                              ? colors.accent
                              : pressed
                              ? colors.bgMuted
                              : colors.bgSurface,
                            borderColor: isSelected ? colors.accent : colors.border,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.chipText,
                            {
                              color: isSelected
                                ? colors.textOnAccent
                                : colors.textPrimary,
                            },
                          ]}
                        >
                          {ubicacion}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </>
            )}

            {/* ── Botón Restablecer (solo si isNonDefault) ── */}
            {isNonDefault && (
              <Pressable
                onPress={onReset}
                accessibilityRole="button"
                accessibilityLabel="Restablecer filtros y orden a valores predeterminados"
                style={({ pressed }) => [
                  styles.resetBtn,
                  {
                    backgroundColor: pressed ? colors.bgMuted : colors.bgSurface,
                    borderColor: colors.border,
                    marginTop: Spacing.xl,
                  },
                ]}
              >
                <Ionicons
                  name="refresh-outline"
                  size={16}
                  color={colors.textSecondary}
                  style={styles.resetIcon}
                />
                <Text style={[styles.resetText, { color: colors.textSecondary }]}>
                  Restablecer
                </Text>
              </Pressable>
            )}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: Radii.xl,
    borderTopRightRadius: Radii.xl,
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xxxl,
    maxHeight: '80%',
    ...Shadows.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.lg,
  },
  title: {
    fontSize: Typography.lg,
    fontWeight: Typography.semibold,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: Radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.lg,
  },
  sectionLabel: {
    fontSize: Typography.xs,
    fontWeight: Typography.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: Spacing.sm,
  },
  criterioList: {
    gap: Spacing.sm,
  },
  criterioBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radii.md,
    borderWidth: 1,
  },
  criterioBtnText: {
    fontSize: Typography.base,
    fontWeight: Typography.medium,
  },
  directionIndicator: {
    fontSize: Typography.md,
    fontWeight: Typography.bold,
  },
  chipList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  chip: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderRadius: Radii.full,
    borderWidth: 1,
  },
  chipText: {
    fontSize: Typography.sm,
    fontWeight: Typography.medium,
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: Radii.md,
    borderWidth: 1,
  },
  resetIcon: {
    marginRight: Spacing.xs,
  },
  resetText: {
    fontSize: Typography.base,
    fontWeight: Typography.medium,
  },
});
