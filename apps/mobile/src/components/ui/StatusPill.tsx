import { Text, View } from 'react-native';

export type DocumentStatus = 'verified' | 'pending' | 'rejected' | 'missing';

interface Props {
  status: DocumentStatus;
}

// Мини-бейдж статуса документа.
const config: Record<DocumentStatus, { bg: string; fg: string; label: string }> = {
  verified: { bg: 'rgba(105,228,183,0.25)', fg: '#0a3a26', label: 'Проверен' },
  pending: { bg: 'rgba(245,200,80,0.3)', fg: '#5e4811', label: 'На проверке' },
  rejected: { bg: 'rgba(230,20,40,0.18)', fg: 'rgb(160,15,30)', label: 'Отклонён' },
  missing: { bg: 'rgba(20,20,20,0.06)', fg: 'rgba(20,20,20,0.55)', label: 'Не добавлен' },
};

export function StatusPill({ status }: Props) {
  const c = config[status];
  return (
    <View
      style={{
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 999,
        backgroundColor: c.bg,
      }}
    >
      <Text
        style={{
          fontFamily: 'Manrope_600SemiBold',
          fontSize: 11,
          color: c.fg,
          letterSpacing: 0.11,
        }}
      >
        {c.label}
      </Text>
    </View>
  );
}
