import { CommonActions, useNavigation } from '@react-navigation/native';
import { Pressable, Text, View } from 'react-native';
import { CloseIcon } from '../../../components/icons/CloseIcon';
import { DownloadIcon } from '../../../components/icons/DownloadIcon';
import { BlurView } from 'expo-blur';
import { OutlineButton } from '../../../components/ui/OutlineButton';
import { PhoneFrame } from '../../../components/ui/PhoneFrame';
import { PolicyQR } from '../../../components/ui/PolicyQR';
import { RedButton } from '../../../components/ui/RedButton';
import { SosLogo } from '../../../components/ui/SosLogo';
import { SuccessTick } from '../../../components/ui/SuccessTick';
import { Tag } from '../../../components/ui/Tag';
import { TextLink } from '../../../components/ui/TextLink';
import { MOCK_CARS, usePurchaseStore } from '../store';
import { tokens } from '../../../theme/colors';

const MONTHS_SHORT = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
function ddmmyyyy(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, '0')}.${MONTHS_SHORT[d.getMonth()]}.${d.getFullYear()}`;
}

// M7.2 — Успешная оплата.
export function SuccessScreen() {
  const nav = useNavigation();
  const state = usePurchaseStore();
  const productLabel = state.productType === 'kasko' ? 'КАСКО' : 'ОСАГО';
  const car = MOCK_CARS.find((c) => c.id === state.carId);

  // Закрыть Purchase-флоу и переключиться на нужный таб.
  const closeAndGo = (tab: 'Home' | 'Policies') => {
    nav.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [
          {
            name: 'Tabs',
            state: {
              routes: [
                { name: 'Home' },
                { name: 'Policies' },
                { name: 'Garage' },
                { name: 'Profile' },
              ],
              index: tab === 'Home' ? 0 : 1,
            },
          },
        ],
      }),
    );
  };

  // Сгенерируем мок-номер полиса для отображения
  const fakePolicyNumber = `№ 1224 ${Math.floor(1000 + Math.random() * 9000)} ${Math.floor(1000 + Math.random() * 9000)}`;

  return (
    <PhoneFrame>
      {/* Top — empty left + close right */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: 24,
          paddingTop: 8,
          paddingBottom: 8,
        }}
      >
        <View style={{ width: 48, height: 48 }} />
        <Pressable
          onPress={() => closeAndGo('Home')}
          style={({ pressed }) => ({
            width: 48,
            height: 48,
            borderRadius: 999,
            overflow: 'hidden',
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <BlurView intensity={32} tint="light" style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.5)', alignItems: 'center', justifyContent: 'center' }}>
            <CloseIcon size={14} color={tokens.inkDark} />
          </BlurView>
        </Pressable>
      </View>

      {/* Hero */}
      <View style={{ alignItems: 'center', marginTop: 40, gap: 22 }}>
        <SuccessTick />
        <View style={{ alignItems: 'center', paddingHorizontal: 32 }}>
          <Text
            style={{
              fontFamily: 'NeueMontreal-Medium',
              fontSize: 30,
              letterSpacing: -0.3,
              color: tokens.ink,
              textAlign: 'center',
              lineHeight: 33,
            }}
          >
            Полис оформлен!
          </Text>
          <Text
            style={{
              marginTop: 10,
              fontFamily: 'Manrope_400Regular',
              fontSize: 16,
              color: tokens.inkMuted,
              textAlign: 'center',
              letterSpacing: -0.08,
              lineHeight: 22,
            }}
          >
            {productLabel} действует с{' '}
            <Text style={{ color: tokens.inkDark, fontFamily: 'Manrope_600SemiBold' }}>
              {ddmmyyyy(state.startDate)}
            </Text>{' '}
            по{' '}
            <Text style={{ color: tokens.inkDark, fontFamily: 'Manrope_600SemiBold' }}>
              {ddmmyyyy(state.endDate)}
            </Text>
          </Text>
        </View>
      </View>

      {/* Mini policy card */}
      <View style={{ paddingHorizontal: 24, marginTop: 40 }}>
        <View
          style={{
            backgroundColor: tokens.inkDark,
            borderRadius: 32,
            padding: 22,
            paddingVertical: 20,
            gap: 14,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 24 },
            shadowOpacity: 0.35,
            shadowRadius: 28,
            elevation: 8,
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <SosLogo size="md" color="#fff" />
            <Tag tone="glass">{fakePolicyNumber}</Tag>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16 }}>
            <View style={{ flex: 1, gap: 4 }}>
              <Text
                style={{
                  fontFamily: 'Manrope_400Regular',
                  fontSize: 11,
                  color: tokens.inkMutedDark,
                  letterSpacing: 0.88,
                  textTransform: 'uppercase',
                }}
              >
                {productLabel} · {state.periodMonths} мес
              </Text>
              <Text
                style={{
                  fontFamily: 'NeueMontreal-Medium',
                  fontSize: 22,
                  letterSpacing: -0.11,
                  color: '#fff',
                  lineHeight: 24,
                }}
              >
                {car?.plate ?? '—'}
              </Text>
              <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 12, color: tokens.inkMutedDark, marginTop: 4 }}>
                {car?.name ?? '—'}
              </Text>
            </View>
            <PolicyQR value={fakePolicyNumber} size={64} padding={6} />
          </View>
        </View>
      </View>

      {/* Action buttons */}
      <View style={{ position: 'absolute', left: 24, right: 24, bottom: 36, gap: 10 }}>
        <RedButton onPress={() => closeAndGo('Policies')}>Мои полисы</RedButton>
        <OutlineButton onPress={() => {}}>↓ Скачать PDF</OutlineButton>
        <View style={{ alignItems: 'center', marginTop: 8 }}>
          <TextLink onPress={() => closeAndGo('Home')}>На главную</TextLink>
        </View>
      </View>
    </PhoneFrame>
  );
}
