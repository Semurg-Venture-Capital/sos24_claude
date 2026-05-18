import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { View } from 'react-native';
import { CalendarIcon } from '../../../components/icons/CalendarIcon';
import { PeriodOption } from '../../../components/ui/PeriodOption';
import { ScreenHeading } from '../../../components/ui/ScreenHeading';
import { TextField } from '../../../components/ui/TextField';
import { WizardFrame } from '../../../components/ui/WizardFrame';
import { usePurchaseStore, type PeriodMonths } from '../store';
import type { PurchaseStackParamList } from '../../../navigation/types';

type Nav = NativeStackNavigationProp<PurchaseStackParamList, 'CalcPeriod'>;

// Из YYYY-MM-DD в "13 мая 2026"
const MONTHS = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
function prettyDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

// M5.3 — Шаг 3: период страхования.
export function CalcPeriodScreen() {
  const nav = useNavigation<Nav>();
  const periodMonths = usePurchaseStore((s) => s.periodMonths);
  const setPeriod = usePurchaseStore((s) => s.setPeriod);
  const startDate = usePurchaseStore((s) => s.startDate);
  const endDate = usePurchaseStore((s) => s.endDate);

  const options: Array<{ months: PeriodMonths; label: string; sub: string }> = [
    { months: 3, label: '3 месяца', sub: '−45%' },
    { months: 6, label: '6 месяцев', sub: '−25%' },
    { months: 12, label: '12 месяцев', sub: 'лучший' },
  ];

  return (
    <WizardFrame
      step={3}
      eyebrow="Шаг 3 из 4 · Период"
      primary="Далее"
      primaryAction={() => nav.navigate('CalcResult')}
      onBack={() => nav.goBack()}
    >
      <ScreenHeading title="Срок страхования" subtitle="Чем дольше — тем выгоднее в пересчёте на месяц" />
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
          label="Дата начала"
          value={prettyDate(startDate)}
          editable={false}
          suffix={<CalendarIcon />}
        />
        <TextField
          label="Дата окончания"
          value={prettyDate(endDate)}
          editable={false}
          suffix={<CalendarIcon />}
        />
      </View>
    </WizardFrame>
  );
}
