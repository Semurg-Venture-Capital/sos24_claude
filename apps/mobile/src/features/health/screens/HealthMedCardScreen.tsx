import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { tokens } from '../../../theme/colors';
import type { HealthStackParamList } from '../../../navigation/types';
import { Avatar } from '../../../components/ui/Avatar';
import { BackArrow } from '../../../components/icons/BackArrow';
import { BloodDropIcon, MedCrossIcon } from '../../../components/icons/MedIcons';
import { MedCardRow, MedChip, MedContactCard, MedSectionLabel, MedVital } from '../components';

type Nav = NativeStackNavigationProp<HealthStackParamList, 'HealthMedCard'>;

// M14.9 — Мед.карта (Medical ID). UI на медкомпонентах Фазы B, данные — мок.
// Реальные данные + шифрование чувствительных полей — Фаза E (docs/HEALTH.md).
export function HealthMedCardScreen() {
  const nav = useNavigation<Nav>();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: tokens.pageBg }} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 48 }}>
        {/* Красная шапка */}
        <LinearGradient
          colors={['#E61428', '#9c0a1a']}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={{ paddingHorizontal: 24, paddingTop: 12, paddingBottom: 56 }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Pressable
              onPress={() => nav.goBack()}
              style={({ pressed }) => ({
                width: 44,
                height: 44,
                borderRadius: 999,
                backgroundColor: 'rgba(255,255,255,0.18)',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <BackArrow size={16} color="#fff" />
            </Pressable>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 7,
                paddingVertical: 8,
                paddingHorizontal: 14,
                borderRadius: 999,
                backgroundColor: 'rgba(255,255,255,0.18)',
              }}
            >
              <MedCrossIcon size={14} color="#fff" />
              <Text style={{ fontFamily: 'Manrope_700Bold', fontSize: 12, color: '#fff', letterSpacing: 0.4 }}>
                МЕД.КАРТА
              </Text>
            </View>
            <Pressable
              onPress={() => nav.navigate('HealthMedCardEdit')}
              style={({ pressed }) => ({
                width: 44,
                height: 44,
                borderRadius: 999,
                backgroundColor: 'rgba(255,255,255,0.18)',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <Text style={{ fontFamily: 'Manrope_600SemiBold', fontSize: 13, color: '#fff' }}>Ред.</Text>
            </Pressable>
          </View>

          {/* Идентификация */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 20 }}>
            <Avatar name="Азиз Каримов" size={72} />
            <View style={{ gap: 4 }}>
              <Text style={{ fontFamily: 'NeueMontreal-Medium', fontSize: 24, color: '#fff', letterSpacing: -0.24 }}>
                Азиз Каримов
              </Text>
              <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 13.5, color: 'rgba(255,255,255,0.85)' }}>
                Мужчина · 32 года · 15.03.1994
              </Text>
            </View>
          </View>
        </LinearGradient>

        {/* Виталы — накладываются на шапку */}
        <View style={{ flexDirection: 'row', gap: 10, paddingHorizontal: 24, marginTop: -34 }}>
          <MedVital label="Кровь" value="B(III) Rh+" accent icon={<BloodDropIcon size={13} />} />
          <MedVital label="Рост" value="178" unit="см" />
          <MedVital label="Вес" value="74" unit="кг" />
        </View>

        {/* Секции */}
        <View style={{ paddingHorizontal: 24, paddingTop: 24, gap: 18 }}>
          <View style={{ gap: 10 }}>
            <MedSectionLabel>Аллергии</MedSectionLabel>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              <MedChip tone="red">Пенициллин</MedChip>
              <MedChip tone="red">Аспирин</MedChip>
              <MedChip tone="yellow">Пыльца</MedChip>
            </View>
          </View>

          <View style={{ gap: 10 }}>
            <MedSectionLabel>Хронические заболевания</MedSectionLabel>
            <MedCardRow label="Бронхиальная астма" value="лёгкая форма" valueColor={tokens.inkMuted} />
          </View>

          <View style={{ gap: 10 }}>
            <MedSectionLabel>Постоянные лекарства</MedSectionLabel>
            <MedCardRow label="Сальбутамол (ингалятор)" value="по потребности" valueColor={tokens.inkMuted} />
          </View>

          <View style={{ gap: 10 }}>
            <MedSectionLabel>Данные</MedSectionLabel>
            <MedCardRow label="Донор органов" value="Да" valueColor="#0a3a26" />
            <MedCardRow label="Беременность" value="—" valueColor={tokens.inkMuted} />
            <MedCardRow label="Полис ДМС" value="SOS24 · до 12.2026" />
            <MedCardRow label="Лечащий врач" value="Малика Содиқова" />
          </View>

          <View style={{ gap: 10 }}>
            <MedSectionLabel action="Изменить" onAction={() => nav.navigate('HealthContacts')}>
              Экстренные контакты
            </MedSectionLabel>
            <MedContactCard name="Гулнора Каримова" relation="Супруга" phone="+998 90 234-56-78" />
            <MedContactCard name="Бахтиёр Каримов" relation="Брат" phone="+998 91 345-67-89" />
          </View>

          <View style={{ flexDirection: 'row', gap: 10, padding: 14, borderRadius: 16, backgroundColor: 'rgba(20,20,20,0.04)' }}>
            <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 12, color: tokens.inkMuted, lineHeight: 17, flex: 1 }}>
              Доступно с экрана блокировки для врачей скорой. При SOS отправляется вместе с геолокацией.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
