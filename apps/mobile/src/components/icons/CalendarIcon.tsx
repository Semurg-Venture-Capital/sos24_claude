import Svg, { Path, Rect } from 'react-native-svg';
import { tokens } from '../../theme/colors';

interface Props {
  size?: number;
  color?: string;
}

export function CalendarIcon({ size = 20, color = tokens.inkMuted }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.6} strokeLinecap="round">
      <Rect x={3} y={5} width={18} height={16} rx={3} />
      <Path d="M3 10h18M8 3v4M16 3v4" />
    </Svg>
  );
}
