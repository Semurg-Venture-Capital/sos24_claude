import { View } from 'react-native';
import Svg, { G, Path, Rect, Text as SvgText } from 'react-native-svg';

// Иконка машины «вид сверху» для схемы ДТП. side='A' — красная (вы), 'B' — тёмная.
// Нос машины направлен ВВЕРХ (поворот задаётся снаружи через rotate).
export function CarTop({ side, size = 56 }: { side: 'A' | 'B'; size?: number }) {
  const body = side === 'A' ? '#E61428' : '#1f2430';
  const glass = side === 'A' ? '#ffd2d7' : '#9aa3b2';
  const w = size * 0.62;
  const h = size;
  return (
    <View style={{ width: w, height: h, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={w} height={h} viewBox="0 0 38 60">
        <G>
          {/* кузов */}
          <Rect x={4} y={2} width={30} height={56} rx={9} fill={body} />
          {/* лобовое + заднее стекло */}
          <Path d="M9 12 H29 L26 20 H12 Z" fill={glass} />
          <Path d="M12 44 H26 L29 52 H9 Z" fill={glass} />
          {/* крыша */}
          <Rect x={11} y={22} width={16} height={20} rx={3} fill={glass} opacity={0.55} />
          {/* метка стороны */}
          <SvgText x={19} y={36} fontSize={11} fontWeight="bold" fill="#ffffff" textAnchor="middle">
            {side}
          </SvgText>
        </G>
      </Svg>
    </View>
  );
}
