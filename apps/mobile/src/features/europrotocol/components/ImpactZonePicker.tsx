import { Pressable, Text, View } from 'react-native';
import Svg, { G, Path, Line } from 'react-native-svg';
import { tokens } from '../../../theme/colors';

// Интерактивный выбор зоны первого удара (европротокол, шаг 3).
// Силуэт авто сверху + 8 тап-зон по периметру (совпадают с кодами НАПП/PDF).
// Выбранная зона подсвечивается красным, стрелка указывает внутрь — к авто.

export type ImpactZone =
  | 'front-left'
  | 'front'
  | 'front-right'
  | 'left'
  | 'right'
  | 'rear-left'
  | 'rear'
  | 'rear-right';

// Русские метки зон (для текстовой сводки под схемой).
export const ZONE_LABEL_RU: Record<string, string> = {
  front: 'перёд',
  rear: 'зад',
  left: 'левая сторона',
  right: 'правая сторона',
  'front-left': 'перёд-слева',
  'front-right': 'перёд-справа',
  'rear-left': 'зад-слева',
  'rear-right': 'зад-справа',
};

// Порядок для читабельной сводки.
const ZONE_ORDER: ImpactZone[] = ['front-left', 'front', 'front-right', 'left', 'right', 'rear-left', 'rear', 'rear-right'];

export function zonesText(codes: string[]): string {
  return ZONE_ORDER.filter((z) => codes.includes(z))
    .map((z) => ZONE_LABEL_RU[z])
    .join(', ');
}

// Угол стрелки «внутрь» (0° = вверх), по позиции ячейки вокруг авто.
const INWARD_ANGLE: Record<ImpactZone, number> = {
  'front-left': 135,
  front: 180,
  'front-right': 225,
  left: 90,
  right: 270,
  'rear-left': 45,
  rear: 0,
  'rear-right': 315,
};

const EDGE_H = 52; // высота верх/низ рядов
const MID_H = 148; // высота среднего ряда (авто)

export function ImpactZonePicker({
  label,
  value,
  onChange,
}: {
  label?: string;
  value: string[];
  onChange: (next: string[]) => void;
}) {
  const toggle = (zone: ImpactZone) =>
    onChange(value.includes(zone) ? value.filter((z) => z !== zone) : [...value, zone]);
  const cell = (zone: ImpactZone) => <ZoneCell zone={zone} active={value.includes(zone)} onPress={() => toggle(zone)} />;

  return (
    <View style={{ gap: 8 }}>
      {label ? (
        <Text style={{ fontFamily: 'Manrope_500Medium', fontSize: 12.5, color: tokens.inkMuted, paddingLeft: 2 }}>{label}</Text>
      ) : null}
      <View
        style={{
          borderWidth: 1,
          borderColor: tokens.hairline,
          borderRadius: 16,
          overflow: 'hidden',
          backgroundColor: 'rgba(255,255,255,0.5)',
        }}
      >
        {/* Верхний ряд — перёд */}
        <View style={{ flexDirection: 'row', height: EDGE_H }}>
          {cell('front-left')}
          {cell('front')}
          {cell('front-right')}
        </View>
        {/* Средний ряд — бока + авто */}
        <View style={{ flexDirection: 'row', height: MID_H }}>
          {cell('left')}
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', borderLeftWidth: 1, borderRightWidth: 1, borderColor: tokens.hairline }}>
            <CarTopView />
          </View>
          {cell('right')}
        </View>
        {/* Нижний ряд — зад */}
        <View style={{ flexDirection: 'row', height: EDGE_H }}>
          {cell('rear-left')}
          {cell('rear')}
          {cell('rear-right')}
        </View>
      </View>
      {/* Текстовая сводка выбранных зон */}
      <Text style={{ fontFamily: 'Manrope_500Medium', fontSize: 12.5, color: value.length ? tokens.inkDark : tokens.inkSubtle, paddingLeft: 2 }}>
        {value.length ? `Удар: ${zonesText(value)}` : 'Зона не выбрана'}
      </Text>
    </View>
  );
}

function ZoneCell({ zone, active, onPress }: { zone: ImpactZone; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: active ? tokens.red : pressed ? 'rgba(230,20,40,0.06)' : 'transparent',
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: tokens.hairline,
      })}
    >
      <InwardArrow angle={INWARD_ANGLE[zone]} color={active ? '#fff' : 'rgba(20,20,20,0.4)'} />
    </Pressable>
  );
}

// Стрелка, указывающая внутрь (к авто). angle=0 — вверх, по часовой.
function InwardArrow({ angle, color }: { angle: number; color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24">
      <G rotation={angle} originX={12} originY={12}>
        <Line x1={12} y1={19} x2={12} y2={5} stroke={color} strokeWidth={1.8} strokeLinecap="round" />
        <Path d="M7 10 L12 5 L17 10" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      </G>
    </Svg>
  );
}

// Силуэт авто (вид сверху, перёд — вверх). Линейный, как в референсе.
function CarTopView() {
  const stroke = 'rgba(20,20,20,0.35)';
  return (
    <Svg width={62} height={128} viewBox="0 0 62 128" fill="none">
      {/* Кузов */}
      <Path
        d="M31 4 C22 4 17 7 15 12 L11 24 C8 33 8 40 8 52 L8 82 C8 96 9 108 12 114 C15 120 22 124 31 124 C40 124 47 120 50 114 C53 108 54 96 54 82 L54 52 C54 40 54 33 51 24 L47 12 C45 7 40 4 31 4 Z"
        stroke={stroke}
        strokeWidth={1.6}
      />
      {/* Лобовое стекло */}
      <Path d="M17 40 C22 35 40 35 45 40 L48 52 C40 48 22 48 14 52 Z" stroke={stroke} strokeWidth={1.3} />
      {/* Крыша */}
      <Path d="M15 54 L47 54 L47 84 L15 84 Z" stroke={stroke} strokeWidth={1.3} />
      {/* Заднее стекло */}
      <Path d="M15 86 C22 90 40 90 47 86 L44 98 C40 95 22 95 18 98 Z" stroke={stroke} strokeWidth={1.3} />
      {/* Зеркала */}
      <Line x1={8} y1={46} x2={3} y2={44} stroke={stroke} strokeWidth={1.4} strokeLinecap="round" />
      <Line x1={54} y1={46} x2={59} y2={44} stroke={stroke} strokeWidth={1.4} strokeLinecap="round" />
    </Svg>
  );
}
