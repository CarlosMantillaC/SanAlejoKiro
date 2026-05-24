/**
 * Integration tests for NuevoObjeto and EditarObjeto screens.
 *
 * Validates: Requirements 1.2, 1.3, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 3.4, 3.5, 3.6, 3.7
 */

import React from 'react';
import { fireEvent, render, screen, waitFor, act } from '@testing-library/react-native';
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
const mockNavigationAddListener = jest.fn();

jest.mock('expo-router', () => ({
  Stack: {
    Screen: () => null,
  },
  router: {
    push: jest.fn(),
    back: (...args: any[]) => mockRouterBack(...args),
  },
  useLocalSearchParams: () => ({ id: '5', id_contenedor: '1' }),
  useNavigation: () => ({
    addListener: mockNavigationAddListener,
  }),
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
const mockInsertFotos = jest.fn();

jest.mock('../../src/db/objetoRepository', () => ({
  insertObjeto: (...args: any[]) => mockInsertObjeto(...args),
  getObjetoById: (...args: any[]) => mockGetObjetoById(...args),
  updateObjeto: (...args: any[]) => mockUpdateObjeto(...args),
}));

const mockSyncFotos = jest.fn();

jest.mock('../../src/db/fotoRepository', () => ({
  insertFotos: (...args: any[]) => mockInsertFotos(...args),
  getFotosByObjeto: jest.fn().mockResolvedValue([]),
  syncFotos: (...args: any[]) => mockSyncFotos(...args),
}));

// Mock imageStorage
const mockDeleteImagesFromStorage = jest.fn();

jest.mock('../../src/utils/imageStorage', () => ({
  copyImageToStorage: jest.fn().mockResolvedValue('file:///stored-foto.jpg'),
  deleteImageFromStorage: jest.fn().mockResolvedValue(undefined),
  deleteImagesFromStorage: (...args: any[]) => mockDeleteImagesFromStorage(...args),
}));

// Mock expo-image-picker
jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  requestCameraPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  launchImageLibraryAsync: jest.fn().mockResolvedValue({ canceled: true, assets: [] }),
  launchCameraAsync: jest.fn().mockResolvedValue({ canceled: true, assets: [] }),
  MediaTypeOptions: { Images: 'Images' },
}));

// Mock GaleriaEditor to simplify testing of NuevoObjeto
// The mock exposes a button that simulates adding a photo
jest.mock('../../src/components/GaleriaEditor', () => {
  const React = require('react');
  const { Pressable, Text } = require('react-native');
  return {
    GaleriaEditor: ({ onFotosChange, onPermissionDenied, onError }: any) =>
      React.createElement(
        Pressable,
        {
          onPress: () =>
            onFotosChange([{ id: null, uri: 'file:///test.jpg', isNew: true }]),
          accessibilityLabel: 'Mock Galeria',
          testID: 'mock-galeria-editor',
        },
        React.createElement(Text, null, 'Agregar foto')
      ),
  };
});

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

