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
import { useSQLiteContext } from 'expo-sqlite';
import { getContenedorById, updateContenedor } from '../../../src/db/contenedorRepository';
import { validateFields } from '../../../src/utils/validator';
import { Colors, Radii, Spacing, Typography } from '../../../src/theme';

export default function EditarContenedor() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const db = useSQLiteContext();

  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [ubicacion, setUbicacion] = useState('');
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
        const c = await getContenedorById(db, Number(id));
        if (c) { setNombre(c.nombre); setDescripcion(c.descripcion); setUbicacion(c.ubicacion); }
      } catch {
        setDbError('No se pudo cargar el contenedor.');
      } finally {
        setLoading(false);
      }
    }
    cargar();
  }, [id]);

  async function handleGuardar() {
    const { valid, errors: ve } = validateFields({ nombre, descripcion, ubicacion });
    if (!valid) { setErrors(ve); return; }
    setErrors({});
    setSaving(true);
    setDbError(null);
    try {
      await updateContenedor(db, Number(id), { nombre, descripcion, ubicacion });
      router.back();
    } catch {
      setDbError('No se pudo guardar el contenedor.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <Stack.Screen options={{ title: 'Editar Contenedor' }} />
        <ActivityIndicator size="large" color={Colors.accent} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <Stack.Screen options={{ title: 'Editar Contenedor' }} />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {dbError ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>⚠️  {dbError}</Text>
          </View>
        ) : null}

        <View style={styles.card}>
          <View style={styles.field}>
            <Text style={styles.label}>Nombre</Text>
            <TextInput
              style={[styles.input, errors.nombre ? styles.inputError : null]}
              value={nombre}
              onChangeText={(t) => { setNombre(t); clearError('nombre'); }}
              placeholder="Nombre del contenedor"
              placeholderTextColor={Colors.textMuted}
              selectionColor={Colors.accent}
              accessibilityLabel="Nombre del contenedor"
            />
            {errors.nombre ? <Text style={styles.fieldError}>{errors.nombre}</Text> : null}
          </View>

          <View style={styles.divider} />

          <View style={styles.field}>
            <Text style={styles.label}>Descripción</Text>
            <TextInput
              style={[styles.input, styles.inputMultiline, errors.descripcion ? styles.inputError : null]}
              value={descripcion}
              onChangeText={(t) => { setDescripcion(t); clearError('descripcion'); }}
              placeholder="Descripción del contenedor"
              placeholderTextColor={Colors.textMuted}
              selectionColor={Colors.accent}
              multiline
              accessibilityLabel="Descripción del contenedor"
            />
            {errors.descripcion ? <Text style={styles.fieldError}>{errors.descripcion}</Text> : null}
          </View>

          <View style={styles.divider} />

          <View style={styles.field}>
            <Text style={styles.label}>Ubicación</Text>
            <TextInput
              style={[styles.input, errors.ubicacion ? styles.inputError : null]}
              value={ubicacion}
              onChangeText={(t) => { setUbicacion(t); clearError('ubicacion'); }}
              placeholder="Ubicación del contenedor"
              placeholderTextColor={Colors.textMuted}
              selectionColor={Colors.accent}
              accessibilityLabel="Ubicación del contenedor"
            />
            {errors.ubicacion ? <Text style={styles.fieldError}>{errors.ubicacion}</Text> : null}
          </View>
        </View>

        <Pressable
          style={({ pressed }) => [styles.saveBtn, saving && styles.saveBtnDisabled, pressed && styles.saveBtnPressed]}
          onPress={handleGuardar}
          disabled={saving}
          accessibilityRole="button"
          accessibilityLabel="Guardar contenedor"
        >
          {saving
            ? <ActivityIndicator color={Colors.textOnAccent} />
            : <Text style={styles.saveBtnText}>Guardar cambios</Text>
          }
        </Pressable>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.bgBase },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.bgBase },
  scroll: { padding: Spacing.lg, paddingBottom: 48 },
  errorBanner: {
    backgroundColor: Colors.dangerMuted,
    borderLeftWidth: 3,
    borderLeftColor: Colors.danger,
    borderRadius: Radii.sm,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  errorBannerText: { color: Colors.danger, fontSize: Typography.sm },
  card: {
    backgroundColor: Colors.bgSurface,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    marginBottom: Spacing.xl,
    overflow: 'hidden',
  },
  field: { padding: Spacing.md },
  divider: { height: 1, backgroundColor: Colors.borderSubtle },
  label: {
    fontSize: Typography.xs,
    fontWeight: Typography.semibold,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: Spacing.sm,
  },
  input: {
    fontSize: Typography.base,
    color: Colors.textPrimary,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.bgMuted,
  },
  inputMultiline: {
    minHeight: 72,
    textAlignVertical: 'top',
  },
  inputError: { borderBottomColor: Colors.danger },
  fieldError: { color: Colors.danger, fontSize: Typography.xs, marginTop: Spacing.xs },
  saveBtn: {
    backgroundColor: Colors.accent,
    borderRadius: Radii.lg,
    paddingVertical: 15,
    alignItems: 'center',
  },
  saveBtnDisabled: { backgroundColor: Colors.bgMuted },
  saveBtnPressed: { backgroundColor: Colors.accentDark },
  saveBtnText: {
    color: Colors.textOnAccent,
    fontSize: Typography.base,
    fontWeight: Typography.semibold,
  },
});
