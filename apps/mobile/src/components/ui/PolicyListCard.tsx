import { BlurView } from 'expo-blur';
import { Pressable, Text, View } from 'react-native';
import { PolicyQR } from './PolicyQR';
import { Tag } from './Tag';
import { tokens } from '../../theme/colors';

interface Props {
  tone?: 'dark' | 'light';
  type: string;
  car: string;
  plate: string;
  period: string;
  number: string;
  daysLeft: number;
  status: 'active' | 'expiring';
  qrPayload: string;
  onPress?: () => void;
}

// Большая карточка полиса в списке M8.1. От PolicyCardActive (на Home)
// отличается layout-ом: горизонтальная с QR справа, нижняя строка
// period + number через separator.
export function PolicyListCard({
  tone = 'light',
  type,
  car,
  plate,
  period,
  number,
  daysLeft,
  status,
  qrPayload,
  onPress,
}: Props) {
  const dark = tone === 'dark';
  const statusTone = status === 'expiring' ? 'yellow' : 'green';
  const statusLabel = status === 'expiring' ? `${daysLeft} дн.` : 'Активен';

  const content = (
    <View style={{ padding: 20, gap: 14 }}>
      {/* Row 1: type + status */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Tag tone={dark ? 'glass' : 'ink'}>{type}</Tag>
        <Tag tone={statusTone}>{statusLabel}</Tag>
      </View>

      {/* Row 2: car + plate (left) + mini QR (right) */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', gap: 12 }}>
        <View style={{ flex: 1, gap: 2 }}>
          <Text
            numberOfLines={1}
            style={{
              fontFamily: 'Manrope_400Regular',
              fontSize: 12,
              color: dark ? tokens.inkMutedDark : tokens.inkMuted,
            }}
          >
            {car}
          </Text>
          <Text
            style={{
              fontFamily: 'NeueMontreal-Medium',
              fontSize: 22,
              letterSpacing: -0.11,
              color: dark ? '#fff' : tokens.ink,
              lineHeight: 24,
            }}
          >
            {plate}
          </Text>
        </View>
        <PolicyQR value={qrPayload} size={48} padding={4} />
      </View>

      {/* Separator */}
      <View
        style={{
          height: 1,
          backgroundColor: dark ? 'rgba(255,255,255,0.06)' : tokens.hairline,
          marginTop: -2,
        }}
      />

      {/* Row 3: period + number */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <Text
          style={{
            fontFamily: 'Manrope_400Regular',
            fontSize: 11,
            color: dark ? tokens.inkMutedDark : tokens.inkMuted,
          }}
        >
          {period}
        </Text>
        <Text
          style={{
            fontFamily: 'NeueMontreal-Regular',
            fontSize: 11,
            letterSpacing: 0.44,
            color: dark ? 'rgba(255,255,255,0.5)' : tokens.inkSubtle,
          }}
        >
          {number}
        </Text>
      </View>
    </View>
  );

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        borderRadius: 28,
        overflow: 'hidden',
        backgroundColor: dark ? tokens.inkDark : undefined,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 16 },
        shadowOpacity: dark ? 0.32 : 0.1,
        shadowRadius: 22,
        elevation: 4,
        opacity: pressed ? 0.9 : 1,
      })}
    >
      {dark ? (
        content
      ) : (
        <BlurView intensity={20} tint="light" style={{ backgroundColor: 'rgba(255,255,255,0.55)' }}>
          {content}
        </BlurView>
      )}
    </Pressable>
  );
}
