import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Glass } from '../../../components/ui/Glass';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { useMe } from '../../../api/auth';
import { useDocument, useUpdateDocumentScans, useUpsertDocument } from '../../../api/documents';
import { uploadFileToS3 } from '../../../api/files';
import { CalendarIcon } from '../../../components/icons/CalendarIcon';
import { IconCamera } from '../../../components/icons/LineIcons';
import { BackButton } from '../../../components/ui/BackButton';
import { DismissKeyboardView } from '../../../components/ui/DismissKeyboardView';
import { PhoneFrame } from '../../../components/ui/PhoneFrame';
import { RedButton } from '../../../components/ui/RedButton';
import { ScreenHeading } from '../../../components/ui/ScreenHeading';
import { StatusPill } from '../../../components/ui/StatusPill';
import { TextField } from '../../../components/ui/TextField';
import { useKeyboardHeight } from '../../../lib/useKeyboardHeight';
import { tokens } from '../../../theme/colors';
import type { ProfileStackParamList } from '../../../navigation/types';

type Nav = NativeStackNavigationProp<ProfileStackParamList, 'Document'>;
type R = RouteProp<ProfileStackParamList, 'Document'>;

const INFO_TEXT: Record<string, string> = {
  passport: 'Данные паспорта используются для оформления полисов и идентификации.',
  license: 'Требуется для расчёта стоимости с учётом стажа водителя.',
};

const TITLE: Record<string, string> = {
  passport: 'Паспорт',
  license: 'Водительское удостоверение',
};

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '';
  return iso.slice(0, 10);
}

