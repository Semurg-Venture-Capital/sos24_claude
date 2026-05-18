import Svg, { Circle, Path } from 'react-native-svg';

interface Props {
  size?: number;
  color?: string;
}

// Тонколинейные SF-Symbols-like иконки для блоков преимуществ
// в каталоге и детальной странице продукта.

export function BenefitBolt({ size = 18, color = 'currentColor' }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M13 3L4 14h7l-1 7 9-11h-7l1-7z" />
    </Svg>
  );
}

export function BenefitMap({ size = 18, color = 'currentColor' }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M12 21s-7-7-7-12a7 7 0 1114 0c0 5-7 12-7 12z" />
      <Circle cx={12} cy={9} r={2.5} />
    </Svg>
  );
}

export function BenefitShield({ size = 18, color = 'currentColor' }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M12 3l8 3v6c0 5-3.5 8.5-8 9-4.5-.5-8-4-8-9V6l8-3z" />
      <Path d="M8.5 12l2.5 2.5 4.5-5" />
    </Svg>
  );
}

export function BenefitCarLock({ size = 20, color = 'currentColor' }: Props) {
  return (
    <Svg width={size} height={(size * 18) / 20} viewBox="0 0 24 22" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M3 14v-2l2.5-1 1.5-4c.3-.7 1-1.2 1.8-1.2h8.4c.8 0 1.5.5 1.8 1.2l1.5 4 2.5 1v2c0 .8-.7 1.5-1.5 1.5H4.5C3.7 15.5 3 14.8 3 14z" />
      <Circle cx={7.5} cy={15.5} r={2} />
      <Circle cx={16.5} cy={15.5} r={2} />
    </Svg>
  );
}

export function BenefitCommissar({ size = 18, color = 'currentColor' }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M21 11.5a8.4 8.4 0 01-1 4 8.5 8.5 0 01-7.5 4.5L3 22l1.5-4.5A8.5 8.5 0 0112 3a8.5 8.5 0 019 8.5z" />
    </Svg>
  );
}

export function BenefitWrench({ size = 18, color = 'currentColor' }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M21 7a5 5 0 01-6.6 4.7L4 22l-2-2L12.3 9.6A5 5 0 0117 3l-3 3 1 3 3 1 3-3z" />
    </Svg>
  );
}

export function BenefitCarHit({ size = 18, color = 'currentColor' }: Props) {
  return (
    <Svg width={size} height={(size * 22) / 24} viewBox="0 0 24 22" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M3 14v-2l2-1 1.5-4c.4-.9 1.3-1.5 2.3-1.5h7.4c1 0 1.9.6 2.3 1.5l2 5 2 1v2c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2z" />
      <Circle cx={7} cy={16} r={2} />
      <Circle cx={17} cy={16} r={2} />
      <Path d="M15 4l3-3M19 5l-2 2" strokeWidth={1.6} />
    </Svg>
  );
}

export function BenefitHospital({ size = 18, color = 'currentColor' }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M12 22c-4.5-1-8-4.5-8-9V6l8-3 8 3v7c0 4.5-3.5 8-8 9z" />
      <Path d="M12 8v8M8 12h8" />
    </Svg>
  );
}

export function BenefitProperty({ size = 18, color = 'currentColor' }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M3 21V10l9-7 9 7v11" />
      <Path d="M9 21V13h6v8" />
    </Svg>
  );
}
