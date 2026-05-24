import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
  Animated,
  Dimensions,
  FlatList,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewToken,
} from 'react-native';
import {
  GestureHandlerRootView,
  PanGestureHandler,
  PinchGestureHandler,
  TapGestureHandler,
  State,
} from 'react-native-gesture-handler';
import { Radii, Spacing, Typography } from '../theme';
import { useTheme } from '../context/ThemeContext';

// ─── Constants ────────────────────────────────────────────────────────────────

const MIN_SCALE = 1;
const MAX_SCALE = 4;
const DOUBLE_TAP_ZOOM = 2;
const ZOOM_STEP = 0.5;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface VisorGaleriaProps {
  fotos: Array<{ uri: string }>;
  initialIndex: number;
  visible: boolean;
  onClose: () => void;
}

// ─── ZoomableImage ────────────────────────────────────────────────────────────

export interface ZoomableImageHandle {
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
  getScale: () => number;
}

interface ZoomableImageProps {
  uri: string;
  width: number;
  height: number;
  /** When false, pan gesture is disabled so the parent FlatList can swipe */
  panEnabled: boolean;
  /** When this becomes false the transform resets to 1x so stale zoom doesn't bleed */
  isActive: boolean;
  onScaleChange?: (scale: number) => void;
}

const ZoomableImage = forwardRef<ZoomableImageHandle, ZoomableImageProps>(
  function ZoomableImage({ uri, width, height, panEnabled, isActive, onScaleChange }, ref) {
    const { colors } = useTheme();
    const [loadFailed, setLoadFailed] = useState(false);

    // ── Scale ───────────────────────────────────────────────────────────────
    const baseScaleRef = useRef(1);
    const currentScaleRef = useRef(1);
    const scale = useRef(new Animated.Value(1)).current;

    // ── Pan ─────────────────────────────────────────────────────────────────
    // We track accumulated position in JS refs and drive Animated.Values directly
    // (no extractOffset/setOffset) so reset is always clean and authoritative.
    const panXRef = useRef(0); // committed position after each gesture ends
    const panYRef = useRef(0);
    const translateX = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(0)).current;

    // ── Gesture refs ────────────────────────────────────────────────────────
    const pinchRef = useRef<PinchGestureHandler>(null);
    const panRef = useRef<PanGestureHandler>(null);
    const doubleTapRef = useRef<TapGestureHandler>(null);

    // ── Helpers ─────────────────────────────────────────────────────────────

    function applyScale(next: number) {
      const clamped = Math.min(MAX_SCALE, Math.max(MIN_SCALE, next));
      baseScaleRef.current = clamped;
      currentScaleRef.current = clamped;
      scale.setValue(clamped);
      onScaleChange?.(clamped);
      if (clamped <= MIN_SCALE) {
        panXRef.current = 0;
        panYRef.current = 0;
        translateX.setValue(0);
        translateY.setValue(0);
      }
    }

    function resetTransform() {
      baseScaleRef.current = MIN_SCALE;
      currentScaleRef.current = MIN_SCALE;
      scale.setValue(MIN_SCALE);
      onScaleChange?.(MIN_SCALE);
      panXRef.current = 0;
      panYRef.current = 0;
      translateX.setValue(0);
      translateY.setValue(0);
    }

    // ── Imperative handle ────────────────────────────────────────────────────

    useImperativeHandle(ref, () => ({
      zoomIn: () => applyScale(currentScaleRef.current + ZOOM_STEP),
      zoomOut: () => applyScale(currentScaleRef.current - ZOOM_STEP),
      resetZoom: resetTransform,
      getScale: () => currentScaleRef.current,
    }));

    // ── Reset on photo change ────────────────────────────────────────────────

    useEffect(() => {
      setLoadFailed(false);
      resetTransform();
    }, [uri]);

    // ── Reset when this item becomes inactive (user navigated away) ──────────

    useEffect(() => {
      if (!isActive) {
        resetTransform();
      }
    }, [isActive]);

    // ── Pinch ────────────────────────────────────────────────────────────────

    const onPinchEvent = Animated.event(
      [{ nativeEvent: { scale } }],
      {
        useNativeDriver: false,
        listener: (event: any) => {
          const raw = baseScaleRef.current * event.nativeEvent.scale;
          currentScaleRef.current = Math.min(MAX_SCALE, Math.max(MIN_SCALE, raw));
          onScaleChange?.(currentScaleRef.current);
        },
      }
    );

    function onPinchStateChange(event: any) {
      const { state } = event.nativeEvent;
      if (
        state === State.END ||
        state === State.CANCELLED ||
        state === State.FAILED
      ) {
        const finalScale = Math.min(
          MAX_SCALE,
          Math.max(MIN_SCALE, baseScaleRef.current * event.nativeEvent.scale)
        );
        applyScale(finalScale);
      }
    }

    // ── Pan ──────────────────────────────────────────────────────────────────
    // We do NOT use Animated.event for pan because extractOffset/setOffset
    // desync with the native driver. Instead we compute total = base + delta
    // in JS and call setValue directly. This is slightly less smooth than
    // native-driven pan but guarantees the reset is always clean.

    const onPanEvent = (event: any) => {
      const { translationX, translationY } = event.nativeEvent;
      translateX.setValue(panXRef.current + translationX);
      translateY.setValue(panYRef.current + translationY);
    };

    function onPanStateChange(event: any) {
      const { state, translationX, translationY } = event.nativeEvent;
      if (
        state === State.END ||
        state === State.CANCELLED ||
        state === State.FAILED
      ) {
        // Commit the final position into the refs
        panXRef.current += translationX;
        panYRef.current += translationY;
        translateX.setValue(panXRef.current);
        translateY.setValue(panYRef.current);
      }
    }

    // ── Double-tap ───────────────────────────────────────────────────────────

    function onDoubleTap(event: any) {
      if (event.nativeEvent.state === State.ACTIVE) {
        if (currentScaleRef.current > MIN_SCALE) {
          resetTransform();
        } else {
          applyScale(DOUBLE_TAP_ZOOM);
        }
      }
    }

    if (loadFailed) {
      return (
        <View style={[styles.itemContainer, { width, height }]}>
          <View style={styles.errorState}>
            <Ionicons name="alert-circle-outline" size={48} color={colors.textMuted} />
            <Text style={[styles.errorText, { color: colors.textPrimary }]}>
              No se pudo cargar la imagen
            </Text>
          </View>
        </View>
      );
    }

    return (
      <View style={[styles.itemContainer, { width, height, overflow: 'hidden' }]}>
        <TapGestureHandler
          ref={doubleTapRef}
          numberOfTaps={2}
          onHandlerStateChange={onDoubleTap}
        >
          <Animated.View style={{ width, height }}>
            <PinchGestureHandler
              ref={pinchRef}
              onGestureEvent={onPinchEvent}
              onHandlerStateChange={onPinchStateChange}
              simultaneousHandlers={panRef}
            >
              <Animated.View style={{ width, height }}>
                {/* Pan is only active when zoomed in; at 1x the FlatList handles swipe */}
                <PanGestureHandler
                  ref={panRef}
                  enabled={panEnabled}
                  onGestureEvent={onPanEvent}
                  onHandlerStateChange={onPanStateChange}
                  simultaneousHandlers={pinchRef}
                  minPointers={1}
                  maxPointers={1}
                  avgTouches
                >
                  <Animated.View
                    style={[
                      styles.zoomStage,
                      { width, height },
                      {
                        transform: [
                          { translateX },
                          { translateY },
                          { scale },
                        ],
                      },
                    ]}
                  >
                    <Image
                      source={{ uri }}
                      style={{ width, height }}
                      resizeMode="contain"
                      accessibilityLabel="Foto del objeto"
                      onError={() => setLoadFailed(true)}
                    />
                  </Animated.View>
                </PanGestureHandler>
              </Animated.View>
            </PinchGestureHandler>
          </Animated.View>
        </TapGestureHandler>
      </View>
    );
  }
);

