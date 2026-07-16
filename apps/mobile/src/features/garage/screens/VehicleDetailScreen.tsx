import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import {
  ActivityIndicator,
  Alert,
  Image,
  InputAccessoryView,
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  type ViewStyle,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import {
  useDeleteVehicle,
  useRemoveVehiclePhoto,
  useSyncVehicleNapp,
  useUploadVehiclePhoto,
  useVehicle,
  useVehicleTypeLabel,
} from '../../../api/vehicles';
import { usePolicies } from '../../../api/policies';
import type { PolicyStatus } from '../../../api/types';
import { BackButton } from '../../../components/ui/BackButton';
import { Glass } from '../../../components/ui/Glass';
import { IconCarSimple, IconPencil } from '../../../components/icons/LineIcons';
import { OutlineButton } from '../../../components/ui/OutlineButton';
import { PhoneFrame } from '../../../components/ui/PhoneFrame';
import { RedButton } from '../../../components/ui/RedButton';
import { Tag } from '../../../components/ui/Tag';
import { tokens } from '../../../theme/colors';
import type { GarageStackParamList } from '../../../navigation/types';

type Nav = NativeStackNavigationProp<GarageStackParamList, 'VehicleDetail'>;
type R = RouteProp<GarageStackParamList, 'VehicleDetail'>;

// Родитель Garage-стека — Tab-навигатор (есть Policies); навигация к Purchase
// (живёт на MainStack) всплывает вверх по дереву навигаторов автоматически.
type ParentNav = NativeStackNavigationProp<{
  Policies: { screen: 'PolicyDetail'; params: { id: string } };
  Purchase: { screen: 'CompanySelect' };
}>;

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  const [y, m, d] = iso.slice(0, 10).split('-');
  return `${d}.${m}.${y}`;
}

function formatPolicyNumber(n: string | null): string {
  if (!n) return '—';
  const clean = n.replace(/\s/g, '');
  return (clean.match(/.{1,4}/g) ?? []).join(' ');
}

function statusTone(status: PolicyStatus): 'green' | 'yellow' | 'glass' {
  if (status === 'ACTIVE') return 'green';
  if (status === 'PENDING_PAYMENT' || status === 'DRAFT') return 'yellow';
  return 'glass';
}

