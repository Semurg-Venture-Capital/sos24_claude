import { Pressable, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { tokens } from '../../theme/colors';

interface Props {
  checked: boolean;
  onChange?: (next: boolean) => void;
  size?: number;
}

// Чекбокс в ink-стиле — квадратный со скруглением, активный заполняется тёмным.
export function Checkbox({ checked, onChange, size = 22 }: Props) {
  return (
    <Pressable
      onPress={() => onChange?.(!checked)}
      hitSlop={6}
      style={{
        width: size,
        height: size,
        borderRadius: 7,
        backgroundColor: checked ? tokens.inkDark : 'rgba(255,255,255,0.6)',
        borderWidth: checked ? 0 : 1,
        borderColor: tokens.hairline,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {checked && (
        <Svg width={13} height={10} viewBox="0 0 13 10" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <Path d="M1 5l4 4 7-8" />
        </Svg>
      )}
    </Pressable>
  );
}
