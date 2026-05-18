import Svg, { Circle, Path } from 'react-native-svg';

interface Props {
  size?: number;
  color?: string;
  active?: boolean;
}

export function TabIconHome({ size = 24, color = 'currentColor', active }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={active ? color : 'none'} stroke={color} strokeWidth={active ? 0 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M3 10.5L12 3l9 7.5V20a1 1 0 01-1 1h-5v-7h-6v7H4a1 1 0 01-1-1v-9.5z" />
    </Svg>
  );
}

export function TabIconShield({ size = 24, color = 'currentColor', active }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={active ? color : 'none'} stroke={color} strokeWidth={active ? 0 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M12 3l8 3v6c0 5-3.5 8.5-8 9-4.5-.5-8-4-8-9V6l8-3z" />
    </Svg>
  );
}

export function TabIconCar({ size = 26, color = 'currentColor', active }: Props) {
  return (
    <Svg width={size} height={size * 0.846} viewBox="0 0 28 22" fill={active ? color : 'none'} stroke={color} strokeWidth={active ? 0 : 1.6} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M2 14v-2l3-1 2-5c.4-.9 1.3-1.5 2.3-1.5h9.4c1 0 1.9.6 2.3 1.5l2 5 3 1v2c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2z" />
      <Circle cx={8} cy={16} r={2.5} fill={active ? '#fff' : 'none'} stroke={color} strokeWidth={1.6} />
      <Circle cx={20} cy={16} r={2.5} fill={active ? '#fff' : 'none'} stroke={color} strokeWidth={1.6} />
    </Svg>
  );
}

export function TabIconUser({ size = 24, color = 'currentColor', active }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={active ? color : 'none'} stroke={color} strokeWidth={active ? 0 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <Circle cx={12} cy={8} r={4} />
      <Path d="M4 21a8 8 0 0116 0" />
    </Svg>
  );
}
