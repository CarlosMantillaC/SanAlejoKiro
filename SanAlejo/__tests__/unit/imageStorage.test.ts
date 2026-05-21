/**
 * Property-based tests for imageStorage utility.
 *
 * **Validates: Requirements 10.9, 10.10**
 */

import fc from 'fast-check';
import * as FileSystem from 'expo-file-system';
import {
  deleteImageFromStorage,
  deleteImagesFromStorage,
} from '../../src/utils/imageStorage';

// Cast mocks for type-safe access
const mockGetInfoAsync = FileSystem.getInfoAsync as jest.Mock;
const mockDeleteAsync = FileSystem.deleteAsync as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
});

// ---------------------------------------------------------------------------
// Property 15: Limpieza de archivo al eliminar objeto con foto
// ---------------------------------------------------------------------------

describe('Property 15: Limpieza de archivo al eliminar objeto con foto', () => {
  it('deleteImageFromStorage invoca FileSystem.deleteAsync con la URI correcta cuando el archivo existe', async () => {
    // Feature: san-alejo-app, Property 15: Limpieza de archivo al eliminar objeto con foto
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1 }),
        async (fotoUri) => {
          // Arrange: el archivo existe
          mockGetInfoAsync.mockResolvedValue({ exists: true });
          mockDeleteAsync.mockResolvedValue(undefined);

          // Act
          await deleteImageFromStorage(fotoUri);

          // Assert: deleteAsync fue llamado con la URI correcta
          expect(mockDeleteAsync).toHaveBeenCalledWith(fotoUri, { idempotent: true });

          // Limpiar para la siguiente iteración
          jest.clearAllMocks();
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 16: Limpieza en cascada de fotos al eliminar contenedor
// ---------------------------------------------------------------------------

describe('Property 16: Limpieza en cascada de fotos al eliminar contenedor', () => {
  it('deleteImagesFromStorage invoca FileSystem.deleteAsync exactamente una vez por cada URI del array', async () => {
    // Feature: san-alejo-app, Property 16: Limpieza en cascada de fotos al eliminar contenedor
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.string({ minLength: 1 }), { minLength: 1, maxLength: 20 }),
        async (uris) => {
          // Arrange: todos los archivos existen
          mockGetInfoAsync.mockResolvedValue({ exists: true });
          mockDeleteAsync.mockResolvedValue(undefined);

          // Act
          await deleteImagesFromStorage(uris);

          // Assert: deleteAsync fue llamado exactamente uris.length veces
          expect(mockDeleteAsync).toHaveBeenCalledTimes(uris.length);

          // Verificar que cada URI fue pasada a deleteAsync
          uris.forEach((uri) => {
            expect(mockDeleteAsync).toHaveBeenCalledWith(uri, { idempotent: true });
          });

          // Limpiar para la siguiente iteración
          jest.clearAllMocks();
        }
      ),
      { numRuns: 100 }
    );
  });
});
