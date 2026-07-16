import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
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
import { useDocuments } from '../../../api/documents';
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
  const { t } = useTranslation();
  const { data: vehicles, isLoading } = useVehicles();
  const { data: myPolicies } = usePolicies();
  const { data: myDocs } = useDocuments();
  const s = useEuroStore();

  // Есть ли у стороны A водительское в профиле. Если нет — спросим в шаге 2.
  const hasLicenseA = (myDocs ?? []).some((d) => d.kind === 'DRIVER_LICENSE');
  const myDlOk = hasLicenseA || (s.myDlSeria.trim().length > 0 && s.myDlNumber.trim().length > 0 && /^\d{4}-\d{2}-\d{2}$/.test(s.myDlIssue));

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
      bodyNumber: v.bodyNumber ?? v.vin ?? '', // если кузов пуст — берём VIN
      vin: v.vin ?? '',
      engineNumber: v.engineNumber ?? '',
      techPassportSeria: v.techPassportSeria ?? '',
      techPassportNumber: v.techPassportNumber ?? '',
      issueYear: v.year ? String(v.year) : '',
    } as unknown as TechPassportInfo);
    s.setOtherPolicyValid(null);
  };

  // Выбор ОСАГО-полиса B из его профиля. Номер может быть в разном формате — буквы → серия, цифры → номер.
  const selectBPolicy = (p: ParticipantPolicy) => {
    setBPolicyId(p.id);
    const raw = (p.policyNumber ?? '').trim();
    const letters = (raw.match(/[A-Za-zА-Яа-я]+/) || [''])[0];
    const digits = raw.replace(/\D/g, '');
    s.setOtherField('otherPolicySeria', letters.toUpperCase());
    s.setOtherField('otherPolicyNumber', digits || raw);
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
      else Alert.alert(t('euro.step2.mismatchTitle'), t('euro.step2.mismatchMsg'));
    } catch (e) {
      Alert.alert('MyID', (e as Error).message || t('euro.step2.verifySelfError'));
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

      // Адрес из MyID участника подставляем для ЛЮБОГО B (симметрично стороне A).
      if (res.participant?.address) s.patch({ otherOwnerAddr: res.participant.address });

      // B найден в системе → автозаполняем все доступные данные европротокола.
      if (res.registered) {
        if (res.contact?.phone) s.setOtherField('otherPhone', res.contact.phone);
        // адрес из профиля приоритетнее адреса из MyID
        if (res.contact?.address) s.patch({ otherOwnerAddr: res.contact.address });
        if (res.driverLicense) {
          s.patch({
            otherDlSeria: res.driverLicense.seria ?? '',
            otherDlNumber: res.driverLicense.number ?? '',
            otherDlCategories: res.driverLicense.categories ?? '',
            otherDlIssue: res.driverLicense.issuedAt ? res.driverLicense.issuedAt.slice(0, 10) : '',
          });
        }
        s.patch({ otherInsurer: 'SOS24 Sugʻurta' });
      }
    } catch (e) {
      Alert.alert('MyID', (e as Error).message || t('euro.step2.verifyOtherError'));
    } finally {
      setVerifyingOther(false);
    }
  };

  // ── НАПП: авто второго участника по техпаспорту ──
  const lookupOtherVehicle = async () => {
    setLookingUp(true);
    setVehMsg(t('euro.step2.vehSearching'));
    try {
      const info = await lookupVehicleByTechPassport({
        techPassportSeria: s.otherTpSeria.trim(),
        techPassportNumber: s.otherTpNumber.trim(),
        govNumber: s.otherGov.replace(/\s+/g, '').toUpperCase(),
      });
      s.setOtherVehicle(info);
      setVehMsg(t('euro.step2.vehFound'));
    } catch (e) {
      s.setOtherVehicle(null);
      setVehMsg((e as Error).message || t('euro.step2.vehNotFound'));
    } finally {
      setLookingUp(false);
    }
  };

  // ── НАПП: валидация полиса второго участника ──
  const checkPolicy = async () => {
    setCheckingPolicy(true);
    setPolMsg(t('euro.step2.polChecking'));
    try {
      const res = await validateOtherPolicy(s.otherPolicySeria.trim(), s.otherPolicyNumber.trim());
      s.setOtherPolicyValid(res.valid);
      setPolMsg(res.valid ? t('euro.step2.polValid') : res.message || t('euro.step2.polNotFound'));
    } catch {
      s.setOtherPolicyValid(false);
      setPolMsg(t('euro.step2.polError'));
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
    myDlOk && // ВУ стороны A (из профиля или заполнено здесь)
    !!s.participant &&
    !!s.otherVehicle &&
    s.otherPolicyValid === true && // полис стороны B проверен и валиден
    phoneOk;

  return (
    <WizardFrame
      step={2}
      total={5}
      eyebrow={t('euro.step2.eyebrow')}
      primary={t('common.next')}
      primaryEnabled={canNext}
      primaryAction={() => nav.navigate('EuroStep3')}
      onBack={() => nav.goBack()}
    >
      <ScreenHeading title={t('euro.step2.title')} subtitle={t('euro.step2.subtitle')} />

      {/* ─────────── Сторона A ─────────── */}
      <SectionLabel badge="A" text={t('euro.step2.sideA')} />
      {s.selfVerified ? (
        <VerifiedCard title={t('euro.step2.identityConfirmed')} subtitle={t('euro.step2.identityConfirmedSub')} />
      ) : (
        <VerifyButton
          label={t('euro.step2.verifySelf')}
          loading={verifyingSelf}
          onPress={verifySelf}
          onSimulate={__DEV__ ? () => s.setSelfVerified(true) : undefined}
        />
      )}

      {!s.selfVerified ? (
        <Text style={hintText}>{t('euro.step2.verifySelfHint')}</Text>
      ) : (
       <>
      <Text style={subLabel}>{t('euro.step2.myVehicle')}</Text>
      {isLoading ? (
        <ActivityIndicator color={tokens.red} style={{ marginVertical: 16 }} />
      ) : !vehicles || vehicles.length === 0 ? (
        <Text style={hintText}>{t('euro.step2.noVehicles')}</Text>
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
          <Text style={subLabel}>{t('euro.step2.osagoForVehicle')}</Text>
          {!myPolicies ? (
            <Text style={hintText}>{t('euro.step2.loadingPolicies')}</Text>
          ) : myVehiclePolicies.length === 0 ? (
            <Text style={hintText}>{t('euro.step2.noOsago')}</Text>
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
                      {t('euro.step2.status')}: {p.status}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}
        </>
      ) : null}

      {/* ВУ стороны A — только если в профиле нет водительского */}
      {s.myVehicleId && !hasLicenseA ? (
        <>
          <Text style={subLabel}>{t('euro.step2.yourLicense')}</Text>
          <Text style={hintText}>{t('euro.step2.noLicenseHint')}</Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TextField
              label={t('euro.step2.seria')}
              value={s.myDlSeria}
              onChangeText={(v) => s.patch({ myDlSeria: v.toUpperCase() })}
              autoCapitalize="characters"
              placeholder="AC"
              maxLength={3}
              containerStyle={{ flex: 1 }}
            />
            <TextField
              label={t('euro.step2.number')}
              value={s.myDlNumber}
              onChangeText={(v) => s.patch({ myDlNumber: v.replace(/\D/g, '') })}
              keyboardType="number-pad"
              placeholder="1234567"
              maxLength={7}
              containerStyle={{ flex: 1.6 }}
            />
          </View>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TextField
              label={t('euro.step2.categories')}
              value={s.myDlCategories}
              onChangeText={(v) => s.patch({ myDlCategories: v.toUpperCase() })}
              autoCapitalize="characters"
              placeholder="B, C"
              maxLength={20}
              containerStyle={{ flex: 1 }}
            />
            <DateField
              label={t('euro.step2.issueDate')}
              value={s.myDlIssue}
              onChange={(v) => s.patch({ myDlIssue: v })}
              containerStyle={{ flex: 1 }}
            />
          </View>
        </>
      ) : null}
       </>
      )}

      {/* ─────────── Сторона B ─────────── */}
      <View style={{ marginTop: 8 }}>
        <SectionLabel badge="B" text={t('euro.step2.sideB')} />
      </View>

      {s.participant ? (
        <VerifiedCard
          title={participantFullName(s.participant)}
          subtitle={t('euro.step2.myidPinfl', { pinfl: s.participant.pinfl })}
        />
      ) : (
        <VerifyButton
          label={t('euro.step2.verifyOther')}
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
              <Text style={subLabel}>{t('euro.step2.otherVehicleFromProfile')}</Text>
              <Text style={hintText}>{t('euro.step2.participantFoundPickVehicle')}</Text>
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
                        {`${v.brand ?? ''} ${v.model ?? ''}`.trim() || t('euro.common.vehicleShort')}{v.year ? `, ${v.year}` : ''}
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
              <Text style={subLabel}>{t('euro.step2.otherVehicleByTechPassport')}</Text>
              {bRegistered ? (
                <Text style={hintText}>{t('euro.step2.noVehicleEnterTp')}</Text>
              ) : (
                <Text style={hintText}>{t('euro.step2.notInSystemLookup')}</Text>
              )}
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TextField
                  label={t('euro.step2.tpSeria')}
                  value={s.otherTpSeria}
                  onChangeText={(v) => s.setOtherField('otherTpSeria', v.toUpperCase())}
                  autoCapitalize="characters"
                  placeholder="AAF"
                  maxLength={3}
                  containerStyle={{ flex: 1 }}
                />
                <TextField
                  label={t('euro.step2.tpNumber')}
                  value={s.otherTpNumber}
                  onChangeText={(v) => s.setOtherField('otherTpNumber', v.replace(/\D/g, ''))}
                  keyboardType="number-pad"
                  placeholder="2949568"
                  maxLength={8}
                  containerStyle={{ flex: 1.4 }}
                />
              </View>
              <TextField
                label={t('euro.step2.govNumber')}
                value={s.otherGov}
                onChangeText={(v) => s.setOtherField('otherGov', v.toUpperCase())}
                autoCapitalize="characters"
                placeholder="01 A 123 BB"
                maxLength={12}
              />
              <ActionButton
                label={s.otherVehicle ? t('euro.step2.findAgain') : t('euro.step2.findVehicle')}
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
                  title={s.otherVehicle.modelName || t('euro.step2.vehicleFound')}
                  subtitle={`${s.otherVehicle.govNumber} · ${s.otherVehicle.issueYear} · ${s.otherVehicle.vehicleColor || ''}`.trim()}
                />
              )}
            </>
          )}

          {bRegistered && bVehicleId && bVehiclePolicies.length > 0 ? (
            <>
              <Text style={subLabel}>{t('euro.step2.otherOsagoFromProfile')}</Text>
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
                        {t('euro.step2.status')}: {p.status}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </>
          ) : (
            <>
              <Text style={subLabel}>{t('euro.step2.otherOsago')}</Text>
              {bRegistered && bVehicleId ? (
                <Text style={hintText}>{t('euro.step2.noOsagoEnterManual')}</Text>
              ) : null}
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TextField
                  label={t('euro.step2.seria')}
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
                  label={t('euro.step2.number')}
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
                  label={t('euro.step2.checkPolicy')}
                  loading={checkingPolicy}
                  disabled={!canCheckPolicy}
                  onPress={checkPolicy}
                  style={{ flex: 1 }}
                />
                {s.otherPolicyValid === true && <Tag tone="green">{t('euro.step2.verified')}</Tag>}
                {s.otherPolicyValid === false && <Tag tone="red">{t('euro.step2.notFound')}</Tag>}
              </View>
              {polMsg ? (
                <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 12, color: polMsg.startsWith('✓') ? tokens.green : tokens.inkMuted, paddingLeft: 2 }}>
                  {polMsg}
                </Text>
              ) : null}
            </>
          )}

          <TextField
            label={t('euro.step2.otherPhone')}
            value={s.otherPhone}
            onChangeText={(v) => s.setOtherField('otherPhone', v)}
            keyboardType="phone-pad"
            placeholder="+998 90 123 45 67"
            maxLength={17}
            error={s.otherPhone.length > 0 && !phoneOk}
            hint={s.otherPhone.length > 0 && !phoneOk ? t('euro.step2.phoneFormat') : undefined}
          />

          <Text style={subLabel}>{t('euro.step2.licenseB')}</Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TextField
              label={t('euro.step2.seria')}
              value={s.otherDlSeria}
              onChangeText={(v) => s.patch({ otherDlSeria: v.toUpperCase() })}
              autoCapitalize="characters"
              placeholder="AC"
              maxLength={3}
              containerStyle={{ flex: 1 }}
            />
            <TextField
              label={t('euro.step2.number')}
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
              label={t('euro.step2.categories')}
              value={s.otherDlCategories}
              onChangeText={(v) => s.patch({ otherDlCategories: v.toUpperCase() })}
              autoCapitalize="characters"
              placeholder="B, C"
              maxLength={20}
              containerStyle={{ flex: 1 }}
            />
            <DateField
              label={t('euro.step2.licenseIssueDate')}
              value={s.otherDlIssue}
              onChange={(v) => s.patch({ otherDlIssue: v })}
              containerStyle={{ flex: 1 }}
            />
          </View>

          <TextField
            label={t('euro.step2.ownerAddrB')}
            value={s.otherOwnerAddr}
            onChangeText={(v) => s.patch({ otherOwnerAddr: v })}
            placeholder={t('euro.step2.addrPlaceholder')}
            maxLength={500}
          />
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TextField
              label={t('euro.step2.insurerB')}
              value={s.otherInsurer}
              onChangeText={(v) => s.patch({ otherInsurer: v })}
              placeholder={t('euro.step2.insurerPlaceholder')}
              maxLength={150}
              containerStyle={{ flex: 1.4 }}
            />
            <DateField
              label={t('euro.step2.policyValidUntil')}
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
  const { t } = useTranslation();
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
          {loading ? t('euro.step2.verifying') : label}
        </Text>
      </Pressable>
      {onSimulate && (
        <Pressable onPress={onSimulate} style={{ alignSelf: 'center', padding: 4 }}>
          <Text style={{ fontFamily: 'Manrope_500Medium', fontSize: 12, color: tokens.inkSubtle }}>
            {t('euro.step2.simulateMyid')}
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
