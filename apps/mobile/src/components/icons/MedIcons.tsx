import Svg, { Path, Rect, Circle } from 'react-native-svg';
import { tokens } from '../../theme/colors';

// Медицинские иконки раздела «Здоровье» (M14). Тонкая обводка в стиле lucide,
// плюс несколько заливочных знаков (капля крови, крест, телефон).

interface IconProps {
  size?: number;
  color?: string;
}

const STROKE = 1.7;

export function StethoscopeIcon({ size = 22, color = '#fff' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={STROKE} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M4 3v6a5 5 0 0010 0V3" />
      <Path d="M4 3H3M10 3h1" />
      <Path d="M9 14a6 6 0 0012 0v-2" />
      <Circle cx="20" cy="10" r="2" />
    </Svg>
  );
}

export function BloodDropIcon({ size = 18, color = tokens.red }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Path d="M12 2.5S5.5 10 5.5 14.5a6.5 6.5 0 0013 0C18.5 10 12 2.5 12 2.5z" />
    </Svg>
  );
}

export function MedCrossIcon({ size = 20, color = tokens.red }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Path d="M9.5 3h5v6h6v5h-6v6h-5v-6h-6v-5h6z" />
    </Svg>
  );
}

export function MicIcon({ size = 18, color = '#fff' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={STROKE} strokeLinecap="round" strokeLinejoin="round">
      <Rect x="9" y="2" width="6" height="12" rx="3" />
      <Path d="M5 11a7 7 0 0014 0" />
      <Path d="M12 18v3" />
    </Svg>
  );
}

export function VideoIcon({ size = 18, color = '#1a3577' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={STROKE} strokeLinecap="round" strokeLinejoin="round">
      <Rect x="2" y="6" width="13" height="12" rx="2.5" />
      <Path d="M15 10l6-3.5v11L15 14" />
    </Svg>
  );
}

export function PhoneFillIcon({ size = 15, color = '#0a3a26' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Path d="M6.6 2.5c.6 0 1.1.4 1.3 1l1 3a1.4 1.4 0 01-.35 1.4L8.1 9.1a12 12 0 006.8 6.8l1.2-1.45a1.4 1.4 0 011.4-.35l3 1c.6.2 1 .7 1 1.3v3c0 .8-.65 1.45-1.45 1.4C11.3 21 3 12.7 3 3.95 2.95 3.15 3.6 2.5 4.4 2.5z" />
    </Svg>
  );
}

export function MapPinIcon({ size = 13, color = tokens.inkMuted }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={STROKE} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0116 0z" />
      <Circle cx="12" cy="10" r="3" />
    </Svg>
  );
}

export function BadgeCheckIcon({ size = 14, color = tokens.blue }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Path
        d="M12 1.5l2.4 1.75 2.95-.05 1 2.8 2.5 1.6-.9 2.85.9 2.85-2.5 1.6-1 2.8-2.95-.05L12 22.5l-2.4-1.75-2.95.05-1-2.8-2.5-1.6.9-2.85-.9-2.85 2.5-1.6 1-2.8 2.95.05z"
      />
      <Path d="M8.5 12l2.2 2.2 4.3-4.4" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function UsersIcon({ size = 20, color = tokens.inkDark }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={STROKE} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M16 19v-1.5a4 4 0 00-4-4H6a4 4 0 00-4 4V19" />
      <Circle cx="9" cy="7" r="3.5" />
      <Path d="M22 19v-1.5a4 4 0 00-3-3.85" />
      <Path d="M16 3.65a4 4 0 010 7.7" />
    </Svg>
  );
}

export function HeartFillIcon({ size = 20, color = tokens.red }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Path d="M12 21s-7.5-4.6-10-9.3C.6 8.9 1.9 5.3 5.2 4.6c1.9-.4 3.8.4 4.8 1.9L12 8l2-1.5c1-1.5 2.9-2.3 4.8-1.9 3.3.7 4.6 4.3 3.2 7.1C19.5 16.4 12 21 12 21z" />
    </Svg>
  );
}

export function ChevronRightThin({ size = 16, color = 'rgba(255,255,255,0.5)' }: IconProps) {
  return (
    <Svg width={size * 0.625} height={size} viewBox="0 0 10 16" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M2 2l6 6-6 6" />
    </Svg>
  );
}
