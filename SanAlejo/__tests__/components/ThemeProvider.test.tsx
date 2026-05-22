/**
 * Unit tests for ThemeProvider and useTheme hook.
 *
 * **Validates: Requirements 11.1, 11.2, 11.3, 11.14**
 */

import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';
import { ThemeProvider, useTheme } from '../../src/context/ThemeContext';
import { darkTheme, lightTheme } from '../../src/theme';

// ---------------------------------------------------------------------------
// Mock useColorScheme so we can control the system scheme in tests
// ---------------------------------------------------------------------------

const mockUseColorScheme = jest.fn<string | null | undefined, []>();

jest.mock('react-native/Libraries/Utilities/useColorScheme', () => ({
  default: () => mockUseColorScheme(),
}));

// ---------------------------------------------------------------------------
// Helper component that reads the theme via useTheme
// ---------------------------------------------------------------------------

function ThemeConsumer() {
  const theme = useTheme();
  return (
    <Text testID="scheme">{theme.scheme}</Text>
  );
}

// ---------------------------------------------------------------------------
// ThemeProvider tests
// ---------------------------------------------------------------------------

describe('ThemeProvider', () => {
  beforeEach(() => {
    mockUseColorScheme.mockReset();
  });

  it("provee darkTheme cuando el esquema del sistema es 'dark'", () => {
    mockUseColorScheme.mockReturnValue('dark');

    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>
    );

    expect(screen.getByTestId('scheme').props.children).toBe('dark');
  });

  it("provee lightTheme cuando el esquema del sistema es 'light'", () => {
    mockUseColorScheme.mockReturnValue('light');

    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>
    );

    expect(screen.getByTestId('scheme').props.children).toBe('light');
  });

  it('provee lightTheme cuando el esquema del sistema es null (fallback)', () => {
    mockUseColorScheme.mockReturnValue(null);

    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>
    );

    expect(screen.getByTestId('scheme').props.children).toBe('light');
  });

  it('provee lightTheme cuando el esquema del sistema es undefined (fallback)', () => {
    mockUseColorScheme.mockReturnValue(undefined);

    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>
    );

    expect(screen.getByTestId('scheme').props.children).toBe('light');
  });

  it('expone el tema con colors y scheme válidos', () => {
    mockUseColorScheme.mockReturnValue('dark');

    function FullConsumer() {
      const theme = useTheme();
      return (
        <>
          <Text testID="scheme">{theme.scheme}</Text>
          <Text testID="accent">{theme.colors.accent}</Text>
        </>
      );
    }

    render(
      <ThemeProvider>
        <FullConsumer />
      </ThemeProvider>
    );

    expect(screen.getByTestId('scheme').props.children).toBe('dark');
    expect(screen.getByTestId('accent').props.children).toBe('#6366F1');
  });
});

// ---------------------------------------------------------------------------
// useTheme outside ThemeProvider
// ---------------------------------------------------------------------------

describe('useTheme fuera de ThemeProvider', () => {
  // Suppress the expected error output from React during this test
  let consoleError: jest.SpyInstance;

  beforeEach(() => {
    consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleError.mockRestore();
  });

  it("lanza error 'useTheme debe usarse dentro de ThemeProvider' cuando se usa fuera del provider", () => {
    function BareConsumer() {
      useTheme(); // should throw
      return null;
    }

    expect(() => render(<BareConsumer />)).toThrow(
      'useTheme debe usarse dentro de ThemeProvider'
    );
  });
});
