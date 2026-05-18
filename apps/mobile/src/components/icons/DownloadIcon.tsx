import Svg, { Path } from 'react-native-svg';

export function DownloadIcon({ size = 16, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M12 4v12M6 11l6 6 6-6" />
      <Path d="M4 20h16" />
    </Svg>
  );
}
