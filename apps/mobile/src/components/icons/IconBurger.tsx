import Svg, { Rect } from 'react-native-svg';

interface Props {
  size?: number;
  color?: string;
}

export function IconBurger({ size = 20, color = 'currentColor' }: Props) {
  return (
    <Svg width={size} height={size * 0.9} viewBox="0 0 20 18" fill="none">
      <Rect x={0} y={0} width={20} height={2} rx={1} fill={color} />
      <Rect x={0} y={8} width={20} height={2} rx={1} fill={color} />
      <Rect x={0} y={16} width={20} height={2} rx={1} fill={color} />
    </Svg>
  );
}
