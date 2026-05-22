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
import { Ionicons } from '@expo/vector-icons';
import { useSQLiteContext } from 'expo-sqlite';
import { Contenedor, getContenedorById } from '../../src/db/contenedorRepository';
import { Objeto, getObjetosByContenedor, deleteObjeto } from '../../src/db/objetoRepository';
import { ObjetoItem } from '../../src/components/ObjetoItem';
import { ConfirmDialog } from '../../src/components/ConfirmDialog';
import { deleteImageFromStorage } from '../../src/utils/imageStorage';
import { Colors, Radii, Shadows, Spacing, Typography } from '../../src/theme';

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

  useEffect(() => { cargarDatos(); }, [id]);
  useFocusEffect(useCallback(() => { cargarDatos(); }, [db, id]));

  async function handleConfirmarEliminar() {
    if (objetoAEliminar === null) return;
    if (objetoAEliminar.foto_uri !== null) {
      try { await deleteImageFromStorage(objetoAEliminar.foto_uri); } catch { /* silencioso */ }
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
              style={styles.editHeaderBtn}
            >
              <Text style={styles.editHeaderText}>Editar</Text>
            </Pressable>
          ),
        }}
      />

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.accent} />
        </View>
      ) : (
        <>
          {(error || deleteError) ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{error ?? deleteError}</Text>
            </View>
          ) : null}

          {contenedor ? (
            <View style={styles.header}>
              <View style={styles.headerAccent} />
              <View style={styles.headerContent}>
                <Text style={styles.headerNombre}>{contenedor.nombre}</Text>
                {contenedor.descripcion ? (
                  <Text style={styles.headerDescripcion}>{contenedor.descripcion}</Text>
                ) : null}
                {contenedor.ubicacion ? (
                  <View style={styles.ubicacionRow}>
                    <Ionicons name="location-outline" size={13} color={Colors.textMuted} />
                    <Text style={styles.ubicacionText}>{contenedor.ubicacion}</Text>
                  </View>
                ) : null}
              </View>
            </View>
          ) : null}

          {objetos.length > 0 ? (
            <Text style={styles.sectionLabel}>
              {objetos.length} objeto{objetos.length !== 1 ? 's' : ''}
            </Text>
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
                <Ionicons name="archive-outline" size={48} color={Colors.textMuted} style={styles.emptyIcon} />
                <Text style={styles.emptyTitle}>Contenedor vacío</Text>
                <Text style={styles.emptySubtitle}>
                  Agrega los objetos que hay dentro.
                </Text>
              </View>
            }
            contentContainerStyle={objetos.length === 0 ? styles.emptyList : styles.list}
          />

          <Pressable
            style={({ pressed }) => [styles.addButton, pressed && styles.addButtonPressed]}
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
    backgroundColor: Colors.bgBase,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editHeaderBtn: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  editHeaderText: {
    fontSize: Typography.base,
    color: Colors.accentLight,
    fontWeight: Typography.medium,
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
  header: {
    flexDirection: 'row',
    backgroundColor: Colors.bgSurface,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
    borderRadius: Radii.lg,
    overflow: 'hidden',
    ...Shadows.sm,
  },
  headerAccent: {
    width: 4,
    backgroundColor: Colors.accent,
  },
  headerContent: {
    flex: 1,
    padding: Spacing.md,
  },
  headerNombre: {
    fontSize: Typography.lg,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  headerDescripcion: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    marginBottom: 6,
    lineHeight: Typography.sm * Typography.normal,
  },
  ubicacionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ubicacionText: {
    fontSize: Typography.sm,
    color: Colors.textMuted,
  },
  sectionLabel: {
    fontSize: Typography.xs,
    fontWeight: Typography.semibold,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.xs,
  },
  list: {
    paddingBottom: 100,
  },
  emptyList: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xxxl,
    paddingTop: 48,
    gap: Spacing.sm,
  },
  emptyIcon: {
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
  addButton: {
    position: 'absolute',
    bottom: 24,
    left: Spacing.lg,
    right: Spacing.lg,
    backgroundColor: Colors.accent,
    borderRadius: Radii.lg,
    paddingVertical: 15,
    alignItems: 'center',
    ...Shadows.lg,
  },
  addButtonPressed: {
    backgroundColor: Colors.accentDark,
  },
  addButtonText: {
    color: Colors.textOnAccent,
    fontSize: Typography.base,
    fontWeight: Typography.semibold,
  },
});
