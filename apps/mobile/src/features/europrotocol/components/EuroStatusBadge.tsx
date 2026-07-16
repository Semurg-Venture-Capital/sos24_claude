import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import { EURO_STATUS_TONE, type EuroStatus } from '../../../api/europrotocol';
import { tokens } from '../../../theme/colors';

const PALETTE = {
  ink: { bg: tokens.inkDark, fg: '#fff' },
  blue: { bg: 'rgba(86,140,255,0.85)', fg: '#fff' },
  yellow: { bg: 'rgba(245,200,80,0.9)', fg: '#503a07' },
  green: { bg: 'rgba(105,228,183,0.9)', fg: '#0a3a26' },
  red: { bg: 'rgba(230,20,40,0.14)', fg: tokens.red },
} as const;

export function EuroStatusBadge({ status }: { status: EuroStatus }) {
  const { t } = useTranslation();
  const p = PALETTE[EURO_STATUS_TONE[status]];
  return (
    <View style={{ paddingVertical: 5, paddingHorizontal: 10, borderRadius: 999, backgroundColor: p.bg }}>
      <Text style={{ fontFamily: 'Manrope_600SemiBold', fontSize: 11, color: p.fg, letterSpacing: 0.2 }}>
        {t('euroDocs.status.' + status)}
      </Text>
    </View>
  );
}
