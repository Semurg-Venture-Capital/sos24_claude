import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import { verifyOtp } from '../../../api/auth';
import { BackButton } from '../../../components/ui/BackButton';
import { OtpBoxes } from '../../../components/ui/OtpBoxes';
import { PhoneFrame } from '../../../components/ui/PhoneFrame';
import { ScreenHeading } from '../../../components/ui/ScreenHeading';
import { TextLink } from '../../../components/ui/TextLink';
import { useAuthStore } from '../../../stores/authStore';
import { tokens } from '../../../theme/colors';
import type { AuthStackParamList } from '../../../navigation/types';

type Nav = NativeStackNavigationProp<AuthStackParamList>;
type R = RouteProp<AuthStackParamList, 'Otp'>;

// На dev OTP-код 4 цифры (6330). В дизайне 6 ячеек — это под реальный SMS.
// При интеграции Playmobile меняем OTP_LENGTH на 6.
const OTP_LENGTH = 4;
const RESEND_SECONDS = 90;

function formatTimer(s: number) {
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
}

// Маскируем номер для подсказки: +998 90 123-45-67
function prettyPhone(phone: string) {
  // phone = "+998901234567"
  const d = phone.slice(4);
  if (d.length !== 9) return phone;
  return `+998 ${d.slice(0, 2)} ${d.slice(2, 5)}-${d.slice(5, 7)}-${d.slice(7, 9)}`;
}

// M1.5 — ввод OTP-кода. Эталон: SOS24/screens.jsx → ScreenOTP.
export function OtpScreen() {
  const route = useRoute<R>();
  const nav = useNavigation<Nav>();
  const { t } = useTranslation();
  const setSession = useAuthStore((s) => s.setSession);

  const [code, setCode] = useState('');
  const [error, setError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [secondsLeft]);

  const onComplete = async (value: string) => {
    setSubmitting(true);
    setError(false);
    try {
      const result = await verifyOtp(route.params.phone, value);
      const sub = JSON.parse(
        decodeB64Url(result.accessToken.split('.')[1]),
      ).sub as string;
      // RootNavigator автоматически показывает нужный стек на основе verificationStatus:
      // NOT_VERIFIED → MyIdNavigator, MYID_VERIFIED → MainNavigator
      await setSession(
        { accessToken: result.accessToken, refreshToken: result.refreshToken },
        sub,
        result.verificationStatus,
      );
    } catch {
      setError(true);
      setCode('');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PhoneFrame>
      {/* Back button */}
      <View
        style={{
          position: 'absolute',
          top: 56,
          left: 24,
          right: 24,
          flexDirection: 'row',
          alignItems: 'center',
          zIndex: 3,
        }}
      >
        <BackButton onPress={() => nav.goBack()} />
      </View>

      <View style={{ position: 'absolute', top: 140, left: 24, right: 24, gap: 28 }}>
        <ScreenHeading
          title={t('auth.otp.title')}
          subtitle={
            <Text>
              {t('auth.otp.subtitle', { phone: '' }).replace('{{phone}}', '')}
              <Text style={{ color: tokens.inkDark, fontFamily: 'Manrope_500Medium' }}>
                {prettyPhone(route.params.phone)}
              </Text>
            </Text>
          }
        />

        <OtpBoxes
          length={OTP_LENGTH}
          value={code}
          onChange={(v) => {
            setError(false);
            setCode(v);
          }}
          onComplete={onComplete}
          error={error}
        />

        <View style={{ alignItems: 'center', gap: 12 }}>
          {secondsLeft > 0 ? (
            <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 14, color: tokens.inkMuted }}>
              {t('auth.otp.resendIn', { time: '' }).replace('{{time}}', '')}
              <Text style={{ color: tokens.inkDark, fontFamily: 'Manrope_600SemiBold' }}>
                {formatTimer(secondsLeft)}
              </Text>
            </Text>
          ) : (
            <TextLink onPress={() => setSecondsLeft(RESEND_SECONDS)} color={tokens.inkDark}>
              {t('auth.otp.resend')}
            </TextLink>
          )}
          <TextLink onPress={() => nav.goBack()}>{t('auth.otp.changeNumber')}</TextLink>
        </View>

        {error && (
          <Text
            style={{
              textAlign: 'center',
              fontFamily: 'Manrope_500Medium',
              fontSize: 13,
              color: tokens.red,
            }}
          >
            {t('auth.otp.errors.invalid')}
          </Text>
        )}

        <Text
          style={{
            marginTop: 8,
            textAlign: 'center',
            fontFamily: 'Manrope_400Regular',
            fontSize: 12,
            color: tokens.inkMuted,
          }}
        >
          Dev-режим: код 6330
        </Text>

        {submitting && (
          <Text style={{ textAlign: 'center', color: tokens.inkMuted, fontFamily: 'Manrope_400Regular' }}>
            {t('common.loading')}
          </Text>
        )}
      </View>
    </PhoneFrame>
  );
}

// Декодируем base64url (часть JWT) без зависимостей. Btoa/atob нет в RN —
// используем простую таблицу.
function decodeB64Url(input: string): string {
  const b64 = input.replace(/-/g, '+').replace(/_/g, '/');
  const pad = b64.length % 4 ? 4 - (b64.length % 4) : 0;
  const padded = b64 + '='.repeat(pad);
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  let str = '';
  let buffer = 0;
  let bits = 0;
  for (const c of padded) {
    if (c === '=') break;
    const v = chars.indexOf(c);
    if (v < 0) continue;
    buffer = (buffer << 6) | v;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      str += String.fromCharCode((buffer >> bits) & 0xff);
    }
  }
  return str;
}
