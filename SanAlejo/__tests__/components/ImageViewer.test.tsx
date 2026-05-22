import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Text } from 'react-native';
import { ThemeProvider } from '../../src/context/ThemeContext';
import { ImageViewer } from '../../src/components/ImageViewer';

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

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
}

describe('ImageViewer', () => {
  beforeEach(() => {
    mockUseColorScheme.mockReturnValue('dark');
  });

  it('no renderiza elementos visuales cuando visible es false', () => {
    renderWithTheme(
      <ImageViewer uri="file:///foto.jpg" visible={false} onClose={jest.fn()} />
    );

    expect(screen.queryByTestId('image-viewer-overlay')).toBeNull();
    expect(screen.queryByLabelText('Cerrar visor de imagen')).toBeNull();
    expect(screen.queryByText('No se pudo cargar la imagen')).toBeNull();
  });

  it('renderiza el modal, overlay e imagen cuando visible es true', () => {
    renderWithTheme(
      <ImageViewer uri="file:///foto.jpg" visible onClose={jest.fn()} />
    );

    expect(screen.getByTestId('image-viewer-overlay')).toBeTruthy();
    expect(screen.getByLabelText('Cerrar visor de imagen').props.accessibilityRole).toBe('button');
    expect(screen.getByLabelText('Vista ampliada de la imagen')).toBeTruthy();
  });

  it('llama onClose cuando se toca el botón de cierre', () => {
    const onClose = jest.fn();

    renderWithTheme(
      <ImageViewer uri="file:///foto.jpg" visible onClose={onClose} />
    );

    fireEvent.press(screen.getByLabelText('Cerrar visor de imagen'));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('llama onClose cuando se toca el overlay', () => {
    const onClose = jest.fn();

    renderWithTheme(
      <ImageViewer uri="file:///foto.jpg" visible onClose={onClose} />
    );

    fireEvent.press(screen.getByTestId('image-viewer-overlay'));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('muestra el estado de error cuando la imagen falla al cargar', async () => {
    renderWithTheme(
      <ImageViewer uri="file:///foto-inexistente.jpg" visible onClose={jest.fn()} />
    );

    fireEvent(screen.getByLabelText('Vista ampliada de la imagen'), 'error');

    await waitFor(() => {
      expect(screen.getByText('No se pudo cargar la imagen')).toBeTruthy();
    });
    expect(screen.queryByLabelText('Vista ampliada de la imagen')).toBeNull();
  });

  it('usa los tokens del tema oscuro', () => {
    mockUseColorScheme.mockReturnValue('dark');

    renderWithTheme(
      <ImageViewer uri="file:///foto.jpg" visible onClose={jest.fn()} />
    );

    expect(screen.getByTestId('image-viewer-overlay')).toHaveStyle({
      backgroundColor: 'rgba(0,0,0,0.65)',
    });

    expect(screen.getByTestId('icon-close').props.color).toBe('#FFFFFF');
  });

  it('usa los tokens del tema light', () => {
    mockUseColorScheme.mockReturnValue('light');

    renderWithTheme(
      <ImageViewer uri="file:///foto.jpg" visible onClose={jest.fn()} />
    );

    expect(screen.getByTestId('image-viewer-overlay')).toHaveStyle({
      backgroundColor: 'rgba(0,0,0,0.45)',
    });
  });

  it('mantiene una etiqueta accesible descriptiva para la imagen', () => {
    renderWithTheme(
      <ImageViewer uri="file:///foto.jpg" visible onClose={jest.fn()} />
    );

    expect(screen.getByLabelText('Vista ampliada de la imagen').props.accessibilityLabel).toBe(
      'Vista ampliada de la imagen'
    );
  });
});