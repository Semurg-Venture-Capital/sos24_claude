import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { tokens } from '../../theme/colors';

interface Props {
  size?: number;
  color?: string;
}

// Минималистичные line-иконки для меню (профиль/настройки/гараж).

export function IconPassport({ size = 20, color = tokens.inkDark }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M5 3h10l4 4v14H5z" />
      <Circle cx={12} cy={11} r={2.5} />
      <Path d="M9 17h6" />
    </Svg>
  );
}

export function IconLicense({ size = 20, color = tokens.inkDark }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <Rect x={3} y={5} width={18} height={14} rx={2} />
      <Circle cx={8} cy={11} r={2} />
      <Path d="M14 9h5M14 12h4M14 15h5" />
    </Svg>
  );
}

export function IconLanguage({ size = 20, color = tokens.inkDark }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <Circle cx={12} cy={12} r={9} />
      <Path d="M3 12h18M12 3a13 13 0 010 18M12 3a13 13 0 000 18" />
    </Svg>
  );
}

export function IconPalette({ size = 20, color = tokens.inkDark }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M21 12a9 9 0 11-9-9c4 0 4.5 2.5 3.5 4.5-.8 1.5.3 2.5 1.8 2.5H19c1 0 2 .7 2 2z" />
      <Circle cx={7.5} cy={11} r={1} />
      <Circle cx={9.5} cy={7} r={1} />
      <Circle cx={14} cy={6.5} r={1} />
      <Circle cx={17} cy={9} r={1} />
    </Svg>
  );
}

export function IconQuestion({ size = 20, color = tokens.inkDark }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <Circle cx={12} cy={12} r={9} />
      <Path d="M9.5 9a2.5 2.5 0 015 0c0 2-2.5 2-2.5 4" />
      <Path d="M12 17h.01" />
    </Svg>
  );
}

export function IconChat({ size = 20, color = tokens.inkDark }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M21 11.5a8.5 8.5 0 01-1 4 8.5 8.5 0 01-7.5 4.5L3 22l1.5-4.5A8.5 8.5 0 0112 3a8.5 8.5 0 019 8.5z" />
    </Svg>
  );
}

export function IconInfo({ size = 20, color = tokens.inkDark }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <Circle cx={12} cy={12} r={9} />
      <Path d="M12 11v6M12 8h.01" />
    </Svg>
  );
}

export function IconFile({ size = 20, color = tokens.inkDark }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M14 3H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V9z" />
      <Path d="M14 3v6h6M9 13h6M9 16h6" />
    </Svg>
  );
}

export function IconLogout({ size = 20, color = tokens.red }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M15 3h5v18h-5" />
      <Path d="M3 12h13M11 8l4 4-4 4" />
    </Svg>
  );
}

export function IconCamera({ size = 22, color = tokens.inkDark }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M3 17V8a2 2 0 012-2h2.5L9 4h6l1.5 2H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
      <Circle cx={12} cy={12} r={4} />
    </Svg>
  );
}

export function IconPencil({ size = 18, color = tokens.inkDark }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M14 3l7 7-12 12H2v-7z" />
    </Svg>
  );
}

export function IconCarSimple({ size = 24, color = tokens.inkDark }: Props) {
  return (
    <Svg width={size} height={(size * 18) / 24} viewBox="0 0 24 18" fill="none" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M2 12V10l2.5-1L6 5c.4-.9 1.3-1.5 2.3-1.5h7.4c1 0 1.9.6 2.3 1.5l1.5 4 2.5 1v2c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2z" />
      <Circle cx={7} cy={14} r={2} />
      <Circle cx={17} cy={14} r={2} />
    </Svg>
  );
}

export function IconSearch({ size = 18, color = tokens.inkDark }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <Circle cx={11} cy={11} r={7} />
      <Path d="M21 21l-4.5-4.5" />
    </Svg>
  );
}

export function IconWallet({ size = 20, color = tokens.inkDark }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M20 7H4a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2Z" />
      <Path d="M16 12a1 1 0 1 0 2 0 1 1 0 0 0-2 0Z" fill={color} stroke="none" />
      <Path d="M2 10h20" />
    </Svg>
  );
}
