import * as ImagePicker from 'expo-image-picker';
import { Image, Pressable, Text, View, StyleSheet } from 'react-native';

interface ImagePickerButtonProps {
  currentUri: string | null;
  onImageSelected: (uri: string) => void;
  onPermissionDenied: () => void;
}

export function ImagePickerButton({
  currentUri,
  onImageSelected,
  onPermissionDenied,
}: ImagePickerButtonProps) {
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
      onImageSelected(result.assets[0].uri);
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
      onImageSelected(result.assets[0].uri);
    }
  }

  return (
    <View>
      {currentUri ? (
        <Image
          source={{ uri: currentUri }}
          style={styles.preview}
          accessibilityLabel="Vista previa de la foto del objeto"
        />
      ) : null}
      <Pressable
        onPress={handleCamera}
        accessibilityRole="button"
        accessibilityLabel="Tomar foto del objeto"
      >
        <Text>Tomar foto</Text>
      </Pressable>
      <Pressable
        onPress={handleGallery}
        accessibilityRole="button"
        accessibilityLabel="Seleccionar foto de galería"
      >
        <Text>{currentUri ? 'Cambiar foto' : 'Seleccionar de galería'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  preview: { width: 120, height: 120, borderRadius: 8, marginBottom: 8 },
});
