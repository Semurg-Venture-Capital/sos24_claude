import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { View } from 'react-native';
import { AddTile } from '../../../components/ui/AddTile';
import { CarCard } from '../../../components/ui/CarCard';
import { ScreenHeading } from '../../../components/ui/ScreenHeading';
import { WizardFrame } from '../../../components/ui/WizardFrame';
import { MOCK_CARS, usePurchaseStore } from '../store';
import type { PurchaseStackParamList } from '../../../navigation/types';

type Nav = NativeStackNavigationProp<PurchaseStackParamList, 'CalcVehicle'>;

// M5.1 — Шаг 1: выбор автомобиля.
export function CalcVehicleScreen() {
  const nav = useNavigation<Nav>();
  const carId = usePurchaseStore((s) => s.carId);
  const setCar = usePurchaseStore((s) => s.setCar);

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
      <View style={{ gap: 10 }}>
        {MOCK_CARS.map((c) => (
          <CarCard
            key={c.id}
            selected={c.id === carId}
            plate={c.plate}
            name={c.name}
            year={c.year}
            engine={c.engine}
            power={c.power}
            onPress={() => setCar(c.id)}
          />
        ))}
        <AddTile>Добавить новый автомобиль</AddTile>
      </View>
    </WizardFrame>
  );
}
