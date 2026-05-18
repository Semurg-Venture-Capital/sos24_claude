import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BlurView } from 'expo-blur';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { CalendarIcon } from '../../../components/icons/CalendarIcon';
import { IconCamera } from '../../../components/icons/LineIcons';
import { BackButton } from '../../../components/ui/BackButton';
import { PhoneFrame } from '../../../components/ui/PhoneFrame';
import { RedButton } from '../../../components/ui/RedButton';
import { ScreenHeading } from '../../../components/ui/ScreenHeading';
import { StatusPill } from '../../../components/ui/StatusPill';
import { TextField } from '../../../components/ui/TextField';
import { tokens } from '../../../theme/colors';
import { MOCK_DOCUMENTS } from '../mockProfile';
import type { ProfileStackParamList } from '../../../navigation/types';

type Nav = NativeStackNavigationProp<ProfileStackParamList, 'Document'>;
type R = RouteProp<ProfileStackParamList, 'Document'>;

const INFO_TEXT: Record<string, string> = {
  passport: 'Необходимо для оформления полисов и идентификации владельца.',
  license: 'Требуется для расчёта стоимости с учётом стажа водителя.',
};

// M2.3 — Документы (паспорт / ВУ). Спецификация: SOS24_Mobile_Screens.md §M2.3.
export function DocumentScreen() {
  const nav = useNavigation<Nav>();
  const route = useRoute<R>();
  const doc = MOCK_DOCUMENTS[route.params.kind];
  const isPassport = doc.kind === 'passport';

  const [series, setSeries] = useState(doc.series ?? '');
  const [number, setNumber] = useState(doc.number ?? '');
  const [issuedAt, setIssuedAt] = useState(doc.issuedAt ?? '');
  const [issuedBy, setIssuedBy] = useState(doc.issuedBy ?? '');
  const [pinfl, setPinfl] = useState(doc.pinfl ?? '');
  const [submitting, setSubmitting] = useState(false);

  const onSave = async () => {
    setSubmitting(true);
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
          paddingHorizontal: 24,
          paddingTop: 8,
          paddingBottom: 16,
        }}
      >
        <BackButton onPress={() => nav.goBack()} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 140, gap: 20 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ gap: 12 }}>
          <ScreenHeading title={doc.title} subtitle={INFO_TEXT[doc.kind]} />
          <View style={{ flexDirection: 'row' }}>
            <StatusPill status={doc.status} />
          </View>
        </View>

        <View style={{ gap: 14 }}>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}>
              <TextField
                label="Серия"
                value={series}
                onChangeText={setSeries}
                placeholder="AA"
                autoCapitalize="characters"
                maxLength={2}
              />
            </View>
            <View style={{ flex: 2 }}>
              <TextField
                label="Номер"
                value={number}
                onChangeText={setNumber}
                placeholder="1234567"
                keyboardType="number-pad"
              />
            </View>
          </View>
          <TextField
            label="Дата выдачи"
            value={issuedAt}
            onChangeText={setIssuedAt}
            placeholder="ГГГГ-ММ-ДД"
            keyboardType="numbers-and-punctuation"
            suffix={<CalendarIcon />}
          />
          <TextField
            label="Кем выдан"
            value={issuedBy}
            onChangeText={setIssuedBy}
            placeholder="УВД..."
          />
          {isPassport && (
            <TextField
              label="ПИНФЛ"
              value={pinfl}
              onChangeText={setPinfl}
              placeholder="14 цифр"
              keyboardType="number-pad"
              maxLength={14}
            />
          )}
        </View>

        {/* Photo upload area */}
        <View style={{ gap: 10 }}>
          <Text
            style={{
              fontFamily: 'Manrope_500Medium',
              fontSize: 13,
              color: tokens.inkMuted,
              letterSpacing: -0.065,
            }}
          >
            Фото документа
          </Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <UploadTile label="Лицевая" />
            <UploadTile label="Обратная" />
          </View>
        </View>
      </ScrollView>

      <View style={{ position: 'absolute', left: 24, right: 24, bottom: 36 }}>
        <RedButton onPress={onSave} disabled={submitting}>
          {submitting ? 'Сохранение...' : 'Сохранить'}
        </RedButton>
      </View>
    </PhoneFrame>
  );
}

function UploadTile({ label }: { label: string }) {
  return (
    <Pressable
      style={({ pressed }) => ({
        flex: 1,
        height: 120,
        borderRadius: 20,
        overflow: 'hidden',
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <BlurView
        intensity={20}
        tint="light"
        style={{
          flex: 1,
          backgroundColor: 'rgba(255,255,255,0.5)',
          borderWidth: 1.5,
          borderColor: 'rgba(20,20,20,0.18)',
          borderStyle: 'dashed',
          borderRadius: 20,
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
        }}
      >
        <IconCamera size={24} color={tokens.inkSubtle} />
        <Text style={{ fontFamily: 'Manrope_500Medium', fontSize: 12, color: tokens.inkSubtle }}>
          {label}
        </Text>
      </BlurView>
    </Pressable>
  );
}
