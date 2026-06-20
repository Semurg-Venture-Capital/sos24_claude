import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import {
  participantFullName,
  runMyIdCode,
  stepUpMyId,
  validateOtherPolicy,
  verifyParticipant,
  type EuroParticipant,
  type ParticipantPolicy,
  type ParticipantVehicle,
} from '../../../api/europrotocol';
import { lookupVehicleByTechPassport, type TechPassportInfo } from '../../../api/vehicles';
import { useVehicles } from '../../../api/vehicles';
import { usePolicies } from '../../../api/policies';
import { CarCard } from '../../../components/ui/CarCard';
import { Glass } from '../../../components/ui/Glass';
import { ScreenHeading } from '../../../components/ui/ScreenHeading';
import { Tag } from '../../../components/ui/Tag';
import { TextField } from '../../../components/ui/TextField';
import { WizardFrame } from '../../../components/ui/WizardFrame';
import { tokens } from '../../../theme/colors';
import { DateField } from '../components/EuroFields';
import { useEuroStore } from '../store';
import type { EuroStackParamList } from '../../../navigation/types';

type Nav = NativeStackNavigationProp<EuroStackParamList, 'EuroStep2'>;

// M9.3 шаг 2 — участники: A (инициатор: шаг-ап MyID + авто из гаража),
// B (второй участник: MyID-верификация + авто из НАПП по техпаспорту + полис).
export function EuroStep2Screen() {
  const nav = useNavigation<Nav>();
  const { data: vehicles, isLoading } = useVehicles();
  const { data: myPolicies } = usePolicies();
  const s = useEuroStore();

  // ОСАГО-полисы стороны A по выбранному авто (активные/в обработке).
  const myVehiclePolicies = (myPolicies ?? []).filter(
    (p) => p.type === 'OSAGO' && p.vehicleId === s.myVehicleId && p.status !== 'CANCELLED' && p.status !== 'EXPIRED',
  );

  const [verifyingSelf, setVerifyingSelf] = useState(false);
  const [verifyingOther, setVerifyingOther] = useState(false);
  const [lookingUp, setLookingUp] = useState(false);
  const [checkingPolicy, setCheckingPolicy] = useState(false);

  // Данные участника B, если он зарегистрирован у нас (по ПИНФЛ из MyID).
  const [bRegistered, setBRegistered] = useState(false);
  const [bVehicles, setBVehicles] = useState<ParticipantVehicle[]>([]);
  const [bPolicies, setBPolicies] = useState<ParticipantPolicy[]>([]);
  const [bVehicleId, setBVehicleId] = useState<string | null>(null); // выбранное авто B из системы
  const [bPolicyId, setBPolicyId] = useState<string | null>(null);
  const [vehMsg, setVehMsg] = useState<string | null>(null); // статус-сообщение поиска авто
  const [polMsg, setPolMsg] = useState<string | null>(null); // статус-сообщение проверки полиса

  const bVehiclePolicies = bPolicies.filter((p) => p.vehicleId === bVehicleId);

  // Выбор авто B из его профиля → заполняем поля европротокола.
  const selectBVehicle = (v: ParticipantVehicle) => {
    setBVehicleId(v.id);
    setBPolicyId(null);
    s.setOtherField('otherGov', v.plate ?? '');
    s.setOtherField('otherTpSeria', v.techPassportSeria ?? '');
    s.setOtherField('otherTpNumber', v.techPassportNumber ?? '');
    s.setOtherVehicle({
      modelName: `${v.brand ?? ''} ${v.model ?? ''}`.trim(),
      markName: v.brand ?? '',
      govNumber: v.plate ?? '',
      bodyNumber: v.bodyNumber ?? '',
      engineNumber: v.engineNumber ?? '',
      techPassportSeria: v.techPassportSeria ?? '',
      techPassportNumber: v.techPassportNumber ?? '',
      issueYear: v.year ? String(v.year) : '',
    } as unknown as TechPassportInfo);
    s.setOtherPolicyValid(null);
  };

  // Выбор ОСАГО-полиса B из его профиля.
  const selectBPolicy = (p: ParticipantPolicy) => {
    setBPolicyId(p.id);
    const m = (p.policyNumber ?? '').trim().match(/^([A-Za-zА-Яа-я]{2,3})\s*-?\s*([0-9]{5,10})$/);
    s.setOtherField('otherPolicySeria', m ? m[1].toUpperCase() : '');
    s.setOtherField('otherPolicyNumber', m ? m[2] : (p.policyNumber ?? ''));
    s.setOtherPolicyValid(true);
  };

  useEffect(() => {
    if (!s.myVehicleId && vehicles && vehicles.length > 0) s.setMyVehicle(vehicles[0].id);
  }, [s, vehicles]);

  // ── Сторона A — шаг-ап инициатора ──
  const verifySelf = async () => {
    setVerifyingSelf(true);
    try {
      // Сторона A — всегда владелец аккаунта. MyID запускаем без pre-fill ПИНФЛ
      // (MyID требует ещё и дату рождения вместе с ПИНФЛ), а stepUp на бэкенде
      // сверяет, что распознанное лицо = владелец аккаунта.
      const code = await runMyIdCode();
      const res = await stepUpMyId(code);
      if (res.ok) s.setSelfVerified(true);
      else Alert.alert('Не совпало', 'Личность не совпала с владельцем аккаунта. Сторона A должна подтверждаться владельцем телефона.');
    } catch (e) {
      Alert.alert('MyID', (e as Error).message || 'Не удалось пройти верификацию.');
    } finally {
      setVerifyingSelf(false);
    }
  };

  // ── Сторона B — верификация второго участника ──
  const verifyOther = async () => {
    setVerifyingOther(true);
    try {
      const code = await runMyIdCode();
      const res = await verifyParticipant(code);
      s.setParticipant(res.participant);
      setBRegistered(res.registered);
      setBVehicles(res.vehicles);
      setBPolicies(res.policies);
      setBVehicleId(null);
      setBPolicyId(null);
    } catch (e) {
      Alert.alert('MyID', (e as Error).message || 'Не удалось верифицировать участника.');
    } finally {
      setVerifyingOther(false);
    }
  };

  // ── НАПП: авто второго участника по техпаспорту ──
  const lookupOtherVehicle = async () => {
    setLookingUp(true);
    setVehMsg('Ищем авто в госреестре…');
    try {
      const info = await lookupVehicleByTechPassport({
        techPassportSeria: s.otherTpSeria.trim(),
        techPassportNumber: s.otherTpNumber.trim(),
        govNumber: s.otherGov.replace(/\s+/g, '').toUpperCase(),
      });
      s.setOtherVehicle(info);
      setVehMsg('✓ Авто найдено и заполнено.');
    } catch (e) {
      s.setOtherVehicle(null);
      setVehMsg((e as Error).message || 'Авто не найдено в реестре. Проверьте серию/номер техпаспорта и госномер.');
    } finally {
      setLookingUp(false);
    }
  };

  // ── НАПП: валидация полиса второго участника ──
  const checkPolicy = async () => {
    setCheckingPolicy(true);
    setPolMsg('Проверяем полис в реестре…');
    try {
      const res = await validateOtherPolicy(s.otherPolicySeria.trim(), s.otherPolicyNumber.trim());
      s.setOtherPolicyValid(res.valid);
      setPolMsg(res.valid ? '✓ Полис действителен.' : res.message || 'Полис не найден в реестре. Проверьте серию и номер.');
    } catch {
      s.setOtherPolicyValid(false);
      setPolMsg('Не удалось проверить полис. Попробуйте ещё раз.');
    } finally {
      setCheckingPolicy(false);
    }
  };

  const canLookupVehicle = s.otherTpSeria.trim() && s.otherTpNumber.trim() && s.otherGov.trim();
  const canCheckPolicy = s.otherPolicySeria.trim() && s.otherPolicyNumber.trim();
  // Узбекский номер: +998 + 9 цифр (пробелы игнорируем).
  const phoneOk = /^\+?998\d{9}$/.test(s.otherPhone.replace(/\s+/g, ''));
  // Полис ОСАГО стороны A выбран и принадлежит выбранному авто.
  const myPolicyOk = myVehiclePolicies.some((p) => p.id === s.myPolicyId);
  const canNext =
    s.selfVerified &&
    !!s.myVehicleId &&
    myPolicyOk && // ОСАГО стороны A обязателен
    !!s.participant &&
    !!s.otherVehicle &&
    s.otherPolicyValid === true && // полис стороны B проверен и валиден
    phoneOk;

  return (
    <WizardFrame
      step={2}
      total={5}
      eyebrow="Шаг 2 из 5 · Участники"
      primary="Далее"
      primaryEnabled={canNext}
      primaryAction={() => nav.navigate('EuroStep3')}
      onBack={() => nav.goBack()}
    >
      <ScreenHeading title="Участники ДТП" subtitle="Оба участника подтверждаются через MyID" />

      {/* ─────────── Сторона A ─────────── */}
      <SectionLabel badge="A" text="Вы (инициатор)" />
      {s.selfVerified ? (
        <VerifiedCard title="Личность подтверждена" subtitle="MyID · присутствие подтверждено" />
      ) : (
        <VerifyButton
          label="Подтвердить личность (MyID)"
          loading={verifyingSelf}
          onPress={verifySelf}
          onSimulate={__DEV__ ? () => s.setSelfVerified(true) : undefined}
        />
      )}

      {!s.selfVerified ? (
        <Text style={hintText}>Сначала подтвердите личность через MyID — затем появятся ваши авто и полисы.</Text>
      ) : (
       <>
      <Text style={subLabel}>Моё транспортное средство</Text>
      {isLoading ? (
        <ActivityIndicator color={tokens.red} style={{ marginVertical: 16 }} />
      ) : !vehicles || vehicles.length === 0 ? (
        <Text style={hintText}>В гараже нет авто. Добавьте автомобиль, чтобы оформить европротокол.</Text>
      ) : (
        <View style={{ gap: 10 }}>
          {vehicles.map((v) => (
            <CarCard
              key={v.id}
              selected={v.id === s.myVehicleId}
              plate={v.plate}
              name={`${v.brand} ${v.model}`}
              year={v.year}
              engine={v.engine ?? '—'}
              power={v.power ?? '—'}
              onPress={() => s.setMyVehicle(v.id)}
            />
          ))}
        </View>
      )}

      {/* Полис ОСАГО стороны A по выбранному авто */}
      {s.myVehicleId ? (
        <>
          <Text style={subLabel}>Полис ОСАГО по этому авто</Text>
          {!myPolicies ? (
            <Text style={hintText}>Загружаем полисы…</Text>
          ) : myVehiclePolicies.length === 0 ? (
            <Text style={hintText}>
              Действующий ОСАГО по выбранному авто не найден. Оформите ОСАГО или выберите другое авто — без полиса европротокол оформить нельзя.
            </Text>
          ) : (
            <View style={{ gap: 8 }}>
              {myVehiclePolicies.map((p) => {
                const active = p.id === s.myPolicyId;
                return (
                  <Pressable
                    key={p.id}
                    onPress={() => s.patch({ myPolicyId: p.id })}
                    style={{
                      padding: 14,
                      borderRadius: 14,
                      backgroundColor: active ? tokens.inkDark : 'rgba(255,255,255,0.6)',
                      borderWidth: 1,
                      borderColor: active ? tokens.inkDark : tokens.hairline,
                    }}
                  >
                    <Text style={{ fontFamily: 'Manrope_600SemiBold', fontSize: 14, color: active ? '#fff' : tokens.inkDark }}>
                      ОСАГО {p.policyNumber ?? p.id.slice(0, 8)}
                    </Text>
                    <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 12, color: active ? 'rgba(255,255,255,0.7)' : tokens.inkMuted, marginTop: 2 }}>
                      статус: {p.status}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}
        </>
      ) : null}
       </>
      )}

      {/* ─────────── Сторона B ─────────── */}
      <View style={{ marginTop: 8 }}>
        <SectionLabel badge="B" text="Второй участник" />
      </View>

      {s.participant ? (
        <VerifiedCard
          title={participantFullName(s.participant)}
          subtitle={`MyID · ПИНФЛ ${s.participant.pinfl}`}
        />
      ) : (
        <VerifyButton
          label="Верифицировать участника (MyID)"
          loading={verifyingOther}
          onPress={verifyOther}
          onSimulate={__DEV__ ? () => s.setParticipant(MOCK_PARTICIPANT) : undefined}
        />
      )}

      {/* Авто и полис второго участника — только после верификации */}
      {s.participant && (
        <>
          {bRegistered && bVehicles.length > 0 ? (
            <>
              <Text style={subLabel}>Авто второго участника (из его профиля)</Text>
              <Text style={hintText}>Участник найден в системе — выберите его авто.</Text>
              <View style={{ gap: 8 }}>
                {bVehicles.map((v) => {
                  const active = bVehicleId === v.id;
                  return (
                    <Pressable
                      key={v.id}
                      onPress={() => selectBVehicle(v)}
                      style={{
                        padding: 14,
                        borderRadius: 14,
                        backgroundColor: active ? tokens.inkDark : 'rgba(255,255,255,0.6)',
                        borderWidth: 1,
                        borderColor: active ? tokens.inkDark : tokens.hairline,
                      }}
                    >
                      <Text style={{ fontFamily: 'Manrope_600SemiBold', fontSize: 14, color: active ? '#fff' : tokens.inkDark }}>
                        {`${v.brand ?? ''} ${v.model ?? ''}`.trim() || 'ТС'}{v.year ? `, ${v.year}` : ''}
                      </Text>
                      <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 12, color: active ? 'rgba(255,255,255,0.7)' : tokens.inkMuted, marginTop: 2 }}>
                        {v.plate ?? '—'}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </>
          ) : (
            <>
              <Text style={subLabel}>Авто второго участника (по техпаспорту)</Text>
              {bRegistered ? (
                <Text style={hintText}>У участника нет авто в системе — введите данные техпаспорта.</Text>
              ) : (
                <Text style={hintText}>Участника нет в системе — найдём авто по техпаспорту в госреестре.</Text>
              )}
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TextField
                  label="Серия ТП"
                  value={s.otherTpSeria}
                  onChangeText={(v) => s.setOtherField('otherTpSeria', v.toUpperCase())}
                  autoCapitalize="characters"
                  placeholder="AAF"
                  maxLength={3}
                  containerStyle={{ flex: 1 }}
                />
                <TextField
                  label="Номер ТП"
                  value={s.otherTpNumber}
                  onChangeText={(v) => s.setOtherField('otherTpNumber', v.replace(/\D/g, ''))}
                  keyboardType="number-pad"
                  placeholder="2949568"
                  maxLength={8}
                  containerStyle={{ flex: 1.4 }}
                />
              </View>
              <TextField
                label="Госномер"
                value={s.otherGov}
                onChangeText={(v) => s.setOtherField('otherGov', v.toUpperCase())}
                autoCapitalize="characters"
                placeholder="01 A 123 BB"
                maxLength={12}
              />
              <ActionButton
                label={s.otherVehicle ? 'Найти заново' : 'Найти авто'}
                loading={lookingUp}
                disabled={!canLookupVehicle}
                onPress={lookupOtherVehicle}
              />
              {vehMsg ? (
                <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 12, color: vehMsg.startsWith('✓') ? tokens.green : tokens.inkMuted, paddingLeft: 2 }}>
                  {vehMsg}
                </Text>
              ) : null}
              {s.otherVehicle && (
                <VerifiedCard
                  title={s.otherVehicle.modelName || 'ТС найдено'}
                  subtitle={`${s.otherVehicle.govNumber} · ${s.otherVehicle.issueYear} · ${s.otherVehicle.vehicleColor || ''}`.trim()}
                />
              )}
            </>
          )}

          {bRegistered && bVehicleId && bVehiclePolicies.length > 0 ? (
            <>
              <Text style={subLabel}>Полис ОСАГО второго участника (из его профиля)</Text>
              <View style={{ gap: 8 }}>
                {bVehiclePolicies.map((p) => {
                  const active = bPolicyId === p.id;
                  return (
                    <Pressable
                      key={p.id}
                      onPress={() => selectBPolicy(p)}
                      style={{
                        padding: 14,
                        borderRadius: 14,
                        backgroundColor: active ? tokens.inkDark : 'rgba(255,255,255,0.6)',
                        borderWidth: 1,
                        borderColor: active ? tokens.inkDark : tokens.hairline,
                      }}
                    >
                      <Text style={{ fontFamily: 'Manrope_600SemiBold', fontSize: 14, color: active ? '#fff' : tokens.inkDark }}>
                        ОСАГО {p.policyNumber ?? p.id.slice(0, 8)}
                      </Text>
                      <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 12, color: active ? 'rgba(255,255,255,0.7)' : tokens.inkMuted, marginTop: 2 }}>
                        статус: {p.status}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </>
          ) : (
            <>
              <Text style={subLabel}>Полис ОСАГО второго участника</Text>
              {bRegistered && bVehicleId ? (
                <Text style={hintText}>По этому авто нет действующего ОСАГО в системе — введите данные полиса.</Text>
              ) : null}
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TextField
                  label="Серия"
                  value={s.otherPolicySeria}
                  onChangeText={(v) => {
                    s.setOtherField('otherPolicySeria', v.toUpperCase());
                    s.setOtherPolicyValid(null);
                    setPolMsg(null);
                  }}
                  autoCapitalize="characters"
                  placeholder="OSG"
                  maxLength={3}
                  containerStyle={{ flex: 1 }}
                />
                <TextField
                  label="Номер"
                  value={s.otherPolicyNumber}
                  onChangeText={(v) => {
                    s.setOtherField('otherPolicyNumber', v.replace(/\D/g, ''));
                    s.setOtherPolicyValid(null);
                    setPolMsg(null);
                  }}
                  keyboardType="number-pad"
                  placeholder="1234567"
                  maxLength={10}
                  containerStyle={{ flex: 1.6 }}
                />
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <ActionButton
                  label="Проверить полис"
                  loading={checkingPolicy}
                  disabled={!canCheckPolicy}
                  onPress={checkPolicy}
                  style={{ flex: 1 }}
                />
                {s.otherPolicyValid === true && <Tag tone="green">проверен</Tag>}
                {s.otherPolicyValid === false && <Tag tone="red">не найден</Tag>}
              </View>
              {polMsg ? (
                <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 12, color: polMsg.startsWith('✓') ? tokens.green : tokens.inkMuted, paddingLeft: 2 }}>
                  {polMsg}
                </Text>
              ) : null}
            </>
          )}

          <TextField
            label="Телефон второго участника"
            value={s.otherPhone}
            onChangeText={(v) => s.setOtherField('otherPhone', v)}
            keyboardType="phone-pad"
            placeholder="+998 90 123 45 67"
            maxLength={17}
            error={s.otherPhone.length > 0 && !phoneOk}
            hint={s.otherPhone.length > 0 && !phoneOk ? 'Формат: +998 XX XXX XX XX' : undefined}
          />

          <Text style={subLabel}>Водительское удостоверение «В»</Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TextField
              label="Серия"
              value={s.otherDlSeria}
              onChangeText={(v) => s.patch({ otherDlSeria: v.toUpperCase() })}
              autoCapitalize="characters"
              placeholder="AC"
              maxLength={3}
              containerStyle={{ flex: 1 }}
            />
            <TextField
              label="Номер"
              value={s.otherDlNumber}
              onChangeText={(v) => s.patch({ otherDlNumber: v.replace(/\D/g, '') })}
              keyboardType="number-pad"
              placeholder="1234567"
              maxLength={7}
              containerStyle={{ flex: 1.6 }}
            />
          </View>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TextField
              label="Категории"
              value={s.otherDlCategories}
              onChangeText={(v) => s.patch({ otherDlCategories: v.toUpperCase() })}
              autoCapitalize="characters"
              placeholder="B, C"
              maxLength={20}
              containerStyle={{ flex: 1 }}
            />
            <DateField
              label="Дата выдачи ВУ"
              value={s.otherDlIssue}
              onChange={(v) => s.patch({ otherDlIssue: v })}
              containerStyle={{ flex: 1 }}
            />
          </View>

          <TextField
            label="Адрес владельца авто «В»"
            value={s.otherOwnerAddr}
            onChangeText={(v) => s.patch({ otherOwnerAddr: v })}
            placeholder="Тошкент ш., Юнусобод…"
            maxLength={500}
          />
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TextField
              label="Страховщик «В»"
              value={s.otherInsurer}
              onChangeText={(v) => s.patch({ otherInsurer: v })}
              placeholder="Apex Insurance"
              maxLength={150}
              containerStyle={{ flex: 1.4 }}
            />
            <DateField
              label="Полис действует до"
              value={s.otherPolicyValidUntil}
              onChange={(v) => s.patch({ otherPolicyValidUntil: v })}
              containerStyle={{ flex: 1 }}
            />
          </View>
        </>
      )}
    </WizardFrame>
  );
}

const MOCK_PARTICIPANT: EuroParticipant = {
  id: 'dev-mock',
  pinfl: '12345678901234',
  name: 'Иван',
  surname: 'Петров',
  patronymic: 'Сергеевич',
  nameEn: 'IVAN',
  surnameEn: 'PETROV',
  birthDate: '1985-02-02',
  birthPlace: null,
  gender: '1',
  nationality: null,
  citizenship: null,
  address: null,
  passportSeria: 'AB',
  passportNumber: '1122334',
  verifiedAt: new Date().toISOString(),
};

const subLabel = {
  fontFamily: 'Manrope_500Medium' as const,
  fontSize: 13,
  color: tokens.inkMuted,
  letterSpacing: -0.07,
  marginTop: 4,
};
const hintText = { fontFamily: 'Manrope_400Regular' as const, fontSize: 14, color: tokens.inkMuted };

function SectionLabel({ badge, text }: { badge: string; text: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <View
        style={{
          width: 24,
          height: 24,
          borderRadius: 8,
          backgroundColor: tokens.inkDark,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ fontFamily: 'NeueMontreal-Medium', fontSize: 12, color: '#fff' }}>{badge}</Text>
      </View>
      <Text style={{ fontFamily: 'Manrope_600SemiBold', fontSize: 15, color: tokens.ink, letterSpacing: -0.08 }}>
        {text}
      </Text>
    </View>
  );
}

function VerifyButton({
  label,
  loading,
  onPress,
  onSimulate,
}: {
  label: string;
  loading: boolean;
  onPress: () => void;
  onSimulate?: () => void;
}) {
  return (
    <View style={{ gap: 8 }}>
      <Pressable
        onPress={onPress}
        disabled={loading}
        style={({ pressed }) => ({
          height: 56,
          borderRadius: 999,
          borderWidth: 1.5,
          borderColor: 'rgba(230,20,40,0.5)',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          opacity: pressed || loading ? 0.6 : 1,
        })}
      >
        {loading ? <ActivityIndicator color={tokens.red} /> : <FaceIcon />}
        <Text style={{ fontFamily: 'Manrope_600SemiBold', fontSize: 15, color: tokens.red, letterSpacing: -0.08 }}>
          {loading ? 'Верификация…' : label}
        </Text>
      </Pressable>
      {onSimulate && (
        <Pressable onPress={onSimulate} style={{ alignSelf: 'center', padding: 4 }}>
          <Text style={{ fontFamily: 'Manrope_500Medium', fontSize: 12, color: tokens.inkSubtle }}>
            Симулировать MyID (DEV)
          </Text>
        </Pressable>
      )}
    </View>
  );
}

function ActionButton({
  label,
  loading,
  disabled,
  onPress,
  style,
}: {
  label: string;
  loading: boolean;
  disabled?: boolean;
  onPress: () => void;
  style?: object;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => ({
        height: 52,
        borderRadius: 999,
        backgroundColor: tokens.inkDark,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        opacity: disabled ? 0.4 : pressed || loading ? 0.7 : 1,
        ...style,
      })}
    >
      {loading && <ActivityIndicator color="#fff" size="small" />}
      <Text style={{ fontFamily: 'Manrope_600SemiBold', fontSize: 14, color: '#fff', letterSpacing: -0.07 }}>
        {label}
      </Text>
    </Pressable>
  );
}

function VerifiedCard({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <View style={{ borderRadius: 20, overflow: 'hidden' }}>
      <Glass
        intensity={20}
        tint="light"
        style={{
          backgroundColor: 'rgba(105,228,183,0.18)',
          padding: 16,
          borderWidth: 1,
          borderColor: 'rgba(105,228,183,0.5)',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <View
          style={{
            width: 32,
            height: 32,
            borderRadius: 999,
            backgroundColor: tokens.green,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#0a3a26" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M5 12l4 4 10-11" />
          </Svg>
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={{ fontFamily: 'Manrope_600SemiBold', fontSize: 15, color: tokens.ink }}>{title}</Text>
          <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 12, color: tokens.inkMuted }}>{subtitle}</Text>
        </View>
      </Glass>
    </View>
  );
}

function FaceIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={tokens.red} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M4 8V6a2 2 0 012-2h2M16 4h2a2 2 0 012 2v2M20 16v2a2 2 0 01-2 2h-2M8 20H6a2 2 0 01-2-2v-2" />
      <Path d="M9 10h.01M15 10h.01M9.5 15a3.5 3.5 0 005 0" />
    </Svg>
  );
}
