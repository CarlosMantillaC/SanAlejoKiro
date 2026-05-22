/**
 * San Alejo — Design System Tokens
 * Dark-first palette with indigo accent. High contrast, professional look.
 */

export const Colors = {
  // Backgrounds
  bgBase: '#0F172A',       // deepest background
  bgSurface: '#1E293B',    // cards, inputs
  bgElevated: '#273549',   // elevated cards, modals
  bgMuted: '#334155',      // dividers, subtle fills

  // Accent — Indigo
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

/** Shared header options for Stack.Screen */
export const headerTheme = {
  headerStyle: { backgroundColor: Colors.bgSurface },
  headerTintColor: Colors.textPrimary,
  headerTitleStyle: {
    color: Colors.textPrimary,
    fontWeight: Typography.semibold,
    fontSize: Typography.md,
  },
  contentStyle: { backgroundColor: Colors.bgBase },
};
