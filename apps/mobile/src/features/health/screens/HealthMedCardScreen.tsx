import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { tokens } from '../../../theme/colors';
import type { HealthStackParamList } from '../../../navigation/types';
import { Avatar } from '../../../components/ui/Avatar';
import { BackArrow } from '../../../components/icons/BackArrow';
import { BloodDropIcon, MedCrossIcon } from '../../../components/icons/MedIcons';
import { RedButton } from '../../../components/ui/RedButton';
import { useEmergencyContacts, useMedicalProfile, type EmergencyContact, type MedicalProfileData } from '../../../api/health';
import { MedCardRow, MedChip, MedContactCard, MedSectionLabel, MedVital, medGlass } from '../components';

type Nav = NativeStackNavigationProp<HealthStackParamList, 'HealthMedCard'>;

const genderLabel = (g: string | null) => (g === 'M' ? 'Мужчина' : g === 'F' ? 'Женщина' : null);

// M14.9 — Мед.карта (Medical ID). Данные с бэкенда (чувствительные поля
// расшифровываются на сервере при чтении владельцем). Фаза E.
export function HealthMedCardScreen() {
  const nav = useNavigation<Nav>();
  const { data, isLoading } = useMedicalProfile();
  const { data: contactsData } = useEmergencyContacts();

  const filled = data?.exists && data.profile;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: tokens.pageBg }} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 48 }}>
        {/* Красная шапка */}
        <LinearGradient
          colors={['#E61428', '#9c0a1a']}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={{ paddingHorizontal: 24, paddingTop: 12, paddingBottom: filled ? 56 : 28 }}
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
          {filled ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 20 }}>
              <Avatar name={data!.profile!.fullName || 'Пациент'} size={72} />
              <View style={{ gap: 4, flex: 1 }}>
                <Text style={{ fontFamily: 'NeueMontreal-Medium', fontSize: 24, color: '#fff', letterSpacing: -0.24 }}>
                  {data!.profile!.fullName || 'Без имени'}
                </Text>
                <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 13.5, color: 'rgba(255,255,255,0.85)' }}>
                  {[genderLabel(data!.profile!.gender), data!.profile!.birthDate].filter(Boolean).join(' · ') || 'Данные не заполнены'}
                </Text>
              </View>
            </View>
          ) : null}
        </LinearGradient>

        {isLoading ? (
          <ActivityIndicator color={tokens.red} style={{ marginTop: 48 }} />
        ) : !filled ? (
          <EmptyState onFill={() => nav.navigate('HealthMedCardEdit')} />
        ) : (
          <FilledCard
            p={data!.profile!}
            contacts={contactsData?.contacts ?? []}
            onEditContacts={() => nav.navigate('HealthContacts')}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function EmptyState({ onFill }: { onFill: () => void }) {
  return (
    <View style={{ paddingHorizontal: 24, paddingTop: 40, alignItems: 'center', gap: 12 }}>
      <View style={{ width: 72, height: 72, borderRadius: 999, backgroundColor: 'rgba(230,20,40,0.1)', alignItems: 'center', justifyContent: 'center' }}>
        <MedCrossIcon size={28} color={tokens.red} />
      </View>
      <Text style={{ fontFamily: 'NeueMontreal-Medium', fontSize: 20, color: tokens.ink, textAlign: 'center' }}>
        Мед.карта ещё не заполнена
      </Text>
      <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 14, color: tokens.inkMuted, textAlign: 'center', lineHeight: 20, maxWidth: 300 }}>
        Группа крови, аллергии и хронические заболевания помогут врачам скорой при экстренной ситуации.
      </Text>
      <View style={{ width: '100%', marginTop: 12 }}>
        <RedButton trailing={false} onPress={onFill}>
          Заполнить мед.карту
        </RedButton>
      </View>
    </View>
  );
}

function TextCard({ text }: { text: string }) {
  return (
    <View style={[{ paddingVertical: 14, paddingHorizontal: 16, borderRadius: 18 }, medGlass]}>
      <Text style={{ fontFamily: 'Manrope_500Medium', fontSize: 14, color: tokens.ink, lineHeight: 20 }}>{text}</Text>
    </View>
  );
}

