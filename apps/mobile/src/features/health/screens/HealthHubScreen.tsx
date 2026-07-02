import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { tokens } from '../../../theme/colors';
import type { HealthStackParamList } from '../../../navigation/types';

type Nav = NativeStackNavigationProp<HealthStackParamList, 'HealthHub'>;

// M14.1 — Хаб раздела «Здоровье» (Фаза A: каркас с навигацией по будущим экранам).
// Полный дизайн (SOS-герой, ИИ-диагноз, плитки, врачи рядом) — в фазе C по docs/HEALTH.md.
export function HealthHubScreen() {
  const nav = useNavigation<Nav>();

  const links: { to: keyof HealthStackParamList; label: string; hint: string }[] = [
    { to: 'HealthTriage', label: 'ИИ-диагноз', hint: 'M14.2 · триаж-чат' },
    { to: 'HealthDoctors', label: 'Врачи и клиники', hint: 'M14.4 · каталог' },
    { to: 'HealthMedCard', label: 'Мед.карта', hint: 'M14.9 · Medical ID' },
    { to: 'HealthContacts', label: 'Экстренные контакты', hint: 'M14.11' },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: tokens.pageBg }} edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 140, gap: 20 }}>
        <View style={{ gap: 4 }}>
          <Text style={{ fontFamily: 'Manrope_700Bold', fontSize: 28, color: tokens.ink }}>Здоровье</Text>
          <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 14, color: tokens.inkMuted }}>
            Помощь рядом, когда нужна
          </Text>
        </View>

        <View
          style={{
            padding: 16,
            borderRadius: 16,
            backgroundColor: 'rgba(230,20,40,0.08)',
            borderWidth: 1,
            borderColor: 'rgba(230,20,40,0.25)',
          }}
        >
          <Text style={{ fontFamily: 'Manrope_600SemiBold', fontSize: 13, color: tokens.red, lineHeight: 18 }}>
            Раздел в разработке (Фаза A · каркас). Ниже — переходы к экранам, которые наполним по docs/HEALTH.md.
          </Text>
        </View>

        <View style={{ gap: 10 }}>
          {links.map((l) => (
            <Pressable
              key={l.to}
              onPress={() => nav.navigate(l.to as never)}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: 18,
                borderRadius: 18,
                backgroundColor: 'rgba(255,255,255,0.6)',
                borderWidth: 1,
                borderColor: tokens.hairline,
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <View style={{ gap: 2 }}>
                <Text style={{ fontFamily: 'Manrope_600SemiBold', fontSize: 16, color: tokens.ink }}>{l.label}</Text>
                <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 12, color: tokens.inkSubtle }}>{l.hint}</Text>
              </View>
              <Text style={{ fontFamily: 'Manrope_700Bold', fontSize: 18, color: tokens.inkSubtle }}>›</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
