import { useNavigation } from '@react-navigation/native';
import { BlurView } from 'expo-blur';
import { ScrollView, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { AddTile } from '../../../components/ui/AddTile';
import { BackButton } from '../../../components/ui/BackButton';
import { PhoneFrame } from '../../../components/ui/PhoneFrame';
import { SavedCardBig } from '../../../components/ui/SavedCardBig';
import { ScreenHeading } from '../../../components/ui/ScreenHeading';
import { tokens } from '../../../theme/colors';

// M7.3 — Управление сохранёнными картами.
export function MyCardsScreen() {
  const nav = useNavigation();

  return (
    <PhoneFrame>
      <View
        style={{
          flexDirection: 'row',
          paddingHorizontal: 24,
          paddingTop: 8,
          paddingBottom: 16,
        }}
      >
        <BackButton onPress={() => nav.goBack()} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40, gap: 14 }}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeading title="Мои карты" subtitle="Управление сохранёнными способами оплаты" />

        <View style={{ gap: 14, marginTop: 8 }}>
          <SavedCardBig brand="uzcard" last4="4582" expiry="08/27" holder="A. KARIMOV" primary />
          <SavedCardBig brand="humo" last4="1190" expiry="03/28" holder="A. KARIMOV" />
          <View style={{ marginTop: 6 }}>
            <AddTile>Добавить карту</AddTile>
          </View>

          <View style={{ borderRadius: 20, overflow: 'hidden', marginTop: 6 }}>
            <BlurView
              intensity={20}
              tint="light"
              style={{
                backgroundColor: 'rgba(255,255,255,0.5)',
                padding: 14,
                paddingHorizontal: 16,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <View
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 999,
                  backgroundColor: 'rgba(20,20,20,0.06)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={tokens.inkDark} strokeWidth={1.8} strokeLinecap="round">
                  <Circle cx={12} cy={12} r={9} />
                  <Path d="M12 8v4M12 16h.01" />
                </Svg>
              </View>
              <Text
                style={{
                  flex: 1,
                  fontFamily: 'Manrope_400Regular',
                  fontSize: 13,
                  color: tokens.inkMuted,
                  lineHeight: 18,
                }}
              >
                Поддерживаются карты Uzcard и Humo. Visa и Mastercard скоро.
              </Text>
            </BlurView>
          </View>
        </View>
      </ScrollView>
    </PhoneFrame>
  );
}
