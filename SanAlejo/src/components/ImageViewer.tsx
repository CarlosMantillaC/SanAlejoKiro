import React, { useEffect, useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Animated, Image, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import {
  GestureHandlerRootView,
  PinchGestureHandler,
  TapGestureHandler,
  PanGestureHandler,
  State,
} from 'react-native-gesture-handler';
import { Radii, Spacing, Typography } from '../theme';
import { useTheme } from '../context/ThemeContext';

interface ImageViewerProps {
  uri: string;
  visible: boolean;
  onClose: () => void;
}

const MIN_SCALE = 1;
const MAX_SCALE = 4;
const DOUBLE_TAP_ZOOM = 2;

export function ImageViewer({ uri, visible, onClose }: ImageViewerProps) {
  const { colors } = useTheme();
  const [loadFailed, setLoadFailed] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);

  // Scale state
  const currentScaleRef = useRef(1);
  const scale = useRef(new Animated.Value(1)).current;
  const baseScaleRef = useRef(1);

  // Pan state
  const pan = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const dragState = useRef({
    active: false,
    startX: 0,
    startY: 0,
    baseX: 0,
    baseY: 0,
  }).current;

  // Gesture handler refs
  const pinchRef = useRef<PinchGestureHandler>(null);
  const doubleTapRef = useRef<TapGestureHandler>(null);
  const singleTapRef = useRef<TapGestureHandler>(null);
  const panRef = useRef<PanGestureHandler>(null);

  useEffect(() => {
    if (visible) {
      setLoadFailed(false);
      setIsZoomed(false);
      currentScaleRef.current = 1;
      baseScaleRef.current = 1;
      scale.setValue(1);
      pan.setOffset({ x: 0, y: 0 });
      pan.setValue({ x: 0, y: 0 });
    }
  }, [pan, scale, uri, visible]);

  function resetPan() {
    pan.setValue({ x: 0, y: 0 });
  }

  function commitScale(nextScale: number) {
    const clamped = Math.min(MAX_SCALE, Math.max(MIN_SCALE, nextScale));
    currentScaleRef.current = clamped;
    baseScaleRef.current = clamped;
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

  // ── Pinch gesture ──────────────────────────────────────────────────────────

  function handlePinchGestureEvent(event: any) {
    const rawScale = baseScaleRef.current * event.nativeEvent.scale;
    const clamped = Math.min(MAX_SCALE, Math.max(MIN_SCALE, rawScale));
    currentScaleRef.current = clamped;
    scale.setValue(clamped);
    setIsZoomed(clamped > 1);
  }

  function handlePinchStateChange(event: any) {
    if (
      event.nativeEvent.state === State.END ||
      event.nativeEvent.state === State.CANCELLED ||
      event.nativeEvent.state === State.FAILED
    ) {
      const finalScale = currentScaleRef.current;
      baseScaleRef.current = finalScale;
      if (finalScale <= 1) {
        currentScaleRef.current = 1;
        baseScaleRef.current = 1;
        scale.setValue(1);
        setIsZoomed(false);
        resetPan();
      }
    }
  }

  // ── Double-tap gesture ─────────────────────────────────────────────────────

  function handleDoubleTap(event: any) {
    if (event.nativeEvent.state === State.ACTIVE) {
      const next = currentScaleRef.current > 1 ? 1 : DOUBLE_TAP_ZOOM;
      commitScale(next);
    }
  }

  // ── Manual pan (touch events) ──────────────────────────────────────────────

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

  const imageElement = (
    <Image
      source={{ uri }}
      style={styles.image}
      resizeMode="contain"
      accessibilityLabel="Vista ampliada de la imagen"
      onError={() => setLoadFailed(true)}
    />
  );

  const content = loadFailed ? (
    <View style={styles.errorState}>
      <Ionicons name="alert-circle-outline" size={48} color={colors.textMuted} />
      <Text style={[styles.errorText, { color: colors.textPrimary }]}>No se pudo cargar la imagen</Text>
    </View>
  ) : imageElement;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <GestureHandlerRootView style={styles.gestureRoot}>
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
                <TapGestureHandler
                  ref={doubleTapRef}
                  numberOfTaps={2}
                  onHandlerStateChange={handleDoubleTap}
                >
                  <Animated.View style={styles.gestureSurface}>
                    <PinchGestureHandler
                      ref={pinchRef}
                      onGestureEvent={handlePinchGestureEvent}
                      onHandlerStateChange={handlePinchStateChange}
                    >
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
                    </PinchGestureHandler>
                  </Animated.View>
                </TapGestureHandler>
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
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  gestureRoot: {
    flex: 1,
  },
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
});
