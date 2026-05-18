import { BlurView } from 'expo-blur';
import type { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import { ChevronRight } from '../icons/ChevronRight';
import { tokens } from '../../theme/colors';

interface Props {
  icon?: ReactNode;
  title: string;
  meta?: string;
  value?: string;
  trailing?: 'chevron' | 'none' | ReactNode;
  onPress?: () => void;
  destructive?: boolean;
}

// Строка-меню в стиле iOS: glass-фон, иконка слева, тайтл + опц. meta,
// справа value или chevron. Используется во многих местах (профиль, настройки).
export function ListRow({ icon, title, meta, value, trailing = 'chevron', onPress, destructive }: Props) {
  const titleColor = destructive ? tokens.red : tokens.inkDark;

  let trailEl: ReactNode = null;
  if (trailing === 'chevron') trailEl = <ChevronRight size={12} />;
  else if (trailing === 'none') trailEl = null;
  else trailEl = trailing;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        borderRadius: 20,
        overflow: 'hidden',
        opacity: pressed && onPress ? 0.85 : 1,
      })}
    >
      <BlurView
        intensity={20}
        tint="light"
        style={{
          backgroundColor: 'rgba(255,255,255,0.5)',
          paddingVertical: 14,
          paddingHorizontal: 18,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 14,
          minHeight: 56,
          borderWidth: 1,
          borderColor: tokens.hairline,
        }}
      >
        {icon && (
          <View
            style={{
              width: 28,
              height: 28,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {icon}
          </View>
        )}
        <View style={{ flex: 1, gap: 2 }}>
          <Text
            style={{
              fontFamily: 'Manrope_500Medium',
              fontSize: 15,
              color: titleColor,
              letterSpacing: -0.075,
            }}
            numberOfLines={1}
          >
            {title}
          </Text>
          {meta && (
            <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 12, color: tokens.inkMuted }}>
              {meta}
            </Text>
          )}
        </View>
        {value && (
          <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 14, color: tokens.inkMuted }}>
            {value}
          </Text>
        )}
        {trailEl}
      </BlurView>
    </Pressable>
  );
}
