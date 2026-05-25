import { useEffect, useState } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  Pressable,
  View,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSQLiteContext } from 'expo-sqlite';
import { ObjetoConContenedor, searchObjetos } from '../src/db/objetoRepository';
import {
  Etiqueta,
  getAllEtiquetas,
  insertEtiquetaIfNotExists,
} from '../src/db/etiquetaRepository';
import { EtiquetaSelector } from '../src/components/EtiquetaSelector';
import { Radii, Shadows, Spacing, Typography } from '../src/theme';
import { useTheme } from '../src/context/ThemeContext';

export default function Busqueda() {
  const db = useSQLiteContext();
  const { colors } = useTheme();
  const [query, setQuery] = useState('');
  const [resultados, setResultados] = useState<ObjetoConContenedor[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [etiquetasDisponibles, setEtiquetasDisponibles] = useState<Etiqueta[]>([]);
  const [etiquetasSeleccionadas, setEtiquetasSeleccionadas] = useState<Etiqueta[]>([]);

  useEffect(() => {
    async function cargarEtiquetas() {
      try {
        const etiquetas = await getAllEtiquetas(db);
        setEtiquetasDisponibles(etiquetas);
      } catch {
        // no interrumpimos la búsqueda
      }
    }
    cargarEtiquetas();
  }, [db]);

  async function handleSearch(texto: string) {
    setQuery(texto);
    const etiquetaIds = etiquetasSeleccionadas.map((etiqueta) => etiqueta.id);
    if (texto.trim().length === 0 && etiquetaIds.length === 0) {
      setResultados([]);
      return;
    }

    setBuscando(true);
    try {
      const encontrados = await searchObjetos(db, texto, etiquetaIds);
      setResultados(encontrados);
    } catch {
      setResultados([]);
    } finally {
      setBuscando(false);
    }
  }

  function handleToggleEtiqueta(id: number) {
    setEtiquetasSeleccionadas((prev) => {
      if (prev.some((etiqueta) => etiqueta.id === id)) {
        return prev.filter((etiqueta) => etiqueta.id !== id);
      }
      const etiqueta = etiquetasDisponibles.find((item) => item.id === id);
      return etiqueta ? [...prev, etiqueta] : prev;
    });
  }

  useEffect(() => {
    async function actualizarBusqueda() {
      if (query.trim().length === 0 && etiquetasSeleccionadas.length === 0) {
        setResultados([]);
        return;
      }

      setBuscando(true);
      try {
        const encontrados = await searchObjetos(
          db,
          query,
          etiquetasSeleccionadas.map((etiqueta) => etiqueta.id)
        );
        setResultados(encontrados);
      } catch {
        setResultados([]);
      } finally {
        setBuscando(false);
      }
    }

    actualizarBusqueda();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [etiquetasSeleccionadas]);

  async function handleCreateEtiqueta(nombreEtiqueta: string) {
    try {
      const id = await insertEtiquetaIfNotExists(db, nombreEtiqueta);
      const nuevaEtiqueta = { id, nombre: nombreEtiqueta };
      setEtiquetasDisponibles((prev) => {
        if (prev.some((etiqueta) => etiqueta.id === id)) return prev;
        return [...prev, nuevaEtiqueta].sort((a, b) => a.nombre.localeCompare(b.nombre));
      });
      setEtiquetasSeleccionadas((prev) => {
        if (prev.some((etiqueta) => etiqueta.id === id)) return prev;
        return [...prev, nuevaEtiqueta];
      });
      await handleSearch(query);
    } catch {
      // Silencioso si la etiqueta no puede crearse
    }
  }

  function handleClearFilters() {
    setQuery('');
    setEtiquetasSeleccionadas([]);
    setResultados([]);
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.bgBase }]}> 
      <Stack.Screen options={{ title: 'Buscar objetos' }} />

      <View style={[styles.heroCard, { backgroundColor: colors.bgSurface, borderColor: colors.borderSubtle }]}> 
        <Text style={[styles.heroTitle, { color: colors.textPrimary }]}>Encuentra tus objetos</Text>
        <Text style={[styles.heroSubtitle, { color: colors.textSecondary }]}>Usa palabras clave o etiquetas para localizar cualquier objeto guardado.</Text>
      </View>

      <View style={[styles.searchWrap, { backgroundColor: colors.bgSurface, borderColor: colors.borderSubtle }]}> 
        <Ionicons name="search-outline" size={18} color={colors.textMuted} style={styles.searchIconStyle} />
        <TextInput
          style={[styles.searchInput, { color: colors.textPrimary }]}
          placeholder="Nombre o descripción del objeto…"
          placeholderTextColor={colors.textMuted}
          value={query}
          onChangeText={handleSearch}
          autoFocus
          returnKeyType="search"
          accessibilityLabel="Barra de búsqueda de objetos"
          selectionColor={colors.accent}
        />
        {query.length > 0 ? (
          <Pressable onPress={() => handleSearch('')} hitSlop={8}>
            <Ionicons name="close-circle" size={18} color={colors.textMuted} />
          </Pressable>
        ) : null}
      </View>

      <View style={[styles.filterSection, { backgroundColor: colors.bgSurface, borderColor: colors.borderSubtle }]}> 
        <View style={styles.filterHeader}>
          <Text style={[styles.filterLabel, { color: colors.textSecondary }]}>Filtrar por etiquetas</Text>
          {(query.length > 0 || etiquetasSeleccionadas.length > 0) ? (
            <Pressable
              onPress={handleClearFilters}
              style={({ pressed }) => [
                styles.clearButton,
                { backgroundColor: pressed ? colors.accentDark : colors.accent },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Limpiar filtros de búsqueda"
            >
              <Text style={[styles.clearButtonText, { color: colors.textOnAccent }]}>Limpiar filtros</Text>
            </Pressable>
          ) : null}
        </View>
        <EtiquetaSelector
          etiquetas={etiquetasDisponibles}
          selectedIds={etiquetasSeleccionadas.map((etiqueta) => etiqueta.id)}
          onToggle={handleToggleEtiqueta}
          onCreate={handleCreateEtiqueta}
        />
      </View>

      <FlatList
        data={resultados}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <Pressable
            style={({ pressed }) => [
              styles.resultCard,
              {
                backgroundColor: pressed ? colors.bgElevated : colors.bgSurface,
                borderColor: colors.borderSubtle,
              },
            ]}
            onPress={() => router.push(`/contenedor/${item.id_contenedor}`)}
            accessibilityRole="button"
            accessibilityLabel={`Ir al contenedor de ${item.nombre}`}
          >
            <View style={styles.resultMain}>
              <Text style={[styles.nombreObjeto, { color: colors.textPrimary }]} numberOfLines={1}>
                {item.nombre}
              </Text>
              {item.descripcion ? (
                <Text style={[styles.descripcionObjeto, { color: colors.textSecondary }]} numberOfLines={2}>
                  {item.descripcion}
                </Text>
              ) : null}
            </View>
            <View style={[styles.contenedorBadge, { backgroundColor: colors.accentMuted }]}> 
              <Ionicons name="cube-outline" size={11} color={colors.accentLight} />
              <Text style={[styles.contenedorBadgeText, { color: colors.accentLight }]} numberOfLines={1}>
                {item.nombre_contenedor}
              </Text>
            </View>
          </Pressable>
        )}
        ListEmptyComponent={
          query.trim().length > 0 || etiquetasSeleccionadas.length > 0 ? (
            !buscando ? (
              <View style={styles.emptyContainer}> 
                <Ionicons name="search-outline" size={48} color={colors.textMuted} style={styles.emptyIcon} />
                <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>Sin resultados</Text>
                <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}> 
                  No se encontraron objetos con ese nombre o descripción.
                </Text>
              </View>
            ) : null
          ) : null
        }
        contentContainerStyle={resultados.length === 0 ? styles.emptyList : styles.list}
        keyboardShouldPersistTaps="handled"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  heroCard: {
    marginHorizontal: Spacing.lg,
    borderRadius: Radii.lg,
    borderWidth: 1,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    ...Shadows.sm,
  },
  heroTitle: {
    fontSize: Typography.xl,
    fontWeight: Typography.semibold,
    marginBottom: Spacing.xs,
  },
  heroSubtitle: {
    fontSize: Typography.sm,
    lineHeight: Typography.sm * Typography.relaxed,
  },
  filterSection: {
    marginHorizontal: Spacing.lg,
    borderRadius: Radii.lg,
    borderWidth: 1,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    ...Shadows.sm,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    borderRadius: Radii.lg,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    ...Shadows.sm,
  },
  searchIconStyle: {
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: Typography.base,
  },
  list: {
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.xxxl,
  },
  emptyList: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xxxl,
    paddingTop: 60,
    gap: Spacing.sm,
  },
  emptyIcon: {
    marginBottom: Spacing.sm,
  },
  emptyTitle: {
    fontSize: Typography.xl,
    fontWeight: Typography.bold,
  },
  emptySubtitle: {
    fontSize: Typography.base,
    textAlign: 'center',
    lineHeight: Typography.base * Typography.relaxed,
  },
  resultCard: {
    marginHorizontal: Spacing.lg,
    marginVertical: 6,
    borderRadius: Radii.lg,
    padding: Spacing.md,
    borderWidth: 1,
    ...Shadows.sm,
  },
  resultMain: {
    marginBottom: Spacing.sm,
  },
  nombreObjeto: {
    fontSize: Typography.base,
    fontWeight: Typography.semibold,
    marginBottom: 3,
  },
  descripcionObjeto: {
    fontSize: Typography.sm,
    lineHeight: Typography.sm * Typography.normal,
  },
  contenedorBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: Radii.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
  },
  contenedorBadgeText: {
    fontSize: Typography.xs,
    fontWeight: Typography.medium,
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  clearButton: {
    borderRadius: Radii.lg,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
  },
  clearButtonText: {
    fontSize: Typography.sm,
    fontWeight: Typography.medium,
  },
});
