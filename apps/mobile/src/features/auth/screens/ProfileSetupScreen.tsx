import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { updateProfile, type MeResponse } from '../../../api/auth';
import { CalendarIcon } from '../../../components/icons/CalendarIcon';
import { BackButton } from '../../../components/ui/BackButton';
import { PhoneFrame } from '../../../components/ui/PhoneFrame';
import { RedButton } from '../../../components/ui/RedButton';
import { ScreenHeading } from '../../../components/ui/ScreenHeading';
import { Segmented } from '../../../components/ui/Segmented';
import { StepperBar } from '../../../components/ui/StepperBar';
import { TextField } from '../../../components/ui/TextField';
import { setLocale } from '../../../lib/i18n';
import { useAuthStore } from '../../../stores/authStore';
import { tokens } from '../../../theme/colors';

const LOCALES: Array<{ label: string; value: MeResponse['locale'] }> = [
  { label: "O'zbek", value: 'uz_Latn' },
  { label: 'Ўзбек', value: 'uz_Cyrl' },
  { label: 'Русский', value: 'ru' },
  { label: 'English', value: 'en' },
];

// M1.6 — заполнение профиля при регистрации. Эталон: SOS24/screens.jsx → ScreenProfileSetup.
export function ProfileSetupScreen() {
  const { t } = useTranslation();
  const status = useAuthStore((s) => s.status);

  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [patronymic, setPatronymic] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [localeIdx, setLocaleIdx] = useState(2); // ru по умолчанию
  const [submitting, setSubmitting] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const canSubmit = name.trim() && surname.trim() && birthDate.trim();

  const onSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const chosen = LOCALES[localeIdx];
      await updateProfile({
        name: name.trim(),
        surname: surname.trim(),
        patronymic: patronymic.trim() || undefined,
        birthDate, // ожидается YYYY-MM-DD; пользователь пока вводит вручную
        locale: chosen.value,
      });
      // Локаль приложения тоже переключаем (i18n)
      const i18nKey = chosen.value === 'uz_Latn' ? 'uz-Latn' : chosen.value === 'uz_Cyrl' ? 'uz-Cyrl' : chosen.value;
      await setLocale(i18nKey as 'ru' | 'en' | 'uz-Latn' | 'uz-Cyrl');
      // После записи профиля RootNavigator уже на authenticated; ProfileSetup
      // лежит в AuthStack, поэтому переход на Home происходит автоматически
      // как только статус обновится (он уже authenticated). Достаточно ничего
      // не делать — но т.к. сейчас стек тот же, делаем сброс через replace
      // отсутствие (RootNavigator решает по auth.status).
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PhoneFrame>
      {/* Top: back button + stepper */}
      <View
        style={{
          position: 'absolute',
          top: 56,
          left: 24,
          right: 24,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 16,
          zIndex: 3,
        }}
      >
        <BackButton />
        <StepperBar current={1} total={1} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingTop: 140, paddingHorizontal: 24, paddingBottom: 140 }}
        keyboardShouldPersistTaps="handled"
      >
        <ScreenHeading
          title={t('auth.profileSetup.title')}
          subtitle={t('auth.profileSetup.subtitle')}
        />

        <View style={{ gap: 14, marginTop: 24 }}>
          <TextField
            label={t('auth.profileSetup.name') as string}
            value={name}
            onChangeText={setName}
            onFocus={() => setFocusedField('name')}
            onBlur={() => setFocusedField(null)}
            focused={focusedField === 'name'}
            placeholder="Азиз"
          />
          <TextField
            label={t('auth.profileSetup.surname') as string}
            value={surname}
            onChangeText={setSurname}
            onFocus={() => setFocusedField('surname')}
            onBlur={() => setFocusedField(null)}
            focused={focusedField === 'surname'}
            placeholder="Каримов"
          />
          <TextField
            label={t('auth.profileSetup.patronymic') as string}
            value={patronymic}
            onChangeText={setPatronymic}
            onFocus={() => setFocusedField('patronymic')}
            onBlur={() => setFocusedField(null)}
            focused={focusedField === 'patronymic'}
            placeholder={t('auth.profileSetup.patronymicPlaceholder') as string}
          />
          <TextField
            label={t('auth.profileSetup.birthDate') as string}
            value={birthDate}
            onChangeText={setBirthDate}
            onFocus={() => setFocusedField('birthDate')}
            onBlur={() => setFocusedField(null)}
            focused={focusedField === 'birthDate'}
            placeholder="ГГГГ-ММ-ДД"
            keyboardType="numbers-and-punctuation"
            suffix={<CalendarIcon />}
          />

          <View style={{ gap: 8, marginTop: 4 }}>
            <Text
              style={{
                fontFamily: 'Manrope_500Medium',
                fontSize: 13,
                color: tokens.inkMuted,
                letterSpacing: -0.065,
              }}
            >
              {t('auth.profileSetup.language')}
            </Text>
            <Segmented
              options={LOCALES.map((l) => l.label)}
              active={localeIdx}
              onChange={setLocaleIdx}
            />
          </View>
        </View>
      </ScrollView>

      <View style={{ position: 'absolute', left: 24, right: 24, bottom: 36 }}>
        <RedButton onPress={onSubmit} disabled={!canSubmit || submitting}>
          {submitting ? <ActivityIndicator color="#fff" /> : t('auth.profileSetup.submit')}
        </RedButton>
      </View>
    </PhoneFrame>
  );
}
