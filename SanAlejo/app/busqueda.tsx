import { useState } from 'react';
import { FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Stack, router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { ObjetoConContenedor, searchObjetos } from '../src/db/objetoRepository';

export default function Busqueda() {
  const db = useSQLiteContext();
  const [query, setQuery] = useState('');
  const [resultados, setResultados] = useState<ObjetoConContenedor[]>([]);
  const [buscando, setBuscando] = useState(false);

  async function handleChangeText(texto: string) {
    setQuery(texto);
    if (texto.trim().length === 0) {
      setResultados([]);
      return;
    }
    setBuscando(true);
    try {
      const encontrados = await searchObjetos(db, texto);
      setResultados(encontrados);
    } catch {
      setResultados([]);
    } finally {
      setBuscando(false);
    }
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Buscar objetos' }} />

      <TextInput
        style={styles.searchInput}
        placeholder="Buscar objetos..."
        value={query}
        onChangeText={handleChangeText}
        autoFocus
        clearButtonMode="while-editing"
        returnKeyType="search"
        accessibilityLabel="Barra de búsqueda de objetos"
      />

      <FlatList
        data={resultados}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.resultItem}
            onPress={() => router.push(`/contenedor/${item.id_contenedor}`)}
            accessibilityRole="button"
            accessibilityLabel={`Ir al contenedor de ${item.nombre}`}
          >
            <Text style={styles.nombreObjeto}>{item.nombre}</Text>
            {item.descripcion ? (
              <Text style={styles.descripcionObjeto}>{item.descripcion}</Text>
            ) : null}
            <Text style={styles.nombreContenedor}>{item.nombre_contenedor}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          query.trim().length > 0 && !buscando ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                No se encontraron objetos con ese nombre o descripción.
              </Text>
            </View>
          ) : null
        }
        contentContainerStyle={resultados.length === 0 ? styles.emptyList : styles.list}
        keyboardShouldPersistTaps="handled"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  searchInput: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#D1D1D6',
  },
  list: {
    paddingVertical: 4,
    paddingBottom: 32,
  },
  emptyList: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 48,
  },
  emptyText: {
    fontSize: 15,
    color: '#888888',
    textAlign: 'center',
    lineHeight: 22,
  },
  resultItem: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginVertical: 4,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  nombreObjeto: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginBottom: 2,
  },
  descripcionObjeto: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 4,
  },
  nombreContenedor: {
    fontSize: 13,
    color: '#007AFF',
  },
});