// M2.3 — Документы (паспорт / ВУ).
// Паспорт заблокирован для редактирования если пользователь верифицирован через MyID —
// данные заполнены из государственной системы автоматически.
export function DocumentScreen() {
  const nav = useNavigation<Nav>();
  const route = useRoute<R>();
  const kbHeight = useKeyboardHeight();
  const kind = route.params.kind;
  const isPassport = kind === 'passport';

  const { data: me } = useMe();
  const { data: doc, isLoading } = useDocument(kind);
  const upsert = useUpsertDocument(kind);
  const updateScans = useUpdateDocumentScans(kind);
  const [uploadingSide, setUploadingSide] = useState<'front' | 'back' | null>(null);

  // Паспорт блокируется только если верифицирован через MyID.
  // ВУ всегда редактируемо — MyID его не верифицирует.
  const isLocked = isPassport && me?.verificationStatus === 'MYID_VERIFIED';

  const [series, setSeries] = useState('');
  const [number, setNumber] = useState('');
  const [issuedAt, setIssuedAt] = useState('');
  const [issuedBy, setIssuedBy] = useState('');
  const [pinfl, setPinfl] = useState('');

  useEffect(() => {
    if (!doc) return;
    setSeries(doc.series ?? '');
    setNumber(doc.number ?? '');
    setIssuedAt(formatDate(doc.issuedAt));
    setIssuedBy(doc.issuedBy ?? '');
    setPinfl(doc.pinfl ?? '');
  }, [doc]);

  const onSave = async () => {
    try {
      await upsert.mutateAsync({
        series,
        number,
        issuedAt,
        issuedBy: issuedBy || undefined,
        pinfl: isPassport ? pinfl || undefined : undefined,
      });
      nav.goBack();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Не удалось сохранить';
      Alert.alert('Ошибка', msg);
    }
  };

  // Загрузить скан документа (лицевая/обратная). Источник: камера, галерея или PDF.
  const uploadScan = async (side: 'front' | 'back', uri: string) => {
    setUploadingSide(side);
    try {
      const { key } = await uploadFileToS3(uri, 'passport');
      const field = side === 'front' ? 'frontImageKey' : 'backImageKey';
      if (doc) {
        await updateScans.mutateAsync({ [field]: key });
      } else {
        // Ручной ввод: документа ещё нет — сохраняем данные вместе со сканом.
        if (!series || !number || !issuedAt || (isPassport && !pinfl)) {
          Alert.alert('Заполните данные', 'Сначала укажите серию, номер, дату выдачи и ПИНФЛ.');
          return;
        }
        await upsert.mutateAsync({
          series,
          number,
          issuedAt,
          issuedBy: issuedBy || undefined,
          pinfl: isPassport ? pinfl || undefined : undefined,
          [field]: key,
        });
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Не удалось загрузить скан';
      Alert.alert('Ошибка загрузки', msg);
    } finally {
      setUploadingSide(null);
    }
  };

  // Выбор источника скана → получить uri → загрузить.
  const pickScan = (side: 'front' | 'back') => {
    Alert.alert('Скан документа', 'Откуда загрузить?', [
      { text: 'Камера', onPress: () => pickImage(side, 'camera') },
      { text: 'Из галереи', onPress: () => pickImage(side, 'gallery') },
      { text: 'PDF-файл', onPress: () => pickPdf(side) },
      { text: 'Отмена', style: 'cancel' },
    ]);
  };

  const pickImage = async (side: 'front' | 'back', source: 'camera' | 'gallery') => {
    const ImagePicker = await import('expo-image-picker');
    const perm =
      source === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Нет доступа', source === 'camera' ? 'Разрешите доступ к камере.' : 'Разрешите доступ к галерее.');
      return;
    }
    const opts = { mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.85 } as const;
    const res = source === 'camera' ? await ImagePicker.launchCameraAsync(opts) : await ImagePicker.launchImageLibraryAsync(opts);
    if (!res.canceled && res.assets?.[0]?.uri) {
      await uploadScan(side, res.assets[0].uri);
    }
  };

  const pickPdf = async (side: 'front' | 'back') => {
    try {
      const DocumentPicker = await import('expo-document-picker');
      const res = await DocumentPicker.getDocumentAsync({ type: 'application/pdf', copyToCacheDirectory: true });
      if (!res.canceled && res.assets?.[0]?.uri) {
        await uploadScan(side, res.assets[0].uri);
      }
    } catch {
      Alert.alert('PDF недоступен', 'Загрузка PDF появится после обновления приложения. Пока используйте фото.');
    }
  };

  if (isLoading) {
    return (
      <PhoneFrame>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={tokens.red} />
        </View>
      </PhoneFrame>
    );
  }

  return (
    <PhoneFrame>
      <DismissKeyboardView>
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
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets
        >
          {/* Title + status */}
          <View style={{ gap: 12 }}>
            <ScreenHeading title={TITLE[kind]} subtitle={INFO_TEXT[kind]} />
            <View style={{ flexDirection: 'row' }}>
              {isPassport && doc && !doc.isComplete ? (
                <ScanNeededChip />
              ) : (
                <StatusPill
                  status={
                    doc?.status === 'VERIFIED'
                      ? 'verified'
                      : doc?.status === 'REJECTED'
                        ? 'rejected'
                        : 'pending'
                  }
                />
              )}
            </View>
          </View>

          {/* MyID lock banner — только для заблокированного паспорта */}
          {isLocked && (
            <View
              style={{
                backgroundColor: 'rgba(52,211,153,0.08)',
                borderRadius: 16,
                borderWidth: 1,
                borderColor: 'rgba(52,211,153,0.2)',
                padding: 14,
                flexDirection: 'row',
                alignItems: 'flex-start',
                gap: 10,
              }}
            >
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" style={{ marginTop: 1, flexShrink: 0 }}>
                <Circle cx={12} cy={12} r={10} stroke="#0a9466" strokeWidth={1.6} />
                <Path d="M8 12l3 3 5-5" stroke="#0a9466" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: 'Manrope_600SemiBold', fontSize: 13, color: '#0a9466', marginBottom: 2 }}>
                  Данные подтверждены MyID
                </Text>
                <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 12, color: '#0a9466', opacity: 0.85, lineHeight: 17 }}>
                  Паспортные данные получены из государственной системы и защищены от изменений.
                </Text>
              </View>
            </View>
          )}

          {/* Form fields */}
          <View style={{ gap: 14, opacity: isLocked ? 0.55 : 1 }}>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <TextField
                  label="Серия"
                  value={series}
                  onChangeText={setSeries}
                  placeholder="AA"
                  autoCapitalize="characters"
                  maxLength={2}
                  editable={!isLocked}
                />
              </View>
              <View style={{ flex: 2 }}>
                <TextField
                  label="Номер"
                  value={number}
                  onChangeText={setNumber}
                  placeholder="1234567"
                  keyboardType="number-pad"
                  editable={!isLocked}
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
              editable={!isLocked}
            />
            <TextField
              label="Кем выдан"
              value={issuedBy}
              onChangeText={setIssuedBy}
              placeholder="УВД..."
              editable={!isLocked}
            />
            {isPassport && (
              <TextField
                label="ПИНФЛ"
                value={pinfl}
                onChangeText={setPinfl}
                placeholder="14 цифр"
                keyboardType="number-pad"
                maxLength={14}
                editable={!isLocked}
              />
            )}
          </View>

          {/* Скан документа — для паспорта обязателен (нужен в европротоколе),
              показываем всегда (в т.ч. для MyID-паспорта). Для ВУ — как раньше. */}
          {isPassport ? (
            <View style={{ gap: 10 }}>
              <Text style={{ fontFamily: 'Manrope_500Medium', fontSize: 13, color: tokens.inkMuted, letterSpacing: -0.065 }}>
                Скан паспорта · обязательно
              </Text>
              <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 12, color: tokens.inkSubtle, lineHeight: 17 }}>
                Загрузите обе стороны (фото или PDF). Без скана паспорт не считается оформленным и его нельзя приложить к европротоколу.
              </Text>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <UploadTile label="Лицевая" imageUrl={doc?.frontImageUrl ?? null} uploading={uploadingSide === 'front'} onPress={() => pickScan('front')} />
                <UploadTile label="Обратная" imageUrl={doc?.backImageUrl ?? null} uploading={uploadingSide === 'back'} onPress={() => pickScan('back')} />
              </View>
            </View>
          ) : (
            !isLocked && (
              <View style={{ gap: 10 }}>
                <Text style={{ fontFamily: 'Manrope_500Medium', fontSize: 13, color: tokens.inkMuted, letterSpacing: -0.065 }}>
                  Фото документа
                </Text>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <UploadTile label="Лицевая" imageUrl={doc?.frontImageUrl ?? null} uploading={uploadingSide === 'front'} onPress={() => pickScan('front')} />
                  <UploadTile label="Обратная" imageUrl={doc?.backImageUrl ?? null} uploading={uploadingSide === 'back'} onPress={() => pickScan('back')} />
                </View>
              </View>
            )
          )}
        </ScrollView>

        {/* Bottom button */}
        <View style={{ position: 'absolute', left: 24, right: 24, bottom: 36 + kbHeight }}>
          {isLocked ? (
            <RedButton onPress={() => nav.goBack()}>
              Закрыть
            </RedButton>
          ) : (
            <RedButton onPress={onSave} disabled={upsert.isPending}>
              {upsert.isPending ? 'Сохранение...' : 'Сохранить'}
            </RedButton>
          )}
        </View>
      </DismissKeyboardView>
    </PhoneFrame>
  );
}

