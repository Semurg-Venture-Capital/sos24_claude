import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useEffect } from 'react';
import type { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';
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

function formatLicense(d: Driver, t: TFunction): string {
  if (d.licenseSeries && d.licenseNumber)
    return t('purchase.calc.drivers.license', { series: d.licenseSeries, number: d.licenseNumber });
  return t('purchase.calc.drivers.noLicense');
}

function formatExperience(years: number, t: TFunction): string {
  if (years === 1) return t('purchase.calc.drivers.expYears.one', { years });
  if (years >= 2 && years <= 4) return t('purchase.calc.drivers.expYears.few', { years });
  return t('purchase.calc.drivers.expYears.many', { years });
}

// M5.2 — Шаг 2: водители + лимит.
export function CalcDriversScreen() {
  const nav = useNavigation<Nav>();
  const { t } = useTranslation();
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
      eyebrow={t('purchase.calc.step2.eyebrow')}
      primary={t('common.next')}
      primaryEnabled={ok}
      primaryAction={() => nav.navigate('CalcPeriod')}
      onBack={() => nav.goBack()}
    >
      <ScreenHeading title={t('purchase.calc.drivers.title')} subtitle={t('purchase.calc.drivers.subtitle')} />
      <Segmented
        options={[t('purchase.calc.drivers.limited'), t('purchase.calc.drivers.unlimited')]}
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
                  doc={formatLicense(d, t)}
                  experience={formatExperience(d.experienceYears, t)}
                  onRemove={() => toggleDriver(d.id)}
                />
              ))}
              <AddTile>{t('purchase.calc.drivers.addDriver')}</AddTile>
            </View>
          )}
        </>
      )}
      <WarningBox text={t('purchase.calc.drivers.warning')} />
    </WizardFrame>
  );
}
