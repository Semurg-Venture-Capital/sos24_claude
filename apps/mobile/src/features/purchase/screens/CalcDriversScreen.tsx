import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useDrivers, type Driver } from '../../../api/drivers';
import { AddTile } from '../../../components/ui/AddTile';
import { DriverCard } from '../../../components/ui/DriverCard';
import { ScreenHeading } from '../../../components/ui/ScreenHeading';
import { Segmented } from '../../../components/ui/Segmented';
import { WarningBox } from '../../../components/ui/WarningBox';
import { WizardFrame } from '../../../components/ui/WizardFrame';
import { tokens } from '../../../theme/colors';
import { usePurchaseStore } from '../store';
import type { PurchaseStackParamList } from '../../../navigation/types';

type Nav = NativeStackNavigationProp<PurchaseStackParamList, 'CalcDrivers'>;

function formatLicense(d: Driver): string {
  if (d.licenseSeries && d.licenseNumber) return `ВУ ${d.licenseSeries} ${d.licenseNumber}`;
  return 'ВУ не указано';
}

function formatExperience(years: number): string {
  if (years === 1) return '1 год';
  if (years >= 2 && years <= 4) return `${years} года`;
  return `${years} лет`;
}

// M5.2 — Шаг 2: водители + лимит.
export function CalcDriversScreen() {
  const nav = useNavigation<Nav>();
  const driverLimit = usePurchaseStore((s) => s.driverLimit);
  const driverIds = usePurchaseStore((s) => s.driverIds);
  const setDriverLimit = usePurchaseStore((s) => s.setDriverLimit);
  const setDriverIds = usePurchaseStore((s) => s.setDriverIds);
  const toggleDriver = usePurchaseStore((s) => s.toggleDriver);
  const { data: allDrivers, isLoading } = useDrivers();

  // Если ни один водитель ещё не выбран и лимит ограниченный — выбираем всех по умолчанию
  useEffect(() => {
    if (driverLimit === 'limited' && driverIds.length === 0 && allDrivers && allDrivers.length > 0) {
      setDriverIds(allDrivers.map((d) => d.id));
    }
  }, [allDrivers, driverIds.length, driverLimit, setDriverIds]);

  const limitedIdx = driverLimit === 'limited' ? 0 : 1;
  const selectedDrivers = allDrivers?.filter((d) => driverIds.includes(d.id)) ?? [];
  const ok = driverLimit === 'unlimited' || selectedDrivers.length > 0;

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
        <>
          {isLoading ? (
            <View style={{ paddingVertical: 24, alignItems: 'center' }}>
              <ActivityIndicator color={tokens.red} />
            </View>
          ) : (
            <View style={{ gap: 10 }}>
              {selectedDrivers.map((d) => (
                <DriverCard
                  key={d.id}
                  name={d.name}
                  doc={formatLicense(d)}
                  experience={formatExperience(d.experienceYears)}
                  onRemove={() => toggleDriver(d.id)}
                />
              ))}
              <AddTile>Добавить водителя</AddTile>
            </View>
          )}
        </>
      )}
      <WarningBox text="«Без ограничений» дороже на ~25%, но позволяет управлять любому водителю с правами." />
    </WizardFrame>
  );
}