describe('NuevoObjeto — integración con GaleriaEditor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseColorScheme.mockReturnValue('dark');
    // Default: addListener returns an unsubscribe function
    mockNavigationAddListener.mockReturnValue(() => {});
    mockInsertObjeto.mockResolvedValue(42);
    mockInsertFotos.mockResolvedValue(undefined);
    mockDeleteImagesFromStorage.mockResolvedValue(undefined);
  });

  // Requirement 2.1, 2.2 — GaleriaEditor is rendered
  it('renderiza el componente GaleriaEditor', () => {
    renderNuevoObjeto();
    expect(screen.getByTestId('mock-galeria-editor')).toBeTruthy();
  });

  // Requirement 2.5, 2.6 — saving with no photos calls insertObjeto with foto_uri: null and insertFotos with empty array
  it('al guardar sin fotos llama insertObjeto con foto_uri: null e insertFotos con array vacío', async () => {
    renderNuevoObjeto();

    fireEvent.changeText(screen.getByLabelText('Nombre del objeto'), 'Martillo');
    fireEvent.changeText(screen.getByLabelText('Descripción del objeto'), 'Martillo de carpintero');

    fireEvent.press(screen.getByLabelText('Guardar objeto'));

    await waitFor(() => {
      expect(mockInsertObjeto).toHaveBeenCalledWith(
        mockDb,
        expect.objectContaining({ nombre: 'Martillo', foto_uri: null })
      );
    });

    await waitFor(() => {
      expect(mockInsertFotos).toHaveBeenCalledWith(mockDb, 42, []);
    });

    expect(mockRouterBack).toHaveBeenCalled();
  });

  // Requirement 2.5, 2.6 — saving with photos calls insertFotos with correct URIs
  it('al guardar con fotos llama insertFotos con las URIs correctas', async () => {
    renderNuevoObjeto();

    fireEvent.changeText(screen.getByLabelText('Nombre del objeto'), 'Martillo');
    fireEvent.changeText(screen.getByLabelText('Descripción del objeto'), 'Martillo de carpintero');

    // Simulate adding a photo via the mock GaleriaEditor
    fireEvent.press(screen.getByTestId('mock-galeria-editor'));

    fireEvent.press(screen.getByLabelText('Guardar objeto'));

    await waitFor(() => {
      expect(mockInsertObjeto).toHaveBeenCalledWith(
        mockDb,
        expect.objectContaining({ nombre: 'Martillo', foto_uri: null })
      );
    });

    await waitFor(() => {
      expect(mockInsertFotos).toHaveBeenCalledWith(mockDb, 42, ['file:///test.jpg']);
    });

    expect(mockRouterBack).toHaveBeenCalled();
  });

  // Requirement 3.7 — DB error shows banner and does not navigate
  it('error de BD al guardar muestra el banner de error y no navega', async () => {
    mockInsertObjeto.mockRejectedValue(new Error('DB error'));

    renderNuevoObjeto();

    fireEvent.changeText(screen.getByLabelText('Nombre del objeto'), 'Martillo');
    fireEvent.changeText(screen.getByLabelText('Descripción del objeto'), 'Martillo de carpintero');
    fireEvent.press(screen.getByLabelText('Guardar objeto'));

    await waitFor(() => {
      expect(screen.getByText('No se pudo guardar el objeto.')).toBeTruthy();
    });

    expect(mockRouterBack).not.toHaveBeenCalled();
  });

  // Requirement 3.7 — insertFotos error shows banner and does not navigate
  it('error de insertFotos al guardar muestra el banner de error y no navega', async () => {
    mockInsertFotos.mockRejectedValue(new Error('DB error'));

    renderNuevoObjeto();

    fireEvent.changeText(screen.getByLabelText('Nombre del objeto'), 'Martillo');
    fireEvent.changeText(screen.getByLabelText('Descripción del objeto'), 'Martillo de carpintero');
    fireEvent.press(screen.getByLabelText('Guardar objeto'));

    await waitFor(() => {
      expect(screen.getByText('No se pudo guardar el objeto.')).toBeTruthy();
    });

    expect(mockRouterBack).not.toHaveBeenCalled();
  });

  // Requirement 3.6 — beforeRemove listener is registered
  it('registra un listener beforeRemove para limpiar fotos nuevas al cancelar', () => {
    renderNuevoObjeto();
    expect(mockNavigationAddListener).toHaveBeenCalledWith('beforeRemove', expect.any(Function));
  });

  // Property 9 — Validates: Requirements 3.6
  // Al cancelar, deleteImagesFromStorage recibe exactamente las fotos nuevas no guardadas
  it('al activar beforeRemove con fotos nuevas, llama deleteImagesFromStorage con esas URIs', async () => {
    let capturedBeforeRemoveHandler: (() => Promise<void>) | null = null;
    mockNavigationAddListener.mockImplementation((event: string, handler: () => Promise<void>) => {
      if (event === 'beforeRemove') {
        capturedBeforeRemoveHandler = handler;
      }
      return () => {};
    });

    renderNuevoObjeto();

    // Add a photo via the mock GaleriaEditor
    fireEvent.press(screen.getByTestId('mock-galeria-editor'));

    // Simulate navigation back (beforeRemove fires)
    expect(capturedBeforeRemoveHandler).not.toBeNull();
    await act(async () => {
      await capturedBeforeRemoveHandler!();
    });

    expect(mockDeleteImagesFromStorage).toHaveBeenCalledWith(['file:///test.jpg']);
  });

  // Property 9 — Al cancelar sin fotos nuevas, no llama deleteImagesFromStorage
  it('al activar beforeRemove sin fotos nuevas, no llama deleteImagesFromStorage', async () => {
    let capturedBeforeRemoveHandler: (() => Promise<void>) | null = null;
    mockNavigationAddListener.mockImplementation((event: string, handler: () => Promise<void>) => {
      if (event === 'beforeRemove') {
        capturedBeforeRemoveHandler = handler;
      }
      return () => {};
    });

    renderNuevoObjeto();

    // No photos added

    expect(capturedBeforeRemoveHandler).not.toBeNull();
    await act(async () => {
      await capturedBeforeRemoveHandler!();
    });

    expect(mockDeleteImagesFromStorage).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// EditarObjeto tests
// ---------------------------------------------------------------------------

describe('EditarObjeto — integración con GaleriaEditor', () => {
  const { getFotosByObjeto } = require('../../src/db/fotoRepository');

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseColorScheme.mockReturnValue('dark');
    mockGetObjetoById.mockResolvedValue(objetoConFoto);
    mockNavigationAddListener.mockReturnValue(() => {});
    mockUpdateObjeto.mockResolvedValue(undefined);
    mockSyncFotos.mockResolvedValue(undefined);
    mockDeleteImagesFromStorage.mockResolvedValue(undefined);
    getFotosByObjeto.mockResolvedValue([]);
  });

  // Requirement 3.1 — GaleriaEditor is rendered after loading
  it('renderiza el componente GaleriaEditor tras cargar', async () => {
    renderEditarObjeto();

    await waitFor(() => {
      expect(screen.getByTestId('mock-galeria-editor')).toBeTruthy();
    });
  });

  // Requirement 3.2 — getFotosByObjeto is called on load
  it('llama getFotosByObjeto al cargar el objeto', async () => {
    renderEditarObjeto();

    await waitFor(() => {
      expect(getFotosByObjeto).toHaveBeenCalledWith(mockDb, 5);
    });
  });

  // Requirement 3.1 — pre-fills form fields from loaded object
  it('pre-rellena los campos del formulario con los datos del objeto', async () => {
    renderEditarObjeto();

    await waitFor(() => {
      expect(screen.getByLabelText('Nombre del objeto').props.value).toBe('Llave inglesa');
    });

    expect(screen.getByLabelText('Descripción del objeto').props.value).toBe('Llave ajustable 12"');
  });

  // Requirement 3.3, 3.4 — saving calls syncFotos with correct parameters
  it('al guardar llama syncFotos con los parámetros correctos', async () => {
    // Simulate existing photo loaded from DB
    getFotosByObjeto.mockResolvedValue([{ id: 10, id_objeto: 5, uri: 'file:///existing.jpg', orden: 0 }]);

    renderEditarObjeto();

    await waitFor(() => {
      expect(screen.getByTestId('mock-galeria-editor')).toBeTruthy();
    });

    fireEvent.press(screen.getByLabelText('Guardar objeto'));

    await waitFor(() => {
      expect(mockUpdateObjeto).toHaveBeenCalledWith(mockDb, 5, {
        nombre: 'Llave inglesa',
        descripcion: 'Llave ajustable 12"',
        foto_uri: null,
      });
    });

    await waitFor(() => {
      // No deletions, no new uris, existing photo id in orderedIds
      expect(mockSyncFotos).toHaveBeenCalledWith(mockDb, 5, [], [], [10]);
    });

    expect(mockRouterBack).toHaveBeenCalled();
  });

  // Requirement 3.5 — deleteImagesFromStorage called for removed photos
  it('al guardar con fotos eliminadas llama deleteImagesFromStorage con las URIs removidas', async () => {
    // Simulate existing photo loaded from DB
    getFotosByObjeto.mockResolvedValue([{ id: 10, id_objeto: 5, uri: 'file:///existing.jpg', orden: 0 }]);

    renderEditarObjeto();

    await waitFor(() => {
      expect(screen.getByTestId('mock-galeria-editor')).toBeTruthy();
    });

    // Simulate removing the existing photo via GaleriaEditor (empty fotos)
    fireEvent.press(screen.getByTestId('mock-galeria-editor'));
    // After pressing, mock sets fotos to [{ id: null, uri: 'file:///test.jpg', isNew: true }]
    // The existing photo (id:10) is no longer in fotos → it's deleted

    fireEvent.press(screen.getByLabelText('Guardar objeto'));

    await waitFor(() => {
      expect(mockSyncFotos).toHaveBeenCalledWith(
        mockDb,
        5,
        [10],                      // deletedIds
        ['file:///test.jpg'],      // newUris
        []                         // orderedIds (no existing non-new photos)
      );
    });

    await waitFor(() => {
      expect(mockDeleteImagesFromStorage).toHaveBeenCalledWith(['file:///existing.jpg']);
    });
  });

  // Requirement 3.7 — DB error shows banner and does not navigate
  it('error de BD al guardar muestra el banner de error y no navega', async () => {
    mockUpdateObjeto.mockRejectedValue(new Error('DB error'));

    renderEditarObjeto();

    await waitFor(() => {
      expect(screen.getByTestId('mock-galeria-editor')).toBeTruthy();
    });

    fireEvent.changeText(screen.getByLabelText('Nombre del objeto'), 'Llave inglesa');
    fireEvent.changeText(screen.getByLabelText('Descripción del objeto'), 'Llave ajustable 12"');
    fireEvent.press(screen.getByLabelText('Guardar objeto'));

    await waitFor(() => {
      expect(screen.getByText('No se pudo guardar el objeto.')).toBeTruthy();
    });

    expect(mockRouterBack).not.toHaveBeenCalled();
  });

  // Requirement 3.6 — beforeRemove listener is registered
  it('registra un listener beforeRemove para limpiar fotos nuevas al cancelar', async () => {
    renderEditarObjeto();

    await waitFor(() => {
      expect(screen.getByTestId('mock-galeria-editor')).toBeTruthy();
    });

    expect(mockNavigationAddListener).toHaveBeenCalledWith('beforeRemove', expect.any(Function));
  });

  // Requirement 3.6 — beforeRemove cleans up new photos
  it('al activar beforeRemove con fotos nuevas, llama deleteImagesFromStorage con esas URIs', async () => {
    let capturedBeforeRemoveHandler: (() => Promise<void>) | null = null;
    mockNavigationAddListener.mockImplementation((event: string, handler: () => Promise<void>) => {
      if (event === 'beforeRemove') {
        capturedBeforeRemoveHandler = handler;
      }
      return () => {};
    });

    renderEditarObjeto();

    await waitFor(() => {
      expect(screen.getByTestId('mock-galeria-editor')).toBeTruthy();
    });

    // Add a new photo via the mock GaleriaEditor
    fireEvent.press(screen.getByTestId('mock-galeria-editor'));

    // Simulate navigation back (beforeRemove fires)
    expect(capturedBeforeRemoveHandler).not.toBeNull();
    await act(async () => {
      await capturedBeforeRemoveHandler!();
    });

    expect(mockDeleteImagesFromStorage).toHaveBeenCalledWith(['file:///test.jpg']);
  });

  // Requirement 3.6 — beforeRemove does not call deleteImagesFromStorage when no new photos
  it('al activar beforeRemove sin fotos nuevas, no llama deleteImagesFromStorage', async () => {
    let capturedBeforeRemoveHandler: (() => Promise<void>) | null = null;
    mockNavigationAddListener.mockImplementation((event: string, handler: () => Promise<void>) => {
      if (event === 'beforeRemove') {
        capturedBeforeRemoveHandler = handler;
      }
      return () => {};
    });

    renderEditarObjeto();

    await waitFor(() => {
      expect(screen.getByTestId('mock-galeria-editor')).toBeTruthy();
    });

    // No new photos added

    expect(capturedBeforeRemoveHandler).not.toBeNull();
    await act(async () => {
      await capturedBeforeRemoveHandler!();
    });

    expect(mockDeleteImagesFromStorage).not.toHaveBeenCalled();
  });
});
