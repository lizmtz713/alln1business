/**
 * Life OS Design System
 * Single source of truth for colors, spacing, typography
 */

export const colors = {
  // Backgrounds
  background: '#0F0F0F',
  surface: '#1A1A1A',
  surfaceAlt: '#2D2D2D',
  
  // Accent
  accent: '#6366F1',    // Indigo
  accentMuted: '#4F46E5',
  gold: '#C9A962',
  
  // Text
  text: '#FFFFFF',
  textMuted: '#9CA3AF',
  textDim: '#6B7280',
  
  // Status
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  
  // Borders
  border: '#2D2D2D',
  borderFocus: '#6366F1',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const fontSize = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 30,
} as const;

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
} as const;

// Category icons and colors for different modules
export const categoryConfig = {
  bills: { icon: '💳', color: '#EF4444', name: 'Bills' },
  insurance: { icon: '🛡️', color: '#3B82F6', name: 'Insurance' },
  vehicles: { icon: '🚗', color: '#8B5CF6', name: 'Vehicles' },
  family: { icon: '👨‍👩‍👧‍👦', color: '#EC4899', name: 'Family' },
  medical: { icon: '🏥', color: '#10B981', name: 'Medical' },
  pets: { icon: '🐕', color: '#F59E0B', name: 'Pets' },
  food: { icon: '🍽️', color: '#F97316', name: 'Food' },
  home: { icon: '🏠', color: '#14B8A6', name: 'Home' },
  documents: { icon: '📄', color: '#6366F1', name: 'Documents' },
  contacts: { icon: '👥', color: '#0EA5E9', name: 'Contacts' },
} as const;