export function VehicleDetailScreen() {
  const nav = useNavigation<Nav>();
  const { t } = useTranslation();
  const route = useRoute<R>();
  const { id } = route.params;

  const { data: vehicle, isLoading } = useVehicle(id);
  const { data: policies } = usePolicies();
  const vehicleTypeLabel = useVehicleTypeLabel();
  const syncNapp = useSyncVehicleNapp();
  const deleteVehicle = useDeleteVehicle();
  const uploadPhoto = useUploadVehiclePhoto();
  const removePhoto = useRemoveVehiclePhoto();
  const [photoBusy, setPhotoBusy] = useState(false);

  // Поля для дозагрузки из НАПП, когда техпаспорт ещё не сохранён.
  const [seria, setSeria] = useState('');
  const [number, setNumber] = useState('');

  // Выбор фото из галереи/камеры → загрузка на бэкенд.
  const pickPhoto = async (fromCamera: boolean) => {
    try {
      const ImagePicker = await import('expo-image-picker');
      const perm = fromCamera
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert(t('garage.detail.permTitle'), t('garage.detail.permMessage'));
        return;
      }
      const res = fromCamera
        ? await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7 })
        : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7 });
      if (res.canceled || !res.assets?.[0]) return;
      const a = res.assets[0];
      setPhotoBusy(true);
      await uploadPhoto.mutateAsync({ id, asset: { uri: a.uri, mimeType: a.mimeType, fileName: a.fileName ?? undefined } });
    } catch (e) {
      Alert.alert(t('garage.detail.photo'), (e as Error).message || t('garage.detail.photoError'));
    } finally {
      setPhotoBusy(false);
    }
  };

  const onPhotoPress = () => {
    Alert.alert(t('garage.detail.photoTitle'), undefined, [
      { text: t('garage.detail.takePhoto'), onPress: () => pickPhoto(true) },
      { text: t('garage.detail.pickGallery'), onPress: () => pickPhoto(false) },
      ...(vehicle?.photoKey ? [{ text: t('garage.detail.deletePhoto'), style: 'destructive' as const, onPress: () => { setPhotoBusy(true); removePhoto.mutateAsync(id).finally(() => setPhotoBusy(false)); } }] : []),
      { text: t('common.cancel'), style: 'cancel' as const },
    ]);
  };

  if (isLoading) {
    return (
      <PhoneFrame bottomSafeArea={false}>
        <Header onBack={() => nav.goBack()} />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={tokens.red} />
        </View>
      </PhoneFrame>
    );
  }

  if (!vehicle) {
    return (
      <PhoneFrame bottomSafeArea={false}>
        <Header onBack={() => nav.goBack()} />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: tokens.inkMuted, fontFamily: 'Manrope_400Regular' }}>{t('garage.detail.notFound')}</Text>
        </View>
      </PhoneFrame>
    );
  }

  const hasNapp = !!vehicle.nappSyncedAt || !!vehicle.techPassportSeria;
  const carPolicies = (policies ?? []).filter((p) => p.vehicleId === vehicle.id);

  const runSync = (input: { techPassportSeria?: string; techPassportNumber?: string }) => {
    syncNapp.mutate(
      { id: vehicle.id, input },
      {
        onSuccess: (res) => {
          if (res.found) {
            Alert.alert(t('garage.detail.syncDoneTitle'), t('garage.detail.syncDoneMessage'));
          } else {
            Alert.alert(t('garage.detail.syncNotFoundTitle'), t('garage.detail.syncNotFoundMessage'));
          }
        },
        onError: (e: unknown) => {
          const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
          Alert.alert(t('garage.errorTitle'), msg || t('garage.detail.syncError'));
        },
      },
    );
  };

  const onDelete = () => {
    Alert.alert(t('garage.detail.deleteTitle'), `${vehicle.brand} ${vehicle.model} · ${vehicle.plate}`, [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('garage.detail.delete'),
        style: 'destructive',
        onPress: () =>
          deleteVehicle.mutate(vehicle.id, {
            onSuccess: () => nav.goBack(),
            onError: () => Alert.alert(t('garage.errorTitle'), t('garage.detail.deleteError')),
          }),
      },
    ]);
  };

  const openPurchase = () => {
    nav.getParent<ParentNav>()?.navigate('Purchase', { screen: 'CompanySelect' });
  };

  const openPolicy = (policyId: string) => {
    // Policies — соседний таб; идём к нему через родительский Tab-навигатор.
    nav.getParent<ParentNav>()?.navigate('Policies', { screen: 'PolicyDetail', params: { id: policyId } });
  };

  return (
    <PhoneFrame bottomSafeArea={false}>
      <Header onBack={() => nav.goBack()} onEdit={() => nav.navigate('GarageEdit', { id: vehicle.id })} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 220, gap: 16 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        automaticallyAdjustKeyboardInsets
      >
        {/* Hero — фото/рендер авто + кнопка изменения фото */}
        <View style={{ gap: 14, paddingTop: 4, paddingBottom: 6 }}>
          <Pressable
            onPress={onPhotoPress}
            disabled={photoBusy}
            style={{
              height: 200,
              borderRadius: 28,
              overflow: 'hidden',
              backgroundColor: 'rgba(20,20,20,0.05)',
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: tokens.hairline,
            }}
          >
            {vehicle.imageUrl ? (
              <Image source={{ uri: vehicle.imageUrl }} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
            ) : (
              <IconCarSimple size={72} color={tokens.inkMuted} />
            )}
            {photoBusy ? (
              <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.5)' }}>
                <ActivityIndicator color={tokens.red} />
              </View>
            ) : (
              <View style={{ position: 'absolute', right: 12, bottom: 12, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(20,20,20,0.78)', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999 }}>
                <IconPencil size={14} color="#fff" />
                <Text style={{ fontFamily: 'Manrope_600SemiBold', fontSize: 12, color: '#fff' }}>
                  {vehicle.photoKey ? t('garage.detail.changePhoto') : t('garage.detail.addPhoto')}
                </Text>
              </View>
            )}
          </Pressable>
          <View style={{ alignItems: 'center', gap: 6 }}>
            <Text style={{ fontFamily: 'NeueMontreal-Medium', fontSize: 30, letterSpacing: -0.3, color: tokens.ink }}>
              {vehicle.plate}
            </Text>
            <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 15, color: tokens.inkMuted }}>
              {vehicle.brand} {vehicle.model} · {vehicle.year}
            </Text>
          </View>
        </View>

        {/* Характеристики */}
        <Section title={t('garage.detail.specs')}>
          <InfoRow label={t('garage.detail.brand')} value={vehicle.brand} />
          <InfoRow label={t('garage.detail.model')} value={vehicle.model} />
          <InfoRow label={t('garage.detail.year')} value={String(vehicle.year)} />
          <InfoRow label={t('garage.detail.color')} value={vehicle.color} />
          <InfoRow label={t('garage.detail.power')} value={vehicle.power} />
          <InfoRow label={t('garage.detail.engine')} value={vehicle.engine} />
          <InfoRow label={t('garage.detail.vin')} value={vehicle.vin} last />
        </Section>

        {/* Техпаспорт */}
        {hasNapp ? (
          <Section
            title={t('garage.detail.techPassport')}
            footer={
              <SyncFooter
                syncedAt={vehicle.nappSyncedAt}
                loading={syncNapp.isPending}
                onPress={() => runSync({})}
                t={t}
              />
            }
          >
            <InfoRow
              label={t('garage.detail.tpSeriaNumber')}
              value={
                vehicle.techPassportSeria || vehicle.techPassportNumber
                  ? `${vehicle.techPassportSeria ?? ''} ${vehicle.techPassportNumber ?? ''}`.trim()
                  : null
              }
            />
            <InfoRow label={t('garage.detail.issueDate')} value={formatDate(vehicle.techPassportDate)} />
            <InfoRow label={t('garage.detail.vehicleType')} value={vehicleTypeLabel(vehicle.vehicleTypeId) ?? labelOrCode(vehicle.vehicleTypeId, t)} />
            <InfoRow label={t('garage.detail.bodyNumber')} value={vehicle.bodyNumber} />
            <InfoRow label={t('garage.detail.engineNumber')} value={vehicle.engineNumber} />
            <InfoRow label={t('garage.detail.fuel')} value={vehicle.fuelType} />
            <InfoRow label={t('garage.detail.seats')} value={vehicle.seats != null ? String(vehicle.seats) : null} />
            <InfoRow label={t('garage.detail.fullWeight')} value={vehicle.fullWeight ? `${vehicle.fullWeight} ${t('garage.detail.kg')}` : null} />
            <InfoRow label={t('garage.detail.emptyWeight')} value={vehicle.emptyWeight ? `${vehicle.emptyWeight} ${t('garage.detail.kg')}` : null} />
            <InfoRow label={t('garage.detail.division')} value={vehicle.division} last />
          </Section>
        ) : (
          <Section title={t('garage.detail.techPassport')}>
            <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 14, color: tokens.inkMuted, lineHeight: 20 }}>
              {t('garage.detail.tpEmpty')}
            </Text>
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
              <Field label={t('garage.detail.tpSeria')} value={seria} onChange={setSeria} placeholder="AAF" flex={1} autoCapitalize="characters" t={t} />
              <Field label={t('garage.detail.tpNumber')} value={number} onChange={setNumber} placeholder="2949568" flex={1.6} keyboardType="number-pad" t={t} />
            </View>
            <View style={{ marginTop: 14 }}>
              <RedButton
                disabled={!seria.trim() || !number.trim() || syncNapp.isPending}
                onPress={() => runSync({ techPassportSeria: seria.trim(), techPassportNumber: number.trim() })}
              >
                {syncNapp.isPending ? t('garage.detail.requesting') : t('garage.detail.updateData')}
              </RedButton>
            </View>
          </Section>
        )}

        {/* Владелец */}
        {hasNapp && (vehicle.ownerName || vehicle.ownerInn || vehicle.ownerPinfl) && (
          <Section title={t('garage.detail.owner')}>
            <InfoRow label={t('garage.detail.ownerName')} value={vehicle.ownerName} />
            {vehicle.ownerInn ? <InfoRow label={t('garage.detail.inn')} value={vehicle.ownerInn} last={!vehicle.ownerPinfl} /> : null}
            {vehicle.ownerPinfl ? <InfoRow label={t('garage.detail.pinfl')} value={vehicle.ownerPinfl} last /> : null}
          </Section>
        )}

        {/* Полисы на это авто */}
        <Section title={t('garage.detail.policiesTitle')}>
          {carPolicies.length === 0 ? (
            <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 14, color: tokens.inkMuted }}>
              {t('garage.detail.policiesEmpty')}
            </Text>
          ) : (
            <View style={{ gap: 10 }}>
              {carPolicies.map((p) => (
                <Pressable
                  key={p.id}
                  onPress={() => openPolicy(p.id)}
                  style={({ pressed }) => ({
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingVertical: 12,
                    paddingHorizontal: 14,
                    borderRadius: 16,
                    backgroundColor: 'rgba(20,20,20,0.03)',
                    opacity: pressed ? 0.7 : 1,
                  })}
                >
                  <View style={{ gap: 3 }}>
                    <Text style={{ fontFamily: 'NeueMontreal-Medium', fontSize: 15, color: tokens.ink }}>
                      {t(`productTypes.${p.type}`)}
                    </Text>
                    <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 12, color: tokens.inkMuted }}>
                      {formatPolicyNumber(p.policyNumber)}
                    </Text>
                  </View>
                  <Tag tone={statusTone(p.status)}>{t(`garage.policyStatus.${p.status}`)}</Tag>
                </Pressable>
              ))}
            </View>
          )}
        </Section>
      </ScrollView>

      {/* Нижние действия */}
      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0 }}>
        <LinearGradient
          colors={['rgba(228,228,228,0)', tokens.pageBg]}
          style={{ position: 'absolute', top: -32, left: 0, right: 0, height: 32 }}
        />
        <View style={{ backgroundColor: tokens.pageBg, paddingHorizontal: 24, paddingTop: 6, paddingBottom: 34, gap: 10 }}>
          <RedButton onPress={openPurchase}>{t('garage.detail.buyPolicy')}</RedButton>
          <OutlineButton tone="red" onPress={onDelete}>
            {t('garage.detail.deleteVehicle')}
          </OutlineButton>
        </View>
      </View>
    </PhoneFrame>
  );
}

