import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Animated, Image, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
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
  const [isZoomed, setIsZoomed] = useState(false);

  const currentScaleRef = useRef(1);
  const scale = useRef(new Animated.Value(1)).current;
  const pan = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const dragState = useRef({
    active: false,
    startX: 0,
    startY: 0,
    baseX: 0,
    baseY: 0,
  }).current;

  useEffect(() => {
    if (visible) {
      setLoadFailed(false);
      setIsZoomed(false);
      currentScaleRef.current = 1;
      scale.setValue(1);
      pan.setOffset({ x: 0, y: 0 });
      pan.setValue({ x: 0, y: 0 });
    }
  }, [pan, scale, uri, visible]);

  function resetPan() {
    pan.setValue({ x: 0, y: 0 });
  }

  function commitScale(nextScale: number) {
    const clamped = Math.min(4, Math.max(1, nextScale));
    currentScaleRef.current = clamped;
    scale.setValue(clamped);
    setIsZoomed(clamped > 1);
    if (clamped === 1) {
      resetPan();
    }
  }

  function zoomIn() {
    commitScale(currentScaleRef.current + 0.5);
  }

  function zoomOut() {
    commitScale(currentScaleRef.current - 0.5);
  }

  function resetZoom() {
    commitScale(1);
  }

  function handleTouchStart(event: any) {
    if (currentScaleRef.current <= 1 || loadFailed) {
      return;
    }

    const touch = event.nativeEvent.touches?.[0];
    if (!touch || event.nativeEvent.touches.length !== 1) {
      return;
    }

    dragState.active = true;
    dragState.startX = touch.pageX;
    dragState.startY = touch.pageY;
    dragState.baseX = (pan.x as any).__getValue?.() ?? 0;
    dragState.baseY = (pan.y as any).__getValue?.() ?? 0;
  }

  function handleTouchMove(event: any) {
    if (!dragState.active) {
      return;
    }

    const touch = event.nativeEvent.touches?.[0];
    if (!touch || event.nativeEvent.touches.length !== 1) {
      return;
    }

    const nextX = dragState.baseX + (touch.pageX - dragState.startX);
    const nextY = dragState.baseY + (touch.pageY - dragState.startY);
    pan.setValue({ x: nextX, y: nextY });
  }

  function handleTouchEnd() {
    dragState.active = false;
  }

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
      <View testID="image-viewer-overlay" style={[styles.overlay, { backgroundColor: colors.overlay }]}> 
        <Pressable
          testID="image-viewer-close-overlay"
          style={StyleSheet.absoluteFill}
          onPress={onClose}
        />
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

          <View testID="image-viewer-content" style={styles.imageWrap} pointerEvents="box-none">
            {loadFailed ? (
              content
            ) : (
                <Animated.View
                testID="image-viewer-draggable-image"
                style={[
                  styles.zoomStage,
                  {
                    transform: [
                      { translateX: pan.x },
                      { translateY: pan.y },
                      { scale },
                    ],
                  },
                ]}
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                  onTouchCancel={handleTouchEnd}
              >
                {content}
              </Animated.View>
            )}

            {!loadFailed ? (
              <View style={styles.zoomControls} pointerEvents="box-none">
                <Pressable
                  style={({ pressed }) => [
                    styles.zoomButton,
                    { backgroundColor: pressed ? colors.accentDark : colors.accent, borderColor: colors.borderSubtle },
                  ]}
                  onPress={zoomOut}
                  accessibilityRole="button"
                  accessibilityLabel="Reducir zoom"
                >
                  <Ionicons name="remove" size={18} color={colors.textOnAccent} />
                </Pressable>
                <Pressable
                  style={({ pressed }) => [
                    styles.zoomButton,
                    { backgroundColor: pressed ? colors.accentDark : colors.accent, borderColor: colors.borderSubtle },
                  ]}
                  onPress={resetZoom}
                  accessibilityRole="button"
                  accessibilityLabel="Restablecer zoom"
                >
                  <Text style={[styles.zoomButtonText, { color: colors.textOnAccent }]}>1x</Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [
                    styles.zoomButton,
                    { backgroundColor: pressed ? colors.accentDark : colors.accent, borderColor: colors.borderSubtle },
                  ]}
                  onPress={zoomIn}
                  accessibilityRole="button"
                  accessibilityLabel="Aumentar zoom"
                >
                  <Ionicons name="add" size={18} color={colors.textOnAccent} />
                </Pressable>
              </View>
            ) : null}
          </View>
        </View>
        </View>
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
  zoomHintWrap: {
    position: 'absolute',
    bottom: Spacing.lg,
    left: Spacing.lg,
    right: Spacing.lg,
    alignItems: 'center',
  },
  zoomHint: {
    fontSize: Typography.xs,
    fontWeight: Typography.medium,
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.32)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radii.full,
    overflow: 'hidden',
  },
  zoomControls: {
    position: 'absolute',
    bottom: Spacing.xxxl,
    left: Spacing.lg,
    right: Spacing.lg,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  zoomButton: {
    minWidth: 56,
    height: 44,
    paddingHorizontal: Spacing.md,
    borderRadius: Radii.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoomButtonText: {
    fontSize: Typography.sm,
    fontWeight: Typography.semibold,
  },
  gestureSurface: {
    width: '100%',
    height: '100%',
  },
  zoomStage: {
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