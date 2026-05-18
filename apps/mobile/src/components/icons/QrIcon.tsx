import Svg, { Path } from 'react-native-svg';

export function QrIcon({ size = 12, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Path d="M3 3h7v7H3V3zm2 2v3h3V5H5zm9-2h7v7h-7V3zm2 2v3h3V5h-3zM3 14h7v7H3v-7zm2 2v3h3v-3H5zm9-2h3v3h-3v-3zm5 0h2v2h-2v-2zm-5 5h2v2h-2v-2zm3 0h2v2h-2v-2zm2 2h2v2h-2v-2z" />
    </Svg>
  );
}
