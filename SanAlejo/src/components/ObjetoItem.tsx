import React from 'react';
import {
  View,
  Text,
  Image,
  Pressable,
  StyleSheet,
} from 'react-native';
import { Objeto } from '../db/objetoRepository';

interface ObjetoItemProps {
  objeto: Objeto;
  onEdit: () => void;
  onDelete: () => void;
}

export function ObjetoItem({ objeto, onEdit, onDelete }: ObjetoItemProps) {
  return (
    <View style={styles.container}>
      {/* Foto a la izquierda */}
      {objeto.foto_uri !== null ? (
        <Image
          source={{ uri: objeto.foto_uri }}
          style={styles.foto}
          accessibilityLabel={`Foto de ${objeto.nombre}`}
        />
      ) : null}

      {/* Texto en el centro */}
      <View style={styles.textContainer}>
        <Text style={styles.nombre}>{objeto.nombre}</Text>
        <Text style={styles.descripcion}>{objeto.descripcion}</Text>
      </View>

      {/* Botones a la derecha */}
      <View style={styles.buttonContainer}>
        <Pressable
          style={styles.editButton}
          onPress={onEdit}
          accessibilityRole="button"
          accessibilityLabel={`Editar ${objeto.nombre}`}
        >
          <Text style={styles.editText}>Editar</Text>
        </Pressable>
        <Pressable
          style={styles.deleteButton}
          onPress={onDelete}
          accessibilityRole="button"
          accessibilityLabel={`Eliminar ${objeto.nombre}`}
        >
          <Text style={styles.deleteText}>Eliminar</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  foto: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
    marginRight: 8,
  },
  nombre: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 4,
  },
  descripcion: {
    fontSize: 13,
    color: '#888888',
  },
  buttonContainer: {
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  editButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#CCCCCC',
    alignItems: 'center',
    marginBottom: 6,
  },
  editText: {
    fontSize: 13,
    color: '#333333',
  },
  deleteButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: '#FF3B30',
    alignItems: 'center',
  },
  deleteText: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
