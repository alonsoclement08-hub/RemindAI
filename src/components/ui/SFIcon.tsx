import React from 'react';
import Svg, { Path, Circle, Rect } from 'react-native-svg';

type IconName =
  | 'chevron.left' | 'chevron.right' | 'chevron.right.small'
  | 'xmark' | 'xmark.circle.fill' | 'plus' | 'plus.circle.fill'
  | 'checkmark' | 'checkmark.bold'
  | 'square.and.pencil' | 'ellipsis' | 'ellipsis.circle' | 'trash'
  | 'calendar' | 'calendar.fill' | 'list.bullet'
  | 'sparkles' | 'sparkle.small'
  | 'person.circle' | 'person.crop.circle.fill'
  | 'mic' | 'mic.fill'
  | 'clock' | 'clock.fill' | 'bell' | 'bell.badge'
  | 'location' | 'location.fill' | 'phone' | 'phone.fill'
  | 'briefcase.fill' | 'heart.fill' | 'cart.fill' | 'leaf.fill'
  | 'moon.fill' | 'link' | 'arrow.up.right' | 'star.fill'
  | 'arrow.clockwise' | 'crown.fill' | 'arrow.up';

interface Props {
  name: IconName;
  size?: number;
  color?: string;
  weight?: 'regular' | 'medium' | 'bold';
}

