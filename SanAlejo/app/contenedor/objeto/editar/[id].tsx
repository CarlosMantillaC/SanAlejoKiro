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
import { getObjetoById, updateObjeto } from '../../../../src/db/objetoRepository';
import { copyImageToStorage, deleteImageFromStorage } from '../../../../src/utils/imageStorage';
import { validateFields } from '../../../../src/utils/validator';
import { ImagePickerButton } from '../../../../src/components/ImagePickerButton';

export default function EditarObjeto() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const db = useSQLiteContext();

  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [fotoUri, setFotoUri] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [dbError, setDbError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function cargarObjeto() {
      try {
        const objeto = await getObjetoById(db, Number(id));
        if (objeto) {
          setNombre(objeto.nombre);
          setDescripcion(objeto.descripcion);
          setFotoUri(objeto.foto_uri);
        }
      } catch {
        setDbError('No se pudo cargar el objeto.');
      } finally {
        setLoading(false);
      }
    }

    cargarObjeto();
  }, [id]);

  async function handleImageSelected(uri: string) {
    // Si había una foto anterior, eliminarla silenciosamente
    if (fotoUri !== null) {
      try {
        await deleteImageFromStorage(fotoUri);
      } catch {
        // Error silencioso: continuar aunque no se pueda eliminar la foto anterior
      }
    }

    try {
      const storedUri = await copyImageToStorage(uri);
      setFotoUri(storedUri);
    } catch {
      setDbError('No se pudo procesar la foto. El objeto se guardará sin imagen.');
    }
  }

  function handlePermissionDenied() {
    setDbError(
      'Debes conceder permiso de acceso a la galería o cámara en la configuración del dispositivo.'
    );
  }

  async function handleGuardar() {
    const { valid, errors: validationErrors } = validateFields({
      nombre,
      descripcion,
    });

    if (!valid) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setSaving(true);
    setDbError(null);

    try {
      await updateObjeto(db, Number(id), {
        nombre,
        descripcion,
        foto_uri: fotoUri,
      });
      router.back();
    } catch {
      setDbError('No se pudo guardar el objeto.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <Stack.Screen options={{ title: 'Editar Objeto' }} />
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Stack.Screen options={{ title: 'Editar Objeto' }} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {dbError ? (
          <View style={styles.dbErrorContainer}>
            <Text style={styles.dbErrorText}>{dbError}</Text>
          </View>
        ) : null}

        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Nombre</Text>
          <TextInput
            style={[styles.input, errors.nombre ? styles.inputError : null]}
            value={nombre}
            onChangeText={(text) => {
              setNombre(text);
              if (errors.nombre) {
                setErrors((prev) => {
                  const next = { ...prev };
                  delete next.nombre;
                  return next;
                });
              }
            }}
            placeholder="Ej. Destornillador Phillips"
            placeholderTextColor="#AAAAAA"
            accessibilityLabel="Nombre del objeto"
          />
          {errors.nombre ? (
            <Text style={styles.fieldError}>{errors.nombre}</Text>
          ) : null}
        </View>

        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Descripción</Text>
          <TextInput
            style={[styles.input, errors.descripcion ? styles.inputError : null]}
            value={descripcion}
            onChangeText={(text) => {
              setDescripcion(text);
              if (errors.descripcion) {
                setErrors((prev) => {
                  const next = { ...prev };
                  delete next.descripcion;
                  return next;
                });
              }
            }}
            placeholder="Ej. Destornillador de cabeza Phillips #2"
            placeholderTextColor="#AAAAAA"
            multiline
            numberOfLines={3}
            accessibilityLabel="Descripción del objeto"
          />
          {errors.descripcion ? (
            <Text style={styles.fieldError}>{errors.descripcion}</Text>
          ) : null}
        </View>

        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Foto</Text>
          <ImagePickerButton
            currentUri={fotoUri}
            onImageSelected={handleImageSelected}
            onPermissionDenied={handlePermissionDenied}
          />
        </View>

        <TouchableOpacity
          style={[styles.button, saving ? styles.buttonDisabled : null]}
          onPress={handleGuardar}
          disabled={saving}
          accessibilityRole="button"
          accessibilityLabel="Guardar objeto"
          accessibilityState={{ disabled: saving }}
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
    backgroundColor: '#F2F2F7',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  dbErrorContainer: {
    backgroundColor: '#FFE5E5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  dbErrorText: {
    color: '#CC0000',
    fontSize: 14,
    textAlign: 'center',
  },
  fieldContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CCCCCC',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#111111',
  },
  inputError: {
    borderColor: '#CC0000',
  },
  fieldError: {
    color: '#CC0000',
    fontSize: 12,
    marginTop: 4,
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    backgroundColor: '#A0C4FF',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
