import { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Stack, router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSQLiteContext } from 'expo-sqlite';
import { Contenedor, getAllContenedores, deleteContenedor, OrdenContenedor } from '../src/db/contenedorRepository';
import { getObjetosFotoUriByContenedor } from '../src/db/objetoRepository';
import { deleteImagesFromStorage } from '../src/utils/imageStorage';
import { ContenedorItem } from '../src/components/ContenedorItem';
import { ConfirmDialog } from '../src/components/ConfirmDialog';
import { FAB } from '../src/components/FAB';
import { Spacing, Typography, Radii } from '../src/theme';
import { useTheme } from '../src/context/ThemeContext';

const ORDENES: { key: OrdenContenedor; label: string }[] = [
  { key: 'nombre', label: 'Nombre' },
  { key: 'fecha', label: 'Fecha' },
  { key: 'cantidad_objetos', label: 'Cantidad' },
];

export default function ListaContenedores() {
  const db = useSQLiteContext();
  const { colors } = useTheme();
  const [contenedores, setContenedores] = useState<Contenedor[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [contenedorAEliminar, setContenedorAEliminar] = useState<Contenedor | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [orden, setOrden] = useState<OrdenContenedor>('nombre');
  const [filtroUbicacion, setFiltroUbicacion] = useState('');
  const [totalContenedores, setTotalContenedores] = useState(0);

  async function cargarContenedores(ord = orden, filtro = filtroUbicacion) {
    try {
      const data = await getAllContenedores(db, ord, filtro);
      setContenedores(data);
      // Cargar total sin filtro para detectar "sin coincidencias"
      const total = await getAllContenedores(db, 'nombre');
      setTotalContenedores(total.length);
      setError(null);
    } catch {
      setError('No se pudo cargar los contenedores. Intenta de nuevo.');
    }
  }

  useEffect(() => { cargarContenedores(); }, []);
  useFocusEffect(useCallback(() => { cargarContenedores(); }, [db]));

  function handleOrden(nuevoOrden: OrdenContenedor) {
    setOrden(nuevoOrden);
    cargarContenedores(nuevoOrden, filtroUbicacion);
  }

  function handleFiltro(texto: string) {
    setFiltroUbicacion(texto);
    cargarContenedores(orden, texto);
  }

  async function handleConfirmarEliminar() {
    if (contenedorAEliminar === null) return;
    try {
      const uris = await getObjetosFotoUriByContenedor(db, contenedorAEliminar.id);
      if (uris.length > 0) {
        try { await deleteImagesFromStorage(uris); } catch { /* silencioso */ }
      }
      await deleteContenedor(db, contenedorAEliminar.id);
      setContenedorAEliminar(null);
      cargarContenedores();
    } catch {
      setDeleteError('No se pudo eliminar el contenedor.');
      setContenedorAEliminar(null);
    }
  }

  const hayFiltroActivo = filtroUbicacion.trim().length > 0;
  const sinCoincidencias = hayFiltroActivo && contenedores.length === 0 && totalContenedores > 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.bgBase }]}>
      <Stack.Screen
        options={{
          title: 'San Alejo',
          headerRight: () => (
            <View style={styles.headerButtons}>
              <Pressable
                onPress={() => router.push('/busqueda')}
                style={styles.searchBtn}
                accessibilityRole="button"
                accessibilityLabel="Buscar objetos"
              >
                <Ionicons name="search-outline" size={22} color={colors.textPrimary} />
              </Pressable>
              <Pressable
                onPress={() => router.push('/configuracion')}
                style={styles.searchBtn}
                accessibilityRole="button"
                accessibilityLabel="Configuración"
              >
                <Ionicons name="settings-outline" size={22} color={colors.textPrimary} />
              </Pressable>
            </View>
          ),
        }}
      />

      {/* Controles de ordenamiento y filtro */}
      <View style={[styles.controlsContainer, { backgroundColor: colors.bgSurface, borderBottomColor: colors.border }]}>
        {/* Filtro por ubicación */}
        <TextInput
          style={[styles.filtroInput, { backgroundColor: colors.bgElevated, color: colors.textPrimary, borderColor: colors.border }]}
          placeholder="Filtrar por ubicación..."
          placeholderTextColor={colors.textMuted}
          value={filtroUbicacion}
          onChangeText={handleFiltro}
          accessibilityLabel="Filtrar contenedores por ubicación"
        />
        {/* Botones de ordenamiento */}
        <View style={styles.ordenRow}>
          {ORDENES.map(({ key, label }) => (
            <Pressable
              key={key}
              style={[
                styles.ordenBtn,
                { borderColor: colors.border, backgroundColor: orden === key ? colors.accent : colors.bgElevated },
              ]}
              onPress={() => handleOrden(key)}
              accessibilityRole="button"
              accessibilityLabel={`Ordenar por ${label}`}
            >
              <Text style={[styles.ordenBtnText, { color: orden === key ? colors.textOnAccent : colors.textSecondary }]}>
                {label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

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
              {hayFiltroActivo ? ' encontrados' : ''}
            </Text>
          ) : null
        }
        ListEmptyComponent={
          sinCoincidencias ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="search-outline" size={52} color={colors.textMuted} style={styles.emptyIcon} />
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>Sin coincidencias</Text>
              <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
                No hay contenedores que coincidan con los filtros aplicados.
              </Text>
            </View>
          ) : (
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  controlsContainer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
  },
  filtroInput: {
    borderWidth: 1,
    borderRadius: Radii.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: Typography.sm,
    marginBottom: Spacing.sm,
  },
  ordenRow: {
    flexDirection: 'row',
  },
  ordenBtn: {
    flex: 1,
    paddingVertical: Spacing.xs,
    borderWidth: 1,
    borderRadius: Radii.sm,
    alignItems: 'center',
    marginRight: Spacing.xs,
  },
  ordenBtnText: {
    fontSize: Typography.xs,
    fontWeight: Typography.semibold,
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
    paddingTop: Spacing.xxxl,
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
    marginTop: Spacing.xs,
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
  searchBtn: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
