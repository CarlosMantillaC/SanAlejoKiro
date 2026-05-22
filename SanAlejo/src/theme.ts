/**
 * San Alejo — Design System Tokens
 * Supports dark and light themes with indigo accent.
 */

// ─── Interfaces ──────────────────────────────────────────────────────────────

/** All color tokens for a theme variant */
export interface ThemeColors {
  // Backgrounds
  bgBase: string;
  bgSurface: string;
  bgElevated: string;
  bgMuted: string;

  // Accent — Indigo (invariant across themes)
  accent: string;
  accentLight: string;
  accentDark: string;
  accentMuted: string;

  // Semantic
  danger: string;
  dangerMuted: string;
  dangerDark: string;
  success: string;
  warning: string;

  // Text
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textOnAccent: string;
  textOnDanger: string;

  // Borders
  border: string;
  borderSubtle: string;
  borderFocus: string;

  // Overlay
  overlay: string;
}

export type ColorScheme = 'dark' | 'light';

export interface Theme {
  colors: ThemeColors;
  scheme: ColorScheme;
}

// ─── Dark palette ─────────────────────────────────────────────────────────────

export const darkColors: ThemeColors = {
  // Backgrounds
  bgBase: '#0F172A',
  bgSurface: '#1E293B',
  bgElevated: '#273549',
  bgMuted: '#334155',

  // Accent
  accent: '#6366F1',
  accentLight: '#818CF8',
  accentDark: '#4F46E5',
  accentMuted: 'rgba(99,102,241,0.15)',

  // Semantic
  danger: '#EF4444',
  dangerMuted: 'rgba(239,68,68,0.15)',
  dangerDark: '#DC2626',
  success: '#22C55E',
  warning: '#F59E0B',

  // Text
  textPrimary: '#F1F5F9',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  textOnAccent: '#FFFFFF',
  textOnDanger: '#FFFFFF',

  // Borders
  border: '#1E293B',
  borderSubtle: 'rgba(255,255,255,0.06)',
  borderFocus: '#6366F1',

  // Overlay
  overlay: 'rgba(0,0,0,0.65)',
};

// ─── Light palette ────────────────────────────────────────────────────────────

export const lightColors: ThemeColors = {
  // Backgrounds (high luminosity, bgBase ≥ #F8FAFC)
  bgBase: '#F8FAFC',
  bgSurface: '#FFFFFF',
  bgElevated: '#F1F5F9',
  bgMuted: '#E2E8F0',

  // Accent (invariant)
  accent: '#6366F1',
  accentLight: '#818CF8',
  accentDark: '#4F46E5',
  accentMuted: 'rgba(99,102,241,0.12)',

  // Semantic
  danger: '#DC2626',
  dangerMuted: 'rgba(220,38,38,0.10)',
  dangerDark: '#B91C1C',
  success: '#16A34A',
  warning: '#D97706',

  // Text (contrast ≥ 4.5:1 over light backgrounds per WCAG AA)
  textPrimary: '#0F172A',   // ~17:1 over #F8FAFC
  textSecondary: '#475569', // ~5.9:1 over #F8FAFC
  textMuted: '#64748B',     // ~4.6:1 over #F8FAFC
  textOnAccent: '#FFFFFF',
  textOnDanger: '#FFFFFF',

  // Borders
  border: '#E2E8F0',
  borderSubtle: 'rgba(0,0,0,0.06)',
  borderFocus: '#6366F1',

  // Overlay
  overlay: 'rgba(0,0,0,0.45)',
};

// ─── Theme objects ────────────────────────────────────────────────────────────

export const darkTheme: Theme = { colors: darkColors, scheme: 'dark' };
export const lightTheme: Theme = { colors: lightColors, scheme: 'light' };

/**
 * Selects the theme based on the system color scheme.
 * Falls back to lightTheme when colorScheme is null or undefined.
 */
export function resolveTheme(colorScheme: string | null | undefined): Theme {
  return colorScheme === 'dark' ? darkTheme : lightTheme;
}

// ─── Backward-compatibility alias ────────────────────────────────────────────

/** @deprecated Use `useTheme().colors` instead. Kept for compatibility. */
export const Colors = darkColors;

// ─── Shared tokens (theme-independent) ───────────────────────────────────────

export const Typography = {
  // Font sizes
  xs: 11,
  sm: 13,
  base: 15,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 28,

  // Weights (as string for RN)
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,

  // Line heights
  tight: 1.2,
  normal: 1.5,
  relaxed: 1.7,
};

export const Radii = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 18,
  full: 9999,
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 5,
  },
  lg: {
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 14,
    elevation: 10,
  },
};

/** @deprecated Use AppNavigator with useTheme() in _layout.tsx instead. */
export const headerTheme = {
  headerStyle: { backgroundColor: darkColors.bgSurface },
  headerTintColor: darkColors.textPrimary,
  headerTitleStyle: {
    color: darkColors.textPrimary,
    fontWeight: Typography.semibold,
    fontSize: Typography.md,
  },
  contentStyle: { backgroundColor: darkColors.bgBase },
};
