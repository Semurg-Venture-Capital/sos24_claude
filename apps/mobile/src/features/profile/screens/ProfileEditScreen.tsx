import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { useMe, useUpdateProfile } from '../../../api/auth';
import { CalendarIcon } from '../../../components/icons/CalendarIcon';
import { IconCamera } from '../../../components/icons/LineIcons';
import { Avatar } from '../../../components/ui/Avatar';
import { BackButton } from '../../../components/ui/BackButton';
import { DismissKeyboardView } from '../../../components/ui/DismissKeyboardView';
import { PhoneFrame } from '../../../components/ui/PhoneFrame';
import { RedButton } from '../../../components/ui/RedButton';
import { TextField } from '../../../components/ui/TextField';
import { useKeyboardHeight } from '../../../lib/useKeyboardHeight';
import { tokens } from '../../../theme/colors';
import type { ProfileStackParamList } from '../../../navigation/types';

type Nav = NativeStackNavigationProp<ProfileStackParamList, 'ProfileEdit'>;

function formatBirthDate(iso: string | null | undefined): string {
  if (!iso) return '';
  return iso.slice(0, 10); // "YYYY-MM-DD"
}

// M2.2 — Редактирование профиля.
// Поля ФИО + дата рождения заблокированы если verificationStatus === MYID_VERIFIED —
// данные заполнены из государственной системы и не могут быть изменены вручную.
export function ProfileEditScreen() {
  const { t } = useTranslation();
  const nav = useNavigation<Nav>();
  const kbHeight = useKeyboardHeight();
  const { data: me, isLoading } = useMe();
  const { mutateAsync: updateProfile } = useUpdateProfile();

  const isVerified = me?.verificationStatus === 'MYID_VERIFIED';

  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [patronymic, setPatronymic] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (me) {
      setName(me.name ?? '');
      setSurname(me.surname ?? '');
      setPatronymic(me.patronymic ?? '');
      setBirthDate(formatBirthDate(me.birthDate));
    }
  }, [me]);

  const onSave = async () => {
    setSubmitting(true);
    try {
      await updateProfile({
        name: isVerified ? undefined : name.trim() || undefined,
        surname: isVerified ? undefined : surname.trim() || undefined,
        patronymic: isVerified ? undefined : patronymic.trim() || undefined,
        birthDate: isVerified ? undefined : birthDate || undefined,
      });
      nav.goBack();
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <PhoneFrame>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={tokens.red} />
        </View>
      </PhoneFrame>
    );
  }

  return (
    <PhoneFrame>
      <DismissKeyboardView>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 24,
            paddingTop: 8,
            paddingBottom: 16,
          }}
        >
          <BackButton onPress={() => nav.goBack()} />
          <Text style={{ fontFamily: 'NeueMontreal-Medium', fontSize: 18, color: tokens.ink }}>
            {t('profileExtra.editTitle')}
          </Text>
          <View style={{ width: 48, height: 48 }} />
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 140, gap: 24 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets
        >
          {/* Avatar */}
          <View style={{ alignItems: 'center', gap: 12, marginTop: 8 }}>
            <View>
              <Avatar name={`${name} ${surname}`} size={88} />
              <Pressable
                style={({ pressed }) => ({
                  position: 'absolute',
                  right: -4,
                  bottom: -4,
                  width: 32,
                  height: 32,
                  borderRadius: 999,
                  backgroundColor: tokens.inkDark,
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: pressed ? 0.8 : 1,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 6 },
                  shadowOpacity: 0.2,
                  shadowRadius: 8,
                  elevation: 4,
                })}
              >
                <LinearGradient
                  colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.06)']}
                  style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 999 }}
                />
                <IconCamera size={16} color="#fff" />
              </Pressable>
            </View>
            <Text style={{ fontFamily: 'Manrope_500Medium', fontSize: 14, color: tokens.inkSubtle }}>
              {t('profileExtra.changePhoto')}
            </Text>
          </View>

          {/* MyID lock notice */}
          {isVerified && (
            <View
              style={{
                backgroundColor: 'rgba(52,211,153,0.08)',
                borderRadius: 16,
                borderWidth: 1,
                borderColor: 'rgba(52,211,153,0.2)',
                padding: 14,
                gap: 4,
              }}
            >
              <Text style={{ fontFamily: 'Manrope_600SemiBold', fontSize: 13, color: '#0a9466' }}>
                {t('profileExtra.myIdConfirmed')}
              </Text>
              <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 12, color: '#0a9466', opacity: 0.8 }}>
                {t('profileExtra.myIdNameNote')}
              </Text>
            </View>
          )}

          <View style={{ gap: 14 }}>
            <View style={{ opacity: isVerified ? 0.5 : 1 }}>
              <TextField
                label={t('profileExtra.firstName')}
                value={name}
                onChangeText={setName}
                placeholder={t('profileExtra.firstNamePlaceholder')}
                editable={!isVerified}
              />
            </View>
            <View style={{ opacity: isVerified ? 0.5 : 1 }}>
              <TextField
                label={t('profileExtra.lastName')}
                value={surname}
                onChangeText={setSurname}
                placeholder={t('profileExtra.lastNamePlaceholder')}
                editable={!isVerified}
              />
            </View>
            <View style={{ opacity: isVerified ? 0.5 : 1 }}>
              <TextField
                label={t('profileExtra.patronymic')}
                value={patronymic}
                onChangeText={setPatronymic}
                placeholder={t('profileExtra.patronymicPlaceholder')}
                editable={!isVerified}
              />
            </View>
            <View style={{ opacity: isVerified ? 0.5 : 1 }}>
              <TextField
                label={t('profileExtra.birthDate')}
                value={birthDate}
                onChangeText={setBirthDate}
                placeholder={t('profileExtra.datePlaceholder')}
                keyboardType="numbers-and-punctuation"
                suffix={<CalendarIcon />}
                editable={!isVerified}
              />
            </View>
          </View>
        </ScrollView>

        <View style={{ position: 'absolute', left: 24, right: 24, bottom: 36 + kbHeight }}>
          <RedButton
            onPress={isVerified ? () => nav.goBack() : onSave}
            disabled={submitting || (!isVerified && (!name.trim() || !surname.trim()))}
          >
            {isVerified ? t('profileExtra.close') : submitting ? t('profileExtra.saving') : t('common.save')}
          </RedButton>
        </View>
      </DismissKeyboardView>
    </PhoneFrame>
  );
}
