import { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Stack, router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSQLiteContext } from 'expo-sqlite';
import { Contenedor, getAllContenedores, deleteContenedor } from '../src/db/contenedorRepository';
import { getObjetosFotoUriByContenedor } from '../src/db/objetoRepository';
import { deleteImagesFromStorage } from '../src/utils/imageStorage';
import { ContenedorItem } from '../src/components/ContenedorItem';
import { ConfirmDialog } from '../src/components/ConfirmDialog';
import { FAB } from '../src/components/FAB';
import { Colors, Spacing, Typography, Radii } from '../src/theme';

export default function ListaContenedores() {
  const db = useSQLiteContext();
  const [contenedores, setContenedores] = useState<Contenedor[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [contenedorAEliminar, setContenedorAEliminar] = useState<Contenedor | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function cargarContenedores() {
    try {
      const data = await getAllContenedores(db);
      setContenedores(data);
      setError(null);
    } catch {
      setError('No se pudo cargar los contenedores. Intenta de nuevo.');
    }
  }

  useEffect(() => { cargarContenedores(); }, []);
  useFocusEffect(useCallback(() => { cargarContenedores(); }, [db]));

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

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'San Alejo',
          headerRight: () => (
            <Pressable
              onPress={() => router.push('/busqueda')}
              style={styles.searchBtn}
              accessibilityRole="button"
              accessibilityLabel="Buscar objetos"
            >
              <Ionicons name="search-outline" size={22} color={Colors.textPrimary} />
            </Pressable>
          ),
        }}
      />

      {(error || deleteError) ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error ?? deleteError}</Text>
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
            <Text style={styles.sectionLabel}>
              {contenedores.length} contenedor{contenedores.length !== 1 ? 'es' : ''}
            </Text>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="archive-outline" size={52} color={Colors.textMuted} style={styles.emptyIcon} />
            <Text style={styles.emptyTitle}>Sin contenedores</Text>
            <Text style={styles.emptySubtitle}>
              Agrega tu primera caja, maleta o cajón.
            </Text>
          </View>
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
    backgroundColor: Colors.bgBase,
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
    color: Colors.textMuted,
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
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: Typography.base,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: Typography.base * Typography.relaxed,
  },
  errorBanner: {
    backgroundColor: Colors.dangerMuted,
    borderLeftWidth: 3,
    borderLeftColor: Colors.danger,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radii.sm,
  },
  errorText: {
    color: Colors.danger,
    fontSize: Typography.sm,
  },
  searchBtn: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
});
