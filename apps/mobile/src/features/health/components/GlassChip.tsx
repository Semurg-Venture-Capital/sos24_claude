import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import { Pressable, Text, View } from 'react-native';
import { Glass } from '../../../components/ui/Glass';
import { tokens } from '../../../theme/colors';

// Фильтр-чип в стиле Liquid Glass (M14).
//  • iOS 26 — нативный <GlassView> (UIGlassEffect), как «телеграмные» чипы:
//    неактивный — чистое стекло, активный — тёмное tinted-glass.
//  • Старее / Android — фолбэк на expo-blur <Glass> (матовое стекло).
// Скругление + overflow — на самом GlassView (иначе glass рендерится
// прямоугольником и обрезается родителем). Внешний wrapper — тень для глубины.
const LIQUID = isLiquidGlassAvailable();

export function GlassChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  const text = (
    <Text
      numberOfLines={1}
      style={{ fontFamily: 'Manrope_600SemiBold', fontSize: 13, color: active ? '#fff' : tokens.inkDark }}
    >
      {label}
    </Text>
  );

  if (LIQUID) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => ({
          alignSelf: 'flex-start',
          borderRadius: 999,
          shadowColor: 'rgb(180,180,180)',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.14,
          shadowRadius: 6,
          opacity: pressed ? 0.9 : 1,
        })}
      >
        <GlassView
          glassEffectStyle="regular"
          isInteractive
          tintColor={active ? tokens.inkDark : undefined}
          style={{ borderRadius: 999, overflow: 'hidden', paddingVertical: 9, paddingHorizontal: 16 }}
        >
          {text}
        </GlassView>
      </Pressable>
    );
  }

  // Фолбэк (iOS < 26 / Android): матовое стекло на expo-blur.
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        alignSelf: 'flex-start',
        borderRadius: 999,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: active ? 'transparent' : tokens.hairline,
        opacity: pressed ? 0.85 : 1,
      })}
    >
      {active ? (
        <View style={{ paddingVertical: 9, paddingHorizontal: 16, backgroundColor: tokens.inkDark }}>{text}</View>
      ) : (
        <Glass
          intensity={24}
          tint="light"
          style={{ paddingVertical: 9, paddingHorizontal: 16, backgroundColor: 'rgba(255,255,255,0.35)' }}
        >
          {text}
        </Glass>
      )}
    </Pressable>
  );
}
