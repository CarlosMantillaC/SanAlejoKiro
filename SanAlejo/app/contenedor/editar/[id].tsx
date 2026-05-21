import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { getContenedorById, updateContenedor } from '../../../src/db/contenedorRepository';
import { validateFields } from '../../../src/utils/validator';

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

  useEffect(() => {
    async function cargarContenedor() {
      try {
        const contenedor = await getContenedorById(db, Number(id));
        if (contenedor) {
          setNombre(contenedor.nombre);
          setDescripcion(contenedor.descripcion);
          setUbicacion(contenedor.ubicacion);
        }
      } catch (e) {
        setDbError('No se pudo cargar el contenedor.');
      } finally {
        setLoading(false);
      }
    }

    cargarContenedor();
  }, [id]);

  async function handleGuardar() {
    const { valid, errors: validationErrors } = validateFields({
      nombre,
      descripcion,
      ubicacion,
    });

    if (!valid) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setSaving(true);
    setDbError(null);

    try {
      await updateContenedor(db, Number(id), { nombre, descripcion, ubicacion });
      router.back();
    } catch (e) {
      setDbError('No se pudo guardar el contenedor.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <Stack.Screen options={{ title: 'Editar Contenedor' }} />
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Stack.Screen options={{ title: 'Editar Contenedor' }} />
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>Nombre</Text>
        <TextInput
          style={[styles.input, errors.nombre ? styles.inputError : null]}
          value={nombre}
          onChangeText={setNombre}
          placeholder="Nombre del contenedor"
          accessibilityLabel="Nombre del contenedor"
        />
        {errors.nombre ? <Text style={styles.errorText}>{errors.nombre}</Text> : null}

        <Text style={styles.label}>Descripción</Text>
        <TextInput
          style={[styles.input, errors.descripcion ? styles.inputError : null]}
          value={descripcion}
          onChangeText={setDescripcion}
          placeholder="Descripción del contenedor"
          accessibilityLabel="Descripción del contenedor"
          multiline
        />
        {errors.descripcion ? <Text style={styles.errorText}>{errors.descripcion}</Text> : null}

        <Text style={styles.label}>Ubicación</Text>
        <TextInput
          style={[styles.input, errors.ubicacion ? styles.inputError : null]}
          value={ubicacion}
          onChangeText={setUbicacion}
          placeholder="Ubicación del contenedor"
          accessibilityLabel="Ubicación del contenedor"
        />
        {errors.ubicacion ? <Text style={styles.errorText}>{errors.ubicacion}</Text> : null}

        {dbError ? <Text style={styles.dbErrorText}>{dbError}</Text> : null}

        <TouchableOpacity
          style={[styles.button, saving ? styles.buttonDisabled : null]}
          onPress={handleGuardar}
          disabled={saving}
          accessibilityRole="button"
          accessibilityLabel="Guardar contenedor"
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Guardar</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    padding: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    marginBottom: 4,
    backgroundColor: '#fff',
  },
  inputError: {
    borderColor: '#e53e3e',
  },
  errorText: {
    color: '#e53e3e',
    fontSize: 12,
    marginBottom: 8,
  },
  dbErrorText: {
    color: '#e53e3e',
    fontSize: 14,
    marginBottom: 12,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#2b6cb0',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonDisabled: {
    backgroundColor: '#90cdf4',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
