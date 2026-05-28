import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Location from 'expo-location';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { type IncidentType, useCreateAdjusterRequest } from '../../../api/adjuster';
import { usePolicies } from '../../../api/policies';
import { BackButton } from '../../../components/ui/BackButton';
import { PhoneFrame } from '../../../components/ui/PhoneFrame';
import { RedButton } from '../../../components/ui/RedButton';
import { tokens } from '../../../theme/colors';
import type { AdjusterStackParamList } from '../../../navigation/types';

type Nav = NativeStackNavigationProp<AdjusterStackParamList, 'AdjusterRequest'>;

const INCIDENT_TYPES: { value: IncidentType; label: string; desc: string }[] = [
  { value: 'ACCIDENT', label: 'ДТП', desc: 'Столкновение с другим авто' },
  { value: 'DAMAGE', label: 'Повреждение', desc: 'Царапина, вмятина, стекло' },
  { value: 'THEFT', label: 'Угон', desc: 'Кража или попытка угона' },
];

const PRODUCT_LABEL: Record<string, string> = { OSAGO: 'ОСАГО', KASKO: 'КАСКО' };

export function AdjusterRequestScreen() {
  const nav = useNavigation<Nav>();
  const { data: policies = [] } = usePolicies('ACTIVE');
  const { mutateAsync: createRequest, isPending } = useCreateAdjusterRequest();

  const [incident, setIncident] = useState<IncidentType>('ACCIDENT');
  const [policyId, setPolicyId] = useState<string | undefined>(undefined);
  const [address, setAddress] = useState('');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | undefined>(undefined);
  const [comment, setComment] = useState('');
  const [geoLoading, setGeoLoading] = useState(false);

  const canSubmit = address.trim().length > 3;

  const handleGeolocate = async () => {
    setGeoLoading(true);
    try {
      const { status } = await Location.getForegroundPermissionsAsync();

      if (status === 'denied') {
        // Уже отклонено — iOS не покажет диалог повторно, ведём в Настройки
        Alert.alert(
          'Геолокация отключена',
          'Чтобы определять адрес автоматически, разрешите доступ в Настройках.',
          [
            { text: 'Отмена', style: 'cancel' },
            { text: 'Открыть Настройки', onPress: () => void Linking.openURL('app-settings:') },
          ],
        );
        setGeoLoading(false);
        return;
      }

      if (status === 'undetermined') {
        const result = await Location.requestForegroundPermissionsAsync();
        if (result.status !== 'granted') {
          setGeoLoading(false);
          return;
        }
      }

      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const { latitude, longitude } = pos.coords;
      setCoords({ lat: latitude, lng: longitude });

      // Обратное геокодирование → читаемый адрес
      const [place] = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (place) {
        const parts = [
          place.street,
          place.streetNumber,
          place.district,
          place.city,
        ].filter(Boolean);
        setAddress(parts.join(', '));
      } else {
        setAddress(`${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
      }
    } catch {
      Alert.alert('Ошибка', 'Не удалось определить геопозицию. Введите адрес вручную.');
    } finally {
      setGeoLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    try {
      const req = await createRequest({
        incidentType: incident,
        address: address.trim(),
        lat: coords?.lat,
        lng: coords?.lng,
        comment: comment.trim() || undefined,
        policyId: policyId || undefined,
      });
      nav.replace('AdjusterSent', { requestId: req.id });
    } catch {
      Alert.alert('Ошибка', 'Не удалось отправить заявку. Попробуйте ещё раз.');
    }
  };

  return (
    <PhoneFrame>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingTop: 8, paddingBottom: 8 }}>
        <BackButton onPress={() => nav.goBack()} />
        <Text style={{ marginLeft: 12, fontFamily: 'NeueMontreal-Medium', fontSize: 18, color: tokens.ink, letterSpacing: -0.09 }}>
          Вызвать аджастера
        </Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 120, gap: 24 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Incident type */}
        <View style={{ gap: 10 }}>
          <Text style={{ fontFamily: 'Manrope_600SemiBold', fontSize: 13, color: tokens.inkMuted, letterSpacing: 0.5, textTransform: 'uppercase' }}>
            Что случилось
          </Text>
          <View style={{ gap: 8 }}>
            {INCIDENT_TYPES.map((t) => {
              const active = incident === t.value;
              return (
                <Pressable
                  key={t.value}
                  onPress={() => setIncident(t.value)}
                  style={({ pressed }) => ({
                    flexDirection: 'row', alignItems: 'center', padding: 16,
                    borderRadius: 16,
                    backgroundColor: active ? tokens.inkDark : 'rgba(255,255,255,0.7)',
                    borderWidth: 1.5, borderColor: active ? tokens.inkDark : tokens.hairline,
                    opacity: pressed ? 0.85 : 1, gap: 12,
                  })}
                >
                  <View style={{
                    width: 20, height: 20, borderRadius: 999, borderWidth: 2,
                    borderColor: active ? tokens.red : tokens.inkMuted,
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    {active && <View style={{ width: 10, height: 10, borderRadius: 999, backgroundColor: tokens.red }} />}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: 'Manrope_600SemiBold', fontSize: 15, color: active ? '#fff' : tokens.ink }}>
                      {t.label}
                    </Text>
                    <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 12, color: active ? 'rgba(255,255,255,0.55)' : tokens.inkMuted, marginTop: 1 }}>
                      {t.desc}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Address */}
        <View style={{ gap: 10 }}>
          <Text style={{ fontFamily: 'Manrope_600SemiBold', fontSize: 13, color: tokens.inkMuted, letterSpacing: 0.5, textTransform: 'uppercase' }}>
            Адрес
          </Text>
          <View style={{
            flexDirection: 'row', alignItems: 'center',
            backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: 16,
            borderWidth: 1.5, borderColor: coords ? tokens.green : tokens.hairline,
            paddingHorizontal: 16, paddingVertical: 14, gap: 10,
          }}>
            {/* Pin icon */}
            <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={coords ? tokens.green : tokens.inkMuted} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
              <Path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z" />
              <Path d="M12 10a1 1 0 110-2 1 1 0 010 2z" fill={coords ? tokens.green : tokens.inkMuted} />
            </Svg>

            <TextInput
              value={address}
              onChangeText={(t) => { setAddress(t); setCoords(undefined); }}
              placeholder="Введите улицу или ориентир..."
              placeholderTextColor={tokens.inkMuted}
              style={{ flex: 1, fontFamily: 'Manrope_400Regular', fontSize: 15, color: tokens.ink }}
              returnKeyType="done"
            />

            {/* GPS button */}
            <Pressable
              onPress={() => void handleGeolocate()}
              disabled={geoLoading}
              style={({ pressed }) => ({
                width: 34, height: 34, borderRadius: 10,
                backgroundColor: geoLoading ? 'rgba(20,20,20,0.04)' : coords ? 'rgba(52,211,153,0.12)' : 'rgba(20,20,20,0.06)',
                alignItems: 'center', justifyContent: 'center',
                opacity: pressed ? 0.7 : 1,
              })}
            >
              {geoLoading ? (
                <ActivityIndicator size="small" color={tokens.inkMuted} />
              ) : (
                <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={coords ? tokens.green : tokens.inkDark} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                  <Path d="M12 2a7 7 0 00-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 00-7-7z" />
                  <Path d="M12 9a2 2 0 100-4 2 2 0 000 4z" fill={coords ? tokens.green : tokens.inkDark} />
                  <Path d="M12 2v2M12 20v2M2 12h2M20 12h2" />
                </Svg>
              )}
            </Pressable>
          </View>

          {/* Coords hint */}
          {coords && (
            <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 12, color: tokens.green, marginTop: -4 }}>
              GPS: {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
            </Text>
          )}
        </View>

        {/* Policy (optional) */}
        {policies.length > 0 && (
          <View style={{ gap: 10 }}>
            <Text style={{ fontFamily: 'Manrope_600SemiBold', fontSize: 13, color: tokens.inkMuted, letterSpacing: 0.5, textTransform: 'uppercase' }}>
              Полис (необязательно)
            </Text>
            <View style={{ gap: 8 }}>
              {policies.map((p) => {
                const active = policyId === p.id;
                const label = `${PRODUCT_LABEL[p.type] ?? p.type} · ${p.vehicle?.plate ?? '—'}`;
                return (
                  <Pressable
                    key={p.id}
                    onPress={() => setPolicyId(active ? undefined : p.id)}
                    style={({ pressed }) => ({
                      flexDirection: 'row', alignItems: 'center',
                      padding: 14, borderRadius: 14, gap: 12,
                      backgroundColor: active ? 'rgba(230,20,40,0.06)' : 'rgba(255,255,255,0.7)',
                      borderWidth: 1.5, borderColor: active ? tokens.red : tokens.hairline,
                      opacity: pressed ? 0.85 : 1,
                    })}
                  >
                    <View style={{
                      width: 18, height: 18, borderRadius: 4,
                      borderWidth: 2, borderColor: active ? tokens.red : tokens.inkMuted,
                      backgroundColor: active ? tokens.red : 'transparent',
                      alignItems: 'center', justifyContent: 'center',
                    }}>
                      {active && (
                        <Svg width={10} height={10} viewBox="0 0 10 10" fill="none" stroke="#fff" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                          <Path d="M1.5 5l2.5 2.5 4.5-4.5" />
                        </Svg>
                      )}
                    </View>
                    <Text style={{ fontFamily: 'Manrope_500Medium', fontSize: 14, color: tokens.ink }}>
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        {/* Comment */}
        <View style={{ gap: 10 }}>
          <Text style={{ fontFamily: 'Manrope_600SemiBold', fontSize: 13, color: tokens.inkMuted, letterSpacing: 0.5, textTransform: 'uppercase' }}>
            Комментарий
          </Text>
          <TextInput
            value={comment}
            onChangeText={setComment}
            placeholder="Дополнительные детали (необязательно)..."
            placeholderTextColor={tokens.inkMuted}
            multiline
            numberOfLines={3}
            style={{
              backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: 16,
              borderWidth: 1.5, borderColor: tokens.hairline,
              paddingHorizontal: 16, paddingVertical: 14,
              fontFamily: 'Manrope_400Regular', fontSize: 15, color: tokens.ink,
              minHeight: 90, textAlignVertical: 'top',
            }}
          />
        </View>
      </ScrollView>

      {/* Submit */}
      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: 24, paddingTop: 16 }}>
        <RedButton trailing={false} onPress={() => void handleSubmit()} disabled={!canSubmit || isPending}>
          {isPending ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <ActivityIndicator color="#fff" size="small" />
              <Text style={{ color: '#fff', fontFamily: 'Manrope_600SemiBold', fontSize: 16 }}>Отправляем...</Text>
            </View>
          ) : (
            'Вызвать аджастера'
          )}
        </RedButton>
      </View>
    </PhoneFrame>
  );
}
