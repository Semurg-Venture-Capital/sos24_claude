import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { Alert, Image, Pressable, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { ScreenHeading } from '../../../components/ui/ScreenHeading';
import { WizardFrame } from '../../../components/ui/WizardFrame';
import { tokens } from '../../../theme/colors';
import { REQUIRED_PHOTOS, useEuroStore, type PhotoKey } from '../store';
import type { EuroStackParamList } from '../../../navigation/types';

type Nav = NativeStackNavigationProp<EuroStackParamList, 'EuroStep4'>;

const TILES: { key: PhotoKey; required: boolean }[] = [
  { key: 'overview', required: true },
  { key: 'myCar', required: true },
  { key: 'otherCar', required: true },
  { key: 'scene', required: false },
];

function nowHHMM(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

// M9.3 шаг 4 — направляемая фотофиксация. Только камера (антифрод), без галереи.
export function EuroStep4Screen() {
  const nav = useNavigation<Nav>();
  const { t } = useTranslation();
  const { photos, setPhoto, videos, addVideo, removeVideo } = useEuroStore();

  const captureVideo = async (fromLibrary: boolean) => {
    try {
      const ImagePicker = await import('expo-image-picker');
      if (fromLibrary) {
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!perm.granted) {
          Alert.alert(t('euro.step4.galleryTitle'), t('euro.step4.galleryPermission'));
          return;
        }
        const res = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Videos,
          quality: 0.7,
        });
        if (!res.canceled && res.assets[0]) addVideo({ uri: res.assets[0].uri, at: nowHHMM() });
      } else {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (!perm.granted) {
          Alert.alert(t('euro.step4.cameraTitle'), t('euro.step4.cameraPermission'));
          return;
        }
        const res = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Videos,
          videoMaxDuration: 60,
          quality: 0.7,
        });
        if (!res.canceled && res.assets[0]) addVideo({ uri: res.assets[0].uri, at: nowHHMM() });
      }
    } catch (e) {
      Alert.alert(t('euro.step4.videoTitle'), (e as Error).message || t('euro.step4.recordUnavailable'));
    }
  };

  const capture = async (key: PhotoKey) => {
    try {
      // Ленивый импорт: нативный модуль нужен только при съёмке (и только на устройстве).
      const ImagePicker = await import('expo-image-picker');
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        Alert.alert(t('euro.step4.cameraTitle'), t('euro.step4.cameraPermissionPhoto'));
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
      Alert.alert(t('euro.step4.cameraTitle'), (e as Error).message || t('euro.step4.captureUnavailable'));
    }
  };

  const allRequired = REQUIRED_PHOTOS.every((k) => photos[k]);

  return (
    <WizardFrame
      step={4}
      total={5}
      eyebrow={t('euro.step4.eyebrow')}
      primary={t('euro.step4.toSigning')}
      primaryEnabled={allRequired}
      primaryAction={() => nav.navigate('EuroStep5')}
      onBack={() => nav.goBack()}
    >
      <ScreenHeading title={t('euro.step4.title')} subtitle={t('euro.step4.subtitle')} />

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
          {t('euro.step4.cameraOnlyBanner')}
        </Text>
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        {TILES.map((tile) => (
          <CaptureTile
            key={tile.key}
            label={t('euro.step4.tiles.' + tile.key)}
            required={tile.required}
            photo={photos[tile.key]}
            onCapture={() => capture(tile.key)}
            onSimulate={
              __DEV__ ? () => setPhoto(tile.key, { uri: '', at: nowHHMM() }) : undefined
            }
          />
        ))}
      </View>

      {/* Видео (опционально) */}
      <View style={{ gap: 10, marginTop: 4 }}>
        <Text style={{ fontFamily: 'Manrope_600SemiBold', fontSize: 13, color: tokens.inkMuted, letterSpacing: -0.07 }}>
          {t('euro.step4.videoOptional')}
        </Text>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <VideoButton label={t('euro.step4.recordVideo')} onPress={() => captureVideo(false)} />
          <VideoButton label={t('euro.step4.fromGallery')} onPress={() => captureVideo(true)} />
        </View>
        {videos.map((v, i) => (
          <View
            key={i}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
              padding: 12,
              borderRadius: 14,
              backgroundColor: 'rgba(255,255,255,0.6)',
              borderWidth: 1,
              borderColor: tokens.hairline,
            }}
          >
            <View style={{ width: 30, height: 30, borderRadius: 8, backgroundColor: 'rgba(230,20,40,0.1)', alignItems: 'center', justifyContent: 'center' }}>
              <Svg width={14} height={14} viewBox="0 0 24 24" fill={tokens.red}><Path d="M8 5v14l11-7z" /></Svg>
            </View>
            <Text style={{ flex: 1, fontFamily: 'Manrope_500Medium', fontSize: 13, color: tokens.inkDark }}>
              {t('euro.step4.videoItem', { num: i + 1, at: v.at })}
            </Text>
            <Pressable onPress={() => removeVideo(i)} hitSlop={8}>
              <Text style={{ fontFamily: 'Manrope_600SemiBold', fontSize: 13, color: tokens.red }}>{t('euro.step4.remove')}</Text>
            </Pressable>
          </View>
        ))}
      </View>

      {__DEV__ ? (
        <Pressable onPress={() => nav.navigate('EuroStep5')} style={{ alignSelf: 'center', paddingVertical: 8, marginTop: 2 }}>
          <Text style={{ fontFamily: 'Manrope_600SemiBold', fontSize: 13, color: tokens.inkSubtle }}>
            {t('euro.step4.skipPhotos')}
          </Text>
        </Pressable>
      ) : null}
    </WizardFrame>
  );
}

function VideoButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flex: 1,
        height: 48,
        borderRadius: 14,
        borderWidth: 1.5,
        borderColor: 'rgba(230,20,40,0.4)',
        borderStyle: 'dashed',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <Text style={{ fontFamily: 'Manrope_600SemiBold', fontSize: 13, color: tokens.red }}>{label}</Text>
    </Pressable>
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
  const { t } = useTranslation();
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
              {t('euro.step4.captured')}
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
            {t('euro.step4.takePhoto')}
          </Text>
          <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 10, color: tokens.inkMuted }}>
            {label}
            {required ? t('euro.step4.requiredSuffix') : ''}
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
