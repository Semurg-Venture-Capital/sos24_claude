import { useEffect, useRef, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ActivityIndicator, Linking, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { tokens } from '../../../theme/colors';
import type { HealthStackParamList } from '../../../navigation/types';
import { BackButton } from '../../../components/ui/BackButton';
import { MapPinIcon, PhoneFillIcon } from '../../../components/icons/MedIcons';
import { StarIcon } from '../../../components/icons/StarIcon';
import { useClinics, useRegions, type ClinicCard } from '../../../api/health';
import { useGeoStore } from '../../../stores/geoStore';
import { LiquidGlassChips, medGlass } from '../components';

const ALL = '__all';

type Nav = NativeStackNavigationProp<HealthStackParamList, 'HealthClinics'>;

export function HealthClinicsScreen() {
  const nav = useNavigation<Nav>();
  const [q, setQ] = useState('');

  const geoRegion = useGeoStore((s) => s.region);
  const [region, setRegion] = useState<string | null>(geoRegion);
  const touched = useRef(false);
  useEffect(() => {
    if (!touched.current && geoRegion) setRegion(geoRegion);
  }, [geoRegion]);
  const pickRegion = (r: string | null) => {
    touched.current = true;
    setRegion(r);
  };

  const { data: regions = [] } = useRegions();
  const { data: clinics = [], isLoading } = useClinics({ q: q.trim() || undefined, region: region || undefined });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: tokens.pageBg }} edges={['top']}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 24, paddingTop: 8, paddingBottom: 12 }}>
        <BackButton onPress={() => nav.goBack()} />
        <Text style={{ fontFamily: 'Manrope_600SemiBold', fontSize: 18, color: tokens.ink }}>Клиники</Text>
      </View>

      <View style={{ paddingHorizontal: 24 }}>
        <View style={{ height: 52, paddingHorizontal: 18, borderRadius: 999, backgroundColor: tokens.glass, borderWidth: 1, borderColor: tokens.hairline, flexDirection: 'row', alignItems: 'center' }}>
          <TextInput value={q} onChangeText={setQ} placeholder="Клиника, адрес" placeholderTextColor={tokens.inkMuted} style={{ flex: 1, fontFamily: 'Manrope_400Regular', fontSize: 15, color: tokens.ink }} />
        </View>
      </View>

      <LiquidGlassChips
        items={[{ key: ALL, label: 'Все области' }, ...regions.map((r) => ({ key: r, label: r }))]}
        selectedKey={region ?? ALL}
        onSelect={(k) => pickRegion(k === ALL ? null : k)}
      />

      <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 140, gap: 12 }}>
        {isLoading ? (
          <ActivityIndicator color={tokens.red} style={{ marginTop: 24 }} />
        ) : clinics.length === 0 ? (
          <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 14, color: tokens.inkMuted, marginTop: 16 }}>
            Клиник не найдено. Измените область или запрос.
          </Text>
        ) : (
          clinics.map((c) => (
            <ClinicRow
              key={c.id}
              clinic={c}
              onPress={() => nav.navigate('HealthClinicProfile', { id: c.id })}
              onCall={() => c.phone && void Linking.openURL(`tel:${c.phone}`)}
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function ClinicRow({ clinic: c, onPress, onCall }: { clinic: ClinicCard; onPress: () => void; onCall: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [{ borderRadius: 22, padding: 16, gap: 12, opacity: pressed ? 0.9 : 1 }, medGlass]}>
      <View style={{ gap: 4 }}>
        <Text style={{ fontFamily: 'Manrope_600SemiBold', fontSize: 16, color: tokens.ink }}>{c.name}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
          <MapPinIcon size={13} />
          <Text style={{ flex: 1, fontFamily: 'Manrope_400Regular', fontSize: 13, color: tokens.inkMuted }} numberOfLines={1}>
            {[c.address, c.region ?? c.city].filter(Boolean).join(', ')}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 2 }}>
          {c.rating > 0 ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <StarIcon size={13} />
              <Text style={{ fontFamily: 'Manrope_600SemiBold', fontSize: 13, color: tokens.ink }}>{c.rating.toFixed(1)}</Text>
            </View>
          ) : null}
          {c.doctorCount > 0 ? (
            <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 13, color: tokens.inkMuted }}>{c.doctorCount} врачей</Text>
          ) : null}
          {c.category ? <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 13, color: tokens.inkMuted }}>{c.category}</Text> : null}
        </View>
      </View>
      <Pressable
        onPress={onCall}
        style={({ pressed }) => ({ height: 44, borderRadius: 999, backgroundColor: tokens.red, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: pressed ? 0.85 : 1 })}
      >
        <PhoneFillIcon size={15} color="#fff" />
        <Text style={{ fontFamily: 'Manrope_600SemiBold', fontSize: 14, color: '#fff' }}>Позвонить</Text>
      </Pressable>
    </Pressable>
  );
}

