import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import { useEffect, useRef } from 'react';
import { Animated, type LayoutChangeEvent, Pressable, ScrollView, Text, View } from 'react-native';
import { tokens } from '../../../theme/colors';

// Фильтр-чипы в стиле Telegram (iOS 26): белый фиксированный контейнер держится
// в поле зрения; чипы (чёрный текст) скроллятся внутри; светло-серая пилюля
// выделения перетекает под активный чип (пружиной, встроенным RN Animated).
// Пилюля — нативное <GlassView isInteractive> (реагирует на касание жидким морфингом).
// ⚠️ Никакой анимации opacity (ломает Liquid Glass); isInteractive статичный.

export interface ChipItem {
  key: string;
  label: string;
}

const LIQUID = isLiquidGlassAvailable();
const PAD_V = 8; // вертикальный отступ текста внутри чипа
const PAD_H = 18; // горизонтальный
const INSET = 5; // отступ пилюли от краёв белого контейнера

export function LiquidGlassChips({
  items,
  selectedKey,
  onSelect,
}: {
  items: ChipItem[];
  selectedKey: string;
  onSelect: (key: string) => void;
}) {
  const layouts = useRef<Record<string, { x: number; w: number }>>({});
  const dropX = useRef(new Animated.Value(0)).current;
  const dropW = useRef(new Animated.Value(0)).current;
  const positioned = useRef(false);

  const moveTo = (key: string, animate: boolean) => {
    const l = layouts.current[key];
    if (!l) return;
    if (animate) {
      Animated.parallel([
        Animated.spring(dropX, { toValue: l.x, useNativeDriver: false, friction: 8, tension: 90 }),
        Animated.spring(dropW, { toValue: l.w, useNativeDriver: false, friction: 8, tension: 90 }),
      ]).start();
    } else {
      dropX.setValue(l.x);
      dropW.setValue(l.w);
    }
  };

  const onChipLayout = (key: string) => (e: LayoutChangeEvent) => {
    const { x, width } = e.nativeEvent.layout;
    layouts.current[key] = { x, w: width };
    if (key === selectedKey) {
      moveTo(key, positioned.current);
      positioned.current = true;
    }
  };

  useEffect(() => {
    if (positioned.current) moveTo(selectedKey, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedKey]);

  // Фолбэк (iOS < 26 / Android): пилюля выделения — обычная серая View.
  const DropInner = LIQUID ? (
    <GlassView glassEffectStyle="regular" isInteractive tintColor="rgba(118,118,128,0.12)" style={{ flex: 1, borderRadius: 999 }} />
  ) : (
    <View style={{ flex: 1, borderRadius: 999, backgroundColor: '#ECECEC' }} />
  );

  return (
    <View style={{ marginHorizontal: 24, marginTop: 14 }}>
      {/* Внешняя белая рамка — фиксирована, с мягкой тенью. */}
      <View
        style={{
          borderRadius: 22,
          backgroundColor: '#FFFFFF',
          shadowColor: '#000',
          shadowOpacity: 0.06,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: 4 },
        }}
      >
        {/* Клип для скролла + внутренний отступ (пилюля инсетится). */}
        <View style={{ borderRadius: 22, overflow: 'hidden', padding: INSET }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ position: 'relative', flexDirection: 'row', alignItems: 'stretch' }}>
              {/* Пилюля выделения — позади текста, переезжает под активный чип. */}
              <Animated.View
                pointerEvents="none"
                style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: dropW, transform: [{ translateX: dropX }] }}
              >
                {DropInner}
              </Animated.View>

              {items.map((it) => {
                const active = it.key === selectedKey;
                return (
                  <Pressable
                    key={it.key}
                    onPress={() => onSelect(it.key)}
                    onLayout={onChipLayout(it.key)}
                    style={{ paddingVertical: PAD_V, paddingHorizontal: PAD_H, justifyContent: 'center' }}
                  >
                    <Text
                      numberOfLines={1}
                      style={{ fontFamily: active ? 'Manrope_700Bold' : 'Manrope_600SemiBold', fontSize: 14, color: tokens.ink }}
                    >
                      {it.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
        </View>
      </View>
    </View>
  );
}
