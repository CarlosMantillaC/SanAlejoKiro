/**
 * Manual mock for react-native-gesture-handler.
 * Replaces gesture handler components with simple View passthroughs
 * so tests can render components that use gesture handlers without
 * requiring native module initialization.
 */
const React = require('react');
const { View } = require('react-native');

const createPassthrough = (displayName) => {
  const Component = React.forwardRef(({ children, ...props }, ref) =>
    React.createElement(View, { ref, ...props }, children)
  );
  Component.displayName = displayName;
  return Component;
};

module.exports = {
  State: {
    UNDETERMINED: 0,
    FAILED: 1,
    BEGAN: 2,
    CANCELLED: 3,
    ACTIVE: 4,
    END: 5,
  },
  GestureHandlerRootView: createPassthrough('GestureHandlerRootView'),
  TapGestureHandler: createPassthrough('TapGestureHandler'),
  PanGestureHandler: createPassthrough('PanGestureHandler'),
  PinchGestureHandler: createPassthrough('PinchGestureHandler'),
  LongPressGestureHandler: createPassthrough('LongPressGestureHandler'),
  FlingGestureHandler: createPassthrough('FlingGestureHandler'),
  RotationGestureHandler: createPassthrough('RotationGestureHandler'),
  NativeViewGestureHandler: createPassthrough('NativeViewGestureHandler'),
  RawButton: createPassthrough('RawButton'),
  BaseButton: createPassthrough('BaseButton'),
  RectButton: createPassthrough('RectButton'),
  BorderlessButton: createPassthrough('BorderlessButton'),
  ScrollView: createPassthrough('ScrollView'),
  Switch: createPassthrough('Switch'),
  TextInput: createPassthrough('TextInput'),
  DrawerLayoutAndroid: createPassthrough('DrawerLayoutAndroid'),
  FlatList: createPassthrough('FlatList'),
  gestureHandlerRootHOC: (Component) => Component,
  Directions: {
    RIGHT: 1,
    LEFT: 2,
    UP: 4,
    DOWN: 8,
  },
};
