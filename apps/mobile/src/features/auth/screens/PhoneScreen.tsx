import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Text, View } from 'react-native';
import { requestOtp } from '../../../api/auth';
import { UzFlag } from '../../../components/icons/UzFlag';
import { BackButton } from '../../../components/ui/BackButton';
import { DismissKeyboardView } from '../../../components/ui/DismissKeyboardView';
import { PhoneFrame } from '../../../components/ui/PhoneFrame';
import { RedButton } from '../../../components/ui/RedButton';
import { ScreenHeading } from '../../../components/ui/ScreenHeading';
import { TextField } from '../../../components/ui/TextField';
import { useKeyboardHeight } from '../../../lib/useKeyboardHeight';
import { tokens } from '../../../theme/colors';
import type { AuthStackParamList } from '../../../navigation/types';

type Nav = NativeStackNavigationProp<AuthStackParamList>;

// Маска +998 (XX) XXX-XX-XX — рендерим из 9 цифр.
function formatPhone(digits: string): string {
  const d = digits.padEnd(9, ' ');
  const a = d.slice(0, 2).trim();
  const b = d.slice(2, 5).trim();
  const c = d.slice(5, 7).trim();
  const e = d.slice(7, 9).trim();
  return [
    a ? `(${a}${a.length === 2 ? ')' : ''}` : '',
    b ? ` ${b}` : '',
    c ? `-${c}` : '',
    e ? `-${e}` : '',
  ].join('');
}

// M1.4 — ввод номера телефона. Эталон: SOS24/screens.jsx → ScreenPhone.
export function PhoneScreen() {
  const nav = useNavigation<Nav>();
  const { t } = useTranslation();
  const kbHeight = useKeyboardHeight();
  const [digits, setDigits] = useState('');
  const [focused, setFocused] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const valid = digits.length === 9;
  const phone = `+998${digits}`;

  const onSubmit = async () => {
    if (!valid) return;
    setSubmitting(true);
    setError(null);
    try {
      await requestOtp(phone);
      nav.navigate('Otp', { phone });
    } catch {
      setError(t('auth.phone.errors.network'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PhoneFrame>
      <DismissKeyboardView>
        {/* Back button row */}
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

        {/* Content */}
        <View style={{ position: 'absolute', top: 140, left: 24, right: 24, gap: 32 }}>
          <ScreenHeading
            title={t('auth.phone.title')}
            subtitle={t('auth.phone.subtitle')}
          />
          <TextField
            label={t('auth.phone.label') as string}
            value={formatPhone(digits)}
            onChangeText={(text) => {
              const onlyDigits = text.replace(/\D/g, '').slice(0, 9);
              setDigits(onlyDigits);
            }}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            focused={focused}
            error={!!error}
            hint={error ?? undefined}
            keyboardType="phone-pad"
            returnKeyType="done"
            onSubmitEditing={onSubmit}
            placeholder="(XX) XXX-XX-XX"
            prefix={
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <UzFlag />
                <Text style={{ fontFamily: 'Manrope_500Medium', fontSize: 17, color: tokens.inkDark }}>
                  +998
                </Text>
                <View style={{ width: 1, height: 22, backgroundColor: tokens.hairline, marginLeft: 4, marginRight: 4 }} />
              </View>
            }
          />
        </View>

        {/* Submit — поднимается над клавиатурой */}
        <View style={{ position: 'absolute', left: 24, right: 24, bottom: 64 + kbHeight }}>
          <RedButton onPress={onSubmit} disabled={!valid || submitting}>
            {submitting ? <ActivityIndicator color="#fff" /> : t('auth.phone.submit')}
          </RedButton>
        </View>
      </DismissKeyboardView>
    </PhoneFrame>
  );
}
