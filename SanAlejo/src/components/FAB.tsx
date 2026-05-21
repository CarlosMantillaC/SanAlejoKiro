import { Pressable, StyleSheet, Text } from 'react-native';

interface FABProps {
  onPress: () => void;
}

export function FAB({ onPress }: FABProps) {
  return (
    <Pressable
      onPress={onPress}
      style={styles.fab}
      accessibilityLabel="Agregar nuevo contenedor"
      accessibilityRole="button"
    >
      <Text style={styles.icon}>+</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    color: '#FFFFFF',
    fontSize: 28,
    lineHeight: 32,
  },
});
