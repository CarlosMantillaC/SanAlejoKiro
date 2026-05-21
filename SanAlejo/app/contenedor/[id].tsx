import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Stack, router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { Contenedor, getContenedorById } from '../../src/db/contenedorRepository';
import { Objeto, getObjetosByContenedor, deleteObjeto } from '../../src/db/objetoRepository';
import { ObjetoItem } from '../../src/components/ObjetoItem';
import { ConfirmDialog } from '../../src/components/ConfirmDialog';
import { deleteImageFromStorage } from '../../src/utils/imageStorage';

export default function DetalleContenedor() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const db = useSQLiteContext();

  const [contenedor, setContenedor] = useState<Contenedor | null>(null);
  const [objetos, setObjetos] = useState<Objeto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [objetoAEliminar, setObjetoAEliminar] = useState<Objeto | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function cargarDatos() {
    try {
      const [cont, objs] = await Promise.all([
        getContenedorById(db, Number(id)),
        getObjetosByContenedor(db, Number(id)),
      ]);
      setContenedor(cont);
      setObjetos(objs);
      setError(null);
    } catch {
      setError('No se pudo cargar el contenedor. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    cargarDatos();
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      cargarDatos();
    }, [db, id])
  );

  async function handleConfirmarEliminar() {
    if (objetoAEliminar === null) return;
    if (objetoAEliminar.foto_uri !== null) {
      try {
        await deleteImageFromStorage(objetoAEliminar.foto_uri);
      } catch {
        // silencioso si falla
      }
    }
    try {
      await deleteObjeto(db, objetoAEliminar.id);
      setObjetoAEliminar(null);
      cargarDatos();
    } catch {
      setDeleteError('No se pudo eliminar el objeto.');
      setObjetoAEliminar(null);
    }
  }

  const titulo = contenedor?.nombre ?? 'Contenedor';

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: titulo,
          headerRight: () => (
            <Pressable
              onPress={() => router.push(`/contenedor/editar/${id}`)}
              accessibilityRole="button"
              accessibilityLabel="Editar contenedor"
              style={styles.headerButton}
            >
              <Text style={styles.headerButtonText}>Editar</Text>
            </Pressable>
          ),
        }}
      />

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" />
        </View>
      ) : (
        <>
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

          {contenedor ? (
            <View style={styles.header}>
              <Text style={styles.nombre}>{contenedor.nombre}</Text>
              {contenedor.descripcion ? (
                <Text style={styles.descripcion}>{contenedor.descripcion}</Text>
              ) : null}
              {contenedor.ubicacion ? (
                <Text style={styles.ubicacion}>📍 {contenedor.ubicacion}</Text>
              ) : null}
            </View>
          ) : null}

          <FlatList
            data={objetos}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => (
              <ObjetoItem
                objeto={item}
                onEdit={() => router.push(`/contenedor/objeto/editar/${item.id}`)}
                onDelete={() => setObjetoAEliminar(item)}
              />
            )}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  Este contenedor está vacío. Agrega los objetos que hay dentro.
                </Text>
              </View>
            }
            contentContainerStyle={
              objetos.length === 0 ? styles.emptyList : styles.list
            }
          />

          <Pressable
            style={styles.addButton}
            onPress={() => router.push(`/contenedor/objeto/nuevo?id_contenedor=${id}`)}
            accessibilityRole="button"
            accessibilityLabel="Agregar objeto"
          >
            <Text style={styles.addButtonText}>+ Agregar objeto</Text>
          </Pressable>
        </>
      )}

      <ConfirmDialog
        visible={objetoAEliminar !== null}
        message="¿Eliminar este objeto?"
        onConfirm={handleConfirmarEliminar}
        onCancel={() => setObjetoAEliminar(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  headerButtonText: {
    fontSize: 16,
    color: '#2b6cb0',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
    marginBottom: 8,
  },
  nombre: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 4,
  },
  descripcion: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
  },
  ubicacion: {
    fontSize: 13,
    color: '#888888',
  },
  list: {
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
    paddingTop: 48,
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
  addButton: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    backgroundColor: '#2b6cb0',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
