import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Glass } from '../../../components/ui/Glass';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { useMe } from '../../../api/auth';
import { useDocument, useUpdateDocumentScans, useUpsertDocument } from '../../../api/documents';
import { uploadFileToS3 } from '../../../api/files';
import { CalendarIcon } from '../../../components/icons/CalendarIcon';
import { IconCamera } from '../../../components/icons/LineIcons';
import { BackButton } from '../../../components/ui/BackButton';
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

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '';
  return iso.slice(0, 10);
}

// M2.3 — Документы (паспорт / ВУ).
// Паспорт заблокирован для редактирования если пользователь верифицирован через MyID —
// данные заполнены из государственной системы автоматически.
export function DocumentScreen() {
  const { t } = useTranslation();
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
      const msg = e instanceof Error ? e.message : t('profileExtra.saveFailed');
      Alert.alert(t('profileExtra.error'), msg);
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
          Alert.alert(t('profileExtra.fillDataTitle'), t('profileExtra.fillDataMsg'));
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
      const msg = e instanceof Error ? e.message : t('profileExtra.uploadFailed');
      Alert.alert(t('profileExtra.uploadErrorTitle'), msg);
    } finally {
      setUploadingSide(null);
    }
  };

  // Выбор источника скана → получить uri → загрузить.
  const pickScan = (side: 'front' | 'back') => {
    Alert.alert(t('profileExtra.scanTitle'), t('profileExtra.scanSource'), [
      { text: t('profileExtra.camera'), onPress: () => pickImage(side, 'camera') },
      { text: t('profileExtra.gallery'), onPress: () => pickImage(side, 'gallery') },
      { text: t('profileExtra.pdfFile'), onPress: () => pickPdf(side) },
      { text: t('common.cancel'), style: 'cancel' },
    ]);
  };

  const pickImage = async (side: 'front' | 'back', source: 'camera' | 'gallery') => {
    const ImagePicker = await import('expo-image-picker');
    const perm =
      source === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(t('profileExtra.noAccess'), source === 'camera' ? t('profileExtra.allowCamera') : t('profileExtra.allowGallery'));
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
      Alert.alert(t('profileExtra.pdfUnavailableTitle'), t('profileExtra.pdfUnavailableMsg'));
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
      {/* Не оборачиваем в TouchableWithoutFeedback (DismissKeyboardView) — он
          перехватывает жест скролла на не-инпут областях. Клавиатуру гасим
          самим ScrollView: keyboardDismissMode="on-drag" + persistTaps="handled". */}
      <View style={{ flex: 1 }}>
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
          keyboardDismissMode="on-drag"
          automaticallyAdjustKeyboardInsets
        >
          {/* Title + status */}
          <View style={{ gap: 12 }}>
            <ScreenHeading title={t(`profileExtra.docTitle.${kind}`)} subtitle={t(`profileExtra.docInfo.${kind}`)} />
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
                  {t('profileExtra.myIdConfirmed')}
                </Text>
                <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 12, color: '#0a9466', opacity: 0.85, lineHeight: 17 }}>
                  {t('profileExtra.myIdPassportNote')}
                </Text>
              </View>
            </View>
          )}

          {/* Form fields */}
          <View style={{ gap: 14, opacity: isLocked ? 0.55 : 1 }}>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <TextField
                  label={t('profileExtra.series')}
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
                  label={t('profileExtra.docNumber')}
                  value={number}
                  onChangeText={setNumber}
                  placeholder="1234567"
                  keyboardType="number-pad"
                  editable={!isLocked}
                />
              </View>
            </View>
            <TextField
              label={t('profileExtra.issuedAt')}
              value={issuedAt}
              onChangeText={setIssuedAt}
              placeholder={t('profileExtra.datePlaceholder')}
              keyboardType="numbers-and-punctuation"
              suffix={<CalendarIcon />}
              editable={!isLocked}
            />
            <TextField
              label={t('profileExtra.issuedBy')}
              value={issuedBy}
              onChangeText={setIssuedBy}
              placeholder={t('profileExtra.issuedByPlaceholder')}
              editable={!isLocked}
            />
            {isPassport && (
              <TextField
                label="ПИНФЛ"
                value={pinfl}
                onChangeText={setPinfl}
                placeholder={t('profileExtra.pinflPlaceholder')}
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
                {t('profileExtra.passportScanRequired')}
              </Text>
              <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 12, color: tokens.inkSubtle, lineHeight: 17 }}>
                {t('profileExtra.scanHint')}
              </Text>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <UploadTile label={t('profileExtra.front')} imageUrl={doc?.frontImageUrl ?? null} uploading={uploadingSide === 'front'} onPress={() => pickScan('front')} />
                <UploadTile label={t('profileExtra.back')} imageUrl={doc?.backImageUrl ?? null} uploading={uploadingSide === 'back'} onPress={() => pickScan('back')} />
              </View>
            </View>
          ) : (
            !isLocked && (
              <View style={{ gap: 10 }}>
                <Text style={{ fontFamily: 'Manrope_500Medium', fontSize: 13, color: tokens.inkMuted, letterSpacing: -0.065 }}>
                  {t('profileExtra.docPhoto')}
                </Text>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <UploadTile label={t('profileExtra.front')} imageUrl={doc?.frontImageUrl ?? null} uploading={uploadingSide === 'front'} onPress={() => pickScan('front')} />
                  <UploadTile label={t('profileExtra.back')} imageUrl={doc?.backImageUrl ?? null} uploading={uploadingSide === 'back'} onPress={() => pickScan('back')} />
                </View>
              </View>
            )
          )}
        </ScrollView>

        {/* Bottom button */}
        <View style={{ position: 'absolute', left: 24, right: 24, bottom: 36 + kbHeight }}>
          {isLocked ? (
            <RedButton onPress={() => nav.goBack()}>
              {t('profileExtra.close')}
            </RedButton>
          ) : (
            <RedButton onPress={onSave} disabled={upsert.isPending}>
              {upsert.isPending ? t('profileExtra.saving') : t('common.save')}
            </RedButton>
          )}
        </View>
      </View>
    </PhoneFrame>
  );
}

// Чип «Требуется скан» — паспорт с данными, но без загруженного скана.
function ScanNeededChip() {
  const { t } = useTranslation();
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
      <Text style={{ fontFamily: 'Manrope_600SemiBold', fontSize: 12, color: '#8a6d0b' }}>{t('profileExtra.scanNeeded')}</Text>
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
  const { t } = useTranslation();
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
            <Text style={{ fontFamily: 'Manrope_600SemiBold', fontSize: 11, color: '#fff' }}>{label} · {t('profileExtra.replace')}</Text>
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
