import { useRef, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Animated, Easing, Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { tokens } from '../../../theme/colors';
import type { HealthStackParamList } from '../../../navigation/types';
import { IconBell } from '../../../components/icons/IconBell';
import { ChevronRightThin, MedCrossIcon, PhoneFillIcon, StethoscopeIcon, UsersIcon } from '../../../components/icons/MedIcons';
import { useDoctors } from '../../../api/health';
import { MedDoctorCard, MedQuickTile, MedSectionLabel, WhoopCard } from '../components';

type Nav = NativeStackNavigationProp<HealthStackParamList, 'HealthHub'>;

const money = (n: number | null) => (n != null ? `${n.toLocaleString('ru-RU')} сум` : '—');

// Короткий номер экстренной службы SOS24 (диспетчер 24/7). Поменять здесь.
const SOS_HOTLINE = '1024';

// M14.1 — Хаб раздела «Здоровье» (Фаза C · собран на медкомпонентах Фазы B).
// SOS-герой, вход в ИИ-диагноз, быстрые плитки, «врачи рядом».
export function HealthHubScreen() {
  const nav = useNavigation<Nav>();
  const openSos = () => nav.getParent()?.navigate('HealthSosActive' as never);
  const { data } = useDoctors({});
  const nearby = (data?.doctors ?? []).slice(0, 2);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: tokens.pageBg }} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 140 }}>
        {/* Заголовок */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            paddingHorizontal: 24,
            paddingTop: 16,
          }}
        >
          <View style={{ gap: 4 }}>
            <Text style={{ fontFamily: 'NeueMontreal-Medium', fontSize: 28, letterSpacing: -0.28, color: tokens.ink }}>
              Здоровье
            </Text>
            <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 14, color: tokens.inkMuted }}>
              Помощь рядом, когда нужна
            </Text>
          </View>
          <Pressable
            hitSlop={8}
            style={({ pressed }) => ({
              width: 40,
              height: 40,
              borderRadius: 999,
              backgroundColor: tokens.glass,
              borderWidth: 1,
              borderColor: tokens.hairline,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <IconBell size={18} color={tokens.ink} />
          </Pressable>
        </View>

        <View style={{ paddingHorizontal: 24, paddingTop: 20, gap: 20 }}>
          {/* SOS-герой — активация удержанием */}
          <SosHero onActivate={openSos} />

          {/* Вход в ИИ-диагноз */}
          <Pressable
            onPress={() => nav.navigate('HealthTriage')}
            style={({ pressed }) => ({
              backgroundColor: tokens.inkDark,
              borderRadius: 28,
              padding: 20,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 16,
              opacity: pressed ? 0.9 : 1,
            })}
          >
            <LinearGradient
              colors={['#E61428', '#3A1117']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ width: 52, height: 52, borderRadius: 999, alignItems: 'center', justifyContent: 'center' }}
            >
              <StethoscopeIcon size={22} color="#fff" />
            </LinearGradient>
            <View style={{ flex: 1, gap: 3 }}>
              <Text style={{ fontFamily: 'NeueMontreal-Medium', fontSize: 18, color: '#fff' }}>ИИ-диагноз</Text>
              <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 12.5, color: tokens.inkMutedDark, lineHeight: 17 }}>
                Опишите или наговорите симптомы — подскажем, что делать
              </Text>
            </View>
            <ChevronRightThin size={16} color="rgba(255,255,255,0.5)" />
          </Pressable>

          {/* Мои показатели (носимый трекер WHOOP) */}
          <WhoopCard onOpenDetail={() => nav.navigate('HealthWearable')} />

          {/* Быстрые действия 2×2 */}
          <View style={{ gap: 12 }}>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <MedQuickTile
                tone="red"
                title="Мед.карта"
                sub="Группа крови, аллергии, контакты"
                icon={(c) => <MedCrossIcon size={20} color={c} />}
                onPress={() => nav.navigate('HealthMedCard')}
              />
              <MedQuickTile
                tone="red"
                title="Скорая помощь"
                sub={`Звонок диспетчеру · ${SOS_HOTLINE}`}
                icon={(c) => <PhoneFillIcon size={20} color={c} />}
                onPress={() => Linking.openURL(`tel:${SOS_HOTLINE}`)}
              />
            </View>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <MedQuickTile
                tone="glass"
                title="Найти врача"
                sub="Терапевт, ЛОР, кардиолог"
                icon={(c) => <StethoscopeIcon size={20} color={c} />}
                onPress={() => nav.navigate('HealthDoctors')}
              />
              <MedQuickTile
                tone="glass"
                title="Контакты ЧП"
                sub="2 близких настроены"
                icon={(c) => <UsersIcon size={20} color={c} />}
                onPress={() => nav.navigate('HealthContacts')}
              />
            </View>
          </View>

          {/* Врачи рядом */}
          <View style={{ gap: 12 }}>
            <MedSectionLabel action="Все врачи" onAction={() => nav.navigate('HealthDoctors')}>
              Врачи рядом
            </MedSectionLabel>
            {nearby.map((d) => (
              <MedDoctorCard
                key={d.id}
                name={d.fullName}
                specialty={d.specialty}
                experience={d.experienceY != null ? `${d.experienceY} лет` : undefined}
                rating={d.rating.toFixed(1)}
                reviews={`${d.reviewCount} отзывов`}
                price={money(d.pricePrimary)}
                video={d.videoEnabled}
                verified={d.verified}
                bookingEnabled={d.bookingEnabled}
                workplace={[d.clinic?.name, d.clinic?.city].filter(Boolean).join(' · ')}
                onPress={() => nav.navigate('HealthDoctorProfile', { id: d.id })}
                onBook={() => nav.navigate('HealthBooking', { doctorId: d.id })}
                onCall={() => d.phone && void Linking.openURL(`tel:${d.phone}`)}
              />
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const HOLD_MS = 1000; // сколько удерживать для активации SOS

// SOS-герой с активацией удержанием: заполнение-прогресс при зажатии,
// срабатывание по long-press; короткий тап показывает подсказку.
function SosHero({ onActivate }: { onActivate: () => void }) {
  const fill = useRef(new Animated.Value(0)).current;
  const [hint, setHint] = useState(false);
  const hintTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startHold = () => {
    fill.stopAnimation();
    Animated.timing(fill, { toValue: 1, duration: HOLD_MS, easing: Easing.linear, useNativeDriver: false }).start();
  };
  const cancelHold = () => {
    Animated.timing(fill, { toValue: 0, duration: 180, useNativeDriver: false }).start();
  };
  const activate = () => {
    fill.setValue(0);
    onActivate();
  };
  const showHint = () => {
    setHint(true);
    if (hintTimer.current) clearTimeout(hintTimer.current);
    hintTimer.current = setTimeout(() => setHint(false), 2600);
  };

  const fillWidth = fill.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <Pressable onPressIn={startHold} onPressOut={cancelHold} onLongPress={activate} onPress={showHint} delayLongPress={HOLD_MS}>
      <LinearGradient
        colors={['#E61428', '#B00C1E']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          borderRadius: 32,
          padding: 22,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 18,
          overflow: 'hidden',
          shadowColor: tokens.red,
          shadowOpacity: 0.4,
          shadowRadius: 24,
          shadowOffset: { width: 0, height: 16 },
        }}
      >
        {/* Прогресс удержания */}
        <Animated.View
          style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: fillWidth, backgroundColor: 'rgba(255,255,255,0.2)' }}
        />
        <View
          style={{
            width: 64,
            height: 64,
            borderRadius: 999,
            backgroundColor: 'rgba(255,255,255,0.16)',
            borderWidth: 2,
            borderColor: 'rgba(255,255,255,0.5)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ fontFamily: 'NeueMontreal-Bold', fontSize: 18, letterSpacing: 0.4, color: '#fff' }}>SOS</Text>
        </View>
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={{ fontFamily: 'NeueMontreal-Medium', fontSize: 20, color: '#fff' }}>Экстренная помощь</Text>
          <Text style={{ fontFamily: hint ? 'Manrope_600SemiBold' : 'Manrope_400Regular', fontSize: 12.5, color: '#fff', lineHeight: 17 }}>
            {hint
              ? 'Нажмите и удерживайте кнопку 1 секунду'
              : 'Удерживайте — оповестим близких и отправим геолокацию'}
          </Text>
        </View>
      </LinearGradient>
    </Pressable>
  );
}
