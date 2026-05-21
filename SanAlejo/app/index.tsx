import { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Stack, router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { Contenedor, getAllContenedores, deleteContenedor } from '../src/db/contenedorRepository';
import { getObjetosFotoUriByContenedor } from '../src/db/objetoRepository';
import { deleteImagesFromStorage } from '../src/utils/imageStorage';
import { ContenedorItem } from '../src/components/ContenedorItem';
import { ConfirmDialog } from '../src/components/ConfirmDialog';
import { FAB } from '../src/components/FAB';

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

  useEffect(() => {
    cargarContenedores();
  }, []);

  useFocusEffect(
    useCallback(() => {
      cargarContenedores();
    }, [db])
  );

  async function handleConfirmarEliminar() {
    if (contenedorAEliminar === null) return;
    try {
      const uris = await getObjetosFotoUriByContenedor(db, contenedorAEliminar.id);
      if (uris.length > 0) {
        try {
          await deleteImagesFromStorage(uris);
        } catch {
          // Silencioso: continuar aunque falle la limpieza de archivos
        }
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
          title: 'Mis Contenedores',
          headerRight: () => (
            <Pressable
              onPress={() => router.push('/busqueda')}
              style={styles.headerButton}
              accessibilityRole="button"
              accessibilityLabel="Buscar objetos"
            >
              <Text style={styles.headerButtonText}>🔍</Text>
            </Pressable>
          ),
        }}
      />

      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {deleteError ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{deleteError}</Text>
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
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              No hay contenedores. Agrega tu primera caja, maleta o cajón.
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
    backgroundColor: '#F2F2F7',
  },
  list: {
    paddingVertical: 8,
    paddingBottom: 88,
  },
  emptyList: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#888888',
    textAlign: 'center',
    lineHeight: 24,
  },
  errorContainer: {
    backgroundColor: '#FFE5E5',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  errorText: {
    color: '#CC0000',
    fontSize: 14,
    textAlign: 'center',
  },
  headerButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  headerButtonText: {
    fontSize: 20,
  },
});
