import { useEffect, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { tokens } from '../../../theme/colors';
import { BackButton } from '../../../components/ui/BackButton';
import { TextField } from '../../../components/ui/TextField';
import { Segmented } from '../../../components/ui/Segmented';
import { Toggle } from '../../../components/ui/Toggle';
import { Checkbox } from '../../../components/ui/Checkbox';
import { RedButton } from '../../../components/ui/RedButton';
import { PlusIcon } from '../../../components/icons/PlusIcon';
import { useMedicalProfile, useSaveMedicalProfile } from '../../../api/health';
import { medGlass } from '../components';

const BLOOD_GROUPS = ['O(I)', 'A(II)', 'B(III)', 'AB(IV)'];

// Разбор строки «B(III) Rh+» → { group, rh }.
function parseBlood(bt: string | null): { group: string | null; rh: '+' | '-' | null } {
  if (!bt) return { group: null, rh: null };
  const group = BLOOD_GROUPS.find((g) => bt.startsWith(g)) ?? null;
  const rh = bt.includes('Rh+') ? '+' : bt.includes('Rh−') || bt.includes('Rh-') ? '-' : null;
  return { group, rh };
}

// M14.10 — Редактирование мед.карты. Сохраняет на бэкенд; чувствительные поля
// шифруются на сервере. Первое сохранение требует согласия.
export function HealthMedCardEditScreen() {
  const nav = useNavigation();
  const { data } = useMedicalProfile();
  const save = useSaveMedicalProfile();

  const [fullName, setFullName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState<'M' | 'F' | null>(null);
  const [group, setGroup] = useState<string | null>(null);
  const [rh, setRh] = useState<'+' | '-' | null>(null);
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [allergies, setAllergies] = useState<string[]>([]);
  const [newAllergy, setNewAllergy] = useState('');
  const [chronic, setChronic] = useState('');
  const [medications, setMedications] = useState('');
  const [organDonor, setOrganDonor] = useState(false);
  const [pregnancy, setPregnancy] = useState(false);
  const [dmsPolicy, setDmsPolicy] = useState('');
  const [doctorName, setDoctorName] = useState('');
  const [consent, setConsent] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  const alreadyConsented = data?.consented ?? false;

  const [prefilled, setPrefilled] = useState(false);

  useEffect(() => {
    if (hydrated || !data) return;
    const p = data.profile;
    if (p) {
      setFullName(p.fullName ?? '');
      setBirthDate(p.birthDate ?? '');
      setGender(p.gender);
      const b = parseBlood(p.bloodType);
      setGroup(b.group);
      setRh(b.rh);
      setHeight(p.heightCm != null ? String(p.heightCm) : '');
      setWeight(p.weightKg != null ? String(p.weightKg) : '');
      setAllergies(p.allergies ?? []);
      setChronic(p.chronic ?? '');
      setMedications(p.medications ?? '');
      setOrganDonor(!!p.organDonor);
      setPregnancy(!!p.pregnancy);
      setDmsPolicy(p.dmsPolicy ?? '');
      setDoctorName(p.doctorName ?? '');
    } else {
      // Новая карта — автозаполняем из профиля (MyID): ФИО, дата рождения, пол.
      const dflt = data.defaults;
      if (dflt.fullName) setFullName(dflt.fullName);
      if (dflt.birthDate) setBirthDate(dflt.birthDate);
      if (dflt.gender) setGender(dflt.gender);
      if (dflt.fullName || dflt.birthDate || dflt.gender) setPrefilled(true);
    }
    setHydrated(true);
  }, [data, hydrated]);

  const addAllergy = () => {
    const v = newAllergy.trim();
    if (!v || allergies.includes(v)) return;
    setAllergies((prev) => [...prev, v]);
    setNewAllergy('');
  };

  const bloodType = group ? `${group}${rh ? ` Rh${rh === '-' ? '−' : '+'}` : ''}` : undefined;
  const canSave = (alreadyConsented || consent) && !save.isPending;

  const onSave = async () => {
    try {
      await save.mutateAsync({
        fullName: fullName.trim() || undefined,
        birthDate: birthDate.trim() || undefined,
        gender: gender ?? undefined,
        bloodType,
        heightCm: height ? Number(height) : undefined,
        weightKg: weight ? Number(weight) : undefined,
        allergies,
        chronic: chronic.trim() || undefined,
        medications: medications.trim() || undefined,
        organDonor,
        pregnancy,
        dmsPolicy: dmsPolicy.trim() || undefined,
        doctorName: doctorName.trim() || undefined,
        consent: alreadyConsented ? undefined : consent,
      });
      nav.goBack();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      alert(msg || 'Не удалось сохранить мед.карту');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: tokens.pageBg }} edges={['top']}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 24, paddingTop: 8, paddingBottom: 12 }}>
        <BackButton onPress={() => nav.goBack()} />
        <Text style={{ fontFamily: 'Manrope_600SemiBold', fontSize: 18, color: tokens.ink }}>Медкарта</Text>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 130, gap: 20 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {prefilled ? (
          <View style={{ flexDirection: 'row', gap: 10, padding: 12, borderRadius: 14, backgroundColor: 'rgba(86,140,255,0.1)' }}>
            <Text style={{ flex: 1, fontFamily: 'Manrope_400Regular', fontSize: 12.5, color: '#1a3577', lineHeight: 17 }}>
              ФИО, дата рождения и пол заполнены из вашего профиля — проверьте и при необходимости измените.
            </Text>
          </View>
        ) : null}

        <TextField label="ФИО" value={fullName} onChangeText={setFullName} placeholder="Азиз Каримов" />

        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <TextField label="Дата рождения" value={birthDate} onChangeText={setBirthDate} placeholder="15.03.1994" />
          </View>
          <View style={{ flex: 1, gap: 6 }}>
            <Text style={{ fontFamily: 'Manrope_500Medium', fontSize: 13, color: tokens.inkMuted }}>Пол</Text>
            <Segmented
              options={['Муж', 'Жен']}
              active={gender === 'F' ? 1 : 0}
              onChange={(i) => setGender(i === 1 ? 'F' : 'M')}
            />
          </View>
        </View>

        {/* Группа крови */}
        <View style={{ gap: 8 }}>
          <Text style={{ fontFamily: 'Manrope_500Medium', fontSize: 13, color: tokens.inkMuted }}>Группа крови</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {BLOOD_GROUPS.map((g) => {
              const on = group === g;
              return (
                <Pressable
                  key={g}
                  onPress={() => setGroup(on ? null : g)}
                  style={{
                    flex: 1,
                    minWidth: 70,
                    paddingVertical: 11,
                    borderRadius: 14,
                    alignItems: 'center',
                    backgroundColor: on ? tokens.inkDark : tokens.glass,
                    borderWidth: on ? 0 : 1,
                    borderColor: tokens.hairline,
                  }}
                >
                  <Text style={{ fontFamily: 'Manrope_600SemiBold', fontSize: 13, color: on ? '#fff' : tokens.inkDark }}>{g}</Text>
                </Pressable>
              );
            })}
          </View>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            {(['+', '-'] as const).map((sign) => {
              const on = rh === sign;
              return (
                <Pressable
                  key={sign}
                  onPress={() => setRh(on ? null : sign)}
                  style={{
                    flex: 1,
                    paddingVertical: 10,
                    borderRadius: 14,
                    alignItems: 'center',
                    backgroundColor: on ? tokens.red : tokens.glass,
                    borderWidth: on ? 0 : 1,
                    borderColor: tokens.hairline,
                  }}
                >
                  <Text style={{ fontFamily: 'Manrope_600SemiBold', fontSize: 13, color: on ? '#fff' : tokens.inkDark }}>
                    {sign === '+' ? 'Rh+ положительный' : 'Rh− отрицательный'}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <TextField label="Рост, см" value={height} onChangeText={setHeight} keyboardType="number-pad" placeholder="178" />
          </View>
          <View style={{ flex: 1 }}>
            <TextField label="Вес, кг" value={weight} onChangeText={setWeight} keyboardType="number-pad" placeholder="74" />
          </View>
        </View>

        {/* Аллергии */}
        <View style={{ gap: 10 }}>
          <Text style={{ fontFamily: 'Manrope_500Medium', fontSize: 13, color: tokens.inkMuted }}>Аллергии</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {allergies.map((a, i) => (
              <Pressable
                key={`${a}-${i}`}
                onPress={() => setAllergies((prev) => prev.filter((x) => x !== a))}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8, paddingLeft: 13, paddingRight: 10, borderRadius: 999, backgroundColor: 'rgba(230,20,40,0.1)' }}
              >
                <Text style={{ fontFamily: 'Manrope_600SemiBold', fontSize: 13, color: tokens.red }}>{a}</Text>
                <View style={{ width: 18, height: 18, borderRadius: 999, backgroundColor: 'rgba(230,20,40,0.18)', alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 11, color: tokens.red, lineHeight: 13 }}>×</Text>
                </View>
              </Pressable>
            ))}
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={{ flex: 1 }}>
              <TextField
                value={newAllergy}
                onChangeText={setNewAllergy}
                placeholder="Добавить аллерген"
                onSubmitEditing={addAllergy}
                returnKeyType="done"
              />
            </View>
            <Pressable
              onPress={addAllergy}
              style={({ pressed }) => ({ width: 48, height: 48, borderRadius: 999, backgroundColor: tokens.inkDark, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.8 : 1 })}
            >
              <PlusIcon size={20} color="#fff" strokeWidth={2} />
            </Pressable>
          </View>
        </View>

        <TextField label="Хронические заболевания" value={chronic} onChangeText={setChronic} placeholder="Бронхиальная астма (лёгкая)" />
        <TextField label="Постоянные лекарства" value={medications} onChangeText={setMedications} placeholder="Сальбутамол — по потребности" />

        {/* Тумблеры */}
        <View style={{ gap: 8 }}>
          <ToggleRow title="Донор органов" sub="Показывать врачам скорой" value={organDonor} onChange={setOrganDonor} />
          <ToggleRow title="Беременность" sub="Актуально сейчас" value={pregnancy} onChange={setPregnancy} />
        </View>

        <TextField label="Полис ОМС / ДМС" value={dmsPolicy} onChangeText={setDmsPolicy} placeholder="SOS24 ДМС · до 12.2026" />
        <TextField label="Лечащий врач" value={doctorName} onChangeText={setDoctorName} placeholder="Малика Содиқова · терапевт" />

        {/* Согласие (только при первом заполнении) */}
        {!alreadyConsented ? (
          <Pressable onPress={() => setConsent((v) => !v)} style={[{ flexDirection: 'row', gap: 12, padding: 14, borderRadius: 16 }, medGlass]}>
            <Checkbox checked={consent} onChange={setConsent} />
            <Text style={{ flex: 1, fontFamily: 'Manrope_400Regular', fontSize: 12.5, color: tokens.inkMuted, lineHeight: 18 }}>
              Согласен на обработку и хранение медицинских данных. Данные шифруются и доступны только мне и врачам скорой при SOS.
            </Text>
          </Pressable>
        ) : null}
      </ScrollView>

      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          paddingHorizontal: 24,
          paddingTop: 12,
          paddingBottom: 32,
          backgroundColor: 'rgba(237,237,237,0.96)',
          borderTopWidth: 1,
          borderTopColor: tokens.hairline,
        }}
      >
        <RedButton trailing={false} onPress={onSave} disabled={!canSave}>
          {save.isPending ? 'Сохраняем…' : 'Сохранить'}
        </RedButton>
      </View>
    </SafeAreaView>
  );
}

function ToggleRow({
  title,
  sub,
  value,
  onChange,
}: {
  title: string;
  sub: string;
  value: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, paddingHorizontal: 16, borderRadius: 18 }, medGlass]}>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={{ fontFamily: 'Manrope_500Medium', fontSize: 15, color: tokens.inkDark }}>{title}</Text>
        <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 12, color: tokens.inkMuted }}>{sub}</Text>
      </View>
      <Toggle value={value} onChange={onChange} />
    </View>
  );
}
