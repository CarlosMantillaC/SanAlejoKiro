import React, { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Image, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Radii, Spacing, Typography } from '../theme';
import { useTheme } from '../context/ThemeContext';

interface ImageViewerProps {
  uri: string;
  visible: boolean;
  onClose: () => void;
}

export function ImageViewer({ uri, visible, onClose }: ImageViewerProps) {
  const { colors } = useTheme();
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    if (visible) {
      setLoadFailed(false);
    }
  }, [uri, visible]);

  if (!visible) {
    return null;
  }

  const content = loadFailed ? (
    <View style={styles.errorState}>
      <Ionicons name="alert-circle-outline" size={48} color={colors.textMuted} />
      <Text style={[styles.errorText, { color: colors.textPrimary }]}>No se pudo cargar la imagen</Text>
    </View>
  ) : (
    <Image
      source={{ uri }}
      style={styles.image}
      resizeMode="contain"
      accessibilityLabel="Vista ampliada de la imagen"
      onError={() => setLoadFailed(true)}
    />
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable
        testID="image-viewer-overlay"
        style={[styles.overlay, { backgroundColor: colors.overlay }]}
        onPress={onClose}
      >
        <View
          style={styles.content}
          accessibilityRole="image"
          pointerEvents="box-none"
        >
          <Pressable
            style={({ pressed }) => [
              styles.closeButton,
              { backgroundColor: pressed ? colors.accentDark : colors.accent },
              { borderColor: colors.borderSubtle },
            ]}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Cerrar visor de imagen"
          >
            <Ionicons name="close" size={22} color={colors.textOnAccent} />
          </Pressable>

          <Pressable testID="image-viewer-content" style={styles.imageWrap} onPress={() => {}}>
            {content}
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  content: {
    width: '100%',
    maxWidth: 900,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
    zIndex: 2,
    width: 44,
    height: 44,
    borderRadius: Radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  imageWrap: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  errorState: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  errorText: {
    fontSize: Typography.md,
    fontWeight: Typography.semibold,
    textAlign: 'center',
  },
});