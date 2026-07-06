import { Image, Pressable, Text, View } from 'react-native';
import Svg, { G, Line, Path } from 'react-native-svg';
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

// Силуэт авто (вид сверху) — чистая схема-картинка (assets/euro/car-top.png).
function CarTopView() {
  return (
    <Image
      source={require('../../../../assets/euro/car-top.png')}
      style={{ width: '100%', height: '92%' }}
      resizeMode="contain"
    />
  );
}
