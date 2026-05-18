import Svg, { Path } from 'react-native-svg';

interface Props {
  size?: number;
  color?: string;
}

export function IconBell({ size = 20, color = 'currentColor' }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M12 3a6 6 0 00-6 6v4l-1.5 3a1 1 0 00.9 1.5h13.2a1 1 0 00.9-1.5L18 13V9a6 6 0 00-6-6z" />
      <Path d="M10 20a2 2 0 004 0" />
    </Svg>
  );
}
