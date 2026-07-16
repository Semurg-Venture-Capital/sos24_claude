import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Location from 'expo-location';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, Linking, Pressable, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { Glass } from '../../../components/ui/Glass';
import { ScreenHeading } from '../../../components/ui/ScreenHeading';
import { Tag } from '../../../components/ui/Tag';
import { WizardFrame } from '../../../components/ui/WizardFrame';
import { tokens } from '../../../theme/colors';
import { FieldInput, SectionLabel, YesNoToggle } from '../components/EuroFields';
import { useEuroStore } from '../store';
import type { EuroStackParamList } from '../../../navigation/types';

type Nav = NativeStackNavigationProp<EuroStackParamList, 'EuroStep1'>;

function formatDate(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split('-');
  return d && m && y ? `${d}.${m}.${y}` : iso;
}

// M9.3 шаг 1 — обстоятельства: дата/время/кол-во ТС фиксируются автоматически
// (read-only, антифрод), место — определяется по GPS по кнопке.
export function EuroStep1Screen() {
  const nav = useNavigation<Nav>();
  const { t } = useTranslation();
  const { date, time, place, vehicleCount, setLocation, medCheck, witnesses, officialRegistered, officerBadgeNo, patch } =
    useEuroStore();
  const [geoLoading, setGeoLoading] = useState(false);

  const detectLocation = async () => {
    setGeoLoading(true);
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status === 'denied') {
        Alert.alert(
          t('euro.step1.geoOffTitle'),
          t('euro.step1.geoOffMsg'),
          [
            { text: t('common.cancel'), style: 'cancel' },
            { text: t('euro.step1.openSettings'), onPress: () => void Linking.openURL('app-settings:') },
          ],
        );
        return;
      }
      if (status === 'undetermined') {
        const res = await Location.requestForegroundPermissionsAsync();
        if (res.status !== 'granted') return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const { latitude, longitude } = pos.coords;
      const [p] = await Location.reverseGeocodeAsync({ latitude, longitude });
      const addr = p
        ? [p.street, p.streetNumber, p.district, p.city].filter(Boolean).join(', ')
        : `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
      setLocation(addr || `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`, latitude, longitude);
    } catch {
      Alert.alert(t('euro.common.errorTitle'), t('euro.step1.geoError'));
    } finally {
      setGeoLoading(false);
    }
  };

  const next = () => {
    nav.navigate('EuroStep2');
  };

  return (
    <WizardFrame
      step={1}
      total={5}
      eyebrow={t('euro.step1.eyebrow')}
      primary={t('common.next')}
      primaryEnabled={place.trim().length > 0}
      primaryAction={next}
      onBack={() => nav.goBack()}
    >
      <ScreenHeading title={t('euro.step1.title')} subtitle={t('euro.step1.subtitle')} />

      {/* Дата / время / кол-во ТС — read-only, авто */}
      <View style={{ borderRadius: 24, overflow: 'hidden' }}>
        <Glass
          intensity={20}
          tint="light"
          style={{
            backgroundColor: 'rgba(255,255,255,0.55)',
            padding: 18,
            borderWidth: 1,
            borderColor: tokens.hairline,
            gap: 2,
          }}
        >
          <ReadonlyRow label={t('euro.step1.date')} value={formatDate(date)} auto />
          <ReadonlyRow label={t('euro.step1.time')} value={time} auto />
          <ReadonlyRow label={t('euro.step1.vehicleCount')} value={vehicleCount} trailing={<Tag tone="green">{t('euro.step1.euroTag')}</Tag>} last />
        </Glass>
      </View>

      {/* Место ДТП — определяется по GPS, read-only */}
      <View style={{ gap: 10 }}>
        <Text style={{ fontFamily: 'Manrope_500Medium', fontSize: 13, color: tokens.inkMuted, letterSpacing: -0.07 }}>
          {t('euro.step1.place')}
        </Text>

        {place ? (
          <View style={{ borderRadius: 20, overflow: 'hidden' }}>
            <Glass
              intensity={20}
              tint="light"
              style={{
                backgroundColor: 'rgba(255,255,255,0.55)',
                padding: 16,
                borderWidth: 1,
                borderColor: tokens.hairline,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <MapPinIcon />
              <Text style={{ flex: 1, fontFamily: 'Manrope_500Medium', fontSize: 14, color: tokens.ink, lineHeight: 19 }}>
                {place}
              </Text>
            </Glass>
          </View>
        ) : null}

        <Pressable
          onPress={detectLocation}
          disabled={geoLoading}
          style={({ pressed }) => ({
            height: 56,
            borderRadius: 999,
            borderWidth: 1.5,
            borderColor: place ? tokens.hairline : 'rgba(230,20,40,0.5)',
            backgroundColor: 'transparent',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            opacity: pressed || geoLoading ? 0.6 : 1,
          })}
        >
          {geoLoading ? (
            <ActivityIndicator color={tokens.red} />
          ) : (
            <MapPinIcon color={place ? tokens.inkDark : tokens.red} />
          )}
          <Text
            style={{
              fontFamily: 'Manrope_600SemiBold',
              fontSize: 15,
              color: place ? tokens.inkDark : tokens.red,
              letterSpacing: -0.08,
            }}
          >
            {geoLoading ? t('euro.step1.detecting') : place ? t('euro.step1.detectAgain') : t('euro.step1.detect')}
          </Text>
        </Pressable>
      </View>

      {/* Дополнительно (пп. 4–6 бланка) */}
      <View style={{ gap: 12, marginTop: 4 }}>
        <SectionLabel>{t('euro.step1.additional')}</SectionLabel>
        <YesNoToggle
          label={t('euro.step1.medCheck')}
          value={medCheck}
          onChange={(v) => patch({ medCheck: v })}
        />
        <FieldInput
          label={t('euro.step1.witnesses')}
          value={witnesses}
          onChangeText={(v) => patch({ witnesses: v })}
          placeholder={t('euro.step1.witnessesPlaceholder')}
          multiline
          maxLength={300}
        />
        <YesNoToggle
          label={t('euro.step1.officialRegistered')}
          value={officialRegistered}
          onChange={(v) => patch({ officialRegistered: v })}
        />
        {officialRegistered === true ? (
          <FieldInput
            label={t('euro.step1.officerBadge')}
            value={officerBadgeNo}
            onChangeText={(v) => patch({ officerBadgeNo: v })}
            placeholder="0000000"
            keyboardType="number-pad"
            maxLength={20}
          />
        ) : null}
      </View>
    </WizardFrame>
  );
}

function ReadonlyRow({
  label,
  value,
  auto,
  trailing,
  last,
}: {
  label: string;
  value: string;
  auto?: boolean;
  trailing?: React.ReactNode;
  last?: boolean;
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        gap: 12,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: tokens.hairline,
      }}
    >
      <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 14, color: tokens.inkMuted }}>{label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Text style={{ fontFamily: 'Manrope_600SemiBold', fontSize: 14, color: tokens.ink }}>{value}</Text>
        {trailing}
        {auto && !trailing ? <LockIcon /> : null}
      </View>
    </View>
  );
}

function MapPinIcon({ color = tokens.inkMuted }: { color?: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0116 0z" />
      <Circle cx={12} cy={10} r={3} />
    </Svg>
  );
}

function LockIcon() {
  return (
    <Svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke={tokens.inkSubtle} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M6 11V8a6 6 0 0112 0v3" />
      <Path d="M5 11h14v9a1 1 0 01-1 1H6a1 1 0 01-1-1z" />
    </Svg>
  );
}
