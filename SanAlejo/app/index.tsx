import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Stack, router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSQLiteContext } from 'expo-sqlite';
import {
  Contenedor,
  deleteContenedorConFotos,
  getContenedoresFiltrados,
  getUbicacionesUnicas,
} from '../src/db/contenedorRepository';
import * as fotoRepository from '../src/db/fotoRepository';
import { ContenedorItem } from '../src/components/ContenedorItem';
import { ConfirmDialog } from '../src/components/ConfirmDialog';
import { FAB } from '../src/components/FAB';
import { PanelFiltros } from '../src/components/PanelFiltros';
import { Radii, Shadows, Spacing, Typography } from '../src/theme';
import { useTheme } from '../src/context/ThemeContext';
import { useSortFilter } from '../src/hooks/useSortFilter';
import { useExportPdf } from '../src/hooks/useExportPdf';

export default function ListaContenedores() {
  const db = useSQLiteContext();
  const { colors } = useTheme();
  const { state, setCriterio, setFiltroUbicacion, setFiltroEtiquetas, reset, isNonDefault } = useSortFilter();
  const { isExporting, exportError, handleExport, clearError } = useExportPdf(db);

  const [contenedores, setContenedores] = useState<Contenedor[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [contenedorAEliminar, setContenedorAEliminar] = useState<Contenedor | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [panelVisible, setPanelVisible] = useState(false);
  const [ubicaciones, setUbicaciones] = useState<string[]>([]);

  async function cargarContenedores() {
    try {
      const data = await getContenedoresFiltrados(
        db,
        state.filtroUbicacion,
        state.criterioOrden,
        state.direccionOrden,
        state.filtroEtiquetas
      );
      setContenedores(data);
      setError(null);
    } catch {
      setError('No se pudo cargar los contenedores. Intenta de nuevo.');
    }
  }

  async function abrirPanel() {
    try {
      const locs = await getUbicacionesUnicas(db);
      setUbicaciones(locs);
    } catch {
      setUbicaciones([]);
    }
    setPanelVisible(true);
  }

  useEffect(() => { cargarContenedores(); }, [state]);
  useFocusEffect(useCallback(() => { cargarContenedores(); }, [db, state]));

  async function handleConfirmarEliminar() {
    if (contenedorAEliminar === null) return;
    try {
      const { hadFileErrors } = await deleteContenedorConFotos(db, contenedorAEliminar.id, fotoRepository);
      setContenedorAEliminar(null);
      if (hadFileErrors) {
        setDeleteError('El contenedor fue eliminado, pero algunos archivos de imagen no pudieron eliminarse del dispositivo.');
      }
      cargarContenedores();
    } catch {
      setDeleteError('No se pudo eliminar el contenedor.');
      setContenedorAEliminar(null);
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.bgBase }]}>
      <Stack.Screen
        options={{
          title: 'San Alejo',
          headerRight: () => (
            <View style={styles.headerButtons}>
              {/* Export button — Requirements 1.1, 1.2, 1.3 */}
              <Pressable
                onPress={handleExport}
                disabled={contenedores.length === 0 || isExporting}
                style={[
                  styles.headerBtn,
                  (contenedores.length === 0 || isExporting) && styles.headerBtnDisabled,
                ]}
                accessibilityRole="button"
                accessibilityLabel="Exportar inventario como PDF"
                accessibilityState={{ disabled: contenedores.length === 0 || isExporting }}
              >
                <Ionicons
                  name="share-outline"
                  size={22}
                  color={
                    contenedores.length === 0 || isExporting
                      ? colors.textMuted
                      : colors.textPrimary
                  }
                />
              </Pressable>

              {/* Filter button with badge when non-default */}
              <Pressable
                onPress={abrirPanel}
                style={styles.headerBtn}
                accessibilityRole="button"
                accessibilityLabel={
                  isNonDefault
                    ? 'Filtros activos. Abrir panel de ordenamiento y filtros'
                    : 'Abrir panel de ordenamiento y filtros'
                }
              >
                <Ionicons name="options-outline" size={22} color={colors.textPrimary} />
                {isNonDefault && (
                  <View
                    style={[styles.badge, { backgroundColor: colors.accent }]}
                    accessibilityElementsHidden
                    importantForAccessibility="no"
                  />
                )}
              </Pressable>

              {/* Search button */}
              <Pressable
                onPress={() => router.push('/busqueda')}
                style={styles.headerBtn}
                accessibilityRole="button"
                accessibilityLabel="Buscar objetos"
              >
                <Ionicons name="search-outline" size={22} color={colors.textPrimary} />
              </Pressable>
            </View>
          ),
        }}
      />

      {(error || deleteError) ? (
        <View style={[styles.errorBanner, { backgroundColor: colors.dangerMuted, borderLeftColor: colors.danger }]}>
          <Text style={[styles.errorText, { color: colors.danger }]}>{error ?? deleteError}</Text>
        </View>
      ) : null}

      <FlatList
        data={contenedores}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <ContenedorItem
            contenedor={item}
            onPress={() => router.push(`/contenedor/${item.id}`)}
            onDelete={() => setContenedorAEliminar(item)}
          />
        )}
        ListHeaderComponent={
          contenedores.length > 0 ? (
            <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>
              {contenedores.length} contenedor{contenedores.length !== 1 ? 'es' : ''}
            </Text>
          ) : null
        }
        ListEmptyComponent={
          isNonDefault ? (
            /* Empty state with active filters */
            <View style={styles.emptyContainer}>
              <Ionicons name="filter-outline" size={52} color={colors.textMuted} style={styles.emptyIcon} />
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>Sin resultados</Text>
              <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
                No hay contenedores que coincidan con los filtros activos.
              </Text>
              <Pressable
                onPress={reset}
                style={({ pressed }) => [
                  styles.clearFiltersBtn,
                  {
                    backgroundColor: pressed ? colors.accentMuted : colors.bgSurface,
                    borderColor: colors.accent,
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel="Limpiar filtros"
              >
                <Text style={[styles.clearFiltersBtnText, { color: colors.accent }]}>
                  Limpiar filtros
                </Text>
              </Pressable>
            </View>
          ) : (
            /* Empty state without filters */
            <View style={styles.emptyContainer}>
              <Ionicons name="archive-outline" size={52} color={colors.textMuted} style={styles.emptyIcon} />
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>Sin contenedores</Text>
              <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
                Agrega tu primera caja, maleta o cajón.
              </Text>
            </View>
          )
        }
        contentContainerStyle={contenedores.length === 0 ? styles.emptyList : styles.list}
      />

      <FAB onPress={() => router.push('/contenedor/nuevo')} />

      <ConfirmDialog
        visible={contenedorAEliminar !== null}
        message="¿Eliminar este contenedor y todos sus objetos?"
        onConfirm={handleConfirmarEliminar}
        onCancel={() => setContenedorAEliminar(null)}
      />

      <PanelFiltros
        visible={panelVisible}
        onClose={() => setPanelVisible(false)}
        state={state}
        ubicaciones={ubicaciones}
        onCriterioChange={setCriterio}
        onUbicacionChange={setFiltroUbicacion}
        selectedEtiquetaIds={state.filtroEtiquetas}
        onEtiquetasChange={setFiltroEtiquetas}
        onReset={reset}
        isNonDefault={isNonDefault}
      />

      {/* Progress overlay — Requirements 4.1, 4.2, 4.3 */}
      <Modal
        visible={isExporting}
        transparent
        animationType="fade"
        statusBarTranslucent
      >
        <View style={[styles.progressOverlay, { backgroundColor: colors.overlay }]}>
          <View style={[styles.progressCard, { backgroundColor: colors.bgElevated, borderColor: colors.borderSubtle }]}>
            <ActivityIndicator size="large" color={colors.accent} />
            <Text style={[styles.progressText, { color: colors.textPrimary }]}>
              Generando PDF…
            </Text>
          </View>
        </View>
      </Modal>

      {/* Error dialog — Requirement 6.4 */}
      <Modal
        visible={exportError !== null}
        transparent
        animationType="fade"
        onRequestClose={clearError}
        statusBarTranslucent
      >
        <Pressable
          style={[styles.progressOverlay, { backgroundColor: colors.overlay }]}
          onPress={clearError}
        >
          <Pressable
            style={[styles.errorCard, { backgroundColor: colors.bgElevated, borderColor: colors.borderSubtle }]}
            onPress={() => {}}
          >
            <View style={[styles.errorIconWrap, { backgroundColor: colors.dangerMuted }]}>
              <Ionicons name="alert-circle-outline" size={28} color={colors.danger} />
            </View>
            <Text style={[styles.errorDialogTitle, { color: colors.textPrimary }]}>
              Error al exportar
            </Text>
            <Text style={[styles.errorDialogMessage, { color: colors.textSecondary }]}>
              {exportError}
            </Text>
            <View style={styles.errorButtonRow}>
              <Pressable
                style={({ pressed }) => [
                  styles.errorCancelBtn,
                  { borderColor: colors.bgMuted },
                  pressed && { backgroundColor: colors.bgMuted },
                ]}
                onPress={clearError}
                accessibilityRole="button"
                accessibilityLabel="Cerrar"
              >
                <Text style={[styles.errorCancelText, { color: colors.textSecondary }]}>
                  Cerrar
                </Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.errorRetryBtn,
                  { backgroundColor: pressed ? colors.accentDark : colors.accent },
                ]}
                onPress={() => { clearError(); handleExport(); }}
                accessibilityRole="button"
                accessibilityLabel="Reintentar exportación"
              >
                <Text style={[styles.errorRetryText, { color: colors.textOnAccent }]}>
                  Reintentar
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    paddingTop: Spacing.sm,
    paddingBottom: 100,
  },
  emptyList: {
    flex: 1,
  },
  sectionLabel: {
    fontSize: Typography.xs,
    fontWeight: Typography.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xxxl,
    gap: Spacing.sm,
  },
  emptyIcon: {
    marginBottom: Spacing.sm,
  },
  emptyTitle: {
    fontSize: Typography.xl,
    fontWeight: Typography.bold,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: Typography.base,
    textAlign: 'center',
    lineHeight: Typography.base * Typography.relaxed,
  },
  clearFiltersBtn: {
    marginTop: Spacing.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    borderRadius: Radii.full,
    borderWidth: 1,
  },
  clearFiltersBtnText: {
    fontSize: Typography.base,
    fontWeight: Typography.semibold,
  },
  errorBanner: {
    borderLeftWidth: 3,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radii.sm,
  },
  errorText: {
    fontSize: Typography.sm,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  headerBtn: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    position: 'relative',
  },
  headerBtnDisabled: {
    opacity: 0.4,
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  searchBtn: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  // Progress overlay
  progressOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xxxl,
  },
  progressCard: {
    borderRadius: Radii.xl,
    padding: Spacing.xxl,
    alignItems: 'center',
    gap: Spacing.lg,
    borderWidth: 1,
    minWidth: 180,
    ...Shadows.md,
  },
  progressText: {
    fontSize: Typography.base,
    fontWeight: Typography.medium,
  },
  // Error dialog
  errorCard: {
    borderRadius: Radii.xl,
    padding: Spacing.xxl,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    ...Shadows.md,
  },
  errorIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  errorDialogTitle: {
    fontSize: Typography.md,
    fontWeight: Typography.semibold,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  errorDialogMessage: {
    fontSize: Typography.sm,
    textAlign: 'center',
    marginBottom: Spacing.xxl,
    lineHeight: Typography.sm * Typography.relaxed,
  },
  errorButtonRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    width: '100%',
  },
  errorCancelBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: Radii.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  errorCancelText: {
    fontSize: Typography.base,
    fontWeight: Typography.medium,
  },
  errorRetryBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: Radii.md,
    alignItems: 'center',
  },
  errorRetryText: {
    fontSize: Typography.base,
    fontWeight: Typography.semibold,
  },
});
