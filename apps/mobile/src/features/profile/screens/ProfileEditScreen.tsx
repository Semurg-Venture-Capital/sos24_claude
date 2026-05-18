import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { CalendarIcon } from '../../../components/icons/CalendarIcon';
import { IconCamera } from '../../../components/icons/LineIcons';
import { Avatar } from '../../../components/ui/Avatar';
import { BackButton } from '../../../components/ui/BackButton';
import { PhoneFrame } from '../../../components/ui/PhoneFrame';
import { RedButton } from '../../../components/ui/RedButton';
import { TextField } from '../../../components/ui/TextField';
import { tokens } from '../../../theme/colors';
import { MOCK_USER } from '../mockProfile';
import type { ProfileStackParamList } from '../../../navigation/types';

type Nav = NativeStackNavigationProp<ProfileStackParamList, 'ProfileEdit'>;

// M2.2 — Редактирование профиля. Спецификация: SOS24_Mobile_Screens.md §M2.2.
export function ProfileEditScreen() {
  const nav = useNavigation<Nav>();
  const [name, setName] = useState(MOCK_USER.name);
  const [surname, setSurname] = useState(MOCK_USER.surname);
  const [patronymic, setPatronymic] = useState(MOCK_USER.patronymic ?? '');
  const [birthDate, setBirthDate] = useState(MOCK_USER.birthDate);
  const [address, setAddress] = useState(MOCK_USER.address ?? '');
  const [submitting, setSubmitting] = useState(false);

  const onSave = async () => {
    setSubmitting(true);
    // В реале — PATCH /me/profile с новыми полями.
    await new Promise((r) => setTimeout(r, 600));
    setSubmitting(false);
    nav.goBack();
  };

  return (
    <PhoneFrame>
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
        <Text
          style={{
            fontFamily: 'NeueMontreal-Medium',
            fontSize: 18,
            color: tokens.ink,
          }}
        >
          Редактировать
        </Text>
        <View style={{ width: 48, height: 48 }} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 140, gap: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar with edit photo */}
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
            Изменить фото
          </Text>
        </View>

        <View style={{ gap: 14 }}>
          <TextField label="Имя" value={name} onChangeText={setName} placeholder="Азиз" />
          <TextField label="Фамилия" value={surname} onChangeText={setSurname} placeholder="Каримов" />
          <TextField
            label="Отчество (необязательно)"
            value={patronymic}
            onChangeText={setPatronymic}
            placeholder="Эркинович"
          />
          <TextField
            label="Дата рождения"
            value={birthDate}
            onChangeText={setBirthDate}
            placeholder="ГГГГ-ММ-ДД"
            keyboardType="numbers-and-punctuation"
            suffix={<CalendarIcon />}
          />
          <TextField
            label="Адрес (необязательно)"
            value={address}
            onChangeText={setAddress}
            placeholder="Город, улица, дом"
          />
        </View>
      </ScrollView>

      <View style={{ position: 'absolute', left: 24, right: 24, bottom: 36 }}>
        <RedButton
          onPress={onSave}
          disabled={submitting || !name.trim() || !surname.trim()}
        >
          {submitting ? 'Сохранение...' : 'Сохранить'}
        </RedButton>
      </View>
    </PhoneFrame>
  );
}
