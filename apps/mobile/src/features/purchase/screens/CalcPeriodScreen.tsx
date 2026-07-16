import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { CalendarIcon } from '../../../components/icons/CalendarIcon';
import { PeriodOption } from '../../../components/ui/PeriodOption';
import { ScreenHeading } from '../../../components/ui/ScreenHeading';
import { TextField } from '../../../components/ui/TextField';
import { WizardFrame } from '../../../components/ui/WizardFrame';
import { usePurchaseStore, type PeriodMonths } from '../store';
import type { PurchaseStackParamList } from '../../../navigation/types';

type Nav = NativeStackNavigationProp<PurchaseStackParamList, 'CalcPeriod'>;

// Из YYYY-MM-DD в "13 мая 2026" (названия месяцев — через i18n, ключи purchase.months.*)
function prettyDate(iso: string, t: TFunction): string {
  const d = new Date(iso);
  return `${d.getDate()} ${t(`purchase.months.${d.getMonth()}`)} ${d.getFullYear()}`;
}

// M5.3 — Шаг 3: период страхования.
export function CalcPeriodScreen() {
  const nav = useNavigation<Nav>();
  const { t } = useTranslation();
  const periodMonths = usePurchaseStore((s) => s.periodMonths);
  const setPeriod = usePurchaseStore((s) => s.setPeriod);
  const startDate = usePurchaseStore((s) => s.startDate);
  const endDate = usePurchaseStore((s) => s.endDate);

  const options: Array<{ months: PeriodMonths; label: string; sub: string }> = [
    { months: 3, label: t('purchase.calc.period.m3'), sub: '−45%' },
    { months: 6, label: t('purchase.calc.period.m6'), sub: '−25%' },
    { months: 12, label: t('purchase.calc.period.m12'), sub: t('purchase.calc.period.best') },
  ];

  return (
    <WizardFrame
      step={3}
      eyebrow={t('purchase.calc.step3.eyebrow')}
      primary={t('common.next')}
      primaryAction={() => nav.navigate('CalcResult')}
      onBack={() => nav.goBack()}
    >
      <ScreenHeading title={t('purchase.calc.period.title')} subtitle={t('purchase.calc.period.subtitle')} />
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {options.map((o) => (
          <PeriodOption
            key={o.months}
            label={o.label}
            sub={o.sub}
            selected={periodMonths === o.months}
            onPress={() => setPeriod(o.months)}
          />
        ))}
      </View>
      <View style={{ gap: 12 }}>
        <TextField
          label={t('purchase.calc.period.startDate')}
          value={prettyDate(startDate, t)}
          editable={false}
          suffix={<CalendarIcon />}
        />
        <TextField
          label={t('purchase.calc.period.endDate')}
          value={prettyDate(endDate, t)}
          editable={false}
          suffix={<CalendarIcon />}
        />
      </View>
    </WizardFrame>
  );
}
