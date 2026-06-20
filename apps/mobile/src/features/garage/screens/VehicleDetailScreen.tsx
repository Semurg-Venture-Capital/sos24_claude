import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { useId, useState } from 'react';
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
import type { ProductType, PolicyStatus } from '../../../api/types';
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

const POLICY_TYPE_LABEL: Record<ProductType, string> = {
  OSAGO: 'ОСАГО',
  KASKO: 'КАСКО',
  HEALTH: 'Здоровье',
  HOME: 'Дом',
  FINANCE: 'Финансы',
};

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

const STATUS_LABEL: Record<PolicyStatus, string> = {
  DRAFT: 'Черновик',
  PENDING_PAYMENT: 'Ожидает оплаты',
  ACTIVE: 'Активен',
  EXPIRED: 'Истёк',
  CANCELLED: 'Отменён',
};

export function VehicleDetailScreen() {
  const nav = useNavigation<Nav>();
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
        Alert.alert('Доступ', 'Нужно разрешение на камеру/галерею.');
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
      Alert.alert('Фото', (e as Error).message || 'Не удалось загрузить фото.');
    } finally {
      setPhotoBusy(false);
    }
  };

  const onPhotoPress = () => {
    Alert.alert('Фото авто', undefined, [
      { text: 'Сделать фото', onPress: () => pickPhoto(true) },
      { text: 'Выбрать из галереи', onPress: () => pickPhoto(false) },
      ...(vehicle?.photoKey ? [{ text: 'Удалить фото', style: 'destructive' as const, onPress: () => { setPhotoBusy(true); removePhoto.mutateAsync(id).finally(() => setPhotoBusy(false)); } }] : []),
      { text: 'Отмена', style: 'cancel' as const },
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
          <Text style={{ color: tokens.inkMuted, fontFamily: 'Manrope_400Regular' }}>Авто не найдено</Text>
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
            Alert.alert('Готово', 'Данные обновлены из госреестра.');
          } else {
            Alert.alert('Не найдено', 'Реестр не вернул данные по этому техпаспорту. Проверьте серию и номер.');
          }
        },
        onError: (e: unknown) => {
          const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
          Alert.alert('Ошибка', msg || 'Не удалось обратиться к реестру. Попробуйте позже.');
        },
      },
    );
  };

  const onDelete = () => {
    Alert.alert('Удалить авто?', `${vehicle.brand} ${vehicle.model} · ${vehicle.plate}`, [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Удалить',
        style: 'destructive',
        onPress: () =>
          deleteVehicle.mutate(vehicle.id, {
            onSuccess: () => nav.goBack(),
            onError: () => Alert.alert('Ошибка', 'Не удалось удалить авто.'),
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
                  {vehicle.photoKey ? 'Изменить фото' : 'Добавить фото'}
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
        <Section title="Характеристики">
          <InfoRow label="Марка" value={vehicle.brand} />
          <InfoRow label="Модель" value={vehicle.model} />
          <InfoRow label="Год выпуска" value={String(vehicle.year)} />
          <InfoRow label="Цвет" value={vehicle.color} />
          <InfoRow label="Мощность" value={vehicle.power} />
          <InfoRow label="Объём двигателя" value={vehicle.engine} />
          <InfoRow label="VIN" value={vehicle.vin} last />
        </Section>

        {/* Техпаспорт */}
        {hasNapp ? (
          <Section
            title="Техпаспорт"
            footer={
              <SyncFooter
                syncedAt={vehicle.nappSyncedAt}
                loading={syncNapp.isPending}
                onPress={() => runSync({})}
              />
            }
          >
            <InfoRow
              label="Серия и номер ТП"
              value={
                vehicle.techPassportSeria || vehicle.techPassportNumber
                  ? `${vehicle.techPassportSeria ?? ''} ${vehicle.techPassportNumber ?? ''}`.trim()
                  : null
              }
            />
            <InfoRow label="Дата выдачи" value={formatDate(vehicle.techPassportDate)} />
            <InfoRow label="Тип ТС" value={vehicleTypeLabel(vehicle.vehicleTypeId) ?? labelOrCode(vehicle.vehicleTypeId)} />
            <InfoRow label="Номер кузова" value={vehicle.bodyNumber} />
            <InfoRow label="Номер двигателя" value={vehicle.engineNumber} />
            <InfoRow label="Топливо" value={vehicle.fuelType} />
            <InfoRow label="Мест" value={vehicle.seats != null ? String(vehicle.seats) : null} />
            <InfoRow label="Полная масса" value={vehicle.fullWeight ? `${vehicle.fullWeight} кг` : null} />
            <InfoRow label="Снаряжённая масса" value={vehicle.emptyWeight ? `${vehicle.emptyWeight} кг` : null} />
            <InfoRow label="Отдел регистрации" value={vehicle.division} last />
          </Section>
        ) : (
          <Section title="Техпаспорт">
            <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 14, color: tokens.inkMuted, lineHeight: 20 }}>
              Данные из госреестра не загружены. Укажите серию и номер техпаспорта — подтянем характеристики и владельца
              автоматически.
            </Text>
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
              <Field label="Серия ТП" value={seria} onChange={setSeria} placeholder="AAF" flex={1} autoCapitalize="characters" />
              <Field label="Номер ТП" value={number} onChange={setNumber} placeholder="2949568" flex={1.6} keyboardType="number-pad" />
            </View>
            <View style={{ marginTop: 14 }}>
              <RedButton
                disabled={!seria.trim() || !number.trim() || syncNapp.isPending}
                onPress={() => runSync({ techPassportSeria: seria.trim(), techPassportNumber: number.trim() })}
              >
                {syncNapp.isPending ? 'Запрос…' : 'Обновить данные'}
              </RedButton>
            </View>
          </Section>
        )}

        {/* Владелец */}
        {hasNapp && (vehicle.ownerName || vehicle.ownerInn || vehicle.ownerPinfl) && (
          <Section title="Владелец">
            <InfoRow label="ФИО / организация" value={vehicle.ownerName} />
            {vehicle.ownerInn ? <InfoRow label="ИНН" value={vehicle.ownerInn} last={!vehicle.ownerPinfl} /> : null}
            {vehicle.ownerPinfl ? <InfoRow label="ПИНФЛ" value={vehicle.ownerPinfl} last /> : null}
          </Section>
        )}

        {/* Полисы на это авто */}
        <Section title="Полисы на это авто">
          {carPolicies.length === 0 ? (
            <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 14, color: tokens.inkMuted }}>
              Пока нет оформленных полисов на это авто.
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
                      {POLICY_TYPE_LABEL[p.type] ?? p.type}
                    </Text>
                    <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 12, color: tokens.inkMuted }}>
                      {formatPolicyNumber(p.policyNumber)}
                    </Text>
                  </View>
                  <Tag tone={statusTone(p.status)}>{STATUS_LABEL[p.status] ?? p.status}</Tag>
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
          <RedButton onPress={openPurchase}>Оформить полис</RedButton>
          <OutlineButton tone="red" onPress={onDelete}>
            Удалить авто
          </OutlineButton>
        </View>
      </View>
    </PhoneFrame>
  );
}

// vehicleTypeId без справочника — показываем код (а не «—»), если он есть.
function labelOrCode(id: number | null): string | null {
  return id != null ? `Код ${id}` : null;
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
}: {
  syncedAt: string | null;
  loading: boolean;
  onPress: () => void;
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
        {syncedAt ? `Обновлено ${formatDate(syncedAt)}` : 'Не синхронизировано'}
      </Text>
      <Pressable onPress={onPress} disabled={loading} style={({ pressed }) => ({ opacity: pressed || loading ? 0.5 : 1 })}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          {loading ? (
            <ActivityIndicator size="small" color={tokens.red} />
          ) : (
            <RefreshIcon size={15} color={tokens.red} />
          )}
          <Text style={{ fontFamily: 'Manrope_600SemiBold', fontSize: 13, color: tokens.red }}>
            {loading ? 'Обновляем…' : 'Обновить данные'}
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
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  flex?: number;
  keyboardType?: 'number-pad' | 'default';
  autoCapitalize?: 'characters' | 'none';
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
              <Text style={{ fontFamily: 'Manrope_600SemiBold', fontSize: 16, color: tokens.red }}>Готово</Text>
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
