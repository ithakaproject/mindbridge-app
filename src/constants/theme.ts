import '@/global.css';
import { Platform } from 'react-native';

const brand = {
  text: '#EDE4D4',
  background: '#141F2E',
  backgroundElement: '#1A2D42',
  backgroundSelected: '#223350',
  backgroundSurface: '#0E1923',
  textSecondary: '#98B4C4',
  textTertiary: '#5A7A8C',
  border: 'rgba(255,255,255,0.07)',
  gold: '#F0C074',
  goldDim: '#C8943A',
  teal: '#3DBFAD',
  tealDim: '#258F80',
  green: '#52C48A',
  rose: '#E07272',
  error: '#E07272',
  purple: '#A07ED4',
  amber: '#E8A952',
  textOnAccent: '#FFFFFF',
  tealSoft: 'rgba(61,191,173,0.12)',
  overlay: 'rgba(0,0,0,0.5)',
  tabInactive: '#6A8898',
  tabActiveGlow: 'rgba(240,192,116,0.16)',
  tealDeep: '#1D6B8F',
  focusCardGlow: 'rgba(255,255,255,0.06)',
} as const;

export const Colors = {
  light: brand,
  dark: brand,
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
export const MaxFormWidth = 420;
