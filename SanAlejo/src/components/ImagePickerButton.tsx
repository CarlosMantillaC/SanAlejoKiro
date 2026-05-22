import * as ImagePicker from 'expo-image-picker';
import { Image, Pressable, Text, View, StyleSheet } from 'react-native';
import { Colors, Radii, Spacing, Typography } from '../theme';

interface ImagePickerButtonProps {
  currentUri: string | null;
  onImageSelected: (uri: string) => void;
  onPermissionDenied: () => void;
}

export function ImagePickerButton({ currentUri, onImageSelected, onPermissionDenied }: ImagePickerButtonProps) {
  async function handleCamera() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') { onPermissionDenied(); return; }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets.length > 0) onImageSelected(result.assets[0].uri);
  }

  async function handleGallery() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { onPermissionDenied(); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets.length > 0) onImageSelected(result.assets[0].uri);
  }

  return (
    <View style={styles.container}>
      {currentUri ? (
        <Image
          source={{ uri: currentUri }}
          style={styles.preview}
          accessibilityLabel="Vista previa de la foto del objeto"
        />
      ) : (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderIcon}>📷</Text>
          <Text style={styles.placeholderText}>Sin foto</Text>
        </View>
      )}

      <View style={styles.btnRow}>
        <Pressable
          style={({ pressed }) => [styles.btn, pressed && styles.btnPressed]}
          onPress={handleCamera}
          accessibilityRole="button"
          accessibilityLabel="Tomar foto del objeto"
        >
          <Text style={styles.btnText}>📷  Cámara</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.btn, pressed && styles.btnPressed]}
          onPress={handleGallery}
          accessibilityRole="button"
          accessibilityLabel="Seleccionar foto de galería"
        >
          <Text style={styles.btnText}>{currentUri ? '🖼  Cambiar' : '🖼  Galería'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.md,
  },
  preview: {
    width: 120,
    height: 120,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  placeholder: {
    width: 120,
    height: 120,
    borderRadius: Radii.md,
    backgroundColor: Colors.bgMuted,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    borderStyle: 'dashed',
  },
  placeholderIcon: { fontSize: 28 },
  placeholderText: { fontSize: Typography.xs, color: Colors.textMuted },
  btnRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  btn: {
    flex: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.accent,
    alignItems: 'center',
  },
  btnPressed: {
    backgroundColor: Colors.accentMuted,
  },
  btnText: {
    fontSize: Typography.sm,
    color: Colors.accentLight,
    fontWeight: Typography.medium,
  },
});
