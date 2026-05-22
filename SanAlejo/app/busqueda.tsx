import { useState } from 'react';
import { FlatList, StyleSheet, Text, TextInput, Pressable, View } from 'react-native';
import { Stack, router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { ObjetoConContenedor, searchObjetos } from '../src/db/objetoRepository';
import { Colors, Radii, Shadows, Spacing, Typography } from '../src/theme';

export default function Busqueda() {
  const db = useSQLiteContext();
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
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Buscar objetos' }} />

      {/* Search bar */}
      <View style={styles.searchWrap}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Nombre o descripción del objeto…"
          placeholderTextColor={Colors.textMuted}
          value={query}
          onChangeText={handleChangeText}
          autoFocus
          returnKeyType="search"
          accessibilityLabel="Barra de búsqueda de objetos"
          selectionColor={Colors.accent}
        />
        {query.length > 0 ? (
          <Pressable onPress={() => handleChangeText('')} hitSlop={8}>
            <Text style={styles.clearIcon}>✕</Text>
          </Pressable>
        ) : null}
      </View>

      <FlatList
        data={resultados}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <Pressable
            style={({ pressed }) => [styles.resultCard, pressed && styles.resultCardPressed]}
            onPress={() => router.push(`/contenedor/${item.id_contenedor}`)}
            accessibilityRole="button"
            accessibilityLabel={`Ir al contenedor de ${item.nombre}`}
          >
            <View style={styles.resultMain}>
              <Text style={styles.nombreObjeto} numberOfLines={1}>{item.nombre}</Text>
              {item.descripcion ? (
                <Text style={styles.descripcionObjeto} numberOfLines={2}>{item.descripcion}</Text>
              ) : null}
            </View>
            <View style={styles.contenedorBadge}>
              <Text style={styles.contenedorBadgeText} numberOfLines={1}>
                📦 {item.nombre_contenedor}
              </Text>
            </View>
          </Pressable>
        )}
        ListEmptyComponent={
          query.trim().length > 0 && !buscando ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>🔎</Text>
              <Text style={styles.emptyTitle}>Sin resultados</Text>
              <Text style={styles.emptySubtitle}>
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
    backgroundColor: Colors.bgBase,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgSurface,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
    borderRadius: Radii.lg,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    ...Shadows.sm,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 13,
    fontSize: Typography.base,
    color: Colors.textPrimary,
  },
  clearIcon: {
    fontSize: 14,
    color: Colors.textMuted,
    paddingLeft: Spacing.sm,
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
  emptyEmoji: {
    fontSize: 48,
    marginBottom: Spacing.sm,
  },
  emptyTitle: {
    fontSize: Typography.xl,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
  },
  emptySubtitle: {
    fontSize: Typography.base,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: Typography.base * Typography.relaxed,
  },
  resultCard: {
    backgroundColor: Colors.bgSurface,
    marginHorizontal: Spacing.lg,
    marginVertical: 4,
    borderRadius: Radii.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    ...Shadows.sm,
  },
  resultCardPressed: {
    opacity: 0.75,
    backgroundColor: Colors.bgElevated,
  },
  resultMain: {
    marginBottom: Spacing.sm,
  },
  nombreObjeto: {
    fontSize: Typography.base,
    fontWeight: Typography.semibold,
    color: Colors.textPrimary,
    marginBottom: 3,
  },
  descripcionObjeto: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    lineHeight: Typography.sm * Typography.normal,
  },
  contenedorBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.accentMuted,
    borderRadius: Radii.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
  },
  contenedorBadgeText: {
    fontSize: Typography.xs,
    color: Colors.accentLight,
    fontWeight: Typography.medium,
  },
});