// ─── VisorGaleria ─────────────────────────────────────────────────────────────

export function VisorGaleria({ fotos, initialIndex, visible, onClose }: VisorGaleriaProps) {
  const { colors } = useTheme();
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [displayScale, setDisplayScale] = useState(1);
  const screenWidth = Dimensions.get('window').width;
  const screenHeight = Dimensions.get('window').height;

  const zoomableRef = useRef<ZoomableImageHandle>(null);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (visible) {
      setCurrentIndex(initialIndex);
      setDisplayScale(1);
    }
  }, [visible, initialIndex]);

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        setCurrentIndex(viewableItems[0].index);
        setDisplayScale(1);
      }
    },
    []
  );

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  const getItemLayout = useCallback(
    (_: any, index: number) => ({
      length: screenWidth,
      offset: screenWidth * index,
      index,
    }),
    [screenWidth]
  );

  // Pan is only active when zoomed in — at 1x the FlatList handles horizontal swipe
  const isZoomed = displayScale > MIN_SCALE;

  const renderItem = useCallback(
    ({ item, index }: { item: { uri: string }; index: number }) => (
      <ZoomableImage
        ref={index === currentIndex ? zoomableRef : undefined}
        uri={item.uri}
        width={screenWidth}
        height={screenHeight}
        panEnabled={isZoomed && index === currentIndex}
        isActive={index === currentIndex}
        onScaleChange={index === currentIndex ? setDisplayScale : undefined}
      />
    ),
    [screenWidth, screenHeight, currentIndex, isZoomed]
  );

  const keyExtractor = useCallback(
    (item: { uri: string }, index: number) => `${index}-${item.uri}`,
    []
  );

  function goTo(index: number) {
    if (index < 0 || index >= fotos.length) return;
    flatListRef.current?.scrollToIndex({ index, animated: true });
    setCurrentIndex(index);
    setDisplayScale(1);
  }

  if (!visible) {
    return null;
  }

  const total = fotos.length;
  const scaleLabel = `${Math.round(displayScale * 10) / 10}x`;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <GestureHandlerRootView style={styles.gestureRoot}>
        <View
          testID="visor-galeria-overlay"
          style={[styles.overlay, { backgroundColor: 'rgba(0,0,0,0.92)' }]}
        >
          {/* Position indicator */}
          <View
            style={styles.indicatorContainer}
            accessibilityLabel={`Foto ${currentIndex + 1} de ${total}`}
            accessibilityRole="text"
          >
            <Text
              testID="visor-galeria-indicator"
              style={[styles.indicatorText, { color: colors.textPrimary }]}
            >
              {currentIndex + 1} / {total}
            </Text>
          </View>

          {/* Close button */}
          <Pressable
            testID="visor-galeria-close"
            style={({ pressed }) => [
              styles.closeButton,
              {
                backgroundColor: pressed ? colors.accentDark : colors.accent,
                borderColor: colors.borderSubtle,
              },
            ]}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Cerrar visor de galería"
          >
            <Ionicons name="close" size={22} color={colors.textOnAccent} />
          </Pressable>

          {/* Prev button — hidden on first photo */}
          {currentIndex > 0 ? (
            <Pressable
              style={({ pressed }) => [
                styles.navBtn,
                styles.navBtnLeft,
                {
                  backgroundColor: pressed ? colors.accentDark : colors.accent,
                  borderColor: colors.borderSubtle,
                },
              ]}
              onPress={() => goTo(currentIndex - 1)}
              accessibilityRole="button"
              accessibilityLabel="Foto anterior"
            >
              <Ionicons name="chevron-back" size={22} color={colors.textOnAccent} />
            </Pressable>
          ) : null}

          {/* Next button — hidden on last photo */}
          {currentIndex < total - 1 ? (
            <Pressable
              style={({ pressed }) => [
                styles.navBtn,
                styles.navBtnRight,
                {
                  backgroundColor: pressed ? colors.accentDark : colors.accent,
                  borderColor: colors.borderSubtle,
                },
              ]}
              onPress={() => goTo(currentIndex + 1)}
              accessibilityRole="button"
              accessibilityLabel="Foto siguiente"
            >
              <Ionicons name="chevron-forward" size={22} color={colors.textOnAccent} />
            </Pressable>
          ) : null}

          {/* Photo list */}
          <FlatList
            ref={flatListRef}
            testID="visor-galeria-flatlist"
            data={fotos}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            initialScrollIndex={initialIndex}
            getItemLayout={getItemLayout}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={viewabilityConfig}
            style={styles.flatList}
            // Disable FlatList's own scroll when zoomed so pan gesture takes over
            scrollEnabled={!isZoomed}
          />

          {/* Zoom controls */}
          <View style={styles.zoomControls}>
            <Pressable
              style={({ pressed }) => [
                styles.zoomBtn,
                {
                  backgroundColor: pressed ? colors.accentDark : colors.accent,
                  borderColor: colors.borderSubtle,
                },
              ]}
              onPress={() => zoomableRef.current?.zoomOut()}
              accessibilityRole="button"
              accessibilityLabel="Reducir zoom"
            >
              <Ionicons name="remove" size={20} color={colors.textOnAccent} />
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.zoomLabel,
                {
                  backgroundColor: pressed ? colors.accentDark : colors.accent,
                  borderColor: colors.borderSubtle,
                },
              ]}
              onPress={() => zoomableRef.current?.resetZoom()}
              accessibilityRole="button"
              accessibilityLabel="Restablecer zoom"
            >
              <Text style={[styles.zoomLabelText, { color: colors.textOnAccent }]}>
                {scaleLabel}
              </Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.zoomBtn,
                {
                  backgroundColor: pressed ? colors.accentDark : colors.accent,
                  borderColor: colors.borderSubtle,
                },
              ]}
              onPress={() => zoomableRef.current?.zoomIn()}
              accessibilityRole="button"
              accessibilityLabel="Aumentar zoom"
            >
              <Ionicons name="add" size={20} color={colors.textOnAccent} />
            </Pressable>
          </View>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  gestureRoot: {
    flex: 1,
  },
  overlay: {
    flex: 1,
  },
  indicatorContainer: {
    position: 'absolute',
    top: Spacing.xl,
    left: 0,
    right: 0,
    zIndex: 2,
    alignItems: 'center',
    pointerEvents: 'none',
  },
  indicatorText: {
    fontSize: Typography.md,
    fontWeight: Typography.semibold,
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radii.full,
    overflow: 'hidden',
  },
  closeButton: {
    position: 'absolute',
    top: Spacing.xl,
    right: Spacing.lg,
    zIndex: 3,
    width: 44,
    height: 44,
    borderRadius: Radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  navBtn: {
    position: 'absolute',
    top: '50%',
    marginTop: -22,
    zIndex: 3,
    width: 44,
    height: 44,
    borderRadius: Radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  navBtnLeft: {
    left: Spacing.lg,
  },
  navBtnRight: {
    right: Spacing.lg,
  },
  flatList: {
    flex: 1,
  },
  itemContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  zoomStage: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorState: {
    flex: 1,
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
    left: 0,
    right: 0,
    zIndex: 3,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  zoomBtn: {
    width: 44,
    height: 44,
    borderRadius: Radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  zoomLabel: {
    height: 44,
    minWidth: 64,
    borderRadius: Radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
  },
  zoomLabelText: {
    fontSize: Typography.base,
    fontWeight: Typography.semibold,
  },
});
