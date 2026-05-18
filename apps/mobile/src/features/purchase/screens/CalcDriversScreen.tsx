import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { View } from 'react-native';
import { AddTile } from '../../../components/ui/AddTile';
import { DriverCard } from '../../../components/ui/DriverCard';
import { ScreenHeading } from '../../../components/ui/ScreenHeading';
import { Segmented } from '../../../components/ui/Segmented';
import { WarningBox } from '../../../components/ui/WarningBox';
import { WizardFrame } from '../../../components/ui/WizardFrame';
import { MOCK_DRIVERS, usePurchaseStore } from '../store';
import type { PurchaseStackParamList } from '../../../navigation/types';

type Nav = NativeStackNavigationProp<PurchaseStackParamList, 'CalcDrivers'>;

// M5.2 — Шаг 2: водители + лимит.
export function CalcDriversScreen() {
  const nav = useNavigation<Nav>();
  const driverLimit = usePurchaseStore((s) => s.driverLimit);
  const driverIds = usePurchaseStore((s) => s.driverIds);
  const setDriverLimit = usePurchaseStore((s) => s.setDriverLimit);
  const toggleDriver = usePurchaseStore((s) => s.toggleDriver);

  const limitedIdx = driverLimit === 'limited' ? 0 : 1;
  const drivers = MOCK_DRIVERS.filter((d) => driverIds.includes(d.id));
  const ok = driverLimit === 'unlimited' || drivers.length > 0;

  return (
    <WizardFrame
      step={2}
      eyebrow="Шаг 2 из 4 · Водители"
      primary="Далее"
      primaryEnabled={ok}
      primaryAction={() => nav.navigate('CalcPeriod')}
      onBack={() => nav.goBack()}
    >
      <ScreenHeading title="Кто будет управлять" subtitle="Количество водителей влияет на стоимость" />
      <Segmented
        options={['Ограниченный круг', 'Без ограничений']}
        active={limitedIdx}
        onChange={(i) => setDriverLimit(i === 0 ? 'limited' : 'unlimited')}
      />
      {driverLimit === 'limited' && (
        <View style={{ gap: 10 }}>
          {drivers.map((d) => (
            <DriverCard
              key={d.id}
              name={d.name}
              doc={d.doc}
              experience={d.experience}
              onRemove={() => toggleDriver(d.id)}
            />
          ))}
          <AddTile>Добавить водителя</AddTile>
        </View>
      )}
      <WarningBox text="«Без ограничений» дороже на ~25%, но позволяет управлять любому водителю с правами." />
    </WizardFrame>
  );
}
