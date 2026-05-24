import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { ThemeProvider } from '../../src/context/ThemeContext';
import { PanelFiltros } from '../../src/components/PanelFiltros';
import { DEFAULT_SORT_FILTER } from '../../src/hooks/useSortFilter';

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

const defaultProps = {
  visible: true,
  onClose: jest.fn(),
  state: DEFAULT_SORT_FILTER,
  ubicaciones: [],
  onCriterioChange: jest.fn(),
  onUbicacionChange: jest.fn(),
  onReset: jest.fn(),
  isNonDefault: false,
};

describe('PanelFiltros', () => {
  beforeEach(() => {
    mockUseColorScheme.mockReturnValue('dark');
    jest.clearAllMocks();
  });

  // Task 6.1: Verifica que la sección de ubicaciones no se renderiza cuando ubicaciones=[]
  it('oculta la sección de ubicaciones cuando ubicaciones es un array vacío', () => {
    renderWithTheme(<PanelFiltros {...defaultProps} ubicaciones={[]} />);

    expect(screen.queryByText('Filtrar por ubicación')).toBeNull();
  });

  it('muestra la sección de ubicaciones cuando hay ubicaciones disponibles', () => {
    renderWithTheme(
      <PanelFiltros {...defaultProps} ubicaciones={['Bodega', 'Sala']} />
    );

    expect(screen.getByText('Filtrar por ubicación')).toBeTruthy();
    expect(screen.getByText('Bodega')).toBeTruthy();
    expect(screen.getByText('Sala')).toBeTruthy();
  });

  it('muestra el título "Ordenar y filtrar"', () => {
    renderWithTheme(<PanelFiltros {...defaultProps} />);

    expect(screen.getByText('Ordenar y filtrar')).toBeTruthy();
  });

  it('el botón cerrar tiene accessibilityRole="button"', () => {
    renderWithTheme(<PanelFiltros {...defaultProps} />);

    const closeBtn = screen.getByLabelText('Cerrar panel de filtros');
    expect(closeBtn).toBeTruthy();
    expect(closeBtn.props.accessibilityRole).toBe('button');
  });

  it('llama a onClose al presionar el botón cerrar', () => {
    const onClose = jest.fn();
    renderWithTheme(<PanelFiltros {...defaultProps} onClose={onClose} />);

    fireEvent.press(screen.getByLabelText('Cerrar panel de filtros'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('muestra los tres botones de criterio de orden con accessibilityRole="button"', () => {
    renderWithTheme(<PanelFiltros {...defaultProps} />);

    const nombreBtn = screen.getByLabelText('Nombre, activo, orden ascendente');
    expect(nombreBtn.props.accessibilityRole).toBe('button');

    const fechaBtn = screen.getByLabelText('Ordenar por Fecha de creación');
    expect(fechaBtn.props.accessibilityRole).toBe('button');

    const cantidadBtn = screen.getByLabelText('Ordenar por Cantidad de objetos');
    expect(cantidadBtn.props.accessibilityRole).toBe('button');
  });

  it('llama a onCriterioChange al presionar un criterio', () => {
    const onCriterioChange = jest.fn();
    renderWithTheme(
      <PanelFiltros {...defaultProps} onCriterioChange={onCriterioChange} />
    );

    fireEvent.press(screen.getByLabelText('Ordenar por Fecha de creación'));
    expect(onCriterioChange).toHaveBeenCalledWith('fecha_creacion');
  });

  it('muestra el indicador de dirección (↑) en el criterio activo con dirección asc', () => {
    renderWithTheme(
      <PanelFiltros
        {...defaultProps}
        state={{ criterioOrden: 'nombre', direccionOrden: 'asc', filtroUbicacion: null }}
      />
    );

    expect(screen.getByText('↑')).toBeTruthy();
  });

  it('muestra el indicador de dirección (↓) en el criterio activo con dirección desc', () => {
    renderWithTheme(
      <PanelFiltros
        {...defaultProps}
        state={{ criterioOrden: 'nombre', direccionOrden: 'desc', filtroUbicacion: null }}
      />
    );

    expect(screen.getByText('↓')).toBeTruthy();
  });

  it('oculta el botón "Restablecer" cuando isNonDefault es false', () => {
    renderWithTheme(<PanelFiltros {...defaultProps} isNonDefault={false} />);

    expect(screen.queryByText('Restablecer')).toBeNull();
  });

  it('muestra el botón "Restablecer" cuando isNonDefault es true', () => {
    renderWithTheme(<PanelFiltros {...defaultProps} isNonDefault={true} />);

    expect(screen.getByText('Restablecer')).toBeTruthy();
  });

  it('llama a onReset al presionar el botón "Restablecer"', () => {
    const onReset = jest.fn();
    renderWithTheme(
      <PanelFiltros {...defaultProps} isNonDefault={true} onReset={onReset} />
    );

    fireEvent.press(screen.getByLabelText('Restablecer filtros y orden a valores predeterminados'));
    expect(onReset).toHaveBeenCalledTimes(1);
  });

  it('llama a onUbicacionChange al presionar un chip de ubicación', () => {
    const onUbicacionChange = jest.fn();
    renderWithTheme(
      <PanelFiltros
        {...defaultProps}
        ubicaciones={['Bodega', 'Sala']}
        onUbicacionChange={onUbicacionChange}
      />
    );

    fireEvent.press(screen.getByLabelText('Filtrar por ubicación Bodega'));
    expect(onUbicacionChange).toHaveBeenCalledWith('Bodega');
  });

  it('deselecciona la ubicación activa al presionar el chip seleccionado', () => {
    const onUbicacionChange = jest.fn();
    renderWithTheme(
      <PanelFiltros
        {...defaultProps}
        ubicaciones={['Bodega']}
        state={{ ...DEFAULT_SORT_FILTER, filtroUbicacion: 'Bodega' }}
        onUbicacionChange={onUbicacionChange}
      />
    );

    fireEvent.press(
      screen.getByLabelText('Ubicación Bodega, seleccionada. Toca para quitar el filtro')
    );
    expect(onUbicacionChange).toHaveBeenCalledWith(null);
  });
});
