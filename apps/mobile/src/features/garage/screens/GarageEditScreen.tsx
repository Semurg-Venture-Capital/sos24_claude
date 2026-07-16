import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { ActivityIndicator, Alert, ScrollView, Text, View } from 'react-native';
import { mapTechPassportToForm, useCreateVehicle, useNappLookup, useUpdateVehicle, useVehicle } from '../../../api/vehicles';
import { IconSearch } from '../../../components/icons/LineIcons';
import { BackButton } from '../../../components/ui/BackButton';
import { DismissKeyboardView } from '../../../components/ui/DismissKeyboardView';
import { PhoneFrame } from '../../../components/ui/PhoneFrame';
import { RedButton } from '../../../components/ui/RedButton';
import { ScreenHeading } from '../../../components/ui/ScreenHeading';
import { TextField } from '../../../components/ui/TextField';
import { useKeyboardHeight } from '../../../lib/useKeyboardHeight';
import { tokens } from '../../../theme/colors';
import type { GarageStackParamList } from '../../../navigation/types';

type Nav = NativeStackNavigationProp<GarageStackParamList, 'GarageEdit'>;
type R = RouteProp<GarageStackParamList, 'GarageEdit'>;

// M3.2 — Добавление/редактирование авто. Большое поле гос. номера + автозаполнение NAPP.
export function GarageEditScreen() {
  const nav = useNavigation<Nav>();
  const { t } = useTranslation();
  const route = useRoute<R>();
  const kbHeight = useKeyboardHeight();

  const vehicleId = route.params?.id;
  const isEdit = !!vehicleId;

  const { data: existing } = useVehicle(vehicleId);
  const createMutation = useCreateVehicle();
  const updateMutation = useUpdateVehicle();
  const nappMutation = useNappLookup();

  const [plate, setPlate] = useState('');
  const [techSeria, setTechSeria] = useState('');
  const [techNumber, setTechNumber] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [color, setColor] = useState('');
  const [vin, setVin] = useState('');
  const [engine, setEngine] = useState('');
  const [power, setPower] = useState('');
  const [lookupStatus, setLookupStatus] = useState<'idle' | 'loading' | 'found' | 'notFound'>('idle');

  const canLookup = !!(plate?.trim() && techSeria?.trim() && techNumber?.trim());

  useEffect(() => {
    if (existing) {
      setPlate(existing.plate);
      setBrand(existing.brand);
      setModel(existing.model);
      setYear(String(existing.year));
      setColor(existing.color ?? '');
      setVin(existing.vin ?? '');
      setEngine(existing.engine ?? '');
      setPower(existing.power ?? '');
    }
  }, [existing]);

  const onLookup = async () => {
    if (!canLookup) return;
    setLookupStatus('loading');
    try {
      const info = await nappMutation.mutateAsync({
        techPassportSeria: techSeria.trim().toUpperCase(),
        techPassportNumber: techNumber.trim(),
        govNumber: plate.trim().toUpperCase(),
      });
      const mapped = mapTechPassportToForm(info);
      setBrand(mapped.brand);
      setModel(mapped.model);
      setYear(mapped.year);
      setColor(mapped.color);
      setVin(mapped.vin);
      setPower(mapped.power);
      // Объём двигателя НАПП не возвращает — заполняется вручную.
      setLookupStatus('found');
    } catch {
      setLookupStatus('notFound');
    }
  };

  const onSave = async () => {
    const input = {
      plate: plate.trim().toUpperCase(),
      brand: brand.trim(),
      model: model.trim(),
      year: Number(year),
      ...(engine.trim() && { engine: engine.trim() }),
      ...(power.trim() && { power: power.trim() }),
      ...(vin.trim() && { vin: vin.trim() }),
      ...(color.trim() && { color: color.trim() }),
      // При создании передаём техпаспорт — backend подтянет и сохранит данные НАПП.
      ...(techSeria.trim() && { techPassportSeria: techSeria.trim().toUpperCase() }),
      ...(techNumber.trim() && { techPassportNumber: techNumber.trim() }),
    };
    try {
      if (isEdit && vehicleId) {
        await updateMutation.mutateAsync({ id: vehicleId, input });
      } else {
        await createMutation.mutateAsync(input);
      }
      nav.goBack();
    } catch {
      Alert.alert(t('garage.errorTitle'), t('garage.saveError'));
    }
  };

  const submitting = createMutation.isPending || updateMutation.isPending;
  const canSubmit = !!(plate?.trim() && brand?.trim() && model?.trim() && year?.trim());

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
        <ScreenHeading
          title={isEdit ? t('garage.editVehicle') : t('garage.addVehicle')}
          subtitle={t('garage.editSubtitle')}
        />

        {/* NAPP lookup: техпаспорт (серия + номер) + госномер */}
        <View style={{ gap: 10 }}>
          <TextField
            label={t('garage.field.plate')}
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
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}>
              <TextField
                label={t('garage.field.techSeria')}
                value={techSeria}
                onChangeText={(t) => {
                  setTechSeria(t.toUpperCase());
                  if (lookupStatus !== 'idle') setLookupStatus('idle');
                }}
                placeholder="AAE"
                autoCapitalize="characters"
                maxLength={3}
              />
            </View>
            <View style={{ flex: 1.4 }}>
              <TextField
                label={t('garage.field.techNumber')}
                value={techNumber}
                onChangeText={(t) => {
                  setTechNumber(t);
                  if (lookupStatus !== 'idle') setLookupStatus('idle');
                }}
                placeholder="3000221"
                keyboardType="number-pad"
                maxLength={7}
              />
            </View>
          </View>
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
                {t('garage.lookupFound')}
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
                {t('garage.lookupNotFound')}
              </Text>
            )}
            <View style={{ flex: lookupStatus === 'idle' ? 1 : undefined }}>
              <FindButton onPress={onLookup} disabled={!canLookup || lookupStatus === 'loading'} t={t} />
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
          {t('garage.vehicleData')}
        </Text>

        <View style={{ gap: 12 }}>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}>
              <TextField label={t('garage.field.brand')} value={brand} onChangeText={setBrand} placeholder="Chevrolet" />
            </View>
            <View style={{ flex: 1 }}>
              <TextField label={t('garage.field.model')} value={model} onChangeText={setModel} placeholder="Cobalt" />
            </View>
          </View>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}>
              <TextField
                label={t('garage.field.year')}
                value={year}
                onChangeText={setYear}
                placeholder="2021"
                keyboardType="number-pad"
                maxLength={4}
              />
            </View>
            <View style={{ flex: 1 }}>
              <TextField label={t('garage.field.color')} value={color} onChangeText={setColor} placeholder={t('garage.field.colorPlaceholder')} />
            </View>
          </View>
          <TextField
            label={t('garage.field.vin')}
            value={vin}
            onChangeText={(txt) => setVin(txt.toUpperCase())}
            placeholder={t('garage.field.vinPlaceholder')}
            autoCapitalize="characters"
            maxLength={17}
          />
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}>
              <TextField
                label={t('garage.field.engine')}
                value={engine}
                onChangeText={setEngine}
                placeholder="1500"
                keyboardType="number-pad"
              />
            </View>
            <View style={{ flex: 1 }}>
              <TextField
                label={t('garage.field.power')}
                value={power}
                onChangeText={setPower}
                placeholder="105"
                keyboardType="number-pad"
              />
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={{ position: 'absolute', left: 24, right: 24, bottom: 36 + kbHeight }}>
        <RedButton onPress={onSave} disabled={!canSubmit || submitting}>
          {submitting ? t('garage.saving') : t('common.save')}
        </RedButton>
      </View>
      </DismissKeyboardView>
    </PhoneFrame>
  );
}

function FindButton({ onPress, disabled, t }: { onPress: () => void; disabled?: boolean; t: TFunction }) {
  return (
    <View style={{ opacity: disabled ? 0.5 : 1 }}>
      <Text
        onPress={disabled ? undefined : onPress}
        style={{
          fontFamily: 'Manrope_600SemiBold',
          fontSize: 13,
          color: tokens.inkDark,
          textDecorationLine: 'underline',
        }}
      >
        {t('garage.find')}
      </Text>
    </View>
  );
}
