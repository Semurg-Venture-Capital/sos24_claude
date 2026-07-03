import { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Contacts from 'expo-contacts';
import { tokens } from '../../../theme/colors';
import { BackButton } from '../../../components/ui/BackButton';
import { TextField } from '../../../components/ui/TextField';
import { Toggle } from '../../../components/ui/Toggle';
import { AddTile } from '../../../components/ui/AddTile';
import { RedButton } from '../../../components/ui/RedButton';
import { UsersIcon } from '../../../components/icons/MedIcons';
import { useAddContact, useDeleteContact, useEmergencyContacts } from '../../../api/health';
import { MedContactCard, MedSectionLabel, medGlass } from '../components';

// M14.11 — Экстренные контакты. Реальный CRUD (лимит 3). SOS-настройки — локально.
export function HealthContactsScreen() {
  const nav = useNavigation();
  const { data, isLoading } = useEmergencyContacts();
  const addContact = useAddContact();
  const deleteContact = useDeleteContact();

  const [autoNotify, setAutoNotify] = useState(true);
  const [sendGeo, setSendGeo] = useState(true);
  const [call103, setCall103] = useState(false);

  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [relation, setRelation] = useState('');
  const [phone, setPhone] = useState('');

  const contacts = data?.contacts ?? [];
  const limit = data?.limit ?? 3;
  const canAdd = contacts.length < limit;

  const submitAdd = async () => {
    if (!name.trim() || !phone.trim()) return;
    try {
      await addContact.mutateAsync({ name: name.trim(), relation: relation.trim() || undefined, phone: phone.trim() });
      setName('');
      setRelation('');
      setPhone('');
      setAdding(false);
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      alert(msg || 'Не удалось добавить контакт');
    }
  };

  const confirmDelete = (id: string, contactName: string) => {
    Alert.alert('Удалить контакт?', contactName, [
      { text: 'Отмена', style: 'cancel' },
      { text: 'Удалить', style: 'destructive', onPress: () => deleteContact.mutate(id) },
    ]);
  };

  // Выбор из телефонной книги (нативный пикер, полный доступ к контактам не нужен).
  const pickFromContacts = async () => {
    try {
      const picked = await Contacts.presentContactPickerAsync();
      if (!picked) return;
      const pickedName = picked.name || [picked.firstName, picked.lastName].filter(Boolean).join(' ');
      const pickedPhone = picked.phoneNumbers?.[0]?.number;
      setName(pickedName ?? '');
      setPhone(pickedPhone ?? '');
      setRelation('');
      setAdding(true);
      if (!pickedPhone) {
        Alert.alert('Нет номера', 'У выбранного контакта нет телефона — впишите его вручную.');
      }
    } catch {
      Alert.alert('Ошибка', 'Не удалось открыть контакты.');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: tokens.pageBg }} edges={['top']}>
      <View style={{ paddingHorizontal: 24, paddingTop: 8 }}>
        <BackButton onPress={() => nav.goBack()} />
      </View>
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 20, paddingBottom: 48, gap: 24 }}
      >
        <View style={{ gap: 8 }}>
          <Text style={{ fontFamily: 'NeueMontreal-Medium', fontSize: 28, letterSpacing: -0.28, color: tokens.ink, lineHeight: 32 }}>
            Экстренные{'\n'}контакты
          </Text>
          <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 14, color: tokens.inkMuted, lineHeight: 20 }}>
            Кого оповестить при SOS — отправим сообщение и вашу геолокацию
          </Text>
        </View>

        <View style={{ gap: 10 }}>
          <MedSectionLabel>{`Контакты · ${contacts.length} из ${limit}`}</MedSectionLabel>

          {isLoading ? (
            <ActivityIndicator color={tokens.red} style={{ marginTop: 8, alignSelf: 'flex-start' }} />
          ) : (
            contacts.map((c) => (
              <MedContactCard
                key={c.id}
                name={c.name}
                relation={c.relation ?? undefined}
                phone={c.phone}
                onDelete={() => confirmDelete(c.id, c.name)}
              />
            ))
          )}

          {/* Форма добавления */}
          {adding ? (
            <View style={[{ padding: 16, borderRadius: 22, gap: 12 }, medGlass]}>
              <Pressable
                onPress={pickFromContacts}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  height: 46,
                  borderRadius: 999,
                  backgroundColor: 'rgba(86,140,255,0.14)',
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <UsersIcon size={17} color="#1a3577" />
                <Text style={{ fontFamily: 'Manrope_600SemiBold', fontSize: 14, color: '#1a3577' }}>Выбрать из контактов</Text>
              </Pressable>
              <TextField label="Имя" value={name} onChangeText={setName} placeholder="Гулнора Каримова" />
              <TextField label="Кем приходится" value={relation} onChangeText={setRelation} placeholder="Супруга" />
              <TextField
                label="Телефон"
                value={phone}
                onChangeText={setPhone}
                placeholder="+998 90 234-56-78"
                keyboardType="phone-pad"
              />
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <Pressable
                  onPress={() => {
                    setAdding(false);
                    setName('');
                    setRelation('');
                    setPhone('');
                  }}
                  style={({ pressed }) => ({ flex: 1, height: 52, borderRadius: 999, alignItems: 'center', justifyContent: 'center', backgroundColor: tokens.glass, borderWidth: 1, borderColor: tokens.hairline, opacity: pressed ? 0.7 : 1 })}
                >
                  <Text style={{ fontFamily: 'Manrope_600SemiBold', fontSize: 15, color: tokens.inkDark }}>Отмена</Text>
                </Pressable>
                <View style={{ flex: 1 }}>
                  <RedButton trailing={false} onPress={submitAdd} disabled={!name.trim() || !phone.trim() || addContact.isPending} style={{ height: 52 }}>
                    {addContact.isPending ? 'Добавляем…' : 'Добавить'}
                  </RedButton>
                </View>
              </View>
            </View>
          ) : canAdd ? (
            <View style={{ gap: 10 }}>
              <Pressable
                onPress={pickFromContacts}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  height: 52,
                  borderRadius: 999,
                  backgroundColor: tokens.inkDark,
                  opacity: pressed ? 0.85 : 1,
                })}
              >
                <UsersIcon size={18} color="#fff" />
                <Text style={{ fontFamily: 'Manrope_600SemiBold', fontSize: 15, color: '#fff' }}>Выбрать из контактов</Text>
              </Pressable>
              <AddTile onPress={() => setAdding(true)}>Ввести вручную</AddTile>
            </View>
          ) : (
            <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 12.5, color: tokens.inkMuted, paddingHorizontal: 4 }}>
              Достигнут лимит в {limit} контакта. Удалите один, чтобы добавить другой.
            </Text>
          )}
        </View>

        <View style={{ gap: 8 }}>
          <MedSectionLabel>При срабатывании SOS</MedSectionLabel>
          <SosToggleRow title="Авто-оповещение" sub="SMS + push близким контактам" value={autoNotify} onChange={setAutoNotify} />
          <SosToggleRow title="Отправлять геолокацию" sub="Последняя точка на карте" value={sendGeo} onChange={setSendGeo} />
          <SosToggleRow title="Звонок в службу 103" sub="После отправки оповещений" value={call103} onChange={setCall103} />
        </View>

        <View style={{ flexDirection: 'row', gap: 10, padding: 14, borderRadius: 16, backgroundColor: 'rgba(230,20,40,0.07)' }}>
          <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 12, color: tokens.inkMuted, lineHeight: 17, flex: 1 }}>
            Контакты получат сообщение только при активации SOS. Геолокация хранится защищённо и не передаётся третьим лицам.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function SosToggleRow({
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
    <View
      style={[
        { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, paddingHorizontal: 16, borderRadius: 18 },
        medGlass,
      ]}
    >
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={{ fontFamily: 'Manrope_600SemiBold', fontSize: 15, color: tokens.ink }}>{title}</Text>
        <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 12, color: tokens.inkMuted }}>{sub}</Text>
      </View>
      <Toggle value={value} onChange={onChange} />
    </View>
  );
}
