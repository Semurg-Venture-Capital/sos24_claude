import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useVehicles } from '../../../api/vehicles';
import { AddTile } from '../../../components/ui/AddTile';
import { CarCard } from '../../../components/ui/CarCard';
import { ScreenHeading } from '../../../components/ui/ScreenHeading';
import { WizardFrame } from '../../../components/ui/WizardFrame';
import { tokens } from '../../../theme/colors';
import { usePurchaseStore } from '../store';
import type { PurchaseStackParamList } from '../../../navigation/types';

type Nav = NativeStackNavigationProp<PurchaseStackParamList, 'CalcVehicle'>;

// M5.1 — Шаг 1: выбор автомобиля.
export function CalcVehicleScreen() {
  const nav = useNavigation<Nav>();
  const carId = usePurchaseStore((s) => s.carId);
  const setCar = usePurchaseStore((s) => s.setCar);
  const { data: vehicles, isLoading } = useVehicles();

  // Авто-выбираем первое авто если ни одного не выбрано (при первом входе)
  useEffect(() => {
    if (!carId && vehicles && vehicles.length > 0) {
      setCar(vehicles[0].id);
    }
  }, [vehicles, carId, setCar]);

  return (
    <WizardFrame
      step={1}
      eyebrow="Шаг 1 из 4 · Автомобиль"
      primary="Далее"
      primaryEnabled={!!carId}
      primaryAction={() => nav.navigate('CalcDrivers')}
      onBack={() => nav.goBack()}
    >
      <ScreenHeading title="Выберите автомобиль" subtitle="На какое авто оформляем полис" />
      {isLoading ? (
        <View style={{ paddingVertical: 32, alignItems: 'center' }}>
          <ActivityIndicator color={tokens.red} />
        </View>
      ) : (
        <View style={{ gap: 10 }}>
          {vehicles?.map((c) => (
            <CarCard
              key={c.id}
              selected={c.id === carId}
              plate={c.plate}
              name={`${c.brand} ${c.model}`}
              year={c.year}
              engine={c.engine ?? '—'}
              power={c.power ?? '—'}
              onPress={() => setCar(c.id)}
            />
          ))}
          <AddTile>Добавить новый автомобиль</AddTile>
        </View>
      )}
    </WizardFrame>
  );
}
