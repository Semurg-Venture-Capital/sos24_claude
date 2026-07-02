import type { ViewStyle } from 'react-native';
import { tokens } from '../../../theme/colors';

// Базовый «liquid-glass» фон медкарточек M14: полупрозрачный белый + hairline-обводка.
// В вебе дизайна это `background: glass` + `inset 0 0 0 1px hairline`;
// в RN box-shadow inset нет — используем borderWidth/borderColor.
export const medGlass: ViewStyle = {
  backgroundColor: tokens.glass,
  borderWidth: 1,
  borderColor: tokens.hairline,
};
