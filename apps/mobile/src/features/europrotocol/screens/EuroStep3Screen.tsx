import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Pressable, Text, TextInput, View } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import { Glass } from '../../../components/ui/Glass';
import { ScreenHeading } from '../../../components/ui/ScreenHeading';
import { WizardFrame } from '../../../components/ui/WizardFrame';
import { tokens } from '../../../theme/colors';
import { EURO_CIRCUMSTANCES } from '../circumstances';
import { FieldInput, SectionLabel, Segmented, YesNoToggle, ZoneSelect } from '../components/EuroFields';
import { useEuroStore, type SchemeType } from '../store';
import type { EuroStackParamList } from '../../../navigation/types';

type Nav = NativeStackNavigationProp<EuroStackParamList, 'EuroStep3'>;

const SCHEMES: { key: SchemeType; label: string; Illu: (p: { color: string }) => React.ReactElement }[] = [
  { key: 'rear', label: 'Наезд сзади', Illu: SchemeRear },
  { key: 'front', label: 'Лобовое', Illu: SchemeFront },
  { key: 'side', label: 'Боковое', Illu: SchemeSide },
];

// M9.3 шаг 3 — схема столкновения (шаблон) + описание обстоятельств своими словами.
export function EuroStep3Screen() {
  const nav = useNavigation<Nav>();
  const s = useEuroStore();
  const { schemeType, description, setScheme, setDescription, patch, toggleCircumstance } = s;

  return (
    <WizardFrame
      step={3}
      total={5}
      eyebrow="Шаг 3 из 5 · Схема"
      primary="Далее"
      primaryEnabled={!!schemeType && !!s.driverRole && s.canMove !== null}
      primaryAction={() => nav.navigate('EuroStep4')}
      onBack={() => nav.goBack()}
    >
      <ScreenHeading title="Схема столкновения" subtitle="Выберите подходящий шаблон и опишите, как произошло ДТП" />

      <View style={{ flexDirection: 'row', gap: 10 }}>
        {SCHEMES.map((it) => (
          <SchemeOption
            key={it.key}
            label={it.label}
            selected={schemeType === it.key}
            onPress={() => setScheme(it.key)}
            Illu={it.Illu}
          />
        ))}
      </View>

      <View style={{ gap: 10, marginTop: 4 }}>
        <Text style={{ fontFamily: 'Manrope_500Medium', fontSize: 13, color: tokens.inkMuted, letterSpacing: -0.07 }}>
          Описание обстоятельств
        </Text>
        <View style={{ borderRadius: 20, overflow: 'hidden' }}>
          <Glass intensity={20} tint="light" style={{ backgroundColor: 'rgba(255,255,255,0.5)' }}>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Опишите, как произошло ДТП: направление движения, кто кого ударил, погодные условия…"
              placeholderTextColor="rgba(20,20,20,0.4)"
              multiline
              style={{
                minHeight: 120,
                padding: 16,
                textAlignVertical: 'top',
                borderRadius: 20,
                borderWidth: 1,
                borderColor: tokens.hairline,
                fontFamily: 'Manrope_500Medium',
                fontSize: 15,
                lineHeight: 21,
                color: tokens.inkDark,
              }}
            />
          </Glass>
        </View>
        <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 12, color: tokens.inkSubtle, lineHeight: 17, paddingLeft: 4 }}>
          Текст войдёт в извещение о ДТП. Чем точнее — тем быстрее рассмотрят выплату.
        </Text>
      </View>

      {/* Обстоятельства ДТП (22 пункта) — отметьте для А (вы) и В (второй) */}
      <View style={{ gap: 8, marginTop: 4 }}>
        <SectionLabel>Обстоятельства ДТП</SectionLabel>
        <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 12, color: tokens.inkSubtle, lineHeight: 16, paddingLeft: 2 }}>
          Отметьте подходящие пункты для «А» (вы) и «В» (второй участник).
        </Text>
        <View style={{ borderRadius: 16, borderWidth: 1, borderColor: tokens.hairline, overflow: 'hidden' }}>
          {EURO_CIRCUMSTANCES.map((text, i) => (
            <CircumstanceRow
              key={i}
              index={i}
              text={text}
              a={!!s.circumstancesA[i]}
              b={!!s.circumstancesB[i]}
              onToggleA={() => toggleCircumstance('a', i)}
              onToggleB={() => toggleCircumstance('b', i)}
              last={i === EURO_CIRCUMSTANCES.length - 1}
            />
          ))}
        </View>
      </View>

      {/* Зона первого удара */}
      <View style={{ gap: 12, marginTop: 4 }}>
        <SectionLabel>Зона первого удара</SectionLabel>
        <ZoneSelect label="Ваше авто (А)" value={s.impactZoneA} onChange={(v) => patch({ impactZoneA: v })} />
        <ZoneSelect label="Авто «В»" value={s.impactZoneB} onChange={(v) => patch({ impactZoneB: v })} />
      </View>

      {/* Повреждения и возражения */}
      <View style={{ gap: 12, marginTop: 4 }}>
        <SectionLabel>Повреждения и возражения</SectionLabel>
        <FieldInput label="Повреждения вашего авто (А)" value={s.damageDescA} onChangeText={(v) => patch({ damageDescA: v })} placeholder="Передний бампер, правая фара…" multiline maxLength={1000} />
        <FieldInput label="Повреждения авто «В»" value={s.damageDescB} onChangeText={(v) => patch({ damageDescB: v })} placeholder="Задний бампер, левая дверь…" multiline maxLength={1000} />
        <FieldInput label="Возражения (А) — если есть" value={s.objectionsA} onChangeText={(v) => patch({ objectionsA: v })} placeholder="Возражения, если есть…" maxLength={1000} />
        <FieldInput label="Возражения (В) — если есть" value={s.objectionsB} onChangeText={(v) => patch({ objectionsB: v })} placeholder="Возражения, если есть…" maxLength={1000} />
      </View>

      {/* Оборот бланка */}
      <View style={{ gap: 12, marginTop: 4 }}>
        <SectionLabel>Дополнительно (оборотная сторона)</SectionLabel>
        <Segmented
          label="Кто управлял вашим ТС?"
          value={s.driverRole}
          options={[
            { key: 'owner', label: 'Я — владелец' },
            { key: 'other', label: 'По доверенности' },
          ]}
          onChange={(v) => patch({ driverRole: v })}
        />
        {s.driverRole === 'other' ? (
          <FieldInput
            label="Документ о праве владения (доверенность/договор)"
            value={s.ownershipDocA}
            onChangeText={(v) => patch({ ownershipDocA: v })}
            placeholder="Серия/номер доверенности или договора"
            maxLength={200}
          />
        ) : null}
        <YesNoToggle
          label="ТС может двигаться самостоятельно?"
          value={s.canMove}
          onChange={(v) =>
            // При «Нет» местоположение ТС = адрес ДТП с шага 1 (GPS), отдельно не спрашиваем.
            patch(v === false ? { canMove: v, cannotMovePlace: s.place } : { canMove: v, cannotMovePlace: '' })
          }
        />
        {s.canMove === false ? (
          <View style={{ gap: 6, padding: 14, borderRadius: 16, borderWidth: 1, borderColor: tokens.hairline, backgroundColor: 'rgba(255,255,255,0.4)' }}>
            <Text style={{ fontFamily: 'Manrope_500Medium', fontSize: 12, color: tokens.inkMuted }}>Местоположение ТС (с шага 1, GPS)</Text>
            <Text style={{ fontFamily: 'Manrope_600SemiBold', fontSize: 14, lineHeight: 19, color: tokens.inkDark }}>
              {s.place || 'Адрес не определён на шаге 1'}
            </Text>
          </View>
        ) : null}
        <FieldInput label="Замечания (Изоҳ)" value={s.remarks} onChangeText={(v) => patch({ remarks: v })} placeholder="Доп. замечания…" multiline maxLength={2000} />
      </View>
    </WizardFrame>
  );
}

