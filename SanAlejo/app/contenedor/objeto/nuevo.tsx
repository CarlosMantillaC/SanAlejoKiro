import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSQLiteContext } from 'expo-sqlite';
import * as ImagePicker from 'expo-image-picker';
import { insertObjeto } from '../../../src/db/objetoRepository';
import { insertFoto } from '../../../src/db/objetoFotoRepository';
import {
  Etiqueta,
  getAllEtiquetas,
  insertEtiquetaIfNotExists,
  setEtiquetasObjeto,
} from '../../../src/db/etiquetaRepository';
import { copyImageToStorage, deleteImageFromStorage } from '../../../src/utils/imageStorage';
import { validateFields } from '../../../src/utils/validator';
import { FotoGaleria } from '../../../src/components/FotoGaleria';
import { ImageViewer } from '../../../src/components/ImageViewer';
import { EtiquetaSelector } from '../../../src/components/EtiquetaSelector';
import { Radii, Spacing, Typography, Shadows } from '../../../src/theme';
import { useTheme } from '../../../src/context/ThemeContext';

export default function NuevoObjeto() {
  const { id_contenedor } = useLocalSearchParams<{ id_contenedor: string }>();
  const db = useSQLiteContext();
  const { colors } = useTheme();

  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [fotos, setFotos] = useState<string[]>([]);
  const [etiquetasDisponibles, setEtiquetasDisponibles] = useState<Etiqueta[]>([]);
  const [etiquetasSeleccionadas, setEtiquetasSeleccionadas] = useState<Etiqueta[]>([]);
  const [imageViewerIndex, setImageViewerIndex] = useState<number | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [dbError, setDbError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function cargarEtiquetas() {
      try {
        const etiquetas = await getAllEtiquetas(db);
        setEtiquetasDisponibles(etiquetas);
      } catch {
        // No interrumpimos el formulario si fallan las etiquetas
      }
    }
    cargarEtiquetas();
  }, [db]);

  function clearError(key: string) {
    if (errors[key]) {
      setErrors((prev) => {
        const n = { ...prev };
        delete n[key];
        return n;
      });
    }
  }

  async function handleAgregarFoto() {
    try {
      const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!granted) {
        setDbError('Debes conceder permiso de acceso a la galería.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (result.canceled) return;
      const uri = result.assets[0].uri;
      const stored = await copyImageToStorage(uri);
      setFotos((prev) => [...prev, stored]);
      setDbError(null);
    } catch {
      setDbError('No se pudo procesar la foto.');
    }
  }

  async function handleEliminarFoto(index: number) {
    const foto = fotos[index];
    try {
      await deleteImageFromStorage(foto);
    } catch {
      // silencioso
    }
    setFotos((prev) => prev.filter((_, i) => i !== index));
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
      setDbError(null);
    } catch {
      setDbError('No se pudo crear la etiqueta.');
    }
  }

  async function handleGuardar() {
    const { valid, errors: ve } = validateFields({ nombre, descripcion });
    if (!valid) {
      setErrors(ve);
      return;
    }
    setErrors({});
    setSaving(true);
    setDbError(null);

    try {
      const objetoId = await insertObjeto(db, {
        nombre,
        descripcion,
        id_contenedor: Number(id_contenedor),
      });

      for (const fotoUri of fotos) {
        await insertFoto(db, objetoId, fotoUri);
      }

      await setEtiquetasObjeto(
        db,
        objetoId,
        etiquetasSeleccionadas.map((etiqueta) => etiqueta.id)
      );

      router.back();
    } catch {
      setDbError('No se pudo guardar el objeto.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: colors.bgBase }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Stack.Screen options={{ title: 'Nuevo Objeto' }} />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {dbError ? (
          <View style={[styles.errorBanner, { backgroundColor: colors.dangerMuted, borderLeftColor: colors.danger }]}> 
            <Ionicons name="warning-outline" size={14} color={colors.danger} />
            <Text style={[styles.errorBannerText, { color: colors.danger }]}>{dbError}</Text>
          </View>
        ) : null}

        <View style={[styles.heroCard, { backgroundColor: colors.bgSurface, borderColor: colors.borderSubtle }]}> 
          <Text style={[styles.heroTitle, { color: colors.textPrimary }]}>Agrega un nuevo objeto</Text>
          <Text style={[styles.heroSubtitle, { color: colors.textSecondary }]}>Guarda nombre, descripción, etiquetas y fotos para encontrarlo más rápido luego.</Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.bgSurface, borderColor: colors.borderSubtle }]}> 
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Nombre</Text>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: colors.bgElevated, color: colors.textPrimary, borderColor: errors.nombre ? colors.danger : colors.borderSubtle },
              ]}
              value={nombre}
              onChangeText={(t) => {
                setNombre(t);
                clearError('nombre');
              }}
              placeholder="Ej. Destornillador Phillips"
              placeholderTextColor={colors.textMuted}
              selectionColor={colors.accent}
              accessibilityLabel="Nombre del objeto"
            />
            {errors.nombre ? <Text style={[styles.fieldError, { color: colors.danger }]}>{errors.nombre}</Text> : null}
          </View>

          <View style={[styles.divider, { backgroundColor: colors.borderSubtle }]} />

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Descripción</Text>
            <TextInput
              style={[
                styles.textArea,
                { backgroundColor: colors.bgElevated, color: colors.textPrimary, borderColor: errors.descripcion ? colors.danger : colors.borderSubtle },
              ]}
              value={descripcion}
              onChangeText={(t) => {
                setDescripcion(t);
                clearError('descripcion');
              }}
              placeholder="Ej. Destornillador de cabeza Phillips #2"
              placeholderTextColor={colors.textMuted}
              selectionColor={colors.accent}
              multiline
              accessibilityLabel="Descripción del objeto"
            />
            {errors.descripcion ? <Text style={[styles.fieldError, { color: colors.danger }]}>{errors.descripcion}</Text> : null}
          </View>

          <View style={[styles.divider, { backgroundColor: colors.borderSubtle }]} />

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Etiquetas (opcional)</Text>
            <EtiquetaSelector
              etiquetas={etiquetasDisponibles}
              selectedIds={etiquetasSeleccionadas.map((etiqueta) => etiqueta.id)}
              onToggle={handleToggleEtiqueta}
              onCreate={handleCreateEtiqueta}
            />
          </View>

          <View style={[styles.divider, { backgroundColor: colors.borderSubtle }]} />

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Fotos (opcional)</Text>
            <FotoGaleria
              fotos={fotos}
              onAdd={handleAgregarFoto}
              onRemove={handleEliminarFoto}
              onPress={(idx) => setImageViewerIndex(idx)}
            />
          </View>
        </View>

        {imageViewerIndex !== null && fotos[imageViewerIndex] ? (
          <ImageViewer
            uri={fotos[imageViewerIndex]}
            visible={true}
            onClose={() => setImageViewerIndex(null)}
          />
        ) : null}

        <Pressable
          style={({ pressed }) => [
            styles.saveBtn,
            { backgroundColor: saving ? colors.bgMuted : pressed ? colors.accentDark : colors.accent },
          ]}
          onPress={handleGuardar}
          disabled={saving}
          accessibilityRole="button"
          accessibilityLabel="Guardar objeto"
          accessibilityState={{ disabled: saving }}
        >
          {saving ? (
            <ActivityIndicator color={colors.textOnAccent} />
          ) : (
            <Text style={[styles.saveBtnText, { color: colors.textOnAccent }]}>Guardar</Text>
          )}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { padding: Spacing.lg, paddingBottom: 80 },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    borderLeftWidth: 3,
    borderRadius: Radii.sm,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  errorBannerText: { fontSize: Typography.sm },
  heroCard: {
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
  card: {
    borderRadius: Radii.lg,
    borderWidth: 1,
    marginBottom: Spacing.xl,
    overflow: 'hidden',
    ...Shadows.sm,
  },
  field: { padding: Spacing.md },
  divider: { height: 1 },
  label: {
    fontSize: Typography.xs,
    fontWeight: Typography.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: Spacing.sm,
  },
  input: {
    fontSize: Typography.base,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radii.md,
    borderWidth: 1,
  },
  textArea: {
    fontSize: Typography.base,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    minHeight: 110,
    borderRadius: Radii.md,
    borderWidth: 1,
    textAlignVertical: 'top',
  },
  fieldError: { fontSize: Typography.xs, marginTop: Spacing.xs },
  saveBtn: {
    borderRadius: Radii.lg,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: Spacing.sm,
    marginBottom: Spacing.xl,
    marginHorizontal: Spacing.lg,
    ...Shadows.md,
  },
  saveBtnText: {
    fontSize: Typography.base,
    fontWeight: Typography.semibold,
    letterSpacing: 0.3,
  },
});
