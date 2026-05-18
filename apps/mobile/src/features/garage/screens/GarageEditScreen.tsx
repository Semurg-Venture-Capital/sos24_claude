import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { IconSearch } from '../../../components/icons/LineIcons';
import { BackButton } from '../../../components/ui/BackButton';
import { DismissKeyboardView } from '../../../components/ui/DismissKeyboardView';
import { PhoneFrame } from '../../../components/ui/PhoneFrame';
import { RedButton } from '../../../components/ui/RedButton';
import { ScreenHeading } from '../../../components/ui/ScreenHeading';
import { TextField } from '../../../components/ui/TextField';
import { useKeyboardHeight } from '../../../lib/useKeyboardHeight';
import { tokens } from '../../../theme/colors';
import { VEHICLE_TYPE_LABELS, getVehicleById, nappLookup } from '../mockGarage';
import type { GarageStackParamList } from '../../../navigation/types';

type Nav = NativeStackNavigationProp<GarageStackParamList, 'GarageEdit'>;
type R = RouteProp<GarageStackParamList, 'GarageEdit'>;

// M3.2 — Добавление/редактирование авто. Большое поле гос. номера + автозаполнение NAPP.
export function GarageEditScreen() {
  const nav = useNavigation<Nav>();
  const route = useRoute<R>();
  const kbHeight = useKeyboardHeight();
  const existing = route.params?.id ? getVehicleById(route.params.id) : undefined;

  const [plate, setPlate] = useState(existing?.plate ?? '');
  const [brand, setBrand] = useState(existing?.brand ?? '');
  const [model, setModel] = useState(existing?.model ?? '');
  const [year, setYear] = useState(existing?.year ? String(existing.year) : '');
  const [color, setColor] = useState(existing?.color ?? '');
  const [vin, setVin] = useState(existing?.vin ?? '');
  const [type, setType] = useState<'car' | 'suv' | 'truck' | 'motorcycle'>(existing?.type ?? 'car');
  const [engineCC, setEngineCC] = useState(existing?.engineCC ? String(existing.engineCC) : '');
  const [powerHP, setPowerHP] = useState(existing?.powerHP ? String(existing.powerHP) : '');
  const [lookupStatus, setLookupStatus] = useState<'idle' | 'loading' | 'found' | 'notFound'>(
    'idle',
  );
  const [submitting, setSubmitting] = useState(false);

  const isEdit = !!existing;

  const onLookup = async () => {
    if (!plate.trim()) return;
    setLookupStatus('loading');
    const result = await nappLookup(plate.trim());
    if (result) {
      setBrand(result.brand ?? '');
      setModel(result.model ?? '');
      setYear(result.year ? String(result.year) : '');
      setColor(result.color ?? '');
      setVin(result.vin ?? '');
      setType(result.type ?? 'car');
      setEngineCC(result.engineCC ? String(result.engineCC) : '');
      setPowerHP(result.powerHP ? String(result.powerHP) : '');
      setLookupStatus('found');
    } else {
      setLookupStatus('notFound');
    }
  };

  const onSave = async () => {
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 600));
    setSubmitting(false);
    nav.goBack();
  };

  const canSubmit = !!(plate.trim() && brand.trim() && model.trim() && year.trim());

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
      >
        <ScreenHeading
          title={isEdit ? 'Редактировать авто' : 'Добавить автомобиль'}
          subtitle="Введите гос. номер — данные подтянутся из NAPP"
        />

        {/* Plate field — bigger, with Lookup */}
        <View style={{ gap: 10 }}>
          <TextField
            label="Гос. номер"
            value={plate}
            onChangeText={(t) => {
              setPlate(t.toUpperCase());
              if (lookupStatus !== 'idle') setLookupStatus('idle');
            }}
            placeholder="01 A 123 BB"
            autoCapitalize="characters"
            suffix={
              lookupStatus === 'loading' ? (
                <ActivityIndicator size="small" color={tokens.inkMuted} />
              ) : (
                <IconSearch size={18} color={tokens.inkSubtle} />
              )
            }
          />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            {lookupStatus === 'found' && (
              <Text
                style={{
                  fontFamily: 'Manrope_500Medium',
                  fontSize: 12,
                  color: '#0a3a26',
                  flex: 1,
                  paddingLeft: 4,
                }}
              >
                Данные найдены и заполнены автоматически
              </Text>
            )}
            {lookupStatus === 'notFound' && (
              <Text
                style={{
                  fontFamily: 'Manrope_500Medium',
                  fontSize: 12,
                  color: tokens.inkSubtle,
                  flex: 1,
                  paddingLeft: 4,
                }}
              >
                Не нашли в NAPP — заполните вручную ниже
              </Text>
            )}
            <View style={{ flex: lookupStatus === 'idle' ? 1 : undefined }}>
              <FindButton onPress={onLookup} disabled={!plate.trim() || lookupStatus === 'loading'} />
            </View>
          </View>
        </View>

        <Text
          style={{
            fontFamily: 'Manrope_600SemiBold',
            fontSize: 11,
            color: tokens.inkSubtle,
            letterSpacing: 0.88,
            textTransform: 'uppercase',
            marginLeft: 4,
            marginTop: 4,
          }}
        >
          Данные автомобиля
        </Text>

        <View style={{ gap: 12 }}>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}>
              <TextField label="Марка" value={brand} onChangeText={setBrand} placeholder="Chevrolet" />
            </View>
            <View style={{ flex: 1 }}>
              <TextField label="Модель" value={model} onChangeText={setModel} placeholder="Cobalt" />
            </View>
          </View>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}>
              <TextField
                label="Год"
                value={year}
                onChangeText={setYear}
                placeholder="2021"
                keyboardType="number-pad"
                maxLength={4}
              />
            </View>
            <View style={{ flex: 1 }}>
              <TextField label="Цвет" value={color} onChangeText={setColor} placeholder="Белый" />
            </View>
          </View>
          <TextField
            label="VIN / кузов"
            value={vin}
            onChangeText={(t) => setVin(t.toUpperCase())}
            placeholder="17 символов"
            autoCapitalize="characters"
            maxLength={17}
          />
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}>
              <TextField
                label="Объём двигателя, см³"
                value={engineCC}
                onChangeText={setEngineCC}
                placeholder="1500"
                keyboardType="number-pad"
              />
            </View>
            <View style={{ flex: 1 }}>
              <TextField
                label="Мощность, л.с."
                value={powerHP}
                onChangeText={setPowerHP}
                placeholder="105"
                keyboardType="number-pad"
              />
            </View>
          </View>
          <TextField label="Тип" value={VEHICLE_TYPE_LABELS[type]} editable={false} />
        </View>
      </ScrollView>

      <View style={{ position: 'absolute', left: 24, right: 24, bottom: 36 + kbHeight }}>
        <RedButton onPress={onSave} disabled={!canSubmit || submitting}>
          {submitting ? 'Сохранение...' : 'Сохранить'}
        </RedButton>
      </View>
      </DismissKeyboardView>
    </PhoneFrame>
  );
}

function FindButton({ onPress, disabled }: { onPress: () => void; disabled?: boolean }) {
  return (
    <View
      style={{
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <Text
        onPress={disabled ? undefined : onPress}
        style={{
          fontFamily: 'Manrope_600SemiBold',
          fontSize: 13,
          color: tokens.inkDark,
          textDecorationLine: 'underline',
        }}
      >
        Найти
      </Text>
    </View>
  );
}