// Строка обстоятельства: текст + переключатели «А» и «В».
function CircumstanceRow({
  index,
  text,
  a,
  b,
  onToggleA,
  onToggleB,
  last,
}: {
  index: number;
  text: string;
  a: boolean;
  b: boolean;
  onToggleA: () => void;
  onToggleB: () => void;
  last: boolean;
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 8,
        paddingHorizontal: 10,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: tokens.hairline,
        backgroundColor: 'rgba(255,255,255,0.4)',
      }}
    >
      <Text style={{ width: 18, fontFamily: 'Manrope_600SemiBold', fontSize: 11, color: tokens.inkSubtle }}>{index + 1}</Text>
      <SideBox label="А" active={a} onPress={onToggleA} />
      <Text style={{ flex: 1, fontFamily: 'Manrope_500Medium', fontSize: 11.5, lineHeight: 15, color: tokens.inkDark }}>{text}</Text>
      <SideBox label="В" active={b} onPress={onToggleB} />
    </View>
  );
}

function SideBox({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        width: 30,
        height: 30,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: active ? tokens.red : 'rgba(20,20,20,0.05)',
        borderWidth: 1,
        borderColor: active ? tokens.red : tokens.hairline,
      }}
    >
      <Text style={{ fontFamily: 'Manrope_700Bold', fontSize: 12, color: active ? '#fff' : tokens.inkMuted }}>{label}</Text>
    </Pressable>
  );
}

