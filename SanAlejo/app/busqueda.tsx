import { useState } from 'react';
import { FlatList, StyleSheet, Text, TextInput, Pressable, View } from 'react-native';
import { Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSQLiteContext } from 'expo-sqlite';
import { ObjetoConContenedor, searchObjetos } from '../src/db/objetoRepository';
import { Radii, Shadows, Spacing, Typography } from '../src/theme';
import { useTheme } from '../src/context/ThemeContext';

export default function Busqueda() {
  const db = useSQLiteContext();
  const { colors } = useTheme();
  const [query, setQuery] = useState('');
  const [resultados, setResultados] = useState<ObjetoConContenedor[]>([]);
  const [buscando, setBuscando] = useState(false);

  async function handleChangeText(texto: string) {
    setQuery(texto);
    if (texto.trim().length === 0) {
      setResultados([]);
      return;
    }
    setBuscando(true);
    try {
      const encontrados = await searchObjetos(db, texto);
      setResultados(encontrados);
    } catch {
      setResultados([]);
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
