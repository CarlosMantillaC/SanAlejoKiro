import * as ImagePicker from 'expo-image-picker';
import { Image, Pressable, Text, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Radii, Spacing, Typography } from '../theme';
import { useTheme } from '../context/ThemeContext';

interface ImagePickerButtonProps {
  currentUri: string | null;
  onImageSelected: (uri: string) => void;
  onPermissionDenied: () => void;
}

export function ImagePickerButton({ currentUri, onImageSelected, onPermissionDenied }: ImagePickerButtonProps) {
  const { colors } = useTheme();

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
          style={[styles.preview, { borderColor: colors.borderSubtle }]}
          accessibilityLabel="Vista previa de la foto del objeto"
        />
      ) : (
        <View
          style={[
            styles.placeholder,
            { backgroundColor: colors.bgMuted, borderColor: colors.borderSubtle },
          ]}
        >
          <Ionicons name="camera-outline" size={28} color={colors.textMuted} />
          <Text style={[styles.placeholderText, { color: colors.textMuted }]}>Sin foto</Text>
        </View>
      )}

      <View style={styles.btnRow}>
        <Pressable
          style={({ pressed }) => [
            styles.btn,
            { borderColor: colors.accent },
            pressed && { backgroundColor: colors.accentMuted },
          ]}
          onPress={handleCamera}
          accessibilityRole="button"
          accessibilityLabel="Tomar foto del objeto"
        >
          <Ionicons name="camera-outline" size={16} color={colors.accentLight} />
          <Text style={[styles.btnText, { color: colors.accentLight }]}>Cámara</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [
            styles.btn,
            { borderColor: colors.accent },
            pressed && { backgroundColor: colors.accentMuted },
          ]}
          onPress={handleGallery}
          accessibilityRole="button"
          accessibilityLabel="Seleccionar foto de galería"
        >
          <Ionicons name="images-outline" size={16} color={colors.accentLight} />
          <Text style={[styles.btnText, { color: colors.accentLight }]}>
            {currentUri ? 'Cambiar' : 'Galería'}
          </Text>
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
  },
  placeholder: {
    width: 120,
    height: 120,
    borderRadius: Radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  placeholderText: { fontSize: Typography.xs },
  btnRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  btn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Radii.md,
    borderWidth: 1,
  },
  btnText: {
    fontSize: Typography.sm,
    fontWeight: Typography.medium,
  },
});
