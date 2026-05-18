import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BlurView } from 'expo-blur';
import { ScrollView, Text, View } from 'react-native';
import { IconCarSimple } from '../../../components/icons/LineIcons';
import { FAB } from '../../../components/ui/FAB';
import { PhoneFrame } from '../../../components/ui/PhoneFrame';
import { RedButton } from '../../../components/ui/RedButton';
import { Tag } from '../../../components/ui/Tag';
import { tokens } from '../../../theme/colors';
import { MOCK_VEHICLES } from '../mockGarage';
import type { GarageStackParamList } from '../../../navigation/types';

type Nav = NativeStackNavigationProp<GarageStackParamList, 'GarageList'>;

// M3.1 — Список автомобилей. Пустое состояние или карточки.
export function GarageListScreen() {
  const nav = useNavigation<Nav>();
  const isEmpty = MOCK_VEHICLES.length === 0;

  return (
    <PhoneFrame>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: 24,
          paddingTop: 8,
          paddingBottom: 16,
        }}
      >
        <Text
          style={{
            fontFamily: 'NeueMontreal-Medium',
            fontSize: 28,
            letterSpacing: -0.28,
            color: tokens.ink,
          }}
        >
          Гараж
        </Text>
      </View>

      {isEmpty ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 18 }}>
          <View
            style={{
              width: 120,
              height: 120,
              borderRadius: 999,
              backgroundColor: 'rgba(255,255,255,0.55)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <IconCarSimple size={56} color={tokens.inkSubtle} />
          </View>
          <View style={{ alignItems: 'center', gap: 8 }}>
            <Text
              style={{
                fontFamily: 'NeueMontreal-Medium',
                fontSize: 24,
                letterSpacing: -0.12,
                color: tokens.ink,
                textAlign: 'center',
              }}
            >
              Добавьте свой автомобиль
            </Text>
            <Text
              style={{
                fontFamily: 'Manrope_400Regular',
                fontSize: 14,
                color: tokens.inkMuted,
                textAlign: 'center',
                maxWidth: 280,
              }}
            >
              Автомобили сохраняются для быстрого оформления полисов
            </Text>
          </View>
          <View style={{ width: 240, marginTop: 8 }}>
            <RedButton onPress={() => nav.navigate('GarageEdit', {})}>Добавить автомобиль</RedButton>
          </View>
        </View>
      ) : (
        <>
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 160, gap: 12 }}
            showsVerticalScrollIndicator={false}
          >
            {MOCK_VEHICLES.map((v) => (
              <View key={v.id} style={{ borderRadius: 28, overflow: 'hidden' }}>
                <BlurView
                  intensity={20}
                  tint="light"
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.55)',
                    padding: 18,
                    paddingHorizontal: 20,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 14,
                    borderWidth: 1,
                    borderColor: tokens.hairline,
                  }}
                >
                  <View
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: 16,
                      backgroundColor: 'rgba(20,20,20,0.05)',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <IconCarSimple size={32} color={tokens.inkDark} />
                  </View>
                  <View style={{ flex: 1, gap: 4 }}>
                    <Text
                      style={{
                        fontFamily: 'NeueMontreal-Medium',
                        fontSize: 18,
                        letterSpacing: -0.09,
                        color: tokens.ink,
                      }}
                    >
                      {v.plate}
                    </Text>
                    <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 13, color: tokens.inkMuted }}>
                      {v.brand} {v.model} · {v.year}
                    </Text>
                    {v.hasActivePolicy && v.activePolicyType && (
                      <View style={{ flexDirection: 'row', marginTop: 4 }}>
                        <Tag tone="green">{v.activePolicyType} активен</Tag>
                      </View>
                    )}
                  </View>
                </BlurView>
              </View>
            ))}
          </ScrollView>
          <FAB onPress={() => nav.navigate('GarageEdit', {})} bottom={110} />
        </>
      )}
    </PhoneFrame>
  );
}
