import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { ThemeProvider } from '../../src/context/ThemeContext';
import { ObjetoItem } from '../../src/components/ObjetoItem';
import { Objeto } from '../../src/db/objetoRepository';

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

describe('ObjetoItem', () => {
  beforeEach(() => {
    mockUseColorScheme.mockReturnValue('dark');
  });

  const objetoConFoto: Objeto = {
    id: 1,
    nombre: 'Caja de cables',
    descripcion: 'Cables HDMI y USB',
    id_contenedor: 10,
    foto_uri: 'file:///foto.jpg',
  };

  const objetoSinFoto: Objeto = {
    ...objetoConFoto,
    foto_uri: null,
  };

  it('expone la foto como botón solo cuando existe foto_uri', () => {
    const onPressFoto = jest.fn();

    renderWithTheme(
      <ObjetoItem
        objeto={objetoConFoto}
        onEdit={jest.fn()}
        onDelete={jest.fn()}
        onPressFoto={onPressFoto}
      />
    );

    fireEvent.press(screen.getByLabelText('Ver foto de Caja de cables'));

    expect(onPressFoto).toHaveBeenCalledTimes(1);
  });

  it('mantiene el placeholder sin comportamiento de apertura cuando no hay foto', () => {
    renderWithTheme(
      <ObjetoItem
        objeto={objetoSinFoto}
        onEdit={jest.fn()}
        onDelete={jest.fn()}
        onPressFoto={jest.fn()}
      />
    );

    expect(screen.queryByLabelText('Ver foto de Caja de cables')).toBeNull();
  });
});