function SchemeOption({
  label,
  selected,
  onPress,
  Illu,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  Illu: (p: { color: string }) => React.ReactElement;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flex: 1,
        borderRadius: 18,
        padding: 12,
        gap: 8,
        alignItems: 'center',
        backgroundColor: selected ? tokens.inkDark : 'rgba(255,255,255,0.55)',
        borderWidth: 1,
        borderColor: selected ? tokens.inkDark : tokens.hairline,
        opacity: pressed ? 0.8 : 1,
      })}
    >
      <View style={{ height: 44, alignItems: 'center', justifyContent: 'center' }}>
        <Illu color={selected ? '#fff' : tokens.inkDark} />
      </View>
      <Text
        style={{
          fontFamily: 'Manrope_500Medium',
          fontSize: 11,
          color: selected ? '#fff' : tokens.inkDark,
          textAlign: 'center',
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

// Мини-иллюстрации схем. Цвет контура передаётся снаружи (белый на выбранной тёмной
// плашке, тёмный — на светлой). Красный акцент удара виден на обоих фонах.
function SchemeRear({ color }: { color: string }) {
  return (
    <Svg width={60} height={40} viewBox="0 0 60 40" fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <Rect x={6} y={14} width={22} height={14} rx={3} />
      <Rect x={32} y={14} width={22} height={14} rx={3} />
      <Path d="M30 18l-2 3 2 3" stroke={tokens.red} strokeWidth={2} />
    </Svg>
  );
}
function SchemeFront({ color }: { color: string }) {
  return (
    <Svg width={60} height={40} viewBox="0 0 60 40" fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <Rect x={6} y={14} width={22} height={14} rx={3} />
      <Rect x={32} y={14} width={22} height={14} rx={3} />
      <Path d="M28 21h4" stroke={tokens.red} strokeWidth={2.5} />
    </Svg>
  );
}
function SchemeSide({ color }: { color: string }) {
  return (
    <Svg width={40} height={44} viewBox="0 0 40 44" fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <Rect x={10} y={4} width={20} height={14} rx={3} />
      <Rect x={10} y={26} width={20} height={14} rx={3} />
      <Path d="M20 20v4" stroke={tokens.red} strokeWidth={2.5} />
    </Svg>
  );
}
