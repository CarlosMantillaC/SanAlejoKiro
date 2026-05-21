import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Contenedor } from '../db/contenedorRepository';

interface ContenedorItemProps {
  contenedor: Contenedor;
  onPress: () => void;
  onDelete: () => void;
}

export function ContenedorItem({ contenedor, onPress, onDelete }: ContenedorItemProps) {
  return (
    <View style={styles.container}>
      <Pressable
        onPress={onPress}
        style={styles.mainArea}
        accessibilityRole="button"
        accessibilityLabel={`Ver contenedor ${contenedor.nombre}`}
      >
        <Text style={styles.nombre}>{contenedor.nombre}</Text>
        <Text style={styles.descripcion}>{contenedor.descripcion}</Text>
        <Text style={styles.ubicacion}>{contenedor.ubicacion}</Text>
      </Pressable>

      <Pressable
        onPress={onDelete}
        style={styles.deleteButton}
        accessibilityRole="button"
        accessibilityLabel={`Eliminar contenedor ${contenedor.nombre}`}
      >
        <Text style={styles.deleteText}>🗑</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginHorizontal: 16,
    marginVertical: 6,
    paddingVertical: 12,
    paddingLeft: 16,
    paddingRight: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  mainArea: {
    flex: 1,
  },
  nombre: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#1A1A1A',
    marginBottom: 2,
  },
  descripcion: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 2,
  },
  ubicacion: {
    fontSize: 12,
    color: '#888888',
  },
  deleteButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginLeft: 8,
  },
  deleteText: {
    fontSize: 20,
  },
});
