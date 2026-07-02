import { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { tokens } from '../../../theme/colors';
import { BackButton } from '../../../components/ui/BackButton';
import { Toggle } from '../../../components/ui/Toggle';
import { AddTile } from '../../../components/ui/AddTile';
import { MedContactCard, MedSectionLabel, medGlass } from '../components';

// M14.11 — Экстренные контакты. UI на медкомпонентах Фазы B, данные — мок.
// Реальные контакты + SOS-оповещение (push/SMS + гео) — Фаза F (docs/HEALTH.md).
export function HealthContactsScreen() {
  const nav = useNavigation();
  const [autoNotify, setAutoNotify] = useState(true);
  const [sendGeo, setSendGeo] = useState(true);
  const [call103, setCall103] = useState(false);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: tokens.pageBg }} edges={['top']}>
      <View style={{ paddingHorizontal: 24, paddingTop: 8 }}>
        <BackButton onPress={() => nav.goBack()} />
      </View>
      <ScrollView
        showsVerticalScrollIndicator={false}
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
          <MedSectionLabel>Контакты · 2 из 3</MedSectionLabel>
          <MedContactCard name="Гулнора Каримова" relation="Супруга" phone="+998 90 234-56-78" />
          <MedContactCard name="Бахтиёр Каримов" relation="Брат" phone="+998 91 345-67-89" />
          <AddTile onPress={() => {}}>Добавить контакт</AddTile>
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
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 14,
          paddingVertical: 14,
          paddingHorizontal: 16,
          borderRadius: 18,
        },
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
