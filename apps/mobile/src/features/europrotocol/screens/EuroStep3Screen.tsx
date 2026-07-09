import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Image, Pressable, Text, TextInput, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { IconPencil } from '../../../components/icons/LineIcons';
import { Glass } from '../../../components/ui/Glass';
import { ScreenHeading } from '../../../components/ui/ScreenHeading';
import { WizardFrame } from '../../../components/ui/WizardFrame';
import { tokens } from '../../../theme/colors';
import { EURO_CIRCUMSTANCES } from '../circumstances';
import { FieldInput, SectionLabel, Segmented, YesNoToggle } from '../components/EuroFields';
import { ImpactZonePicker } from '../components/ImpactZonePicker';
import { DamagePartsPicker } from '../components/DamagePartsPicker';
import { VoiceRemarks } from '../components/VoiceRemarks';
import { useEuroStore } from '../store';
import type { EuroStackParamList } from '../../../navigation/types';

type Nav = NativeStackNavigationProp<EuroStackParamList, 'EuroStep3'>;

// M9.3 шаг 3 — схема ДТП на карте (машины + точка удара) + описание обстоятельств.
export function EuroStep3Screen() {
  const nav = useNavigation<Nav>();
  const s = useEuroStore();
  const { description, setDescription, patch, toggleCircumstance } = s;

  return (
    <WizardFrame
      step={3}
      total={5}
      eyebrow="Шаг 3 из 5 · Схема"
      primary="Далее"
      primaryEnabled={!!s.driverRole && s.canMove !== null}
      primaryAction={() => nav.navigate('EuroStep4')}
      onBack={() => nav.goBack()}
    >
      <ScreenHeading title="Схема столкновения" subtitle="Отметьте на карте, как стояли машины, и опишите, как произошло ДТП" />

      <SchemeCard uri={s.schemeImageUri} onOpen={() => nav.navigate('EuroSchemeMap')} onClear={() => s.setSchemeImage(null)} />

      <View
        style={{
          paddingHorizontal: 14,
          paddingVertical: 10,
          borderRadius: 14,
          backgroundColor: 'rgba(230,20,40,0.08)',
          borderWidth: 1,
          borderColor: 'rgba(230,20,40,0.35)',
        }}
      >
        <Text style={{ fontFamily: 'Manrope_600SemiBold', fontSize: 12.5, color: tokens.red, lineHeight: 17 }}>
          ⚠️ Укажите место ДТП и положение машин точно. При неверных данных страховая компания может отказать в выплате.
        </Text>
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
        <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 12, color: tokens.inkSubtle, lineHeight: 16, paddingLeft: 2 }}>
          Нажмите на место, куда пришёлся первый удар.
        </Text>
        <ImpactZonePicker label="Ваше авто (А)" value={s.impactZoneA} onChange={(v) => patch({ impactZoneA: v })} />
        <ImpactZonePicker label="Авто «В»" value={s.impactZoneB} onChange={(v) => patch({ impactZoneB: v })} />
      </View>

      {/* Повреждения и возражения */}
      <View style={{ gap: 12, marginTop: 4 }}>
        <SectionLabel>Повреждения авто</SectionLabel>
        <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 12, color: tokens.inkSubtle, lineHeight: 16, paddingLeft: 2 }}>
          Отметьте повреждённые детали на схеме. Список попадёт в извещение.
        </Text>
        <DamagePartsPicker label="Ваше авто (А)" value={s.damagePartsA} onChange={(v) => patch({ damagePartsA: v })} />
        <FieldInput label="Уточнение по повреждениям (А)" value={s.damageDescA} onChangeText={(v) => patch({ damageDescA: v })} placeholder="Напр.: вмятина на двери, разбита фара…" multiline maxLength={1000} />
        <DamagePartsPicker label="Авто «В»" value={s.damagePartsB} onChange={(v) => patch({ damagePartsB: v })} />
        <FieldInput label="Уточнение по повреждениям (В)" value={s.damageDescB} onChangeText={(v) => patch({ damageDescB: v })} placeholder="Напр.: задний бампер, левая дверь…" multiline maxLength={1000} />
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
        <View style={{ gap: 8 }}>
          <VoiceRemarks
            audioAttached={!!s.remarksAudioKey}
            onResult={(r) => patch({ remarks: r.normalized, remarksAudioKey: r.audioKey, remarksRaw: r.transcript })}
          />
          <FieldInput
            label="Замечания (Изоҳ)"
            value={s.remarks}
            onChangeText={(v) => patch({ remarks: v })}
            placeholder="Продиктуйте голосом или введите текст…"
            multiline
            maxLength={2000}
          />
        </View>
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

// Карточка схемы ДТП: пустая (кнопка «Открыть карту») или с превью готового рисунка.
function SchemeCard({ uri, onOpen, onClear }: { uri: string | null; onOpen: () => void; onClear: () => void }) {
  if (uri) {
    return (
      <View style={{ gap: 8 }}>
        <View style={{ borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: tokens.hairline }}>
          <Image source={{ uri }} style={{ width: '100%', height: 180 }} resizeMode="cover" />
        </View>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Pressable
            onPress={onOpen}
            style={{ flex: 1, height: 44, borderRadius: 14, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: tokens.inkDark }}
          >
            <IconPencil size={16} color="#fff" />
            <Text style={{ fontFamily: 'Manrope_600SemiBold', fontSize: 14, color: '#fff' }}>Изменить</Text>
          </Pressable>
          <Pressable
            onPress={onClear}
            style={{ height: 44, paddingHorizontal: 18, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(20,20,20,0.06)', borderWidth: 1, borderColor: tokens.hairline }}
          >
            <Text style={{ fontFamily: 'Manrope_600SemiBold', fontSize: 14, color: tokens.inkMuted }}>Убрать</Text>
          </Pressable>
        </View>
      </View>
    );
  }
  return (
    <Pressable
      onPress={onOpen}
      style={({ pressed }) => ({
        borderRadius: 18,
        paddingVertical: 22,
        paddingHorizontal: 16,
        gap: 10,
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.55)',
        borderWidth: 1,
        borderColor: tokens.hairline,
        borderStyle: 'dashed',
        opacity: pressed ? 0.8 : 1,
      })}
    >
      <View style={{ width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(230,20,40,0.1)' }}>
        <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={tokens.red} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
          <Path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0116 0z" />
          <Circle cx={12} cy={10} r={3} />
        </Svg>
      </View>
      <Text style={{ fontFamily: 'Manrope_600SemiBold', fontSize: 15, color: tokens.inkDark }}>Открыть карту</Text>
      <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 12.5, color: tokens.inkSubtle, textAlign: 'center', lineHeight: 17 }}>
        Поставьте две машины на карте текущего места и укажите точку удара
      </Text>
    </Pressable>
  );
}
