export const C = {
  violet: '#7F77DD',
  violetDeep: '#5B53B8',
  violetSoft: 'rgba(127,119,221,0.12)',
  teal: '#1D9E75',
  tealDeep: '#126B4F',
  tealSoft: 'rgba(29,158,117,0.12)',
  urgent: '#E0654A',
  urgentSoft: 'rgba(224,101,74,0.12)',
  amber: '#D9A441',
  amberDeep: '#8A5E0F',
  amberSoft: 'rgba(217,164,65,0.18)',
  bg: '#F2F2F7',
  bgTint: '#FAFAFC',
  surface: '#FFFFFF',
  surface2: '#F5F5F7',
  surface3: '#EBEBF0',
  text: '#0B0B0F',
  text2: '#3C3C43',
  text3: 'rgba(60,60,67,0.6)',
  text4: 'rgba(60,60,67,0.36)',
  border: 'rgba(60,60,67,0.10)',
  borderStrong: 'rgba(60,60,67,0.18)',
};

export const CAT = {
  work:     { color: '#7F77DD', deep: '#5B53B8', soft: 'rgba(127,119,221,0.10)', bgTint: '#F8F6FF', label: 'Travail',   icon: '💼' },
  health:   { color: '#E0654A', deep: '#B14528', soft: 'rgba(224,101,74,0.10)',  bgTint: '#FFF8F4', label: 'Santé',     icon: '💪' },
  errand:   { color: '#D9A441', deep: '#8A5E0F', soft: 'rgba(217,164,65,0.13)',  bgTint: '#FFFAEF', label: 'Courses',   icon: '🛒' },
  habit:    { color: '#1D9E75', deep: '#126B4F', soft: 'rgba(29,158,117,0.10)',  bgTint: '#F4FBF8', label: 'Habitude',  icon: '🔄' },
  personal: { color: '#7F77DD', deep: '#5B53B8', soft: 'rgba(127,119,221,0.10)', bgTint: '#F8F6FF', label: 'Personnel', icon: '👤' },
  call:     { color: '#1D9E75', deep: '#126B4F', soft: 'rgba(29,158,117,0.10)',  bgTint: '#F4FBF8', label: 'Appel',     icon: '📞' },
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
  card: 16,
  btn: 14,
  sm: 8,
  md: 12,
};

export const SP = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 28,
  '4xl': 32,
};
