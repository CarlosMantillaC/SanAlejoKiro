/**
 * Integration tests for NuevoObjeto and EditarObjeto screens and ImageViewer integration.
 *
 * Validates: Requirements 1.2, 1.3, 3.4
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

// Mock expo-router
const mockRouterBack = jest.fn();

jest.mock('expo-router', () => ({
  Stack: {
    Screen: () => null,
  },
  router: {
    push: jest.fn(),
    back: (...args: any[]) => mockRouterBack(...args),
  },
  useLocalSearchParams: () => ({ id: '5', id_contenedor: '1' }),
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
const mockInsertObjeto = jest.fn();
const mockGetObjetoById = jest.fn();
const mockUpdateObjeto = jest.fn();

jest.mock('../../src/db/objetoRepository', () => ({
  insertObjeto: (...args: any[]) => mockInsertObjeto(...args),
  getObjetoById: (...args: any[]) => mockGetObjetoById(...args),
  updateObjeto: (...args: any[]) => mockUpdateObjeto(...args),
}));

// Mock imageStorage
jest.mock('../../src/utils/imageStorage', () => ({
  copyImageToStorage: jest.fn().mockResolvedValue('file:///stored-foto.jpg'),
  deleteImageFromStorage: jest.fn().mockResolvedValue(undefined),
}));

// Mock expo-image-picker (already has a manual mock, but explicit here for clarity)
jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  requestCameraPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  launchImageLibraryAsync: jest.fn().mockResolvedValue({ canceled: true, assets: [] }),
  launchCameraAsync: jest.fn().mockResolvedValue({ canceled: true, assets: [] }),
  MediaTypeOptions: { Images: 'Images' },
}));

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const objetoConFoto = {
  id: 5,
  nombre: 'Llave inglesa',
  descripcion: 'Llave ajustable 12"',
  id_contenedor: 1,
  foto_uri: 'file:///foto-llave.jpg',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function renderNuevoObjeto() {
  const NuevoObjeto = require('../../app/contenedor/objeto/nuevo').default;
  return render(
    <ThemeProvider>
      <NuevoObjeto />
    </ThemeProvider>
  );
}

function renderEditarObjeto() {
  const EditarObjeto = require('../../app/contenedor/objeto/editar/[id]').default;
  return render(
    <ThemeProvider>
      <EditarObjeto />
    </ThemeProvider>
  );
}

// ---------------------------------------------------------------------------
// NuevoObjeto tests
// ---------------------------------------------------------------------------

describe('NuevoObjeto — integración con ImageViewer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseColorScheme.mockReturnValue('dark');
  });

  // Requirement 1.3 — creation mode without image: viewer does not open
  it('no abre el visor en modo creación cuando no hay imagen seleccionada', () => {
    renderNuevoObjeto();

    // No preview tap target should exist
    expect(screen.queryByLabelText('Ver foto del objeto')).toBeNull();

    // Viewer must remain closed
    expect(screen.queryByTestId('image-viewer-overlay')).toBeNull();
  });

  // Requirement 1.3 — creation mode with image: viewer opens on preview tap
  it('abre el visor al tocar la vista previa en modo creación cuando hay imagen', async () => {
    const { copyImageToStorage } = require('../../src/utils/imageStorage');
    (copyImageToStorage as jest.Mock).mockResolvedValue('file:///stored-foto.jpg');

    const ImagePicker = require('expo-image-picker');
    ImagePicker.launchImageLibraryAsync.mockResolvedValueOnce({
      canceled: false,
      assets: [{ uri: 'file:///original-foto.jpg' }],
    });

    renderNuevoObjeto();

    // Trigger image selection via gallery button
    fireEvent.press(screen.getByLabelText('Seleccionar foto de galería'));

    // Wait for the preview to appear
    await waitFor(() => {
      expect(screen.getByLabelText('Ver foto del objeto')).toBeTruthy();
    });

    // Viewer should not be open yet
    expect(screen.queryByTestId('image-viewer-overlay')).toBeNull();

    // Tap the preview
    fireEvent.press(screen.getByLabelText('Ver foto del objeto'));

    await waitFor(() => {
      expect(screen.getByTestId('image-viewer-overlay')).toBeTruthy();
    });
  });

  // Requirement 3.4 — closing viewer does not modify form fields or foto_uri
  it('cerrar el visor no modifica los campos del formulario ni foto_uri', async () => {
    const { copyImageToStorage } = require('../../src/utils/imageStorage');
    (copyImageToStorage as jest.Mock).mockResolvedValue('file:///stored-foto.jpg');

    const ImagePicker = require('expo-image-picker');
    ImagePicker.launchImageLibraryAsync.mockResolvedValueOnce({
      canceled: false,
      assets: [{ uri: 'file:///original-foto.jpg' }],
    });

    renderNuevoObjeto();

    // Fill in the nombre field
    fireEvent.changeText(screen.getByLabelText('Nombre del objeto'), 'Llave inglesa');

    // Select an image
    fireEvent.press(screen.getByLabelText('Seleccionar foto de galería'));

    await waitFor(() => {
      expect(screen.getByLabelText('Ver foto del objeto')).toBeTruthy();
    });

    // Open the viewer
    fireEvent.press(screen.getByLabelText('Ver foto del objeto'));

    await waitFor(() => {
      expect(screen.getByTestId('image-viewer-overlay')).toBeTruthy();
    });

    // Close the viewer
    fireEvent.press(screen.getByLabelText('Cerrar visor de imagen'));

    await waitFor(() => {
      expect(screen.queryByTestId('image-viewer-overlay')).toBeNull();
    });

    // Form fields must be unchanged
    expect(screen.getByLabelText('Nombre del objeto').props.value).toBe('Llave inglesa');

    // Preview must still be present (foto_uri not cleared)
    expect(screen.getByLabelText('Ver foto del objeto')).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// EditarObjeto tests
// ---------------------------------------------------------------------------

describe('EditarObjeto — integración con ImageViewer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseColorScheme.mockReturnValue('dark');
    mockGetObjetoById.mockResolvedValue(objetoConFoto);
  });

  // Requirement 1.2 — edit mode: viewer opens on preview tap
  it('abre el visor al tocar la vista previa en modo edición', async () => {
    renderEditarObjeto();

    // Wait for the form to load with the existing image
    await waitFor(() => {
      expect(screen.getByLabelText('Ver foto del objeto')).toBeTruthy();
    });

    // Viewer should not be open yet
    expect(screen.queryByTestId('image-viewer-overlay')).toBeNull();

    // Tap the preview
    fireEvent.press(screen.getByLabelText('Ver foto del objeto'));

    await waitFor(() => {
      expect(screen.getByTestId('image-viewer-overlay')).toBeTruthy();
    });
  });

  // Requirement 3.4 — closing viewer does not modify form fields or foto_uri
  it('cerrar el visor no modifica los campos del formulario ni foto_uri en modo edición', async () => {
    renderEditarObjeto();

    await waitFor(() => {
      expect(screen.getByLabelText('Ver foto del objeto')).toBeTruthy();
    });

    // Verify the nombre field is pre-filled
    expect(screen.getByLabelText('Nombre del objeto').props.value).toBe('Llave inglesa');

    // Open the viewer
    fireEvent.press(screen.getByLabelText('Ver foto del objeto'));

    await waitFor(() => {
      expect(screen.getByTestId('image-viewer-overlay')).toBeTruthy();
    });

    // Close the viewer
    fireEvent.press(screen.getByLabelText('Cerrar visor de imagen'));

    await waitFor(() => {
      expect(screen.queryByTestId('image-viewer-overlay')).toBeNull();
    });

    // Form fields must be unchanged
    expect(screen.getByLabelText('Nombre del objeto').props.value).toBe('Llave inglesa');

    // Preview must still be present (foto_uri not cleared)
    expect(screen.getByLabelText('Ver foto del objeto')).toBeTruthy();
  });

  // Requirement 1.2 — edit mode without image: no viewer tap target
  it('no expone tap de vista previa cuando el objeto no tiene foto en modo edición', async () => {
    mockGetObjetoById.mockResolvedValue({ ...objetoConFoto, foto_uri: null });

    renderEditarObjeto();

    await waitFor(() => {
      expect(screen.getByLabelText('Nombre del objeto')).toBeTruthy();
    });

    expect(screen.queryByLabelText('Ver foto del objeto')).toBeNull();
    expect(screen.queryByTestId('image-viewer-overlay')).toBeNull();
  });
});
