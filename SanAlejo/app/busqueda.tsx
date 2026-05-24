import { useEffect, useState } from 'react';
import { FlatList, Image, StyleSheet, Text, TextInput, Pressable, View } from 'react-native';
import { Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSQLiteContext } from 'expo-sqlite';
import {
  ObjetoConContenedorYPortada,
  searchObjetosConPortada,
  searchObjetosConPortadaWithEtiquetas,
} from '../src/db/objetoRepository';
import { searchEtiquetas, listAllEtiquetas, Etiqueta } from '../src/db/etiquetaRepository';
import { subscribe } from '../src/utils/pubsub';
import { Radii, Shadows, Spacing, Typography } from '../src/theme';
import { useTheme } from '../src/context/ThemeContext';

export default function Busqueda() {
  const db = useSQLiteContext();
  const { colors } = useTheme();
  const [query, setQuery] = useState('');
  const [resultados, setResultados] = useState<ObjetoConContenedorYPortada[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [etiquetasSugeridas, setEtiquetasSugeridas] = useState<Etiqueta[]>([]);
  const [selectedEtiquetaId, setSelectedEtiquetaId] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const all = await listAllEtiquetas(db);
        if (!cancelled) setEtiquetasSugeridas(all.slice(0, 16));
      } catch {
        if (!cancelled) setEtiquetasSugeridas([]);
      }
    })();
    const unsub = subscribe('etiquetas:changed', () => {
      (async () => {
        try {
          const all = await listAllEtiquetas(db);
          if (!cancelled) setEtiquetasSugeridas(all.slice(0, 16));
        } catch {
          if (!cancelled) setEtiquetasSugeridas([]);
        }
      })();
    });
    return () => { cancelled = true; unsub(); };
  }, [db]);

  async function handleChangeText(texto: string) {
    setQuery(texto);
    if (texto.trim().length === 0) {
      setResultados([]);
      // keep etiquetasSugeridas loaded so legend + chips remain visible on empty query
      return;
    }
    setBuscando(true);
    try {
      // If the query exactly matches an etiqueta name, search by etiqueta
      const etiquetaCandidates = await searchEtiquetas(db, texto, 10);
      // keep the original suggestions list; only use etiquetaCandidates to detect exact matches
      const exact = etiquetaCandidates.filter(e => e.nombre.toLowerCase() === texto.trim().toLowerCase());
      if (exact.length > 0) {
        const encontrados = await searchObjetosConPortadaWithEtiquetas(db, texto, exact.map(e => e.id));
        setResultados(encontrados);
      } else {
        const encontrados = await searchObjetosConPortada(db, texto);
        setResultados(encontrados);
      }
    } catch {
      setResultados([]);
    } finally {
      setBuscando(false);
    }
  }

  async function buscarPorEtiqueta(id: number) {
    setBuscando(true);
    try {
      const encontrados = await searchObjetosConPortadaWithEtiquetas(db, '', [id]);
      setResultados(encontrados);
      setQuery('');
      setSelectedEtiquetaId(id);
      setEtiquetasSugeridas([]);
    } catch {
      setResultados([]);
    } finally {
      setBuscando(false);
    }
  }

  async function clearSearch() {
    setBuscando(true);
    try {
      setResultados([]);
      setQuery('');
      setSelectedEtiquetaId(null);
      const all = await listAllEtiquetas(db);
      setEtiquetasSugeridas(all.slice(0, 16));
    } catch {
      // ignore
    } finally {
      setBuscando(false);
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.bgBase }]}>
      <Stack.Screen options={{ title: 'Buscar objetos' }} />

      {/* Search bar */}
      <View
        style={[
          styles.searchWrap,
          { backgroundColor: colors.bgSurface, borderColor: colors.borderSubtle },
        ]}
      >
        <Ionicons name="search-outline" size={18} color={colors.textMuted} style={styles.searchIconStyle} />
        <TextInput
          style={[styles.searchInput, { color: colors.textPrimary }]}
          placeholder="Nombre o descripción del objeto…"
          placeholderTextColor={colors.textMuted}
          value={query}
          onChangeText={handleChangeText}
          autoFocus
          returnKeyType="search"
          accessibilityLabel="Barra de búsqueda de objetos"
          selectionColor={colors.accent}
        />
        {query.length > 0 ? (
          <Pressable onPress={() => handleChangeText('')} hitSlop={8}>
            <Ionicons name="close-circle" size={18} color={colors.textMuted} />
          </Pressable>
        ) : null}
      </View>
      
      {/** Show legend + chips; if a tag is selected show Clear button */}
      {(
        etiquetasSugeridas.length > 0 || selectedEtiquetaId !== null
      ) && (
        <View style={{ paddingHorizontal: Spacing.lg, paddingBottom: Spacing.sm, paddingTop: Spacing.sm }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={[{ marginBottom: Spacing.sm, textTransform: 'uppercase', fontSize: Typography.xs, fontWeight: Typography.semibold, color: colors.textMuted }]}>Etiquetas</Text>
            {selectedEtiquetaId !== null && (
              <Pressable
                onPress={clearSearch}
                accessibilityRole="button"
                accessibilityLabel="Limpiar búsqueda por etiqueta"
                style={({ pressed }) => ([{ paddingVertical: Spacing.xs, paddingHorizontal: Spacing.md, borderRadius: Radii.md, borderWidth: 1, backgroundColor: pressed ? colors.bgMuted : colors.bgSurface, borderColor: colors.border }])}
              >
                <Text style={{ color: colors.textSecondary }}>Limpiar</Text>
              </Pressable>
            )}
          </View>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm }}>
            {etiquetasSugeridas.map((et) => (
              <Pressable
                key={et.id}
                onPress={() => buscarPorEtiqueta(et.id)}
                style={({ pressed }) => ({
                  paddingVertical: Spacing.sm,
                  paddingHorizontal: Spacing.md,
                  borderRadius: Radii.full,
                  borderWidth: 1,
                  backgroundColor: pressed ? colors.bgMuted : colors.bgSurface,
                  borderColor: colors.border,
                  marginRight: Spacing.sm,
                  marginBottom: Spacing.sm,
                })}
              >
                <Text style={{ color: colors.textPrimary }}>{et.nombre}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}
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
            <View style={styles.resultCardInner}>
              {item.portada_uri !== null ? (
                <Image
                  source={{ uri: item.portada_uri }}
                  style={styles.resultThumbnail}
                  accessibilityLabel={`Foto de ${item.nombre}`}
                />
              ) : (
                <View style={[styles.resultThumbnailPlaceholder, { backgroundColor: colors.bgMuted }]}>
                  <Ionicons name="cube-outline" size={22} color={colors.textMuted} />
                </View>
              )}
              <View style={styles.resultContent}>
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
              </View>
            </View>
          </Pressable>
        )}
        ListEmptyComponent={
          query.trim().length > 0 && !buscando ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="search-outline" size={48} color={colors.textMuted} style={styles.emptyIcon} />
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>Sin resultados</Text>
              <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
                No se encontraron objetos con ese nombre o descripción.
              </Text>
            </View>
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
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
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
    paddingVertical: 13,
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
    marginVertical: 4,
    borderRadius: Radii.lg,
    padding: Spacing.md,
    borderWidth: 1,
    ...Shadows.sm,
  },
  resultCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resultThumbnail: {
    width: 52,
    height: 52,
    borderRadius: Radii.md,
    marginRight: Spacing.md,
  },
  resultThumbnailPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: Radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  resultContent: {
    flex: 1,
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
});
