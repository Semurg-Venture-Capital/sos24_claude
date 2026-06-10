import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { BackButton } from '../../../components/ui/BackButton';
import { Checkbox } from '../../../components/ui/Checkbox';
import { OutlineButton } from '../../../components/ui/OutlineButton';
import { PhoneFrame } from '../../../components/ui/PhoneFrame';
import { RedButton } from '../../../components/ui/RedButton';
import { ScreenHeading } from '../../../components/ui/ScreenHeading';
import { WarningBox } from '../../../components/ui/WarningBox';
import { tokens } from '../../../theme/colors';
import { screeningPassed, useEuroStore, type EuroScreening } from '../store';
import type { EuroStackParamList, MainStackParamList } from '../../../navigation/types';

type Nav = NativeStackNavigationProp<EuroStackParamList, 'EuroCheck'>;

const CONDITIONS: { key: keyof EuroScreening; text: string }[] = [
  { key: 'twoVehicles', text: 'В ДТП участвуют только 2 транспортных средства' },
  { key: 'noInjured', text: 'Нет пострадавших и погибших' },
  { key: 'noThirdParty', text: 'Не повреждено имущество третьих лиц' },
  { key: 'agree', text: 'Оба водителя согласны с обстоятельствами' },
  { key: 'bothOsago', text: 'У обоих водителей действующий полис ОСАГО' },
];

// M9.2 — скрининг применимости европротокола. Все 5 условий → «Продолжить».
export function EuroCheckScreen() {
  const nav = useNavigation<Nav>();
  const screening = useEuroStore((s) => s.screening);
  const setScreening = useEuroStore((s) => s.setScreening);
  const captureNow = useEuroStore((s) => s.captureNow);
  const passed = screeningPassed(screening);

  const proceed = () => {
    captureNow(); // зафиксировать дату/время на момент оформления (антифрод)
    nav.navigate('EuroStep1');
  };

  const callInspector = () => {
    nav.getParent<NativeStackNavigationProp<MainStackParamList>>()?.navigate('Adjuster');
  };

  return (
    <PhoneFrame>
      <View style={{ paddingHorizontal: 24, paddingTop: 8, paddingBottom: 12 }}>
        <BackButton onPress={() => nav.goBack()} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 200, gap: 20 }}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeading
          title="Подходит ли европротокол?"
          subtitle="Подтвердите все условия. Если хотя бы одно не выполняется — нужен инспектор или ГАИ"
        />

        <View style={{ gap: 10 }}>
          {CONDITIONS.map((c) => {
            const checked = screening[c.key];
            return (
              <Pressable
                key={c.key}
                onPress={() => setScreening(c.key, !checked)}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 14,
                  padding: 16,
                  borderRadius: 20,
                  backgroundColor: checked ? 'rgba(20,20,20,0.04)' : 'rgba(255,255,255,0.55)',
                  borderWidth: 1,
                  borderColor: tokens.hairline,
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <Checkbox checked={checked} onChange={() => setScreening(c.key, !checked)} />
                <Text
                  style={{
                    flex: 1,
                    fontFamily: 'Manrope_500Medium',
                    fontSize: 14,
                    lineHeight: 19,
                    color: tokens.ink,
                    letterSpacing: -0.07,
                  }}
                >
                  {c.text}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {!passed && (
          <WarningBox text="Пока подтверждены не все условия. Если какое-то не выполняется — оформление по европротоколу невозможно, вызовите инспектора." />
        )}
      </ScrollView>

      {/* Sticky CTA */}
      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0 }}>
        <LinearGradient colors={['rgba(228,228,228,0)', 'rgba(228,228,228,0.95)']} style={{ height: 24 }} />
        <View style={{ paddingHorizontal: 24, paddingBottom: 32, paddingTop: 8, backgroundColor: 'rgba(228,228,228,0.95)', gap: 10 }}>
          <RedButton disabled={!passed} onPress={proceed}>
            Продолжить
          </RedButton>
          <OutlineButton tone="dark" style={{ height: 52 }} onPress={callInspector}>
            Вызвать инспектора
          </OutlineButton>
        </View>
      </View>
    </PhoneFrame>
  );
}
