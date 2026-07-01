// theme.js — RemindAI design tokens (violet brand)
import { useColorScheme } from 'react-native';

export const LIGHT_C = {
  // Brand — Violet
  brand:      '#7F77DD',
  brandDeep:  '#5B53B8',
  brandLight: '#ABA4ED',
  brandSoft:  'rgba(127,119,221,0.12)',
  brandTeal:  '#1D9E75',

  // iOS System backgrounds
  systemBackground:                    '#FFFFFF',
  secondarySystemBackground:           '#F4F2FB',
  systemGroupedBackground:             '#F4F2FB',
  secondarySystemGroupedBackground:    '#FFFFFF',
  tertiarySystemGroupedBackground:     '#F4F2FB',

  // Backgrounds (aliases)
  bg:       '#F4F2FB',
  surface:  '#FFFFFF',
  surface2: '#F4F2FB',
  surface3: '#E8E6FA',

  // Compatibility aliases
  bgTint:     '#F4F2FB',
  violetSoft: 'rgba(127,119,221,0.12)',
  violet:     '#7F77DD',
  violetDeep: '#5B53B8',
  tint:       '#7F77DD',
  tintPressed:'#5B53B8',
  teal:       '#34C759',
  tealSoft:   'rgba(52,199,89,0.12)',
  tealDeep:   '#248A3D',
  urgent:     '#FF3B30',
  urgentSoft: 'rgba(255,59,48,0.12)',
  amber:      '#FF9500',
  amberSoft:  'rgba(255,149,0,0.14)',
  amberDeep:  '#C93400',

  // iOS Labels
  label:           '#000000',
  secondaryLabel:  'rgba(60, 60, 67, 0.60)',
  tertiaryLabel:   'rgba(60, 60, 67, 0.30)',
  quaternaryLabel: 'rgba(60, 60, 67, 0.18)',
  text:   '#000000',
  text2:  'rgba(60, 60, 67, 0.60)',
  text3:  'rgba(60, 60, 67, 0.30)',
  text4:  'rgba(60, 60, 67, 0.18)',

  // iOS System fills
  systemFill:           'rgba(120, 120, 128, 0.20)',
  secondarySystemFill:  'rgba(120, 120, 128, 0.16)',
  tertiarySystemFill:   'rgba(118, 118, 128, 0.12)',
  quaternarySystemFill: 'rgba(116, 116, 128, 0.08)',

  // Separator / fill
  separator:    'rgba(60, 60, 67, 0.29)',
  border:       'rgba(60, 60, 67, 0.29)',
  borderStrong: 'rgba(127,119,221,0.35)',
  fill:         'rgba(127,119,221,0.10)',
  fill2:        'rgba(127,119,221,0.07)',

  // System semantic
  systemRed:    '#FF3B30',
  systemOrange: '#FF9500',
  systemYellow: '#FFCC00',
  systemGreen:  '#34C759',
  systemMint:   '#00C7BE',
  systemTeal:   '#30B0C7',
  systemCyan:   '#32ADE6',
  systemBlue:   '#007AFF',
  systemIndigo: '#5856D6',
  systemPurple: '#AF52DE',
  systemPink:   '#FF2D55',
  systemGray:   '#8E8E93',
  systemGray2:  '#AEAEB2',
  systemGray3:  '#C7C7CC',
  systemGray4:  '#D1D1D6',
  systemGray5:  '#E5E5EA',
  systemGray6:  '#F2F2F7',
  star:         '#FFB800',

  // Category colors
  catWork:   '#5B53B8',
  catHealth: '#7F77DD',
  catErrand: '#9089E0',
  catHabit:  '#ABA4ED',
};

