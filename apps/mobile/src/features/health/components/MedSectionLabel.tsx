import { Pressable, Text, View } from 'react-native';
import { tokens } from '../../../theme/colors';

// Заголовок секции M14: uppercase-подпись слева + опциональное красное действие справа.
export function MedSectionLabel({
  children,
  action,
  onAction,
}: {
  children: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        paddingHorizontal: 4,
      }}
    >
      <Text
        style={{
          fontFamily: 'Manrope_600SemiBold',
          fontSize: 13,
          color: tokens.inkMuted,
          letterSpacing: 0.5,
          textTransform: 'uppercase',
        }}
      >
        {children}
      </Text>
      {action ? (
        <Pressable onPress={onAction} hitSlop={8} disabled={!onAction}>
          <Text style={{ fontFamily: 'Manrope_500Medium', fontSize: 13, color: tokens.red }}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
