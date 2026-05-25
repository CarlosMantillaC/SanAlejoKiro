/**
 * Property/unit tests for theme contrast (Property 17)
 */

import { lightColors } from '../../src/theme';

function hexToRgb(hex: string) {
  const h = hex.replace('#', '');
  const normalized = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
  const bigint = parseInt(normalized, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return { r, g, b };
}

function srgbToLinear(c: number) {
  const v = c / 255;
  return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}

function relativeLuminance(hex: string) {
  const { r, g, b } = hexToRgb(hex);
  const R = srgbToLinear(r);
  const G = srgbToLinear(g);
  const B = srgbToLinear(b);
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

function contrastRatio(hex1: string, hex2: string) {
  const L1 = relativeLuminance(hex1);
  const L2 = relativeLuminance(hex2);
  const lighter = Math.max(L1, L2);
  const darker = Math.min(L1, L2);
  return (lighter + 0.05) / (darker + 0.05);
}

describe('Property 17: Contraste WCAG AA en tema light', () => {
  it('textos principales y secundarios tienen contraste ≥ 4.5:1 frente a fondos principales', () => {
    const textColors = [lightColors.textPrimary, lightColors.textSecondary, lightColors.textMuted];
    const bgColors = [lightColors.bgBase, lightColors.bgSurface, lightColors.bgElevated];

    for (const tc of textColors) {
      for (const bc of bgColors) {
        const ratio = contrastRatio(tc, bc);
        expect(ratio).toBeGreaterThanOrEqual(4.5);
      }
    }
  });
});
/**
 * Unit and property-based tests for the theme system.
 *
 * **Validates: Requirements 11.1, 11.3, 11.4, 11.5, 11.13, 11.14**
 */

import fc from 'fast-check';
import {
  darkTheme,
  lightTheme,
  resolveTheme,
  darkColors,
  lightColors,
  Theme,
} from '../../src/theme';

// ---------------------------------------------------------------------------
// Helper: WCAG 2.1 relative luminance and contrast ratio
// ---------------------------------------------------------------------------

/**
 * Converts a hex color string (#RRGGBB) to its WCAG 2.1 relative luminance.
 * https://www.w3.org/TR/WCAG21/#dfn-relative-luminance
 */
function relativeLuminance(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const linearize = (c: number) =>
    c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);

  return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
}

/**
 * Computes the WCAG 2.1 contrast ratio between two hex colors.
 * Returns a value between 1 (no contrast) and 21 (maximum contrast).
 */
function contrastRatio(hex1: string, hex2: string): number {
  const l1 = relativeLuminance(hex1);
  const l2 = relativeLuminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

// ---------------------------------------------------------------------------
// Property 17: Contraste WCAG AA en ambos temas
// ---------------------------------------------------------------------------

describe('Property 17: Contraste WCAG AA en el tema light', () => {
  // Feature: san-alejo-app, Property 17: Contraste WCAG AA en el tema light
  const textColors = [
    { name: 'textPrimary', value: lightColors.textPrimary },
    { name: 'textSecondary', value: lightColors.textSecondary },
    { name: 'textMuted', value: lightColors.textMuted },
  ];

  const bgColors = [
    { name: 'bgBase', value: lightColors.bgBase },
    { name: 'bgSurface', value: lightColors.bgSurface },
    { name: 'bgElevated', value: lightColors.bgElevated },
  ];

  for (const text of textColors) {
    for (const bg of bgColors) {
      it(`${text.name} (${text.value}) sobre ${bg.name} (${bg.value}) tiene contraste ≥ 4.5:1`, () => {
        // Feature: san-alejo-app, Property 17: Contraste WCAG AA en el tema light
        const ratio = contrastRatio(text.value, bg.value);
        expect(ratio).toBeGreaterThanOrEqual(4.5);
      });
    }
  }
});

describe('Property 17: Contraste WCAG AA en el tema dark', () => {
  // Feature: san-alejo-app, Property 17: Contraste WCAG AA en el tema dark
  const textColors = [
    { name: 'textPrimary', value: darkColors.textPrimary },
    { name: 'textSecondary', value: darkColors.textSecondary },
    { name: 'textMuted', value: darkColors.textMuted },
  ];

  const bgColors = [
    { name: 'bgBase', value: darkColors.bgBase },
    { name: 'bgSurface', value: darkColors.bgSurface },
    { name: 'bgElevated', value: darkColors.bgElevated },
    { name: 'bgMuted', value: darkColors.bgMuted },
  ];

  for (const text of textColors) {
    for (const bg of bgColors) {
      it(`${text.name} (${text.value}) sobre ${bg.name} (${bg.value}) tiene contraste ≥ 4.5:1`, () => {
        // Feature: san-alejo-app, Property 17: Contraste WCAG AA en el tema dark
        const ratio = contrastRatio(text.value, bg.value);
        expect(ratio).toBeGreaterThanOrEqual(4.5);
      });
    }
  }
});

// ---------------------------------------------------------------------------
// Property 18: Invariancia del color de acento
// ---------------------------------------------------------------------------

describe('Property 18: Invariancia del color de acento en ambos temas', () => {
  it('el color de acento es #6366F1 en cualquier tema válido', () => {
    // Feature: san-alejo-app, Property 18: Invariancia del color de acento en ambos temas
    fc.assert(
      fc.property(
        fc.constantFrom(darkTheme, lightTheme),
        (theme: Theme) => {
          return theme.colors.accent === '#6366F1';
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Unit tests for resolveTheme
// Requirements: 11.1, 11.14
// ---------------------------------------------------------------------------

describe('resolveTheme — unit tests', () => {
  it("retorna darkTheme cuando colorScheme es 'dark'", () => {
    const result = resolveTheme('dark');
    expect(result).toBe(darkTheme);
    expect(result.scheme).toBe('dark');
  });

  it("retorna lightTheme cuando colorScheme es 'light'", () => {
    const result = resolveTheme('light');
    expect(result).toBe(lightTheme);
    expect(result.scheme).toBe('light');
  });

  it('retorna lightTheme cuando colorScheme es null (fallback)', () => {
    const result = resolveTheme(null);
    expect(result).toBe(lightTheme);
    expect(result.scheme).toBe('light');
  });

  it('retorna lightTheme cuando colorScheme es undefined (fallback)', () => {
    const result = resolveTheme(undefined);
    expect(result).toBe(lightTheme);
    expect(result.scheme).toBe('light');
  });

  it('retorna lightTheme para cualquier valor desconocido', () => {
    const result = resolveTheme('system');
    expect(result).toBe(lightTheme);
    expect(result.scheme).toBe('light');
  });
});

// ---------------------------------------------------------------------------
// Unit tests for theme structure
// Requirements: 11.4, 11.5
// ---------------------------------------------------------------------------

describe('darkTheme — estructura y valores', () => {
  it('tiene scheme dark', () => {
    expect(darkTheme.scheme).toBe('dark');
  });

  it('tiene fondo base #0F172A', () => {
    expect(darkTheme.colors.bgBase).toBe('#0F172A');
  });

  it('tiene fondo surface #1E293B', () => {
    expect(darkTheme.colors.bgSurface).toBe('#1E293B');
  });

  it('tiene texto primario #F1F5F9', () => {
    expect(darkTheme.colors.textPrimary).toBe('#F1F5F9');
  });

  it('tiene texto secundario #9EAEC2', () => {
    expect(darkTheme.colors.textSecondary).toBe('#9EAEC2');
  });

  it('tiene acento #6366F1', () => {
    expect(darkTheme.colors.accent).toBe('#6366F1');
  });
});

describe('lightTheme — estructura y valores', () => {
  it('tiene scheme light', () => {
    expect(lightTheme.scheme).toBe('light');
  });

  it('tiene fondo base con luminosidad mínima #F8FAFC', () => {
    // bgBase must be at least as bright as #F8FAFC
    expect(lightTheme.colors.bgBase).toBe('#F8FAFC');
  });

  it('tiene texto primario con alto contraste sobre fondo base', () => {
    const ratio = contrastRatio(lightTheme.colors.textPrimary, lightTheme.colors.bgBase);
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });

  it('tiene acento #6366F1', () => {
    expect(lightTheme.colors.accent).toBe('#6366F1');
  });
});
