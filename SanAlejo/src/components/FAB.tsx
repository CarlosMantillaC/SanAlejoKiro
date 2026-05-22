import { Pressable, StyleSheet, Text } from 'react-native';
import { Colors, Shadows } from '../theme';

interface FABProps {
  onPress: () => void;
  label?: string;
}

export function FAB({ onPress, label = '+' }: FABProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
      accessibilityLabel="Agregar nuevo contenedor"
      accessibilityRole="button"
    >
      <Text style={styles.icon}>{label}</Text>
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
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.lg,
  },
  fabPressed: {
    backgroundColor: Colors.accentDark,
    transform: [{ scale: 0.95 }],
  },
  icon: {
    color: Colors.textOnAccent,
    fontSize: 28,
    lineHeight: 32,
    fontWeight: '300',
  },
});
