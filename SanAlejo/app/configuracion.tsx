import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { exportarDatos, importarDatos } from '../src/utils/backupManager';
import { ConfirmDialog } from '../src/components/ConfirmDialog';

export default function Configuracion() {
  const db = useSQLiteContext();
  const [exportando, setExportando] = useState(false);
  const [importando, setImportando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [archivoImportar, setArchivoImportar] = useState<string | null>(null);
  const [mostrarConfirmImport, setMostrarConfirmImport] = useState(false);

  async function handleExportar() {
    setExportando(true);
    setError(null);
    try {
      const filePath = await exportarDatos(db);
      const puedeCompartir = await Sharing.isAvailableAsync();
      if (puedeCompartir) {
        await Sharing.shareAsync(filePath, {
          mimeType: 'application/json',
          dialogTitle: 'Exportar backup de San Alejo',
        });
      } else {
        Alert.alert('Exportado', `Backup guardado en: ${filePath}`);
      }
    } catch (e) {
      setError('No se pudo exportar los datos. Intenta de nuevo.');
    } finally {
      setExportando(false);
    }
  }

  async function handleSeleccionarArchivo() {
    setError(null);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;
      const uri = result.assets[0].uri;
      setArchivoImportar(uri);
      setMostrarConfirmImport(true);
    } catch {
      setError('No se pudo seleccionar el archivo.');
    }
  }

  async function handleConfirmarImportar() {
    if (!archivoImportar) return;
    setMostrarConfirmImport(false);
    setImportando(true);
    setError(null);
    try {
      await importarDatos(db, archivoImportar);
      setArchivoImportar(null);
      router.replace('/');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Error desconocido';
      setError(`No se pudo importar: ${msg}`);
    } finally {
      setImportando(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: 'Configuración' }} />

      <Text style={styles.sectionTitle}>Copia de seguridad</Text>
      <Text style={styles.sectionDesc}>
        Exporta todos tus contenedores y objetos a un archivo JSON. Puedes importarlo
        en otro dispositivo o después de reinstalar la app.
      </Text>

      {error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <Pressable
        style={[styles.btn, styles.btnPrimary, exportando && styles.btnDisabled]}
        onPress={handleExportar}
        disabled={exportando}
        accessibilityRole="button"
        accessibilityLabel="Exportar datos"
      >
        {exportando
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.btnTextPrimary}>📤  Exportar datos</Text>
        }
      </Pressable>

      <Pressable
        style={[styles.btn, styles.btnSecondary, importando && styles.btnDisabled]}
        onPress={handleSeleccionarArchivo}
        disabled={importando}
        accessibilityRole="button"
        accessibilityLabel="Importar datos"
      >
        {importando
          ? <ActivityIndicator color="#007AFF" />
          : <Text style={styles.btnTextSecondary}>📥  Importar datos</Text>
        }
      </Pressable>

      <Text style={styles.nota}>
        ⚠️ La importación reemplazará todos los contenedores y objetos actuales.
        Las fotos no se incluyen en el backup.
      </Text>

      <ConfirmDialog
        visible={mostrarConfirmImport}
        message="¿Importar datos? Esto reemplazará todos los contenedores y objetos actuales."
        onConfirm={handleConfirmarImportar}
        onCancel={() => { setMostrarConfirmImport(false); setArchivoImportar(null); }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  sectionDesc: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 24,
  },
  errorBanner: {
    backgroundColor: '#FFE5E5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#EF4444',
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
  },
  btn: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  btnPrimary: {
    backgroundColor: '#007AFF',
  },
  btnSecondary: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  btnDisabled: {
    opacity: 0.5,
  },
  btnTextPrimary: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  btnTextSecondary: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  nota: {
    fontSize: 13,
    color: '#9CA3AF',
    lineHeight: 18,
    marginTop: 8,
    textAlign: 'center',
  },
});
