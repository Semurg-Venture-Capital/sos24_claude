import { useEffect, useRef, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { ActivityIndicator, Animated, Easing, Linking, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { tokens } from '../../../theme/colors';
import { Avatar } from '../../../components/ui/Avatar';
import { MapPinIcon, PhoneFillIcon } from '../../../components/icons/MedIcons';
import { cancelSos, triggerSos, type SosContact } from '../../../api/health';

type Phase = 'locating' | 'active' | 'error';

// M14.12 — Экран ЧП/SOS. Корневой модал: берёт геолокацию, активирует тревогу
// (POST /health/sos/trigger), показывает оповещённые контакты. Фаза F.
export function HealthSosActiveScreen() {
  const nav = useNavigation();
  const [phase, setPhase] = useState<Phase>('locating');
  const [alertId, setAlertId] = useState<string | null>(null);
  const [contacts, setContacts] = useState<SosContact[]>([]);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [address, setAddress] = useState<string | null>(null);

  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(pulse, { toValue: 1, duration: 2000, easing: Easing.out(Easing.ease), useNativeDriver: true }),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  useEffect(() => {
    let alive = true;
    (async () => {
      // 1) геолокация (best-effort, не блокируем тревогу если отказано/долго)
      let lat: number | undefined;
      let lng: number | undefined;
      let addr: string | undefined;
      try {
        const perm = await Location.requestForegroundPermissionsAsync();
        if (perm.granted) {
          const pos = (await Promise.race([
            Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
            new Promise((res) => setTimeout(() => res(null), 6000)),
          ])) as Location.LocationObject | null;
          if (pos) {
            lat = pos.coords.latitude;
            lng = pos.coords.longitude;
            if (alive) setCoords({ lat, lng });
            try {
              const geo = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
              const g = geo[0];
              if (g) addr = [g.street, g.name].filter(Boolean).join(', ') || g.city || undefined;
              if (alive && addr) setAddress(addr);
            } catch {
              /* reverse geocode необязателен */
            }
          }
        }
      } catch {
        /* геолокация недоступна — тревогу всё равно шлём */
      }

      // 2) активируем тревогу
      try {
        const res = await triggerSos({ lat, lng, address: addr });
        if (!alive) return;
        setAlertId(res.alert.id);
        setContacts(res.contacts);
        setPhase('active');
      } catch {
        if (alive) setPhase('error');
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const close = async () => {
    if (alertId) {
      try {
        await cancelSos(alertId);
      } catch {
        /* всё равно закрываем */
      }
    }
    nav.goBack();
  };

  const ringScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.6] });
  const ringOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0] });

  return (
    <View style={{ flex: 1, backgroundColor: '#120608' }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        {/* Заголовок */}
        <View style={{ alignItems: 'center', paddingTop: 16 }}>
          <Text style={{ fontFamily: 'Manrope_700Bold', fontSize: 13, color: '#fff', letterSpacing: 1.8 }}>
            SOS · ЭКСТРЕННЫЙ ВЫЗОВ
          </Text>
        </View>

        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 24, paddingHorizontal: 24 }}>
          {/* Пульсирующий SOS */}
          <View style={{ width: 150, height: 150, alignItems: 'center', justifyContent: 'center' }}>
            <Animated.View
              style={{
                position: 'absolute',
                width: 130,
                height: 130,
                borderRadius: 999,
                borderWidth: 2,
                borderColor: 'rgba(230,20,40,0.5)',
                transform: [{ scale: ringScale }],
                opacity: ringOpacity,
              }}
            />
            <View
              style={{
                width: 118,
                height: 118,
                borderRadius: 999,
                backgroundColor: tokens.red,
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: tokens.red,
                shadowOpacity: 0.6,
                shadowRadius: 30,
                shadowOffset: { width: 0, height: 0 },
              }}
            >
              <Text style={{ fontFamily: 'NeueMontreal-Bold', fontSize: 30, color: '#fff', letterSpacing: 1.2 }}>SOS</Text>
            </View>
          </View>

          <View style={{ alignItems: 'center', gap: 6 }}>
            <Text style={{ fontFamily: 'NeueMontreal-Medium', fontSize: 22, color: '#fff' }}>
              {phase === 'error' ? 'Не удалось отправить' : 'Отправляем помощь…'}
            </Text>
            <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 13.5, color: 'rgba(255,255,255,0.6)', textAlign: 'center', lineHeight: 19, maxWidth: 280 }}>
              {phase === 'error'
                ? 'Проверьте соединение и попробуйте ещё раз или позвоните 103.'
                : 'Оповещаем близких и передаём геолокацию диспетчеру'}
            </Text>
          </View>

          {/* Геолокация */}
          {coords ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 16, paddingVertical: 12, paddingHorizontal: 16, alignSelf: 'stretch' }}>
              <MapPinIcon size={16} color={tokens.red} />
              <View style={{ flex: 1, minWidth: 0 }}>
                {address ? (
                  <Text numberOfLines={1} style={{ fontFamily: 'Manrope_600SemiBold', fontSize: 13, color: '#fff' }}>{address}</Text>
                ) : null}
                <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 11, color: 'rgba(255,255,255,0.55)' }}>
                  {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
                </Text>
              </View>
            </View>
          ) : phase === 'locating' ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <ActivityIndicator color="rgba(255,255,255,0.6)" />
              <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 12, color: 'rgba(255,255,255,0.55)' }}>Определяем геолокацию…</Text>
            </View>
          ) : null}

          {/* Оповещённые контакты */}
          {contacts.length > 0 ? (
            <View style={{ alignSelf: 'stretch', gap: 8 }}>
              {contacts.map((c) => (
                <View key={c.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 16, padding: 10 }}>
                  <Avatar name={c.name} size={36} />
                  <Text style={{ flex: 1, fontFamily: 'Manrope_600SemiBold', fontSize: 13.5, color: '#fff' }}>
                    {c.name}
                    {c.relation ? ` · ${c.relation}` : ''}
                  </Text>
                  <Text style={{ fontFamily: 'Manrope_500Medium', fontSize: 12, color: c.notifyStatus === 'FAILED' ? '#ff8a8a' : tokens.green }}>
                    {c.notifyStatus === 'FAILED' ? 'не доставлено' : 'оповещён'}
                  </Text>
                </View>
              ))}
            </View>
          ) : phase === 'active' ? (
            <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 12.5, color: 'rgba(255,255,255,0.5)', textAlign: 'center' }}>
              Экстренные контакты не добавлены — диспетчер всё равно уведомлён.
            </Text>
          ) : null}
        </View>

        {/* Кнопки */}
        <View style={{ paddingHorizontal: 24, paddingBottom: 12, gap: 12 }}>
          <Pressable
            onPress={() => Linking.openURL('tel:103')}
            style={({ pressed }) => ({ height: 60, borderRadius: 999, backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: pressed ? 0.9 : 1 })}
          >
            <PhoneFillIcon size={17} color={tokens.red} />
            <Text style={{ fontFamily: 'Manrope_700Bold', fontSize: 15, color: tokens.inkDark }}>Позвонить 103</Text>
          </Pressable>
          <Pressable
            onPress={close}
            style={({ pressed }) => ({ height: 52, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.7 : 1 })}
          >
            <Text style={{ fontFamily: 'Manrope_600SemiBold', fontSize: 14, color: 'rgba(255,255,255,0.85)' }}>
              {phase === 'error' ? 'Закрыть' : 'Отменить тревогу'}
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}
