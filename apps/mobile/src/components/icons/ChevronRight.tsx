import Svg, { Path } from 'react-native-svg';

interface Props {
  size?: number;
  color?: string;
}

export function ChevronRight({ size = 10, color = 'rgba(20,20,20,0.32)' }: Props) {
  return (
    <Svg width={size * 0.5} height={size * 0.875} viewBox="0 0 7 10" fill={color}>
      <Path d="M.833 0L0 .833 4.167 5 0 9.167.833 10l5-5z" />
    </Svg>
  );
}
