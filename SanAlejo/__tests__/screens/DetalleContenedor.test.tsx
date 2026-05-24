/**
 * Integration tests for the DetalleContenedor screen and VisorGaleria integration.
 *
 * Validates: Requirements 4.1, 4.2, 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 6.1, 6.2, 6.3, 6.4
 */

import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { ThemeProvider } from '../../src/context/ThemeContext';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockUseColorScheme = jest.fn<string | null | undefined, []>();

jest.mock('react-native/Libraries/Utilities/useColorScheme', () => ({
  default: () => mockUseColorScheme(),
}));

jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return {
    Ionicons: ({ name, ...props }: { name: string }) =>
      React.createElement(Text, { testID: `icon-${name}`, ...props }),
  };
});

// Mock expo-router hooks and navigation
const mockRouterPush = jest.fn();
const mockRouterBack = jest.fn();

jest.mock('expo-router', () => ({
  Stack: {
    Screen: () => null,
  },
  router: {
    push: (...args: any[]) => mockRouterPush(...args),
    back: (...args: any[]) => mockRouterBack(...args),
  },
  useLocalSearchParams: () => ({ id: '1' }),
  // useFocusEffect is a no-op in tests; initial load is handled by useEffect
  useFocusEffect: jest.fn(),
}));

// Mock expo-sqlite context
const mockDb = {
  execAsync: jest.fn(),
  getFirstAsync: jest.fn(),
  getAllAsync: jest.fn(),
  runAsync: jest.fn(),
};

jest.mock('expo-sqlite', () => ({
  useSQLiteContext: () => mockDb,
}));

// Mock DB repositories
const mockGetContenedorById = jest.fn();
const mockGetObjetosConPortadaByContenedor = jest.fn();
const mockDeleteObjeto = jest.fn();

jest.mock('../../src/db/contenedorRepository', () => ({
  getContenedorById: (...args: any[]) => mockGetContenedorById(...args),
}));

jest.mock('../../src/db/objetoRepository', () => ({
  getObjetosConPortadaByContenedor: (...args: any[]) => mockGetObjetosConPortadaByContenedor(...args),
  deleteObjeto: (...args: any[]) => mockDeleteObjeto(...args),
}));

// Mock fotoRepository
const mockGetFotosByObjeto = jest.fn();
const mockGetUrisByObjeto = jest.fn();

jest.mock('../../src/db/fotoRepository', () => ({
  getFotosByObjeto: (...args: any[]) => mockGetFotosByObjeto(...args),
  getUrisByObjeto: (...args: any[]) => mockGetUrisByObjeto(...args),
}));

// Mock imageStorage
jest.mock('../../src/utils/imageStorage', () => ({
  deleteImagesFromStorage: jest.fn().mockResolvedValue(undefined),
}));

// Mock VisorGaleria
jest.mock('../../src/components/VisorGaleria', () => {
  const React = require('react');
  const { View, Pressable, Text } = require('react-native');
  return {
    VisorGaleria: ({ visible, onClose }: any) =>
      visible
        ? React.createElement(
            View,
            { testID: 'visor-galeria-overlay' },
            React.createElement(
              Pressable,
              { onPress: onClose, accessibilityLabel: 'Cerrar visor de galería', testID: 'visor-galeria-close' },
              React.createElement(Text, null, 'Cerrar')
            )
          )
        : null,
  };
});

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const contenedorBase = {
  id: 1,
  nombre: 'Caja de herramientas',
  descripcion: 'Herramientas varias',
  ubicacion: 'Garaje',
};

const objetoConFoto = {
  id: 10,
  nombre: 'Martillo',
  descripcion: 'Martillo de carpintero',
  id_contenedor: 1,
  foto_uri: 'file:///foto-martillo.jpg',
  portada_uri: 'file:///foto-martillo.jpg',
};

