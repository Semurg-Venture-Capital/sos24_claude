import { useTranslation } from 'react-i18next';
import { Image, Pressable, Text, View } from 'react-native';
import { tokens } from '../../../theme/colors';

// Интерактивный выбор повреждённых деталей (европротокол, шаг 3).
// Фон — «развёртка» авто (assets/euro/auto-parts.jpg), поверх — 17 тап-маркеров
// по координатам «+» на картинке. Мультивыбор, выбранное — красным.
// Итог складывается текстом в описание повреждений (свободное поле → PDF).

const IMG = require('../../../../assets/euro/auto-parts.jpg');
const IMG_RATIO = 891 / 1280;

interface Part {
  code: string;
  label: string;
  x: number; // % ширины
  y: number; // % высоты
}

// Позиции детектированы по «+» на картинке (см. auto-parts.jpg).
export const DAMAGE_PARTS: Part[] = [
  { code: 'front-bumper', label: 'Передний бампер', x: 50.6, y: 2.0 },
  { code: 'hood', label: 'Капот', x: 50.6, y: 15.7 },
  { code: 'front-left-fender', label: 'Переднее левое крыло', x: 20.5, y: 21.7 },
  { code: 'front-right-fender', label: 'Переднее правое крыло', x: 80.7, y: 21.7 },
  { code: 'windshield', label: 'Лобовое стекло', x: 50.5, y: 30.8 },
  { code: 'front-left-door', label: 'Передняя левая дверь', x: 15.7, y: 39.4 },
  { code: 'front-right-door', label: 'Передняя правая дверь', x: 85.5, y: 39.4 },
  { code: 'left-mirror', label: 'Левое зеркало', x: 7.1, y: 44.9 },
  { code: 'right-mirror', label: 'Правое зеркало', x: 94.0, y: 44.9 },
  { code: 'roof', label: 'Крыша', x: 50.6, y: 52.3 },
  { code: 'rear-left-door', label: 'Задняя левая дверь', x: 15.7, y: 55.8 },
  { code: 'rear-right-door', label: 'Задняя правая дверь', x: 85.5, y: 55.8 },
  { code: 'rear-window', label: 'Заднее стекло', x: 50.6, y: 71.2 },
  { code: 'rear-left-fender', label: 'Заднее левое крыло', x: 21.5, y: 76.2 },
  { code: 'rear-right-fender', label: 'Заднее правое крыло', x: 79.6, y: 76.2 },
  { code: 'trunk', label: 'Крышка багажника', x: 50.5, y: 79.2 },
  { code: 'rear-bumper', label: 'Задний бампер', x: 50.5, y: 90.2 },
];

const LABEL_BY_CODE: Record<string, string> = Object.fromEntries(DAMAGE_PARTS.map((p) => [p.code, p.label]));

// Читаемый текст выбранных деталей (в порядке диаграммы).
export function damagePartsText(codes: string[]): string {
  return DAMAGE_PARTS.filter((p) => codes.includes(p.code))
    .map((p) => p.label)
    .join(', ');
}

const MARKER = 34;

export function DamagePartsPicker({
  label,
  value,
  onChange,
}: {
  label?: string;
  value: string[];
  onChange: (next: string[]) => void;
}) {
  const { t } = useTranslation();
  const toggle = (code: string) =>
    onChange(value.includes(code) ? value.filter((c) => c !== code) : [...value, code]);
  // Читаемая (локализованная) сводка выбранных деталей — в порядке диаграммы.
  const selectedText = DAMAGE_PARTS.filter((p) => value.includes(p.code))
    .map((p) => t('euroDocs.map.part.' + p.code))
    .join(', ');

  return (
    <View style={{ gap: 8 }}>
      {label ? (
        <Text style={{ fontFamily: 'Manrope_500Medium', fontSize: 12.5, color: tokens.inkMuted, paddingLeft: 2 }}>{label}</Text>
      ) : null}
      <View
        style={{
          width: '100%',
          aspectRatio: IMG_RATIO,
          borderWidth: 1,
          borderColor: tokens.hairline,
          borderRadius: 16,
          overflow: 'hidden',
          backgroundColor: '#fff',
        }}
      >
        <Image source={IMG} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
        {DAMAGE_PARTS.map((p) => {
          const active = value.includes(p.code);
          return (
            <Pressable
              key={p.code}
              onPress={() => toggle(p.code)}
              hitSlop={6}
              style={{
                position: 'absolute',
                left: `${p.x}%`,
                top: `${p.y}%`,
                width: MARKER,
                height: MARKER,
                marginLeft: -MARKER / 2,
                marginTop: -MARKER / 2,
                borderRadius: 999,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: active ? tokens.red : 'transparent',
              }}
            >
              {active ? (
                <Text style={{ fontFamily: 'Manrope_700Bold', fontSize: 18, color: '#fff', lineHeight: 20 }}>✓</Text>
              ) : null}
            </Pressable>
          );
        })}
      </View>
      <Text style={{ fontFamily: 'Manrope_500Medium', fontSize: 12.5, color: value.length ? tokens.inkDark : tokens.inkSubtle, paddingLeft: 2 }}>
        {value.length ? t('euroDocs.parts.summary', { list: selectedText }) : t('euroDocs.parts.empty')}
      </Text>
    </View>
  );
}

export { LABEL_BY_CODE };
