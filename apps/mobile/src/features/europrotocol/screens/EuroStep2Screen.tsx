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
} from '../../../api/europrotocol';
import { lookupVehicleByTechPassport } from '../../../api/vehicles';
import { useVehicles } from '../../../api/vehicles';
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
  const s = useEuroStore();

  const [verifyingSelf, setVerifyingSelf] = useState(false);
  const [verifyingOther, setVerifyingOther] = useState(false);
  const [lookingUp, setLookingUp] = useState(false);
  const [checkingPolicy, setCheckingPolicy] = useState(false);

  useEffect(() => {
    if (!s.myVehicleId && vehicles && vehicles.length > 0) s.setMyVehicle(vehicles[0].id);
  }, [s, vehicles]);

  // ── Сторона A — шаг-ап инициатора ──
  const verifySelf = async () => {
    setVerifyingSelf(true);
    try {
      const code = await runMyIdCode();
      const res = await stepUpMyId(code);
      if (res.ok) s.setSelfVerified(true);
      else Alert.alert('Не совпало', 'Лицо не соответствует владельцу аккаунта.');
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
      const p = await verifyParticipant(code);
      s.setParticipant(p);
    } catch (e) {
      Alert.alert('MyID', (e as Error).message || 'Не удалось верифицировать участника.');
    } finally {
      setVerifyingOther(false);
    }
  };

  // ── НАПП: авто второго участника по техпаспорту ──
  const lookupOtherVehicle = async () => {
    setLookingUp(true);
    try {
      const info = await lookupVehicleByTechPassport({
        techPassportSeria: s.otherTpSeria.trim(),
        techPassportNumber: s.otherTpNumber.trim(),
        govNumber: s.otherGov.replace(/\s+/g, '').toUpperCase(),
      });
      s.setOtherVehicle(info);
    } catch (e) {
      s.setOtherVehicle(null);
      Alert.alert('Авто', (e as Error).message || 'ТС не найдено в реестре.');
    } finally {
      setLookingUp(false);
    }
  };

  // ── НАПП: валидация полиса второго участника ──
  const checkPolicy = async () => {
    setCheckingPolicy(true);
    try {
      const res = await validateOtherPolicy(s.otherPolicySeria.trim(), s.otherPolicyNumber.trim());
      s.setOtherPolicyValid(res.valid);
      if (!res.valid) Alert.alert('Полис', res.message || 'Полис не найден в реестре.');
    } catch {
      s.setOtherPolicyValid(false);
      Alert.alert('Полис', 'Не удалось проверить полис.');
    } finally {
      setCheckingPolicy(false);
    }
  };

  const canLookupVehicle = s.otherTpSeria.trim() && s.otherTpNumber.trim() && s.otherGov.trim();
  const canCheckPolicy = s.otherPolicySeria.trim() && s.otherPolicyNumber.trim();
  // Узбекский номер: +998 + 9 цифр (пробелы игнорируем).
  const phoneOk = /^\+?998\d{9}$/.test(s.otherPhone.replace(/\s+/g, ''));
  const canNext =
    s.selfVerified &&
    !!s.myVehicleId &&
    !!s.participant &&
    !!s.otherVehicle &&
    s.otherPolicyValid === true && // полис должен быть проверен и валиден
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
          <Text style={subLabel}>Авто второго участника (по техпаспорту)</Text>
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
          {s.otherVehicle && (
            <VerifiedCard
              title={s.otherVehicle.modelName || 'ТС найдено'}
              subtitle={`${s.otherVehicle.govNumber} · ${s.otherVehicle.issueYear} · ${s.otherVehicle.vehicleColor || ''}`.trim()}
            />
          )}

          <Text style={subLabel}>Полис ОСАГО второго участника</Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TextField
              label="Серия"
              value={s.otherPolicySeria}
              onChangeText={(v) => {
                s.setOtherField('otherPolicySeria', v.toUpperCase());
                s.setOtherPolicyValid(null);
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
