import Svg, { Path } from 'react-native-svg';

export function CloseIcon({ size = 14, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 14 14" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round">
      <Path d="M2 2l10 10M12 2L2 12" />
    </Svg>
  );
}