function FilledCard({
  p,
  contacts,
  onEditContacts,
}: {
  p: MedicalProfileData;
  contacts: EmergencyContact[];
  onEditContacts: () => void;
}) {
  const hasVitals = p.bloodType || p.heightCm != null || p.weightKg != null;
  const dataRows: { label: string; value: string; color?: string }[] = [];
  if (p.organDonor != null) dataRows.push({ label: 'Донор органов', value: p.organDonor ? 'Да' : 'Нет', color: p.organDonor ? '#0a3a26' : tokens.inkMuted });
  if (p.pregnancy != null) dataRows.push({ label: 'Беременность', value: p.pregnancy ? 'Да' : '—', color: tokens.inkMuted });
  if (p.dmsPolicy) dataRows.push({ label: 'Полис ДМС', value: p.dmsPolicy });
  if (p.doctorName) dataRows.push({ label: 'Лечащий врач', value: p.doctorName });

  return (
    <>
      {/* Виталы */}
      {hasVitals ? (
        <View style={{ flexDirection: 'row', gap: 10, paddingHorizontal: 24, marginTop: -34 }}>
          <MedVital label="Кровь" value={p.bloodType || '—'} accent icon={<BloodDropIcon size={13} />} />
          <MedVital label="Рост" value={p.heightCm != null ? String(p.heightCm) : '—'} unit={p.heightCm != null ? 'см' : undefined} />
          <MedVital label="Вес" value={p.weightKg != null ? String(p.weightKg) : '—'} unit={p.weightKg != null ? 'кг' : undefined} />
        </View>
      ) : null}

      <View style={{ paddingHorizontal: 24, paddingTop: 24, gap: 18 }}>
        {p.allergies.length > 0 ? (
          <View style={{ gap: 10 }}>
            <MedSectionLabel>Аллергии</MedSectionLabel>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {p.allergies.map((a, i) => (
                <MedChip key={`${a}-${i}`} tone="red">
                  {a}
                </MedChip>
              ))}
            </View>
          </View>
        ) : null}

        {p.chronic ? (
          <View style={{ gap: 10 }}>
            <MedSectionLabel>Хронические заболевания</MedSectionLabel>
            <TextCard text={p.chronic} />
          </View>
        ) : null}

        {p.medications ? (
          <View style={{ gap: 10 }}>
            <MedSectionLabel>Постоянные лекарства</MedSectionLabel>
            <TextCard text={p.medications} />
          </View>
        ) : null}

        {dataRows.length > 0 ? (
          <View style={{ gap: 10 }}>
            <MedSectionLabel>Данные</MedSectionLabel>
            {dataRows.map((r) => (
              <MedCardRow key={r.label} label={r.label} value={r.value} valueColor={r.color} />
            ))}
          </View>
        ) : null}

        {/* Экстренные контакты (реальные, из API) */}
        <View style={{ gap: 10 }}>
          <MedSectionLabel action={contacts.length ? 'Изменить' : 'Добавить'} onAction={onEditContacts}>
            Экстренные контакты
          </MedSectionLabel>
          {contacts.length > 0 ? (
            contacts.map((c) => (
              <MedContactCard key={c.id} name={c.name} relation={c.relation ?? undefined} phone={c.phone} />
            ))
          ) : (
            <Pressable
              onPress={onEditContacts}
              style={({ pressed }) => [
                { padding: 16, borderRadius: 18, alignItems: 'center', opacity: pressed ? 0.7 : 1 },
                medGlass,
              ]}
            >
              <Text style={{ fontFamily: 'Manrope_500Medium', fontSize: 13.5, color: tokens.inkMuted, textAlign: 'center' }}>
                Контакты не добавлены. Укажите близких — их оповестят при SOS.
              </Text>
            </Pressable>
          )}
        </View>

        <View style={{ flexDirection: 'row', gap: 10, padding: 14, borderRadius: 16, backgroundColor: 'rgba(20,20,20,0.04)' }}>
          <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 12, color: tokens.inkMuted, lineHeight: 17, flex: 1 }}>
            Доступно с экрана блокировки для врачей скорой. При SOS отправляется вместе с геолокацией.
          </Text>
        </View>
      </View>
    </>
  );
}
