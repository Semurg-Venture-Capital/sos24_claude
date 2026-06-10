import { BlurView, type BlurViewProps } from 'expo-blur';
import type { RefObject } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

// <Glass> — кросс-платформенная «стеклянная» поверхность (Liquid Glass).
// Drop-in замена expo-blur <BlurView>: пропы те же (intensity, tint, style, children).
//
//  • iOS     — нативный BlurView 1:1 как раньше (на iOS 26+ системный Liquid Glass). Вид НЕ меняется.
//  • Android — два режима:
//      ─ если передан blurTarget (ref на <BlurTargetView>) → НАСТОЯЩИЙ фоновый блюр
//        через blurMethod="dimezisBlurViewSdk31Plus" (SDK 55 API). Используется для
//        нижнего таб-бара, где под поверхностью реально скроллится контент.
//      ─ иначе → аккуратный faux-glass (полупрозрачный фрост-оверлей поверх фона
//        компонента). Над плоским фоном экранов выглядит как матовое стекло,
//        работает всегда и без затрат GPU. Чинит «сломанный» вид карточек.
//
// Почему так: на Android реальный блюр (SDK 55) требует обёртки фона в <BlurTargetView>
// и виден только над неоднородным контентом. Над flat-фоном faux визуально не отличим.

const ANDROID_BLUR_MULTIPLIER = 3.2;
const ANDROID_MAX_INTENSITY = 100;
// Доп. матовость для faux-режима (поверх фона компонента).
const FAUX_FROST = 'rgba(255,255,255,0.4)';

export interface GlassProps extends BlurViewProps {
  // Android: ref на <BlurTargetView> для настоящего фонового блюра.
  blurTarget?: RefObject<View | null>;
}

export function Glass({ intensity = 20, tint = 'light', style, children, blurTarget, ...rest }: GlassProps) {
  if (Platform.OS === 'android') {
    // Настоящий блюр — только когда есть цель захвата фона (таб-бар, оверлеи).
    if (blurTarget) {
      return (
        <BlurView
          intensity={Math.min(ANDROID_MAX_INTENSITY, Math.round(intensity * ANDROID_BLUR_MULTIPLIER))}
          tint={tint}
          blurMethod="dimezisBlurViewSdk31Plus"
          blurTarget={blurTarget}
          style={style}
          {...rest}
        >
          {children}
        </BlurView>
      );
    }
    // Faux-glass: фон компонента + матовый оверлей для «стеклянной» глубины.
    return (
      <View style={style} {...rest}>
        <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: FAUX_FROST }]} />
        {children}
      </View>
    );
  }

  // iOS / web — как было.
  return (
    <BlurView intensity={intensity} tint={tint} style={style} {...rest}>
      {children}
    </BlurView>
  );
}
