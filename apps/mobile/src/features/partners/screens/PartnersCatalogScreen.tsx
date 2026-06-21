import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import Svg, { Circle, Path } from 'react-native-svg';
import { useCatalog, useCategories, type PartnerCard } from '../../../api/partners';
import { BackButton } from '../../../components/ui/BackButton';
import { Glass } from '../../../components/ui/Glass';
import { PhoneFrame } from '../../../components/ui/PhoneFrame';
import { StarIcon } from '../../../components/icons/StarIcon';
import { tokens } from '../../../theme/colors';
import type { PartnersStackParamList } from '../../../navigation/types';

type Nav = NativeStackNavigationProp<PartnersStackParamList, 'PartnersCatalog'>;

export function PartnersCatalogScreen() {
  const nav = useNavigation<Nav>();
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState<string | undefined>(undefined);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | undefined>(undefined);
  const [mapMode, setMapMode] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const Location = await import('expo-location');
        const perm = await Location.requestForegroundPermissionsAsync();
        if (!perm.granted) return;
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      } catch {
        // без локации каталог работает, просто без расстояний
      }
    })();
  }, []);

  const { data: categories = [] } = useCategories();
  const { data: partners = [], isLoading } = useCatalog({
    search: search.trim() || undefined,
    categoryId,
    lat: coords?.lat,
    lng: coords?.lng,
    sort: 'distance',
  });

  const region = useMemo(
    () => ({
      latitude: coords?.lat ?? 41.311,
      longitude: coords?.lng ?? 69.279,
      latitudeDelta: 0.08,
      longitudeDelta: 0.08,
    }),
    [coords],
  );

  return (
    <PhoneFrame bottomSafeArea={!mapMode}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingHorizontal: 24, paddingTop: 8, paddingBottom: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <BackButton onPress={() => nav.goBack()} />
          <Text style={{ fontFamily: 'NeueMontreal-Medium', fontSize: 24, letterSpacing: -0.24, color: tokens.ink }}>Партнёры</Text>
        </View>
        <Pressable onPress={() => nav.navigate('MyBookings')}>
          <Text style={{ fontFamily: 'Manrope_600SemiBold', fontSize: 13, color: tokens.red }}>Мои записи</Text>
        </Pressable>
      </View>

      {/* Поиск + переключатель список/карта */}
      <View style={{ paddingHorizontal: 24, gap: 10 }}>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <View style={{ flex: 1, height: 48, borderRadius: 999, backgroundColor: tokens.glass, borderWidth: 1, borderColor: tokens.hairline, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, gap: 10 }}>
            <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={tokens.inkMuted} strokeWidth={1.8} strokeLinecap="round">
              <Circle cx={11} cy={11} r={7} />
              <Path d="M21 21l-4.3-4.3" />
            </Svg>
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="СТО, клиника, услуга"
              placeholderTextColor={tokens.inkMuted}
              style={{ flex: 1, fontFamily: 'Manrope_400Regular', fontSize: 15, color: tokens.ink }}
            />
          </View>
          <Pressable
            onPress={() => setMapMode((v) => !v)}
            style={{ width: 48, height: 48, borderRadius: 999, backgroundColor: tokens.inkDark, alignItems: 'center', justifyContent: 'center' }}
          >
            {mapMode ? (
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                <Path d="M3 6h18M3 12h18M3 18h18" />
              </Svg>
            ) : (
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                <Path d="M2 22V8l7-3 6 3 7-3v14l-7 3-6-3-7 3zM9 5v17M15 8v14" />
              </Svg>
            )}
          </Pressable>
        </View>

        {/* Категории */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          <Chip label="Все" active={!categoryId} onPress={() => setCategoryId(undefined)} />
          {categories.map((c) => (
            <Chip key={c.id} label={`${c.icon ?? ''} ${c.name}`.trim()} active={categoryId === c.id} onPress={() => setCategoryId(c.id)} />
          ))}
        </ScrollView>
      </View>

      {mapMode ? (
        <View style={{ flex: 1, marginTop: 10 }}>
          <MapView style={{ flex: 1 }} initialRegion={region}>
            {partners
              .filter((p) => p.lat != null && p.lng != null)
              .map((p) => (
                <Marker
                  key={p.id}
                  coordinate={{ latitude: p.lat!, longitude: p.lng! }}
                  title={p.name}
                  description={`${p.category?.name ?? ''} · ${p.rating.toFixed(1)}★`}
                  onCalloutPress={() => nav.navigate('PartnerDetail', { id: p.id })}
                  pinColor={tokens.red}
                />
              ))}
          </MapView>
        </View>
      ) : isLoading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={tokens.red} />
        </View>
      ) : partners.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 }}>
          <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 14, color: tokens.inkMuted, textAlign: 'center' }}>Ничего не найдено</Text>
        </View>
      ) : (
        <ScrollView style={{ flex: 1, marginTop: 12 }} contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 120, gap: 10 }} showsVerticalScrollIndicator={false}>
          {partners.map((p) => (
            <PartnerRow key={p.id} p={p} onPress={() => nav.navigate('PartnerDetail', { id: p.id })} />
          ))}
        </ScrollView>
      )}
    </PhoneFrame>
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: active ? tokens.inkDark : tokens.glass, borderWidth: active ? 0 : 1, borderColor: tokens.hairline }}
    >
      <Text style={{ fontFamily: 'Manrope_500Medium', fontSize: 12, color: active ? '#fff' : tokens.inkDark }}>{label}</Text>
    </Pressable>
  );
}

