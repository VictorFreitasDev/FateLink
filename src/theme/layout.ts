// ==========================================================
// FATELINK 2.0 DESIGN SYSTEM — RESPONSIVE LAYOUT HELPERS
// ==========================================================

import { Dimensions, Platform } from 'react-native';

export const Breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
};

export const Layout = {
  maxContentWidth: 1200,
  maxFormWidth: 540,
  maxCardWidth: 620,
  sidebarWidth: 380,

  isWeb: Platform.OS === 'web',
  getScreenWidth: () => Dimensions.get('window').width,
  getScreenHeight: () => Dimensions.get('window').height,

  isMobile: () => Dimensions.get('window').width < Breakpoints.sm,
  isTablet: () => {
    const w = Dimensions.get('window').width;
    return w >= Breakpoints.sm && w < Breakpoints.lg;
  },
  isDesktop: () => Dimensions.get('window').width >= Breakpoints.lg,
};

