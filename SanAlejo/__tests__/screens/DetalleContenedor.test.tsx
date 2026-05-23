/**
 * Integration tests for the DetalleContenedor screen and ImageViewer integration.
 *
 * Validates: Requirements 1.1, 1.4, 3.1, 3.2, 3.4
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
const mockGetObjetosByContenedor = jest.fn();
const mockDeleteObjeto = jest.fn();

jest.mock('../../src/db/contenedorRepository', () => ({
  getContenedorById: (...args: any[]) => mockGetContenedorById(...args),
}));

jest.mock('../../src/db/objetoRepository', () => ({
  getObjetosByContenedor: (...args: any[]) => mockGetObjetosByContenedor(...args),
  deleteObjeto: (...args: any[]) => mockDeleteObjeto(...args),
}));

// Mock imageStorage
jest.mock('../../src/utils/imageStorage', () => ({
  deleteImageFromStorage: jest.fn().mockResolvedValue(undefined),
}));

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
};

const objetoSinFoto = {
  id: 11,
  nombre: 'Destornillador',
  descripcion: 'Phillips #2',
  id_contenedor: 1,
  foto_uri: null,
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

describe('DetalleContenedor — integración con ImageViewer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseColorScheme.mockReturnValue('dark');
    mockGetContenedorById.mockResolvedValue(contenedorBase);
  });

  // Requirement 1.1
  it('abre el ImageViewer al tocar la foto de un objeto con foto_uri', async () => {
    mockGetObjetosByContenedor.mockResolvedValue([objetoConFoto]);

    renderScreen();

    // Wait for the list to load
    await waitFor(() => {
      expect(screen.getByLabelText('Ver foto de Martillo')).toBeTruthy();
    });

    // The viewer should not be visible yet
    expect(screen.queryByTestId('image-viewer-overlay')).toBeNull();

    // Tap the photo
    fireEvent.press(screen.getByLabelText('Ver foto de Martillo'));

    // The viewer should now be open
    await waitFor(() => {
      expect(screen.getByTestId('image-viewer-overlay')).toBeTruthy();
    });
  });

  // Requirement 1.4
  it('mantiene el placeholder sin apertura del visor cuando el objeto no tiene foto', async () => {
    mockGetObjetosByContenedor.mockResolvedValue([objetoSinFoto]);

    renderScreen();

    await waitFor(() => {
      expect(screen.getByText('Destornillador')).toBeTruthy();
    });

    // No tap target for the photo should exist
    expect(screen.queryByLabelText('Ver foto de Destornillador')).toBeNull();

    // Viewer must remain closed
    expect(screen.queryByTestId('image-viewer-overlay')).toBeNull();
  });

  // Requirement 3.1 — close via close button
  it('cierra el visor al tocar el botón de cierre y conserva el estado de la pantalla', async () => {
    mockGetObjetosByContenedor.mockResolvedValue([objetoConFoto]);

    renderScreen();

    await waitFor(() => {
      expect(screen.getByLabelText('Ver foto de Martillo')).toBeTruthy();
    });

    // Open the viewer
    fireEvent.press(screen.getByLabelText('Ver foto de Martillo'));

    await waitFor(() => {
      expect(screen.getByTestId('image-viewer-overlay')).toBeTruthy();
    });

    // Close via the close button
    fireEvent.press(screen.getByLabelText('Cerrar visor de imagen'));

    await waitFor(() => {
      expect(screen.queryByTestId('image-viewer-overlay')).toBeNull();
    });

    // The object list must still be rendered (state preserved)
    expect(screen.getByText('Martillo')).toBeTruthy();
  });

  // Requirement 3.2 — close via overlay
  it('cierra el visor al tocar el overlay fuera de la imagen', async () => {
    mockGetObjetosByContenedor.mockResolvedValue([objetoConFoto]);

    renderScreen();

    await waitFor(() => {
      expect(screen.getByLabelText('Ver foto de Martillo')).toBeTruthy();
    });

    fireEvent.press(screen.getByLabelText('Ver foto de Martillo'));

    await waitFor(() => {
      expect(screen.getByTestId('image-viewer-close-overlay')).toBeTruthy();
    });

    fireEvent.press(screen.getByTestId('image-viewer-close-overlay'));

    await waitFor(() => {
      expect(screen.queryByTestId('image-viewer-overlay')).toBeNull();
    });
  });

  // Requirement 3.4 — closing does not alter the list
  it('cerrar el visor no altera la lista de objetos ni el estado de la pantalla', async () => {
    mockGetObjetosByContenedor.mockResolvedValue([objetoConFoto, objetoSinFoto]);

    renderScreen();

    await waitFor(() => {
      expect(screen.getByText('Martillo')).toBeTruthy();
      expect(screen.getByText('Destornillador')).toBeTruthy();
    });

    // Open and close the viewer
    fireEvent.press(screen.getByLabelText('Ver foto de Martillo'));

    await waitFor(() => {
      expect(screen.getByTestId('image-viewer-overlay')).toBeTruthy();
    });

    fireEvent.press(screen.getByLabelText('Cerrar visor de imagen'));

    await waitFor(() => {
      expect(screen.queryByTestId('image-viewer-overlay')).toBeNull();
    });

    // Both items must still be present
    expect(screen.getByText('Martillo')).toBeTruthy();
    expect(screen.getByText('Destornillador')).toBeTruthy();
  });
});
