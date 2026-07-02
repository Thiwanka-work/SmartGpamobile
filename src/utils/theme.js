// ================================================================
// SmartGPA - App Theme Colors & Styles
// ================================================================

export const COLORS = {
  primary: '#2563eb',
  primaryDark: '#1d4ed8',
  primaryLight: '#3b82f6',
  secondary: '#10b981',
  secondaryDark: '#059669',
  accent: '#7c3aed',
  danger: '#ef4444',
  warning: '#f59e0b',
  success: '#10b981',
  
  // Dark theme
  bgDark: '#0f172a',
  bgDark2: '#1e293b',
  bgDark3: '#334155',
  borderDark: '#334155',
  textDark: '#f1f5f9',
  textSecondaryDark: '#94a3b8',
  textMutedDark: '#64748b',
  
  // Light theme
  bgLight: '#f8fafc',
  bgLight2: '#ffffff',
  bgLight3: '#f1f5f9',
  borderLight: '#e2e8f0',
  textLight: '#0f172a',
  textSecondaryLight: '#475569',
  textMutedLight: '#94a3b8',
  
  // Classification colors
  firstClass: '#059669',
  secondUpper: '#2563eb',
  secondLower: '#d97706',
  generalPass: '#64748b',
  fail: '#ef4444',
  skip: '#7c3aed',
};

export const GRADIENTS = {
  primary: ['#2563eb', '#1d4ed8'],
  secondary: ['#10b981', '#059669'],
  hero: ['#1e3a8a', '#2563eb', '#1d4ed8'],
  firstClass: ['#059669', '#10b981'],
  secondUpper: ['#1d4ed8', '#3b82f6'],
  secondLower: ['#b45309', '#f59e0b'],
  generalPass: ['#475569', '#94a3b8'],
  skip: ['#5b21b6', '#7c3aed'],
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const BORDER_RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
};

export const FONT_SIZE = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 26,
  xxxl: 36,
};

export const SHADOW = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
};
