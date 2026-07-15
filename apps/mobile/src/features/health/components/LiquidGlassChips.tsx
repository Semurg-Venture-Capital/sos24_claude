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
  // Анимируем ЛЕВЫЙ и ПРАВЫЙ край пилюли раздельно: ведущий край быстрее, задний
  // отстаёт → в полёте пилюля растягивается «каплей», затем стягивается (эффект Telegram).
  const edgeL = useRef(new Animated.Value(0)).current;
  const edgeR = useRef(new Animated.Value(0)).current;
  const dropW = useRef(Animated.subtract(edgeR, edgeL)).current;
  const last = useRef({ L: 0, R: 0 });
  const lastKey = useRef<string | null>(null);
  const positioned = useRef(false);

  const moveTo = (key: string, animate: boolean) => {
    const l = layouts.current[key];
    if (!l) return;
    lastKey.current = key;
    const toL = l.x;
    const toR = l.x + l.w;
    if (!animate) {
      edgeL.setValue(toL);
      edgeR.setValue(toR);
      last.current = { L: toL, R: toR };
      return;
    }
    const movingRight = toL >= last.current.L;
    const lead = { friction: 13, tension: 130 }; // ведущий край — снапом
    const trail = { friction: 11, tension: 55 }; // задний — отстаёт (растяжение)
    Animated.parallel([
      Animated.spring(edgeL, { toValue: toL, useNativeDriver: false, ...(movingRight ? trail : lead) }),
      Animated.spring(edgeR, { toValue: toR, useNativeDriver: false, ...(movingRight ? lead : trail) }),
    ]).start();
    last.current = { L: toL, R: toR };
  };

  const onChipLayout = (key: string) => (e: LayoutChangeEvent) => {
    const { x, width } = e.nativeEvent.layout;
    layouts.current[key] = { x, w: width };
    if (key === selectedKey) {
      moveTo(key, positioned.current);
      positioned.current = true;
    }
  };

  // Внешняя смена выбранного (GPS-автообласть и т.п.) — тоже плавно.
  // Тап анимируется сразу в onPress, поэтому здесь дедупим по lastKey.
  useEffect(() => {
    if (positioned.current && selectedKey !== lastKey.current) moveTo(selectedKey, true);
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
                style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: dropW, transform: [{ translateX: edgeL }] }}
              >
                {DropInner}
              </Animated.View>

              {items.map((it) => {
                const active = it.key === selectedKey;
                return (
                  <Pressable
                    key={it.key}
                    onPress={() => {
                      moveTo(it.key, true); // пилюля едет СРАЗУ, не ожидая ре-рендера от запроса
                      onSelect(it.key);
                    }}
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