function PartnerRow({ p, onPress }: { p: PartnerCard; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ borderRadius: 24, overflow: 'hidden', opacity: pressed ? 0.7 : 1 })}>
      <Glass intensity={20} tint="light" style={{ backgroundColor: 'rgba(255,255,255,0.55)', padding: 14, borderWidth: 1, borderColor: tokens.hairline, flexDirection: 'row', gap: 14 }}>
        <View style={{ width: 70, height: 70, borderRadius: 18, backgroundColor: '#d8d8d8', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
          {p.logoUrl ? (
            <Image source={{ uri: p.logoUrl }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
          ) : (
            <Text style={{ fontFamily: 'NeueMontreal-Medium', fontSize: 22, color: tokens.inkSubtle }}>{p.name[0]}</Text>
          )}
        </View>
        <View style={{ flex: 1, gap: 6, minWidth: 0 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <Text numberOfLines={1} style={{ flex: 1, fontFamily: 'Manrope_600SemiBold', fontSize: 14, color: tokens.ink }}>{p.name}</Text>
            {p.openNow != null && (
              <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, backgroundColor: p.openNow ? 'rgba(105,228,183,0.85)' : 'rgba(20,20,20,0.06)' }}>
                <Text style={{ fontFamily: 'Manrope_600SemiBold', fontSize: 10, color: p.openNow ? '#0a3a26' : tokens.inkMuted }}>{p.openNow ? 'открыто' : 'закрыто'}</Text>
              </View>
            )}
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <StarIcon size={11} />
            <Text style={{ fontFamily: 'Manrope_600SemiBold', fontSize: 12, color: tokens.inkDark }}>{p.rating.toFixed(1)}</Text>
            <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 12, color: tokens.inkMuted }}>({p.reviewCount})</Text>
            {p.distanceKm != null && <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 12, color: tokens.inkMuted }}>· {p.distanceKm} км</Text>}
            {p.category && <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 12, color: tokens.inkMuted }}>· {p.category.name}</Text>}
          </View>
          <View style={{ flexDirection: 'row', gap: 4, flexWrap: 'wrap' }}>
            {p.tags.map((t) => (
              <View key={t} style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, backgroundColor: 'rgba(20,20,20,0.06)' }}>
                <Text style={{ fontFamily: 'Manrope_500Medium', fontSize: 10, color: tokens.inkSubtle }}>{t}</Text>
              </View>
            ))}
          </View>
        </View>
      </Glass>
    </Pressable>
  );
}
