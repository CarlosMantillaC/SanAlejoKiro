import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
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
import { getObjetoById, updateObjeto } from '../../../../src/db/objetoRepository';
import { copyImageToStorage, deleteImageFromStorage } from '../../../../src/utils/imageStorage';
import { validateFields } from '../../../../src/utils/validator';
import { ImagePickerButton } from '../../../../src/components/ImagePickerButton';
import { Radii, Spacing, Typography } from '../../../../src/theme';
import { useTheme } from '../../../../src/context/ThemeContext';

export default function EditarObjeto() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const db = useSQLiteContext();
  const { colors } = useTheme();

  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [fotoUri, setFotoUri] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [dbError, setDbError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  function clearError(key: string) {
    if (errors[key]) {
      setErrors((prev) => { const n = { ...prev }; delete n[key]; return n; });
    }
  }

  useEffect(() => {
    async function cargar() {
      try {
        const obj = await getObjetoById(db, Number(id));
        if (obj) { setNombre(obj.nombre); setDescripcion(obj.descripcion); setFotoUri(obj.foto_uri); }
      } catch {
        setDbError('No se pudo cargar el objeto.');
      } finally {
        setLoading(false);
      }
    }
    cargar();
  }, [id]);

  async function handleImageSelected(uri: string) {
    if (fotoUri !== null) {
      try { await deleteImageFromStorage(fotoUri); } catch { /* silencioso */ }
    }
    try {
      const stored = await copyImageToStorage(uri);
      setFotoUri(stored);
    } catch {
      setDbError('No se pudo procesar la foto. El objeto se guardará sin imagen.');
    }
  }

  function handlePermissionDenied() {
    setDbError('Debes conceder permiso de acceso a la galería o cámara en la configuración del dispositivo.');
  }

  async function handleGuardar() {
    const { valid, errors: ve } = validateFields({ nombre, descripcion });
    if (!valid) { setErrors(ve); return; }
    setErrors({});
    setSaving(true);
    setDbError(null);
    try {
      await updateObjeto(db, Number(id), { nombre, descripcion, foto_uri: fotoUri });
      router.back();
    } catch {
      setDbError('No se pudo guardar el objeto.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.bgBase }]}>
        <Stack.Screen options={{ title: 'Editar Objeto' }} />
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: colors.bgBase }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Stack.Screen options={{ title: 'Editar Objeto' }} />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {dbError ? (
          <View style={[styles.errorBanner, { backgroundColor: colors.dangerMuted, borderLeftColor: colors.danger }]}>
            <Ionicons name="warning-outline" size={14} color={colors.danger} />
            <Text style={[styles.errorBannerText, { color: colors.danger }]}>{dbError}</Text>
          </View>
        ) : null}

        <View style={[styles.card, { backgroundColor: colors.bgSurface, borderColor: colors.borderSubtle }]}>
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.textMuted }]}>Nombre</Text>
            <TextInput
              style={[
                styles.input,
                { color: colors.textPrimary, borderBottomColor: errors.nombre ? colors.danger : colors.bgMuted },
              ]}
              value={nombre}
              onChangeText={(t) => { setNombre(t); clearError('nombre'); }}
              placeholder="Ej. Destornillador Phillips"
              placeholderTextColor={colors.textMuted}
              selectionColor={colors.accent}
              accessibilityLabel="Nombre del objeto"
            />
            {errors.nombre ? <Text style={[styles.fieldError, { color: colors.danger }]}>{errors.nombre}</Text> : null}
          </View>

          <View style={[styles.divider, { backgroundColor: colors.borderSubtle }]} />

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.textMuted }]}>Descripción</Text>
            <TextInput
              style={[
                styles.input,
                { color: colors.textPrimary, borderBottomColor: errors.descripcion ? colors.danger : colors.bgMuted },
              ]}
              value={descripcion}
              onChangeText={(t) => { setDescripcion(t); clearError('descripcion'); }}
              placeholder="Ej. Destornillador de cabeza Phillips #2"
              placeholderTextColor={colors.textMuted}
              selectionColor={colors.accent}
              multiline
              numberOfLines={3}
              accessibilityLabel="Descripción del objeto"
            />
            {errors.descripcion ? <Text style={[styles.fieldError, { color: colors.danger }]}>{errors.descripcion}</Text> : null}
          </View>

          <View style={[styles.divider, { backgroundColor: colors.borderSubtle }]} />

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.textMuted }]}>Foto (opcional)</Text>
            <ImagePickerButton
              currentUri={fotoUri}
              onImageSelected={handleImageSelected}
              onPermissionDenied={handlePermissionDenied}
            />
          </View>
        </View>

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
          {saving
            ? <ActivityIndicator color={colors.textOnAccent} />
            : <Text style={[styles.saveBtnText, { color: colors.textOnAccent }]}>Guardar cambios</Text>
          }
        </Pressable>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { padding: Spacing.lg, paddingBottom: 48 },
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
  card: {
    borderRadius: Radii.lg,
    borderWidth: 1,
    marginBottom: Spacing.xl,
    overflow: 'hidden',
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
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
  },
  fieldError: { fontSize: Typography.xs, marginTop: Spacing.xs },
  saveBtn: {
    borderRadius: Radii.lg,
    paddingVertical: 15,
    alignItems: 'center',
  },
  saveBtnText: {
    fontSize: Typography.base,
    fontWeight: Typography.semibold,
  },
});
