import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSQLiteContext } from 'expo-sqlite';
import { insertContenedor } from '../../src/db/contenedorRepository';
import { validateFields } from '../../src/utils/validator';
import { Radii, Spacing, Typography } from '../../src/theme';
import { useTheme } from '../../src/context/ThemeContext';

export default function NuevoContenedor() {
  const db = useSQLiteContext();
  const { colors } = useTheme();

  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [ubicacion, setUbicacion] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [dbError, setDbError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function clearError(key: string) {
    if (errors[key]) {
      setErrors((prev) => { const n = { ...prev }; delete n[key]; return n; });
    }
  }

  async function handleGuardar() {
    const { valid, errors: ve } = validateFields({ nombre, descripcion, ubicacion });
    if (!valid) { setErrors(ve); return; }
    setSaving(true);
    setDbError(null);
    try {
      await insertContenedor(db, { nombre, descripcion, ubicacion });
      router.back();
    } catch {
      setDbError('No se pudo guardar el contenedor.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: colors.bgBase }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Stack.Screen options={{ title: 'Nuevo Contenedor' }} />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {dbError ? (
          <View style={[styles.errorBanner, { backgroundColor: colors.dangerMuted, borderLeftColor: colors.danger }]}>
            <Ionicons name="warning-outline" size={14} color={colors.danger} />
            <Text style={[styles.errorBannerText, { color: colors.danger }]}>{dbError}</Text>
          </View>
        ) : null}

        <View style={[styles.card, { backgroundColor: colors.bgSurface, borderColor: colors.borderSubtle }]}>
          {/* Nombre */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.textMuted }]}>Nombre</Text>
            <TextInput
              style={[
                styles.input,
                { color: colors.textPrimary, borderBottomColor: errors.nombre ? colors.danger : colors.bgMuted },
              ]}
              value={nombre}
              onChangeText={(t) => { setNombre(t); clearError('nombre'); }}
              placeholder="Ej. Caja de herramientas"
              placeholderTextColor={colors.textMuted}
              selectionColor={colors.accent}
              accessibilityLabel="Nombre del contenedor"
            />
            {errors.nombre ? <Text style={[styles.fieldError, { color: colors.danger }]}>{errors.nombre}</Text> : null}
          </View>

          <View style={[styles.divider, { backgroundColor: colors.borderSubtle }]} />

          {/* Descripción */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.textMuted }]}>Descripción</Text>
            <TextInput
              style={[
                styles.input,
                { color: colors.textPrimary, borderBottomColor: errors.descripcion ? colors.danger : colors.bgMuted },
              ]}
              value={descripcion}
              onChangeText={(t) => { setDescripcion(t); clearError('descripcion'); }}
              placeholder="Ej. Herramientas del taller"
              placeholderTextColor={colors.textMuted}
              selectionColor={colors.accent}
              multiline
              accessibilityLabel="Descripción del contenedor"
            />
            {errors.descripcion ? <Text style={[styles.fieldError, { color: colors.danger }]}>{errors.descripcion}</Text> : null}
          </View>

          <View style={[styles.divider, { backgroundColor: colors.borderSubtle }]} />

          {/* Ubicación */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.textMuted }]}>Ubicación</Text>
            <TextInput
              style={[
                styles.input,
                { color: colors.textPrimary, borderBottomColor: errors.ubicacion ? colors.danger : colors.bgMuted },
              ]}
              value={ubicacion}
              onChangeText={(t) => { setUbicacion(t); clearError('ubicacion'); }}
              placeholder="Ej. Garaje, estante 2"
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
          accessibilityState={{ disabled: saving }}
        >
          <Text style={[styles.saveBtnText, { color: colors.textOnAccent }]}>
            {saving ? 'Guardando…' : 'Guardar'}
          </Text>
        </Pressable>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
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
  fieldError: {
    fontSize: Typography.xs,
    marginTop: Spacing.xs,
  },
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
