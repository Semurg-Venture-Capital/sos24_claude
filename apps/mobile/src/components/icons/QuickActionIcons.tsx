import Svg, { Circle, Path } from 'react-native-svg';
import { tokens } from '../../theme/colors';

interface Props {
  size?: number;
  color?: string;
}

export function QuickIconOSAGO({ size = 36, color = '#fff' }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 36 36" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M8 4h14l6 6v20a2 2 0 01-2 2H8a2 2 0 01-2-2V6a2 2 0 012-2z" />
      <Path d="M22 4v6h6" />
      <Path d="M12 22l3.5 3.5L24 17" />
    </Svg>
  );
}

export function QuickIconKASKO({ size = 36, color = tokens.red }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 36 36" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M18 4l12 4v8c0 8-6 13-12 14-6-1-12-6-12-14V8l12-4z" />
      <Path d="M10 20v-1.5l1.5-.6 1-2.4c.2-.5.7-.9 1.2-.9h6.6c.5 0 1 .4 1.2.9l1 2.4 1.5.6V20" />
      <Circle cx={13} cy={21} r={1.6} />
      <Circle cx={23} cy={21} r={1.6} />
    </Svg>
  );
}

export function QuickIconCommissar({ size = 36, color = tokens.red }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 36 36" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M8 12c2-3 5.5-4 10-4s8 1 10 4" />
      <Path d="M6 13h24" />
      <Circle cx={18} cy={19} r={4} />
      <Path d="M9 32a9 9 0 0118 0" />
    </Svg>
  );
}

export function QuickIconHistory({ size = 36, color = tokens.red }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 36 36" fill="none" stroke={color} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M18 6a12 12 0 11-11.5 16" />
      <Path d="M6.5 22L2.5 23l1-4" />
      <Path d="M18 12v6.5l5 3" />
    </Svg>
  );
}
