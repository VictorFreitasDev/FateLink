// ==========================================================
// FATELINK 2.0 DESIGN SYSTEM — TYPOGRAPHY TOKENS
// ==========================================================

import { TextStyle, Platform } from 'react-native';

const fontFamily = Platform.select({
  ios: 'System',
  android: 'Roboto',
  web: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  default: 'System',
});

export const FontWeights = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extraBold: '800' as const,
  black: '900' as const,
};

export const FontSizes = {
  xs: 11,
  sm: 12,
  md: 14,
  base: 16,
  lg: 18,
  xl: 21,
  xxl: 26,
  display: 32,
};

export const Typography: Record<string, TextStyle> = {
  // Display e Títulos
  h1: {
    fontFamily,
    fontSize: 26,
    fontWeight: '800',
    lineHeight: 32,
    letterSpacing: -0.4,
  },
  h2: {
    fontFamily,
    fontSize: 21,
    fontWeight: '800',
    lineHeight: 28,
    letterSpacing: -0.3,
  },
  h3: {
    fontFamily,
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 24,
    letterSpacing: -0.2,
  },
  h4: {
    fontFamily,
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
  },

  // Corpo de Texto
  bodyLarge: {
    fontFamily,
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
  },
  body: {
    fontFamily,
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 21,
  },
  bodyMedium: {
    fontFamily,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 21,
  },
  bodyBold: {
    fontFamily,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 21,
  },

  // Pequenos e Legendas
  bodySmall: {
    fontFamily,
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 18,
  },
  bodySmallMedium: {
    fontFamily,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  caption: {
    fontFamily,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
  },
  captionMuted: {
    fontFamily,
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 15,
  },
  overline: {
    fontFamily,
    fontSize: 10,
    fontWeight: '800',
    lineHeight: 14,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  button: {
    fontFamily,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
    letterSpacing: 0.2,
  },
};

