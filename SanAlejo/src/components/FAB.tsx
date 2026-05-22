import { Pressable, StyleSheet, Text } from 'react-native';
import { Shadows } from '../theme';
import { useTheme } from '../context/ThemeContext';

interface FABProps {
  onPress: () => void;
  label?: string;
}

export function FAB({ onPress, label = '+' }: FABProps) {
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.fab,
        { backgroundColor: pressed ? colors.accentDark : colors.accent },
        pressed && styles.fabPressed,
      ]}
      accessibilityLabel="Agregar nuevo contenedor"
      accessibilityRole="button"
    >
      <Text style={[styles.icon, { color: colors.textOnAccent }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: 28,
    right: 24,
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.lg,
  },
  fabPressed: {
    transform: [{ scale: 0.95 }],
  },
  icon: {
    fontSize: 28,
    lineHeight: 32,
    fontWeight: '300',
  },
});
