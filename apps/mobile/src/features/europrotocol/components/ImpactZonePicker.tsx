import { Pressable, Text, View } from 'react-native';
import Svg, { Defs, Ellipse, G, LinearGradient, Line, Path, Rect, Stop } from 'react-native-svg';
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

// Силуэт авто (вид сверху, перёд — вверх): залитый кузов с лёгким градиентом,
// стёкла, крыша, колёса и зеркала.
function CarTopView() {
  const outline = 'rgba(20,20,20,0.22)';
  const glass = '#cdd6e6';
  const glassStroke = 'rgba(20,20,20,0.12)';
  const wheel = '#33363d';
  return (
    <Svg width={72} height={144} viewBox="0 0 120 240" fill="none">
      <Defs>
        <LinearGradient id="carBody" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="#f4f5f8" />
          <Stop offset="0.5" stopColor="#ffffff" />
          <Stop offset="1" stopColor="#e8eaef" />
        </LinearGradient>
      </Defs>

      {/* Колёса (под кузовом) */}
      <Rect x={12} y={52} width={11} height={30} rx={4} fill={wheel} />
      <Rect x={97} y={52} width={11} height={30} rx={4} fill={wheel} />
      <Rect x={12} y={162} width={11} height={30} rx={4} fill={wheel} />
      <Rect x={97} y={162} width={11} height={30} rx={4} fill={wheel} />

      {/* Зеркала */}
      <Ellipse cx={20} cy={70} rx={6} ry={4} fill="url(#carBody)" stroke={outline} strokeWidth={1} />
      <Ellipse cx={100} cy={70} rx={6} ry={4} fill="url(#carBody)" stroke={outline} strokeWidth={1} />

      {/* Кузов */}
      <Path
        d="M60 10 C48 10 40 14 36 24 L30 42 C25 56 24 70 24 96 L24 156 C24 182 26 196 32 208 C38 222 48 228 60 228 C72 228 82 222 88 208 C94 196 96 182 96 156 L96 96 C96 70 95 56 90 42 L84 24 C80 14 72 10 60 10 Z"
        fill="url(#carBody)"
        stroke={outline}
        strokeWidth={2}
        strokeLinejoin="round"
      />

      {/* Лобовое стекло */}
      <Path d="M38 58 C46 52 74 52 82 58 L86 78 C74 71 46 71 34 78 Z" fill={glass} stroke={glassStroke} strokeWidth={1} strokeLinejoin="round" />
      {/* Крыша */}
      <Rect x={35} y={82} width={50} height={70} rx={8} fill="#eef0f4" stroke={glassStroke} strokeWidth={1} />
      {/* Заднее стекло */}
      <Path d="M34 158 C46 165 74 165 86 158 L82 176 C74 170 46 170 38 176 Z" fill={glass} stroke={glassStroke} strokeWidth={1} strokeLinejoin="round" />

      {/* Боковые стёкла */}
      <Path d="M37 86 L37 148" stroke={glassStroke} strokeWidth={1} />
      <Path d="M83 86 L83 148" stroke={glassStroke} strokeWidth={1} />

      {/* Капот и багажник — тонкие линии */}
      <Line x1={44} y1={30} x2={76} y2={30} stroke={outline} strokeWidth={1.2} strokeLinecap="round" />
      <Line x1={42} y1={210} x2={78} y2={210} stroke={outline} strokeWidth={1.2} strokeLinecap="round" />
    </Svg>
  );
}
