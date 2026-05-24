import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, FlatList } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useSQLiteContext } from 'expo-sqlite';
import { Etiqueta, searchEtiquetas, createEtiqueta } from '../db/etiquetaRepository';
import { Spacing, Radii, Typography } from '../theme';

interface TagPickerProps {
  selected: Etiqueta[];
  onChange: (next: Etiqueta[]) => void;
  placeholder?: string;
}

export function TagPicker({ selected, onChange, placeholder }: TagPickerProps) {
  const { colors } = useTheme();
  const db = useSQLiteContext();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Etiqueta[]>([]);
  const [loading, setLoading] = useState(false);

  function normalizeNombre(nombre: string): string {
    return nombre.trim().replace(/\s+/g, ' ');
  }

  const debounceRef = useRef<number | null>(null as any);

  useEffect(() => {
    const q = normalizeNombre(query);
    if (!q) { setSuggestions([]); return; }
    setLoading(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const rows = await searchEtiquetas(db, q, 10);
        setSuggestions(rows.filter(r => !selected.some(s => s.id === r.id)));
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, selected]);

  async function handleAddExisting(e: Etiqueta) {
    onChange([...selected, e]);
    setQuery('');
    setSuggestions([]);
  }

  async function handleCreateAndAdd() {
    const nombre = normalizeNombre(query);
    if (!nombre) return;
    try {
      const created = await createEtiqueta(db, nombre);
      onChange([...selected, created]);
    } catch {
      // silently ignore for now — caller may show errors
    } finally {
      setQuery('');
      setSuggestions([]);
    }
  }

  function handleRemove(id: number) {
    onChange(selected.filter(s => s.id !== id));
  }

  return (
    <View>
      <View style={styles.chipsRow}>
        {selected.map((s) => (
          <View key={s.id} style={[styles.chip, { backgroundColor: colors.bgSurface, borderColor: colors.border }]}>
            <Text style={{ color: colors.textPrimary, fontSize: Typography.sm }}>{s.nombre}</Text>
            <Pressable onPress={() => handleRemove(s.id)} style={styles.chipClose} accessibilityLabel={`Quitar etiqueta ${s.nombre}`}>
              <Text style={{ color: colors.textMuted }}>✕</Text>
            </Pressable>
          </View>
        ))}
      </View>

      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder={placeholder ?? 'Agregar etiqueta'}
        placeholderTextColor={colors.textMuted}
        style={[styles.input, { borderColor: colors.border, color: colors.textPrimary }]}
        selectionColor={colors.accent}
        caretColor={colors.accent}
        onSubmitEditing={handleCreateAndAdd}
      />

      {query ? (
        <View style={[styles.suggestions, { backgroundColor: colors.bgElevated, borderColor: colors.border }]}
        >
          {suggestions.length === 0 ? (
            <Pressable onPress={handleCreateAndAdd} style={styles.suggestionItem}>
              <Text style={{ color: colors.textPrimary }}>Crear "{query}"</Text>
            </Pressable>
          ) : (
            <View>
              {suggestions.map((item) => (
                <Pressable key={item.id} onPress={() => handleAddExisting(item)} style={styles.suggestionItem}>
                  <Text style={{ color: colors.textPrimary }}>{item.nombre}</Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.sm },
  chip: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: Radii.full, borderWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  chipClose: { marginLeft: 8 },
  input: { borderWidth: 1, borderRadius: Radii.md, padding: Spacing.sm, fontSize: Typography.base },
  suggestions: { marginTop: 6, borderWidth: 1, borderRadius: Radii.md, maxHeight: 160 },
  suggestionItem: { padding: Spacing.md, borderBottomWidth: 1 },
});

export default TagPicker;