export const DARK_C = {
  brand:      '#9B94E8',
  brandDeep:  '#7F77DD',
  brandLight: '#C0BAFF',
  brandSoft:  'rgba(155,148,232,0.18)',
  brandTeal:  '#30D07D',

  systemBackground:                 '#000000',
  secondarySystemBackground:        '#1C1C1E',
  systemGroupedBackground:          '#000000',
  secondarySystemGroupedBackground: '#1C1C1E',
  tertiarySystemGroupedBackground:  '#2C2C2E',

  bg:       '#000000',
  surface:  '#1C1C1E',
  surface2: '#2C2C2E',
  surface3: '#3A3A3C',

  bgTint:     '#1C1C1E',
  violetSoft: 'rgba(155,148,232,0.18)',
  violet:     '#9B94E8',
  violetDeep: '#7F77DD',
  tint:       '#9B94E8',
  tintPressed:'#7F77DD',
  teal:       '#30D158',
  tealSoft:   'rgba(48,209,88,0.15)',
  tealDeep:   '#25A244',
  urgent:     '#FF453A',
  urgentSoft: 'rgba(255,69,58,0.18)',
  amber:      '#FF9F0A',
  amberSoft:  'rgba(255,159,10,0.18)',
  amberDeep:  '#E07000',

  label:           '#FFFFFF',
  secondaryLabel:  'rgba(235,235,245,0.60)',
  tertiaryLabel:   'rgba(235,235,245,0.30)',
  quaternaryLabel: 'rgba(235,235,245,0.18)',
  text:   '#FFFFFF',
  text2:  'rgba(235,235,245,0.60)',
  text3:  'rgba(235,235,245,0.30)',
  text4:  'rgba(235,235,245,0.18)',

  systemFill:           'rgba(120,120,128,0.36)',
  secondarySystemFill:  'rgba(120,120,128,0.32)',
  tertiarySystemFill:   'rgba(118,118,128,0.24)',
  quaternarySystemFill: 'rgba(116,116,128,0.18)',

  separator:    'rgba(84,84,88,0.65)',
  border:       'rgba(84,84,88,0.65)',
  borderStrong: 'rgba(155,148,232,0.45)',
  fill:         'rgba(155,148,232,0.15)',
  fill2:        'rgba(155,148,232,0.10)',

  systemRed:    '#FF453A',
  systemOrange: '#FF9F0A',
  systemYellow: '#FFD60A',
  systemGreen:  '#30D158',
  systemMint:   '#63E6E2',
  systemTeal:   '#40CBE0',
  systemCyan:   '#64D2FF',
  systemBlue:   '#0A84FF',
  systemIndigo: '#5E5CE6',
  systemPurple: '#BF5AF2',
  systemPink:   '#FF375F',
  systemGray:   '#8E8E93',
  systemGray2:  '#636366',
  systemGray3:  '#48484A',
  systemGray4:  '#3A3A3C',
  systemGray5:  '#2C2C2E',
  systemGray6:  '#1C1C1E',
  star:         '#FFD60A',

  catWork:   '#9B94E8',
  catHealth: '#FF453A',
  catErrand: '#FF9F0A',
  catHabit:  '#30D158',
};

// Keep C as light alias for backward compat with other screens
export const C = LIGHT_C;

export function useColors() {
  const scheme = useColorScheme();
  return scheme === 'dark' ? DARK_C : LIGHT_C;
}

export const CAT = {
  work:     { color: '#7F77DD', deep: '#5A52C5', soft: 'rgba(127,119,221,0.12)', bgTint: '#F0EFFE', label: 'Travail',   icon: '💼' },
  health:   { color: '#FF3B30', deep: '#D70015', soft: 'rgba(255,59,48,0.12)',   bgTint: '#FFF4F3', label: 'Santé',     icon: '💪' },
  errand:   { color: '#FF9500', deep: '#C93400', soft: 'rgba(255,149,0,0.14)',   bgTint: '#FFFAEF', label: 'Courses',   icon: '🛒' },
  habit:    { color: '#34C759', deep: '#248A3D', soft: 'rgba(52,199,89,0.12)',   bgTint: '#F4FBF6', label: 'Habitude',  icon: '🔄' },
  personal: { color: '#7F77DD', deep: '#5A52C5', soft: 'rgba(127,119,221,0.12)', bgTint: '#F0EFFE', label: 'Personnel', icon: '👤' },
  call:     { color: '#34C759', deep: '#248A3D', soft: 'rgba(52,199,89,0.12)',   bgTint: '#F4FBF6', label: 'Appel',     icon: '📞' },
};

export const SHADOW = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  md: (color = '#000') => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 5,
  }),
  lg: (color = '#000') => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.14,
    shadowRadius: 32,
    elevation: 8,
  }),
};

export const RADIUS = {
  pill: 999,
  card: 10,
  btn:  14,
  sm:   6,
  md:   10,
  lg:   14,
  xl:   18,
};

export const SP = {
  xs:   4,
  sm:   8,
  md:   12,
  lg:   16,
  xl:   20,
  '2xl': 24,
  '3xl': 28,
  '4xl': 32,
};
