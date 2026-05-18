import Svg, { Path } from 'react-native-svg';

interface Props {
  size?: number;
  color?: string;
}

export function BackArrow({ size = 16, color = 'currentColor' }: Props) {
  return (
    <Svg width={size * 0.5625} height={size} viewBox="0 0 9 16" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M8 1L1 8l7 7" />
    </Svg>
  );
}
