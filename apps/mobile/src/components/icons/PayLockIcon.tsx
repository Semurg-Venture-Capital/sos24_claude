import Svg, { Path, Rect } from 'react-native-svg';

export function PayLockIcon({ size = 16, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <Rect x={4} y={11} width={16} height={11} rx={2} />
      <Path d="M8 11V7a4 4 0 018 0v4" />
    </Svg>
  );
}
