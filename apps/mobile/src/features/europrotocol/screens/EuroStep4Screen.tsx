import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Alert, Image, Pressable, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { ScreenHeading } from '../../../components/ui/ScreenHeading';
import { WizardFrame } from '../../../components/ui/WizardFrame';
import { tokens } from '../../../theme/colors';
import { REQUIRED_PHOTOS, useEuroStore, type PhotoKey } from '../store';
import type { EuroStackParamList } from '../../../navigation/types';

type Nav = NativeStackNavigationProp<EuroStackParamList, 'EuroStep4'>;

const TILES: { key: PhotoKey; label: string; required: boolean }[] = [
  { key: 'overview', label: 'Общий план', required: true },
  { key: 'myCar', label: 'Моё авто', required: true },
  { key: 'otherCar', label: 'Второе авто', required: true },
  { key: 'scene', label: 'Место (доп.)', required: false },
];

function nowHHMM(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

// M9.3 шаг 4 — направляемая фотофиксация. Только камера (антифрод), без галереи.
export function EuroStep4Screen() {
  const nav = useNavigation<Nav>();
  const { photos, setPhoto } = useEuroStore();

  const capture = async (key: PhotoKey) => {
    try {
      // Ленивый импорт: нативный модуль нужен только при съёмке (и только на устройстве).
      const ImagePicker = await import('expo-image-picker');
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Камера', 'Разрешите доступ к камере, чтобы сделать фото.');
        return;
      }
      const res = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        exif: true, // GPS/время в EXIF — для подтверждения подлинности
        quality: 0.7,
      });
      if (!res.canceled && res.assets[0]) {
        setPhoto(key, { uri: res.assets[0].uri, at: nowHHMM() });
      }
    } catch (e) {
      Alert.alert('Камера', (e as Error).message || 'Съёмка недоступна. На симуляторе используйте «Симулировать».');
    }
  };

  const allRequired = REQUIRED_PHOTOS.every((k) => photos[k]);

  return (
    <WizardFrame
      step={4}
      total={5}
      eyebrow="Шаг 4 из 5 · Фотофиксация"
      primary="К подписанию"
      primaryEnabled={allRequired}
      primaryAction={() => nav.navigate('EuroStep5')}
      onBack={() => nav.goBack()}
    >
      <ScreenHeading title="Сфотографируйте место" subtitle="Минимум 3 кадра. Снимайте, не перемещая автомобили" />

      {/* Антифрод-баннер */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          padding: 14,
          borderRadius: 16,
          backgroundColor: 'rgba(230,20,40,0.08)',
        }}
      >
        <View
          style={{
            width: 24,
            height: 24,
            borderRadius: 999,
            backgroundColor: tokens.red,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M12 8v5M12 16h.01" />
          </Svg>
        </View>
        <Text style={{ flex: 1, fontFamily: 'Manrope_600SemiBold', fontSize: 12, color: tokens.red, lineHeight: 17 }}>
          Только съёмка с камеры. Загрузка из галереи отключена.
        </Text>
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        {TILES.map((t) => (
          <CaptureTile
            key={t.key}
            label={t.label}
            required={t.required}
            photo={photos[t.key]}
            onCapture={() => capture(t.key)}
            onSimulate={
              __DEV__ ? () => setPhoto(t.key, { uri: '', at: nowHHMM() }) : undefined
            }
          />
        ))}
      </View>
    </WizardFrame>
  );
}

function CaptureTile({
  label,
  required,
  photo,
  onCapture,
  onSimulate,
}: {
  label: string;
  required: boolean;
  photo: { uri: string; at: string } | null;
  onCapture: () => void;
  onSimulate?: () => void;
}) {
  const filled = !!photo;
  return (
    <Pressable
      onPress={onCapture}
      onLongPress={onSimulate}
      style={({ pressed }) => ({
        width: '47.5%',
        height: 130,
        borderRadius: 22,
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: filled ? tokens.inkDark : 'transparent',
        borderWidth: filled ? 0 : 1.5,
        borderColor: 'rgba(20,20,20,0.18)',
        borderStyle: filled ? 'solid' : 'dashed',
        opacity: pressed ? 0.8 : 1,
      })}
    >
      {filled && photo!.uri ? (
        <Image source={{ uri: photo!.uri }} style={{ position: 'absolute', width: '100%', height: '100%' }} />
      ) : null}

      {filled ? (
        <>
          <View
            style={{
              position: 'absolute',
              top: 8,
              left: 8,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
              paddingVertical: 3,
              paddingHorizontal: 8,
              borderRadius: 999,
              backgroundColor: 'rgba(20,20,20,0.6)',
            }}
          >
            <View style={{ width: 6, height: 6, borderRadius: 999, backgroundColor: tokens.red }} />
            <Text style={{ fontFamily: 'Manrope_600SemiBold', fontSize: 9, color: '#fff', letterSpacing: 0.4 }}>
              ЗАСНЯТО
            </Text>
          </View>
          <View
            style={{
              position: 'absolute',
              top: 8,
              right: 8,
              paddingVertical: 3,
              paddingHorizontal: 8,
              borderRadius: 999,
              backgroundColor: 'rgba(20,20,20,0.6)',
            }}
          >
            <Text style={{ fontFamily: 'Manrope_600SemiBold', fontSize: 9, color: '#fff' }}>{photo!.at}</Text>
          </View>
          <View style={{ position: 'absolute', bottom: 8, left: 8 }}>
            <Text style={{ fontFamily: 'Manrope_500Medium', fontSize: 10, color: '#fff' }}>{label}</Text>
          </View>
        </>
      ) : (
        <>
          <View
            style={{
              width: 42,
              height: 42,
              borderRadius: 999,
              backgroundColor: 'rgba(230,20,40,0.1)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <CameraIcon />
          </View>
          <Text style={{ fontFamily: 'Manrope_600SemiBold', fontSize: 12, color: tokens.inkDark, letterSpacing: -0.06 }}>
            Сфотографировать
          </Text>
          <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 10, color: tokens.inkMuted }}>
            {label}
            {required ? ' · обязательно' : ''}
          </Text>
        </>
      )}
    </Pressable>
  );
}

function CameraIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={tokens.red} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M3 8a2 2 0 012-2h2l1.5-2h7L18 6h2a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
      <Path d="M12 17a4 4 0 100-8 4 4 0 000 8z" />
    </Svg>
  );
}
