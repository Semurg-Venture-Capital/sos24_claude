import type { ReactNode } from 'react';
import { Pressable, Text, View, type ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { tokens } from '../../theme/colors';

interface Props {
  children: ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  trailing?: boolean;
  style?: ViewStyle;
}

export function RedButton({ children, onPress, disabled, trailing = true, style }: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        {
          backgroundColor: disabled ? 'rgba(230,20,40,0.35)' : tokens.red,
          borderRadius: 999,
          height: 64,
          paddingHorizontal: 28,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          // Imitate глянец-shadow эталона: '0 10px 30px -10px rgba(230,20,40,0.45)'
          shadowColor: tokens.red,
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: disabled ? 0 : 0.35,
          shadowRadius: 14,
          elevation: disabled ? 0 : 8,
          opacity: pressed && !disabled ? 0.9 : 1,
        },
        style,
      ]}
    >
      <Text
        style={{
          color: '#FFFFFF',
          fontFamily: 'Manrope_700Bold',
          fontSize: 16,
          letterSpacing: -0.16,
        }}
      >
        {children}
      </Text>
      {trailing && (
        <View style={{ marginLeft: 4 }}>
          <Svg width={7} height={10} viewBox="0 0 7 10" fill="#FFFFFF">
            <Path d="M.833 0L0 .833 4.167 5 0 9.167.833 10l5-5z" />
          </Svg>
        </View>
      )}
    </Pressable>
  );
}
