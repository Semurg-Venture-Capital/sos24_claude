import { Pressable, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { tokens } from '../../theme/colors';

interface Props {
  title: string;
  linkLabel?: string;
  onLinkPress?: () => void;
}

// Заголовок секции + опциональная ссылка "Все >" справа
export function SectionRow({ title, linkLabel, onLinkPress }: Props) {
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        paddingHorizontal: 24,
      }}
    >
      <Text
        style={{
          fontFamily: 'NeueMontreal-Medium',
          fontSize: 18,
          letterSpacing: -0.09,
          color: tokens.ink,
        }}
      >
        {title}
      </Text>
      {linkLabel && (
        <Pressable onPress={onLinkPress} hitSlop={8}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Text
              style={{
                fontFamily: 'Manrope_500Medium',
                fontSize: 13,
                color: tokens.inkSubtle,
              }}
            >
              {linkLabel}
            </Text>
            <Svg width={6} height={10} viewBox="0 0 6 10" fill="none" stroke={tokens.inkSubtle} strokeWidth={1.6} strokeLinecap="round">
              <Path d="M1 1l4 4-4 4" />
            </Svg>
          </View>
        </Pressable>
      )}
    </View>
  );
}
