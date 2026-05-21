import Svg, { Circle, Line, Path } from 'react-native-svg';
import { tokens } from '../../theme/colors';

interface Props {
  size?: number;
  color?: string;
}

// Lucide-style иконки для плиток быстрых действий 2×2 на Home (24×24 viewBox).
// Эталон: SOS24/lucide-icons.jsx.

// file-check — «Страховой полис» (dark tile).
export function QuickIconPolicy({ size = 36, color = '#fff' }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <Path d="M14 2v6h6" />
      <Path d="m9 15 2 2 4-4" />
    </Svg>
  );
}

// badge-check — «Аджастер» (red).
export function QuickIconAdjuster({ size = 36, color = tokens.red }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z" />
      <Path d="m9 12 2 2 4-4" />
    </Svg>
  );
}

// users — «Партнёры» (red).
export function QuickIconPartners({ size = 36, color = tokens.red }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <Circle cx={9} cy={7} r={4} />
      <Path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <Path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </Svg>
  );
}

// file-text — «Европротокол» (red).
export function QuickIconEuroProtocol({ size = 36, color = tokens.red }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <Path d="M14 2v6h6" />
      <Line x1={16} y1={13} x2={8} y2={13} />
      <Line x1={16} y1={17} x2={8} y2={17} />
      <Line x1={10} y1={9} x2={8} y2={9} />
    </Svg>
  );
}