// vehicleTypeId без справочника — показываем код (а не «—»), если он есть.
function labelOrCode(id: number | null, t: TFunction): string | null {
  return id != null ? t('garage.detail.code', { id }) : null;
}

function Header({ onBack, onEdit }: { onBack: () => void; onEdit?: () => void }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 8,
        paddingBottom: 12,
      }}
    >
      <BackButton onPress={onBack} />
      {onEdit ? (
        <Pressable
          onPress={onEdit}
          style={({ pressed }) => ({
            width: 48,
            height: 48,
            borderRadius: 999,
            backgroundColor: 'rgba(255,255,255,0.55)',
            borderWidth: 1,
            borderColor: tokens.hairline,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <IconPencil size={18} color={tokens.inkDark} />
        </Pressable>
      ) : (
        <View style={{ width: 48 }} />
      )}
    </View>
  );
}

function Section({
  title,
  children,
  footer,
}: {
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <View style={{ borderRadius: 24, overflow: 'hidden' }}>
      <Glass
        intensity={20}
        tint="light"
        style={{
          backgroundColor: 'rgba(255,255,255,0.55)',
          padding: 18,
          borderWidth: 1,
          borderColor: tokens.hairline,
        }}
      >
        <Text
          style={{
            fontFamily: 'NeueMontreal-Medium',
            fontSize: 17,
            letterSpacing: -0.1,
            color: tokens.ink,
            marginBottom: 12,
          }}
        >
          {title}
        </Text>
        {children}
        {footer}
      </Glass>
    </View>
  );
}

// Строка не рендерится, если значение пустое (чтобы не плодить «—»),
// кроме случая, когда явно хотим показать прочерк — но мы просто скрываем.
function InfoRow({ label, value, last }: { label: string; value: string | null | undefined; last?: boolean }) {
  if (value === null || value === undefined || value === '') return null;
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        paddingVertical: 9,
        gap: 16,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: tokens.hairline,
      }}
    >
      <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 14, color: tokens.inkMuted, flexShrink: 0 }}>
        {label}
      </Text>
      <Text
        style={{ fontFamily: 'Manrope_500Medium', fontSize: 14, color: tokens.ink, flex: 1, textAlign: 'right' }}
      >
        {value}
      </Text>
    </View>
  );
}