const objetoSinFoto = {
  id: 11,
  nombre: 'Destornillador',
  descripcion: 'Phillips #2',
  id_contenedor: 1,
  foto_uri: null,
  portada_uri: null,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// Lazy import to ensure mocks are set up before the module loads
function renderScreen() {
  const DetalleContenedor = require('../../app/contenedor/[id]').default;
  return render(
    <ThemeProvider>
      <DetalleContenedor />
    </ThemeProvider>
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('DetalleContenedor — integración con VisorGaleria', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseColorScheme.mockReturnValue('dark');
    mockGetContenedorById.mockResolvedValue(contenedorBase);
    mockGetFotosByObjeto.mockResolvedValue([
      { id: 1, id_objeto: 10, uri: 'file:///foto-martillo.jpg', orden: 0 },
    ]);
    mockGetUrisByObjeto.mockResolvedValue(['file:///foto-martillo.jpg']);
  });

  // Requirement 4.1 / 5.1
  it('abre el VisorGaleria al tocar la portada de un objeto con foto', async () => {
    mockGetObjetosConPortadaByContenedor.mockResolvedValue([objetoConFoto]);

    renderScreen();

    // Wait for the list to load
    await waitFor(() => {
      expect(screen.getByLabelText('Ver foto de Martillo')).toBeTruthy();
    });

    // The viewer should not be visible yet
    expect(screen.queryByTestId('visor-galeria-overlay')).toBeNull();

    // Tap the photo
    fireEvent.press(screen.getByLabelText('Ver foto de Martillo'));

    // The viewer should now be open
    await waitFor(() => {
      expect(screen.getByTestId('visor-galeria-overlay')).toBeTruthy();
    });
  });

  // Requirement 4.2
  it('mantiene el placeholder sin apertura del visor cuando el objeto no tiene foto', async () => {
    mockGetObjetosConPortadaByContenedor.mockResolvedValue([objetoSinFoto]);

    renderScreen();

    await waitFor(() => {
      expect(screen.getByText('Destornillador')).toBeTruthy();
    });

    // No tap target for the photo should exist
    expect(screen.queryByLabelText('Ver foto de Destornillador')).toBeNull();

    // Viewer must remain closed
    expect(screen.queryByTestId('visor-galeria-overlay')).toBeNull();
  });

  // Requirement 5.3 — close via close button
  it('cierra el visor al tocar el botón de cierre y conserva el estado de la pantalla', async () => {
    mockGetObjetosConPortadaByContenedor.mockResolvedValue([objetoConFoto]);

    renderScreen();

    await waitFor(() => {
      expect(screen.getByLabelText('Ver foto de Martillo')).toBeTruthy();
    });

    // Open the viewer
    fireEvent.press(screen.getByLabelText('Ver foto de Martillo'));

    await waitFor(() => {
      expect(screen.getByTestId('visor-galeria-overlay')).toBeTruthy();
    });

    // Close via the close button
    fireEvent.press(screen.getByLabelText('Cerrar visor de galería'));

    await waitFor(() => {
      expect(screen.queryByTestId('visor-galeria-overlay')).toBeNull();
    });

    // The object list must still be rendered (state preserved)
    expect(screen.getByText('Martillo')).toBeTruthy();
  });

  // Requirement 5.4 — closing does not alter the list
  it('cerrar el visor no altera la lista de objetos ni el estado de la pantalla', async () => {
    mockGetObjetosConPortadaByContenedor.mockResolvedValue([objetoConFoto, objetoSinFoto]);

    renderScreen();

    await waitFor(() => {
      expect(screen.getByText('Martillo')).toBeTruthy();
      expect(screen.getByText('Destornillador')).toBeTruthy();
    });

    // Open and close the viewer
    fireEvent.press(screen.getByLabelText('Ver foto de Martillo'));

    await waitFor(() => {
      expect(screen.getByTestId('visor-galeria-overlay')).toBeTruthy();
    });

    fireEvent.press(screen.getByLabelText('Cerrar visor de galería'));

    await waitFor(() => {
      expect(screen.queryByTestId('visor-galeria-overlay')).toBeNull();
    });

    // Both items must still be present
    expect(screen.getByText('Martillo')).toBeTruthy();
    expect(screen.getByText('Destornillador')).toBeTruthy();
  });

  // Requirement 6.1 / 6.2 — delete object with photos
  it('elimina el objeto y sus fotos al confirmar la eliminación', async () => {
    mockGetObjetosConPortadaByContenedor.mockResolvedValue([objetoConFoto]);
    mockDeleteObjeto.mockResolvedValue(undefined);

    const { deleteImagesFromStorage } = require('../../src/utils/imageStorage');

    renderScreen();

    await waitFor(() => {
      expect(screen.getByText('Martillo')).toBeTruthy();
    });

    // Tap delete button
    fireEvent.press(screen.getByLabelText('Eliminar Martillo'));

    // Confirm dialog should appear
    await waitFor(() => {
      expect(screen.getByText('¿Eliminar este objeto?')).toBeTruthy();
    });

    // Confirm deletion
    fireEvent.press(screen.getByText('Eliminar'));

    await waitFor(() => {
      expect(mockGetUrisByObjeto).toHaveBeenCalledWith(mockDb, 10);
      expect(deleteImagesFromStorage).toHaveBeenCalled();
      expect(mockDeleteObjeto).toHaveBeenCalledWith(mockDb, 10);
    });
  });

  // Requirement 6.3 — delete object without photos
  it('elimina el objeto sin intentar borrar archivos si no tiene fotos', async () => {
    mockGetObjetosConPortadaByContenedor.mockResolvedValue([objetoSinFoto]);
    mockGetUrisByObjeto.mockResolvedValue([]);
    mockDeleteObjeto.mockResolvedValue(undefined);

    const { deleteImagesFromStorage } = require('../../src/utils/imageStorage');

    renderScreen();

    await waitFor(() => {
      expect(screen.getByText('Destornillador')).toBeTruthy();
    });

    fireEvent.press(screen.getByLabelText('Eliminar Destornillador'));

    await waitFor(() => {
      expect(screen.getByText('¿Eliminar este objeto?')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('Eliminar'));

    await waitFor(() => {
      expect(mockDeleteObjeto).toHaveBeenCalledWith(mockDb, 11);
    });

    // deleteImagesFromStorage should NOT have been called (no URIs)
    expect(deleteImagesFromStorage).not.toHaveBeenCalled();
  });
});
