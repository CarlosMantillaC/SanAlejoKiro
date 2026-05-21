import * as FileSystem from 'expo-file-system';

const IMAGES_DIR = FileSystem.documentDirectory + 'images/';

/** Asegura que el directorio de imágenes existe antes de copiar. */
async function ensureImagesDirExists(): Promise<void> {
  const info = await FileSystem.getInfoAsync(IMAGES_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(IMAGES_DIR, { intermediates: true });
  }
}

/**
 * Genera un nombre de archivo único usando timestamp + número aleatorio.
 * Alternativa a randomUUID() de expo-crypto (no disponible en este proyecto).
 */
function generateUniqueFilename(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/**
 * Copia una imagen al directorio persistente de la app.
 * Retorna la ruta de destino (dentro de images/).
 */
export async function copyImageToStorage(sourceUri: string): Promise<string> {
  await ensureImagesDirExists();
  const extension = sourceUri.split('.').pop() ?? 'jpg';
  const destUri = `${IMAGES_DIR}${generateUniqueFilename()}.${extension}`;
  await FileSystem.copyAsync({ from: sourceUri, to: destUri });
  return destUri;
}

/**
 * Elimina un archivo de imagen si existe.
 * No lanza error si el archivo no existe.
 */
export async function deleteImageFromStorage(uri: string): Promise<void> {
  const info = await FileSystem.getInfoAsync(uri);
  if (info.exists) {
    await FileSystem.deleteAsync(uri, { idempotent: true });
  }
}

/**
 * Elimina múltiples archivos de imagen (para cascade delete).
 * Ignora archivos que no existen.
 */
export async function deleteImagesFromStorage(uris: string[]): Promise<void> {
  await Promise.all(uris.map(deleteImageFromStorage));
}
