import { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
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
import { Spacing, Typography, Radii } from '../src/theme';
import { useTheme } from '../src/context/ThemeContext';
import { useSortFilter } from '../src/hooks/useSortFilter';

export default function ListaContenedores() {
  const db = useSQLiteContext();
  const { colors } = useTheme();
  const { state, setCriterio, setFiltroUbicacion, setFiltroEtiquetas, reset, isNonDefault } = useSortFilter();

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
});
