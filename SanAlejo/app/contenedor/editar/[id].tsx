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
import { getContenedorById, updateContenedor } from '../../../src/db/contenedorRepository';
import { validateFields } from '../../../src/utils/validator';
import { Radii, Spacing, Typography } from '../../../src/theme';
import { useTheme } from '../../../src/context/ThemeContext';

export default function EditarContenedor() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const db = useSQLiteContext();
  const { colors } = useTheme();

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
      <View style={[styles.centered, { backgroundColor: colors.bgBase }]}>
        <Stack.Screen options={{ title: 'Editar Contenedor' }} />
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: colors.bgBase }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Stack.Screen options={{ title: 'Editar Contenedor' }} />
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
              placeholder="Nombre del contenedor"
              placeholderTextColor={colors.textMuted}
              selectionColor={colors.accent}
              accessibilityLabel="Nombre del contenedor"
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
              placeholder="Descripción del contenedor"
              placeholderTextColor={colors.textMuted}
              selectionColor={colors.accent}
              multiline
              accessibilityLabel="Descripción del contenedor"
            />
            {errors.descripcion ? <Text style={[styles.fieldError, { color: colors.danger }]}>{errors.descripcion}</Text> : null}
          </View>

          <View style={[styles.divider, { backgroundColor: colors.borderSubtle }]} />

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.textMuted }]}>Ubicación</Text>
            <TextInput
              style={[
                styles.input,
                { color: colors.textPrimary, borderBottomColor: errors.ubicacion ? colors.danger : colors.bgMuted },
              ]}
              value={ubicacion}
              onChangeText={(t) => { setUbicacion(t); clearError('ubicacion'); }}
              placeholder="Ubicación del contenedor"
              placeholderTextColor={colors.textMuted}
              selectionColor={colors.accent}
              accessibilityLabel="Ubicación del contenedor"
            />
            {errors.ubicacion ? <Text style={[styles.fieldError, { color: colors.danger }]}>{errors.ubicacion}</Text> : null}
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
          accessibilityLabel="Guardar contenedor"
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
