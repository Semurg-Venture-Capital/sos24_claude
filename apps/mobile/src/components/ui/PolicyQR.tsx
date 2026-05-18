import { View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { tokens } from '../../theme/colors';

interface Props {
  value: string;
  size: number;
  padding?: number;
  bgColor?: string;
  fgColor?: string;
}

// Унифицированная обёртка над react-native-qrcode-svg с белым padding-фоном.
// Используется в трёх размерах: mini (60), big (200), huge (260).
export function PolicyQR({ value, size, padding = 8, bgColor = '#fff', fgColor = tokens.inkDark }: Props) {
  return (
    <View
      style={{
        padding,
        borderRadius: padding * 1.5,
        backgroundColor: bgColor,
      }}
    >
      <QRCode value={value} size={size} color={fgColor} backgroundColor={bgColor} />
    </View>
  );
}
