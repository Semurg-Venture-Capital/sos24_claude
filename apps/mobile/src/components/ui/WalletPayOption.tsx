import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { SosMark } from '../icons/SosMark';
import { tokens } from '../../theme/colors';

interface Props {
  balance: number;
  amount: number;
  selected?: boolean;
  onPress?: () => void;
}

// Опция «Кошелёк SOS24» на экране оплаты. Эталон: SOS24/screens-payment.jsx → WalletPayOption.
// Чёрно-красный gradient-фон логотипа, баланс под названием, без radio.
// Если баланса не хватает — индикация красным «недостаточно».
export function WalletPayOption({ balance, amount, selected, onPress }: Props) {
  const sufficient = balance >= amount;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 18,
        backgroundColor: selected ? '#fff' : 'rgba(255,255,255,0.6)',
        borderWidth: selected ? 2 : 1,
        borderColor: selected ? tokens.ink : tokens.hairline,
        opacity: pressed ? 0.85 : 1,
        gap: 12,
      })}
    >
      <LinearGradient
        colors={[tokens.inkDark, tokens.red]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          width: 44,
          height: 44,
          borderRadius: 999,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <SosMark size={22} color="#fff" />
      </LinearGradient>
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: 'Manrope_600SemiBold', fontSize: 15, color: tokens.ink }}>
          Кошелёк SOS24
        </Text>
        <Text
          style={{
            fontFamily: 'Manrope_400Regular',
            fontSize: 12,
            color: sufficient ? tokens.inkMuted : tokens.red,
            marginTop: 2,
          }}
        >
          Баланс: {balance.toLocaleString('ru-RU')} сум
          {!sufficient && ' · недостаточно'}
        </Text>
      </View>
      <Svg
        width={8}
        height={14}
        viewBox="0 0 8 14"
        fill="none"
        stroke={tokens.inkMuted}
        strokeWidth={2}
        strokeLinecap="round"
      >
        <Path d="M1 1l6 6-6 6" />
      </Svg>
    </Pressable>
  );
}
