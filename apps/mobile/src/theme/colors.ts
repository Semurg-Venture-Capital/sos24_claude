// Точная палитра из SOS24/sos-system.jsx (SOS_TOKENS).
// Дублируем как JS-константы для мест, где Tailwind-классы не подходят
// (StyleSheet, нативные API, fill-атрибуты react-native-svg, BlurView tint).
export const tokens = {
  pageBg: 'rgb(228,228,228)',
  ink: 'rgb(21,21,21)',
  inkDark: 'rgb(18,18,18)',
  inkMuted: 'rgb(95,94,94)',
  inkSubtle: 'rgb(77,77,77)',
  inkMutedDark: 'rgb(224,224,224)',
  red: 'rgb(230,20,40)',
  redSoft: 'rgba(230,20,40,0.6)',
  green: 'rgb(105,228,183)',
  greenSoft: 'rgba(52,211,153,0.6)',
  yellow: 'rgb(245,200,80)',
  blue: 'rgb(86,140,255)',
  glass: 'rgba(255,255,255,0.5)',
  glassStrong: 'rgba(255,255,255,0.9)',
  glassThin: 'rgba(255,255,255,0.04)',
  hairline: 'rgba(20,20,20,0.08)',
  white: '#FFFFFF',
  black: '#010101',
} as const;

// Сохраняем алиас colors для обратной совместимости со старым кодом скелета,
// в новых файлах используем tokens.* напрямую.
export const colors = tokens;