// Чип «Требуется скан» — паспорт с данными, но без загруженного скана.
function ScanNeededChip() {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 999,
        backgroundColor: 'rgba(245,200,80,0.2)',
      }}
    >
      <View style={{ width: 7, height: 7, borderRadius: 999, backgroundColor: '#b8860b' }} />
      <Text style={{ fontFamily: 'Manrope_600SemiBold', fontSize: 12, color: '#8a6d0b' }}>Требуется скан</Text>
    </View>
  );
}

function UploadTile({
  label,
  imageUrl,
  uploading,
  onPress,
}: {
  label: string;
  imageUrl?: string | null;
  uploading?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={uploading ? undefined : onPress}
      style={({ pressed }) => ({
        flex: 1,
        height: 120,
        borderRadius: 20,
        overflow: 'hidden',
        opacity: pressed ? 0.7 : 1,
      })}
    >
      {imageUrl && !uploading ? (
        // Загруженный скан — превью + подпись «Заменить».
        <View style={{ flex: 1, borderRadius: 20, overflow: 'hidden' }}>
          <Image source={{ uri: imageUrl }} style={{ flex: 1 }} resizeMode="cover" />
          <View
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 0,
              paddingVertical: 6,
              alignItems: 'center',
              backgroundColor: 'rgba(0,0,0,0.45)',
            }}
          >
            <Text style={{ fontFamily: 'Manrope_600SemiBold', fontSize: 11, color: '#fff' }}>{label} · заменить</Text>
          </View>
        </View>
      ) : (
        <Glass
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
          {uploading ? (
            <ActivityIndicator color={tokens.red} />
          ) : (
            <>
              <IconCamera size={24} color={tokens.inkSubtle} />
              <Text style={{ fontFamily: 'Manrope_500Medium', fontSize: 12, color: tokens.inkSubtle }}>{label}</Text>
            </>
          )}
        </Glass>
      )}
    </Pressable>
  );
}
