import React from 'react';
import {
  View,
  Image,
  Pressable,
  Text,
  ScrollView,
  Alert,
  StyleSheet,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { Radii, Spacing, Typography } from '../theme';
import { useTheme } from '../context/ThemeContext';
import { copyImageToStorage } from '../utils/imageStorage';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FotoLocal {
  /** null para fotos nuevas aún no persistidas */
  id: number | null;
  uri: string;
  /** true si fue copiada en esta sesión (candidata a limpieza si se cancela) */
  isNew: boolean;
}

interface GaleriaEditorProps {
  fotos: FotoLocal[];
  onFotosChange: (fotos: FotoLocal[]) => void;
  onPermissionDenied: () => void;
  onError: (msg: string) => void;
  /** Called when the user taps a thumbnail to view it full-screen */
  onPressFoto?: (index: number) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function GaleriaEditor({
  fotos,
  onFotosChange,
  onPermissionDenied,
  onError,
  onPressFoto,
}: GaleriaEditorProps) {
  const { colors } = useTheme();

  // ── Handlers ──────────────────────────────────────────────────────────────

  async function handleImageSelected(uri: string) {
    try {
      const storedUri = await copyImageToStorage(uri);
      const newFoto: FotoLocal = { id: null, uri: storedUri, isNew: true };
      onFotosChange([...fotos, newFoto]);
    } catch {
      onError('No se pudo procesar la foto.');
    }
  }

  async function handleCamera() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      onPermissionDenied();
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets.length > 0) {
      await handleImageSelected(result.assets[0].uri);
    }
  }

  async function handleGallery() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      onPermissionDenied();
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets.length > 0) {
      await handleImageSelected(result.assets[0].uri);
    }
  }

  function handleAgregarFoto() {
    Alert.alert('Agregar foto', '¿Desde dónde quieres agregar la foto?', [
      {
        text: 'Cámara',
        onPress: handleCamera,
      },
      {
        text: 'Galería',
        onPress: handleGallery,
      },
      {
        text: 'Cancelar',
        style: 'cancel',
      },
    ]);
  }

  function handleEliminar(index: number) {
    Alert.alert(
      'Eliminar foto',
      '¿Estás seguro de que quieres eliminar esta foto?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => onFotosChange(fotos.filter((_, i) => i !== index)),
        },
      ]
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        accessibilityRole="scrollbar"
        accessibilityLabel="Galería de fotos"
      >
        {fotos.map((foto, index) => (
          <View key={`${foto.id ?? 'new'}-${index}`} style={styles.thumbnailWrapper}>
            {onPressFoto ? (
              <Pressable
                onPress={() => onPressFoto(index)}
                accessibilityRole="button"
                accessibilityLabel={`Ver foto ${index + 1} de ${fotos.length}`}
              >
                <Image
                  source={{ uri: foto.uri }}
                  style={[styles.thumbnail, { borderColor: colors.borderSubtle }]}
                  accessibilityLabel={`Foto ${index + 1} de ${fotos.length}`}
                />
              </Pressable>
            ) : (
              <Image
                source={{ uri: foto.uri }}
                style={[styles.thumbnail, { borderColor: colors.borderSubtle }]}
                accessibilityLabel={`Foto ${index + 1} de ${fotos.length}`}
              />
            )}
            <Pressable
              style={({ pressed }) => [
                styles.deleteBtn,
                {
                  backgroundColor: pressed ? colors.dangerDark : colors.danger,
                },
              ]}
              onPress={() => handleEliminar(index)}
              accessibilityRole="button"
              accessibilityLabel={`Eliminar foto ${index + 1}`}
            >
              <Ionicons name="trash-outline" size={14} color={colors.textOnDanger} />
            </Pressable>
          </View>
        ))}

        {/* Botón Agregar foto al final del scroll */}
        <Pressable
          style={({ pressed }) => [
            styles.addBtn,
            {
              backgroundColor: pressed ? colors.accentMuted : colors.bgMuted,
              borderColor: colors.accent,
            },
          ]}
          onPress={handleAgregarFoto}
          accessibilityRole="button"
          accessibilityLabel="Agregar foto"
        >
          <Ionicons name="add-outline" size={24} color={colors.accentLight} />
          <Text style={[styles.addBtnText, { color: colors.accentLight }]}>
            Agregar foto
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    gap: Spacing.sm,
  },
  scrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xs,
  },
  thumbnailWrapper: {
    position: 'relative',
    paddingTop: 10,
    paddingRight: 10,
  },
  thumbnail: {
    width: 88,
    height: 88,
    borderRadius: Radii.md,
    borderWidth: 1,
  },
  deleteBtn: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 30,
    height: 30,
    borderRadius: Radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtn: {
    width: 88,
    height: 88,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
  },
  addBtnText: {
    fontSize: Typography.xs,
    fontWeight: Typography.medium,
    textAlign: 'center',
  },
});
