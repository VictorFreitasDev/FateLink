// ==========================================================
// FATELINK 2.0 DESIGN SYSTEM — SPACING, RADII & SHADOWS
// ==========================================================

import { ViewStyle, Platform } from 'react-native';

export const Spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
};

export const Radii = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  pill: 9999,
  full: 9999,
};

export const Shadows: Record<string, ViewStyle> = {
  none: {
    shadowOpacity: 0,
    elevation: 0,
  },
  sm: Platform.select({
    web: {
      boxShadow: '0 1px 2px rgba(15, 23, 42, 0.05)',
    } as any,
    default: {
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
  }),
  md: Platform.select({
    web: {
      boxShadow: '0 4px 6px -1px rgba(15, 23, 42, 0.08), 0 2px 4px -2px rgba(15, 23, 42, 0.05)',
    } as any,
    default: {
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
      elevation: 3,
    },
  }),
  lg: Platform.select({
    web: {
      boxShadow: '0 10px 15px -3px rgba(15, 23, 42, 0.10), 0 4px 6px -4px rgba(15, 23, 42, 0.05)',
    } as any,
    default: {
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 5 },
      shadowOpacity: 0.12,
      shadowRadius: 8,
      elevation: 6,
    },
  }),
  glow: Platform.select({
    web: {
      boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)',
    } as any,
    default: {
      shadowColor: '#2563EB',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.35,
      shadowRadius: 8,
      elevation: 6,
    },
  }),
};

