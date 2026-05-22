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
import { ImageViewer } from '../../src/components/ImageViewer';
import { ConfirmDialog } from '../../src/components/ConfirmDialog';
import { deleteImageFromStorage } from '../../src/utils/imageStorage';
import { Radii, Shadows, Spacing, Typography } from '../../src/theme';
import { useTheme } from '../../src/context/ThemeContext';

export default function DetalleContenedor() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const db = useSQLiteContext();
  const { colors } = useTheme();

  const [contenedor, setContenedor] = useState<Contenedor | null>(null);
  const [objetos, setObjetos] = useState<Objeto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [objetoAEliminar, setObjetoAEliminar] = useState<Objeto | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [imagenVisorUri, setImagenVisorUri] = useState<string | null>(null);

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
    <View style={[styles.container, { backgroundColor: colors.bgBase }]}>
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
              <Text style={[styles.editHeaderText, { color: colors.accentLight }]}>Editar</Text>
            </Pressable>
          ),
        }}
      />

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : (
        <>
          {(error || deleteError) ? (
            <View style={[styles.errorBanner, { backgroundColor: colors.dangerMuted, borderLeftColor: colors.danger }]}>
              <Text style={[styles.errorText, { color: colors.danger }]}>{error ?? deleteError}</Text>
            </View>
          ) : null}

          {contenedor ? (
            <View style={[styles.header, { backgroundColor: colors.bgSurface }]}>
              <View style={[styles.headerAccent, { backgroundColor: colors.accent }]} />
              <View style={styles.headerContent}>
                <Text style={[styles.headerNombre, { color: colors.textPrimary }]}>
                  {contenedor.nombre}
                </Text>
                {contenedor.descripcion ? (
                  <Text style={[styles.headerDescripcion, { color: colors.textSecondary }]}>
                    {contenedor.descripcion}
                  </Text>
                ) : null}
                {contenedor.ubicacion ? (
                  <View style={styles.ubicacionRow}>
                    <Ionicons name="location-outline" size={13} color={colors.textMuted} />
                    <Text style={[styles.ubicacionText, { color: colors.textMuted }]}>
                      {contenedor.ubicacion}
                    </Text>
                  </View>
                ) : null}
              </View>
            </View>
          ) : null}

          {objetos.length > 0 ? (
            <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>
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
                onPressFoto={item.foto_uri !== null ? () => setImagenVisorUri(item.foto_uri) : undefined}
              />
            )}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="archive-outline" size={48} color={colors.textMuted} style={styles.emptyIcon} />
                <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>Contenedor vacío</Text>
                <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
                  Agrega los objetos que hay dentro.
                </Text>
              </View>
            }
            contentContainerStyle={objetos.length === 0 ? styles.emptyList : styles.list}
          />

          <ImageViewer
            uri={imagenVisorUri ?? ''}
            visible={imagenVisorUri !== null}
            onClose={() => setImagenVisorUri(null)}
          />

          <Pressable
            style={({ pressed }) => [
              styles.addButton,
              { backgroundColor: pressed ? colors.accentDark : colors.accent },
            ]}
            onPress={() => router.push(`/contenedor/objeto/nuevo?id_contenedor=${id}`)}
            accessibilityRole="button"
            accessibilityLabel="Agregar objeto"
          >
            <Text style={[styles.addButtonText, { color: colors.textOnAccent }]}>+ Agregar objeto</Text>
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
    fontWeight: Typography.medium,
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
  header: {
    flexDirection: 'row',
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
    borderRadius: Radii.lg,
    overflow: 'hidden',
    ...Shadows.sm,
  },
  headerAccent: {
    width: 4,
  },
  headerContent: {
    flex: 1,
    padding: Spacing.md,
  },
  headerNombre: {
    fontSize: Typography.lg,
    fontWeight: Typography.bold,
    marginBottom: 4,
  },
  headerDescripcion: {
    fontSize: Typography.sm,
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
  },
  sectionLabel: {
    fontSize: Typography.xs,
    fontWeight: Typography.semibold,
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
  },
  emptySubtitle: {
    fontSize: Typography.base,
    textAlign: 'center',
    lineHeight: Typography.base * Typography.relaxed,
  },
  addButton: {
    position: 'absolute',
    bottom: 24,
    left: Spacing.lg,
    right: Spacing.lg,
    borderRadius: Radii.lg,
    paddingVertical: 15,
    alignItems: 'center',
    ...Shadows.lg,
  },
  addButtonText: {
    fontSize: Typography.base,
    fontWeight: Typography.semibold,
  },
});