function SyncFooter({
  syncedAt,
  loading,
  onPress,
  t,
}: {
  syncedAt: string | null;
  loading: boolean;
  onPress: () => void;
  t: TFunction;
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: tokens.hairline,
      }}
    >
      <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 12, color: tokens.inkMuted }}>
        {syncedAt ? t('garage.detail.syncedAt', { date: formatDate(syncedAt) }) : t('garage.detail.notSynced')}
      </Text>
      <Pressable onPress={onPress} disabled={loading} style={({ pressed }) => ({ opacity: pressed || loading ? 0.5 : 1 })}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          {loading ? (
            <ActivityIndicator size="small" color={tokens.red} />
          ) : (
            <RefreshIcon size={15} color={tokens.red} />
          )}
          <Text style={{ fontFamily: 'Manrope_600SemiBold', fontSize: 13, color: tokens.red }}>
            {loading ? t('garage.detail.updating') : t('garage.detail.updateData')}
          </Text>
        </View>
      </Pressable>
    </View>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  flex,
  keyboardType,
  autoCapitalize,
  t,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  flex?: number;
  keyboardType?: 'number-pad' | 'default';
  autoCapitalize?: 'characters' | 'none';
  t: TFunction;
}) {
  const wrap: ViewStyle = { flex: flex ?? 1, gap: 6 };
  const accId = useId();
  const numericKb = Platform.OS === 'ios' && keyboardType === 'number-pad';
  return (
    <View style={wrap}>
      <Text style={{ fontFamily: 'Manrope_500Medium', fontSize: 12, color: tokens.inkMuted }}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={tokens.inkMuted}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        inputAccessoryViewID={numericKb ? accId : undefined}
        style={{
          height: 48,
          borderRadius: 14,
          backgroundColor: tokens.white,
          borderWidth: 1,
          borderColor: tokens.hairline,
          paddingHorizontal: 14,
          fontFamily: 'Manrope_500Medium',
          fontSize: 15,
          color: tokens.ink,
        }}
      />
      {numericKb && (
        <InputAccessoryView nativeID={accId}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'flex-end',
              backgroundColor: '#f2f2f7',
              borderTopWidth: 1,
              borderTopColor: 'rgba(0,0,0,0.12)',
              paddingHorizontal: 16,
              paddingVertical: 9,
            }}
          >
            <Pressable onPress={() => Keyboard.dismiss()} hitSlop={10}>
              <Text style={{ fontFamily: 'Manrope_600SemiBold', fontSize: 16, color: tokens.red }}>{t('garage.detail.done')}</Text>
            </Pressable>
          </View>
        </InputAccessoryView>
      )}
    </View>
  );
}

function RefreshIcon({ size = 16, color = tokens.red }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 12a9 9 0 1 1-2.64-6.36M21 3v5h-5"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