export function SFIcon({ name, size = 22, color = '#000', weight = 'regular' }: Props) {
  const sw = weight === 'bold' ? 2.4 : weight === 'medium' ? 2.0 : 1.7;

  switch (name) {
    case 'chevron.left':
      return (<Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Path d="M15 6l-6 6 6 6" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" /></Svg>);
    case 'chevron.right':
      return (<Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Path d="M9 6l6 6-6 6" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" /></Svg>);
    case 'chevron.right.small':
      return (<Svg width={size} height={size} viewBox="0 0 8 14" fill="none"><Path d="M1 1l6 6-6 6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></Svg>);
    case 'xmark':
      return (<Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Path d="M6 6l12 12M18 6L6 18" stroke={color} strokeWidth={sw} strokeLinecap="round" /></Svg>);
    case 'xmark.circle.fill':
      return (<Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Circle cx="12" cy="12" r="10" fill={color} /><Path d="M9 9l6 6M15 9l-6 6" stroke="white" strokeWidth="2" strokeLinecap="round" /></Svg>);
    case 'plus':
      return (<Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Path d="M12 5v14M5 12h14" stroke={color} strokeWidth={sw} strokeLinecap="round" /></Svg>);
    case 'checkmark':
      return (<Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Path d="M5 12l5 5 9-10" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" /></Svg>);
    case 'checkmark.bold':
      return (<Svg width={size} height={size} viewBox="0 0 14 14" fill="none"><Path d="M3 7l3 3 5-6" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></Svg>);
    case 'square.and.pencil':
      return (<Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Path d="M14 4l6 6L9 21H3v-6L14 4z" stroke={color} strokeWidth={sw} strokeLinejoin="round" /></Svg>);
    case 'ellipsis.circle':
      return (<Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Circle cx="12" cy="12" r="9.5" stroke={color} strokeWidth={sw} /><Circle cx="8" cy="12" r="1.2" fill={color} /><Circle cx="12" cy="12" r="1.2" fill={color} /><Circle cx="16" cy="12" r="1.2" fill={color} /></Svg>);
    case 'calendar':
      return (<Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Rect x="3.5" y="5" width="17" height="15" rx="3" stroke={color} strokeWidth={sw} /><Path d="M3.5 9h17M8 3v3M16 3v3" stroke={color} strokeWidth={sw} strokeLinecap="round" /></Svg>);
    case 'calendar.fill':
      return (<Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Rect x="3.5" y="5" width="17" height="15" rx="3" fill={color} /><Rect x="3.5" y="5" width="17" height="4" rx="3" fill={color} opacity="0.5" /><Path d="M8 3v3M16 3v3" stroke={color} strokeWidth={sw} strokeLinecap="round" /></Svg>);
    case 'list.bullet':
      return (<Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Path d="M8 6h12M8 12h12M8 18h12" stroke={color} strokeWidth={sw} strokeLinecap="round" /><Circle cx="4" cy="6" r="1.3" fill={color} /><Circle cx="4" cy="12" r="1.3" fill={color} /><Circle cx="4" cy="18" r="1.3" fill={color} /></Svg>);
    case 'sparkles':
      return (<Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Path d="M12 3l1.8 4.5L18 9l-4.2 1.5L12 15l-1.8-4.5L6 9l4.2-1.5z" fill={color} /><Circle cx="18" cy="18" r="1.4" fill={color} /><Circle cx="6" cy="19" r="1" fill={color} /></Svg>);
    case 'sparkle.small':
      return (<Svg width={size} height={size} viewBox="0 0 14 14" fill="none"><Path d="M7 1.5l1.4 3.2L11.5 6 8.4 7.3 7 10.5 5.6 7.3 2.5 6l3.1-1.3z" fill={color} /></Svg>);
    case 'person.circle':
      return (<Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Circle cx="12" cy="12" r="9.5" stroke={color} strokeWidth={sw} /><Circle cx="12" cy="10" r="3" stroke={color} strokeWidth={sw} /><Path d="M5 19c1-2.5 3-4 7-4s6 1.5 7 4" stroke={color} strokeWidth={sw} strokeLinecap="round" /></Svg>);
    case 'person.crop.circle.fill':
      return (<Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Circle cx="12" cy="12" r="10" fill={color} /><Circle cx="12" cy="10" r="3.5" fill="white" /><Path d="M5 19c1.5-3 4-4.5 7-4.5s5.5 1.5 7 4.5" fill="white" /></Svg>);
    case 'mic.fill':
      return (<Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Rect x="9" y="3" width="6" height="11" rx="3" fill={color} /><Path d="M5 11v1a7 7 0 0014 0v-1M12 19v3" stroke={color} strokeWidth={sw} strokeLinecap="round" /></Svg>);
    case 'clock':
      return (<Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Circle cx="12" cy="12" r="9" stroke={color} strokeWidth={sw} /><Path d="M12 7v5l3 2" stroke={color} strokeWidth={sw} strokeLinecap="round" /></Svg>);
    case 'clock.fill':
      return (<Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Circle cx="12" cy="12" r="10" fill={color} /><Path d="M12 7v5l3.5 2.2" stroke="white" strokeWidth="1.8" strokeLinecap="round" /></Svg>);
    case 'bell':
      return (<Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Path d="M6 16V11a6 6 0 1112 0v5l1.5 2.5h-15L6 16zM10 20a2 2 0 004 0" stroke={color} strokeWidth={sw} strokeLinejoin="round" strokeLinecap="round" /></Svg>);
    case 'location':
      return (<Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Path d="M12 22s8-7 8-13a8 8 0 10-16 0c0 6 8 13 8 13z" stroke={color} strokeWidth={sw} /><Circle cx="12" cy="9" r="3" stroke={color} strokeWidth={sw} /></Svg>);
    case 'phone.fill':
      return (<Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6A19.79 19.79 0 012.12 4.18 2 2 0 014.11 2h3a2 2 0 012 1.72c.12.96.36 1.9.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.91.34 1.85.58 2.81.7A2 2 0 0122 16.92z" fill={color} /></Svg>);
    case 'location.fill':
      return (<Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Path d="M12 22s8-7 8-13a8 8 0 10-16 0c0 6 8 13 8 13z" fill={color} /><Circle cx="12" cy="9" r="3" fill="white" /></Svg>);
    case 'briefcase.fill':
      return (<Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Rect x="3" y="7" width="18" height="13" rx="2.5" fill={color} /><Path d="M9 7V5a2 2 0 012-2h2a2 2 0 012 2v2" stroke={color} strokeWidth={sw} /></Svg>);
    case 'heart.fill':
      return (<Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Path d="M12 20s-8-5-8-11a4.5 4.5 0 018-3 4.5 4.5 0 018 3c0 6-8 11-8 11z" fill={color} /></Svg>);
    case 'cart.fill':
      return (<Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Path d="M3 6h2l2 11h11l2-8H7" stroke={color} strokeWidth={sw} fill={color} strokeLinejoin="round" strokeLinecap="round" /><Circle cx="9" cy="20" r="1.5" fill={color} /><Circle cx="17" cy="20" r="1.5" fill={color} /></Svg>);
    case 'leaf.fill':
      return (<Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Path d="M4 20s0-12 14-15c0 14-7 16-14 15z" fill={color} /></Svg>);
    case 'moon.fill':
      return (<Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Path d="M20 14a8 8 0 11-10-10 6 6 0 0010 10z" fill={color} /></Svg>);
    case 'link':
      return (<Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Path d="M10 14L14 10M8 6l2-2a4 4 0 015.6 5.6L14 11M10 13l-2 2a4 4 0 01-5.6-5.6L4 8" stroke={color} strokeWidth={sw} strokeLinecap="round" /></Svg>);
    case 'arrow.up.right':
      return (<Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Path d="M7 17L17 7M9 7h8v8" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" /></Svg>);
    case 'arrow.up':
      return (<Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Path d="M12 19V5M5 12l7-7 7 7" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" /></Svg>);
    case 'star.fill':
      return (<Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Path d="M12 2l3 6.5L22 9.5l-5 4.5 1.5 7.5L12 17.5l-6.5 4L7 14l-5-4.5 7-1z" fill={color} /></Svg>);
    case 'arrow.clockwise':
      return (<Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Path d="M20 11a8 8 0 11-2-5L20 8M20 3v5h-5" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" /></Svg>);
    case 'crown.fill':
      return (<Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Path d="M3 18l2-9 4 4 3-7 3 7 4-4 2 9-9 1z" fill={color} /></Svg>);
    case 'trash':
      return (<Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" /></Svg>);
    default:
      return null;
  }
}
