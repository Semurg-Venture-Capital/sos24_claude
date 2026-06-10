import { requireNativeView } from 'expo';
import { Platform, View, type ViewProps } from 'react-native';

// Нативный Android Liquid Glass (порт шейдеров Kyant). На iOS — пустой проброс (там системный glass).

export interface LiquidGlassNativeProps extends ViewProps {
  /** Связь с <LiquidGlassBackdrop> того же id (фон, который преломляем). */
  backdropId?: number;
  /** Радиус скругления, dp. */
  cornerRadius?: number;
  /** Высота зоны преломления у края, dp. */
  refractionHeight?: number;
  /** Сила преломления, dp. */
  refractionAmount?: number;
  /** Радиус блюра фона, dp. */
  blurRadius?: number;
  /** Усиление преломления к центру (depth). */
  depthEffect?: boolean;
  /** Непрозрачность блика по краю (0..1). */
  highlightOpacity?: number;
  /** Угол направленного света, градусы. */
  highlightAngle?: number;
  /** Резкость спада блика. */
  highlightFalloff?: number;
}

export interface LiquidGlassBackdropProps extends ViewProps {
  backdropId?: number;
}

const isAndroid = Platform.OS === 'android';

export const LiquidGlassNativeView = (
  isAndroid ? requireNativeView('LiquidGlassNative') : View
) as React.ComponentType<LiquidGlassNativeProps>;

export const LiquidGlassBackdropView = (
  isAndroid ? requireNativeView('LiquidGlassBackdrop') : View
) as React.ComponentType<LiquidGlassBackdropProps>;

/** Доступен ли нативный liquid glass (Android API 33+). */
export const isLiquidGlassSupported = isAndroid && (Platform.Version as number) >= 33;
