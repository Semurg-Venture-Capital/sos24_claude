import type { ReactNode } from 'react';
import { View } from 'react-native';

interface Props {
  leading?: ReactNode;
  center?: ReactNode;
  trailing?: ReactNode;
}

// Top bar для Home/inner screens: фиксирован на top:56, по краям 48×48 слоты.
export function TopBar({ leading, center, trailing }: Props) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        height: 48,
      }}
    >
      <View style={{ width: 48, height: 48 }}>{leading}</View>
      <View>{center}</View>
      <View style={{ width: 48, height: 48 }}>{trailing}</View>
    </View>
  );
}
