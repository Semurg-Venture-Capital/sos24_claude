import { Glass } from './Glass';
import { Pressable, Text, View } from 'react-native';
import { QrIcon } from '../icons/QrIcon';
import { Tag } from './Tag';
import { tokens } from '../../theme/colors';

interface Props {
  tone?: 'dark' | 'light';
  type: string;
  car: string;
  plate: string;
  daysLeft: number;
  expiry: string;
  warn?: boolean;
  onPress?: () => void;
  onQrPress?: () => void;
  onMorePress?: () => void;
}

// Карточка активного полиса в горизонтальной ленте на Home.
export function PolicyCardActive({
  tone = 'light',
  type,
  car,
  plate,
  daysLeft,
  expiry,
  warn,
  onPress,
  onQrPress,
  onMorePress,
}: Props) {
  const dark = tone === 'dark';

  const inner = (
    <View
      style={{
        padding: 18,
        flex: 1,
        gap: 12,
        height: '100%',
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Tag tone={dark ? 'glass' : 'ink'}>{type}</Tag>
        <Tag tone={warn ? 'yellow' : 'green'}>{`${daysLeft} дн.`}</Tag>
      </View>
      <View style={{ marginTop: 'auto', gap: 2 }}>
        <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 12, color: dark ? tokens.inkMutedDark : tokens.inkMuted }}>
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
        <Text
          style={{
            fontFamily: 'Manrope_400Regular',
            fontSize: 11,
            color: dark ? 'rgba(255,255,255,0.5)' : tokens.inkMuted,
            marginTop: 4,
          }}
        >
          до {expiry}
        </Text>
      </View>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Pressable
          onPress={onQrPress}
          style={({ pressed }) => ({
            flex: 1,
            height: 38,
            borderRadius: 999,
            backgroundColor: dark ? '#fff' : tokens.inkDark,
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'row',
            gap: 6,
            opacity: pressed ? 0.85 : 1,
          })}
        >
          <QrIcon size={12} color={dark ? tokens.inkDark : '#fff'} />
          <Text style={{ color: dark ? tokens.inkDark : '#fff', fontFamily: 'Manrope_600SemiBold', fontSize: 13 }}>
            QR
          </Text>
        </Pressable>
        <Pressable
          onPress={onMorePress}
          style={({ pressed }) => ({
            height: 38,
            paddingHorizontal: 14,
            borderRadius: 999,
            backgroundColor: dark ? 'rgba(255,255,255,0.06)' : 'rgba(20,20,20,0.05)',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <Text style={{ color: dark ? tokens.inkMutedDark : tokens.inkDark, fontFamily: 'Manrope_500Medium', fontSize: 13 }}>
            ···
          </Text>
        </Pressable>
      </View>
    </View>
  );

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        width: 260,
        height: 200,
        borderRadius: 32,
        overflow: 'hidden',
        backgroundColor: dark ? tokens.inkDark : undefined,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 16 },
        shadowOpacity: dark ? 0.32 : 0.1,
        shadowRadius: 20,
        elevation: 4,
        opacity: pressed && onPress ? 0.88 : 1,
      })}
    >
      {dark ? (
        inner
      ) : (
        <Glass intensity={20} tint="light" style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.6)' }}>
          {inner}
        </Glass>
      )}
    </Pressable>
  );
}
