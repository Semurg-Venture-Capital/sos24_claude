import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { createMyIdSession, verifyMyId } from '../../../api/myid';
import { PhoneFrame } from '../../../components/ui/PhoneFrame';
import { RedButton } from '../../../components/ui/RedButton';
import { SosLogo } from '../../../components/ui/SosLogo';
import { useAuthStore } from '../../../stores/authStore';
import { tokens } from '../../../theme/colors';

// M1.7 — Верификация личности через MyID (обязательный шаг после OTP).
export function MyIdOnboardingScreen() {
  const setVerified = useAuthStore((s) => s.setVerified);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startMyId = async () => {
    setLoading(true);
    setError(null);
    try {
      // Шаг 1: создаём сессию на бэке
      await createMyIdSession();

      // TODO (когда придут ключи): здесь запускаем нативный SDK
      // import { MyIdClient } from 'myid-rn-sdk';
      // const result = await MyIdClient.start({ sessionId, clientHash, clientHashId });
      // await completeVerification(result.code);

      // Сейчас в prod: здесь будет SDK. В __DEV__ — используй кнопку ниже.
    } catch {
      setError('Не удалось подключиться к серверу. Попробуйте ещё раз.');
    } finally {
      setLoading(false);
    }
  };

  const simulateMyId = async () => {
    setLoading(true);
    setError(null);
    try {
      await verifyMyId('mock-code');
      setVerified();
    } catch {
      setError('Ошибка верификации. Попробуйте ещё раз.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PhoneFrame>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={{ paddingTop: 16, paddingBottom: 32 }}>
          <SosLogo size="sm" color={tokens.inkDark} />
        </View>

        {/* MyID Icon */}
        <View style={{ alignItems: 'center', marginBottom: 32 }}>
          <View
            style={{
              width: 120,
              height: 120,
              borderRadius: 36,
              backgroundColor: 'rgba(230,20,40,0.06)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <MyIdIcon />
          </View>
        </View>

        {/* Heading */}
        <Text
          style={{
            fontFamily: 'NeueMontreal-Medium',
            fontSize: 30,
            letterSpacing: -0.3,
            color: tokens.ink,
            marginBottom: 12,
          }}
        >
          Подтверждение личности
        </Text>
        <Text
          style={{
            fontFamily: 'Manrope_400Regular',
            fontSize: 15,
            color: tokens.inkMuted,
            lineHeight: 22,
            marginBottom: 32,
          }}
        >
          Для оформления страховых полисов нам нужно верифицировать вашу личность через
          государственную систему MyID.
        </Text>

        {/* Steps */}
        <View style={{ gap: 16, marginBottom: 32 }}>
          {STEPS.map((step, i) => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 14 }}>
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 999,
                  backgroundColor: 'rgba(230,20,40,0.08)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginTop: 1,
                  flexShrink: 0,
                }}
              >
                <Text
                  style={{
                    fontFamily: 'NeueMontreal-Medium',
                    fontSize: 13,
                    color: tokens.red,
                  }}
                >
                  {i + 1}
                </Text>
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text
                  style={{
                    fontFamily: 'Manrope_600SemiBold',
                    fontSize: 14,
                    color: tokens.inkDark,
                  }}
                >
                  {step.title}
                </Text>
                <Text
                  style={{
                    fontFamily: 'Manrope_400Regular',
                    fontSize: 13,
                    color: tokens.inkMuted,
                    lineHeight: 18,
                  }}
                >
                  {step.desc}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Info pill */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            backgroundColor: 'rgba(20,20,20,0.04)',
            borderRadius: 14,
            padding: 14,
            marginBottom: 8,
          }}
        >
          <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={tokens.inkMuted} strokeWidth={1.8} strokeLinecap="round">
            <Circle cx={12} cy={12} r={10} />
            <Path d="M12 16v-4M12 8h.01" />
          </Svg>
          <Text
            style={{
              flex: 1,
              fontFamily: 'Manrope_400Regular',
              fontSize: 12,
              color: tokens.inkMuted,
              lineHeight: 17,
            }}
          >
            Данные передаются по защищённому каналу. Государственная система ГНКР.
          </Text>
        </View>
      </ScrollView>

      {/* Bottom actions */}
      <View style={{ position: 'absolute', left: 24, right: 24, bottom: 36, gap: 12 }}>
        {error && (
          <Text
            style={{
              textAlign: 'center',
              fontFamily: 'Manrope_500Medium',
              fontSize: 13,
              color: tokens.red,
            }}
          >
            {error}
          </Text>
        )}

        <RedButton onPress={startMyId} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : 'Пройти идентификацию MyID'}
        </RedButton>

        {/* DEV-only: симуляция без реального SDK */}
        {__DEV__ && (
          <Pressable
            onPress={simulateMyId}
            disabled={loading}
            style={({ pressed }) => ({
              alignItems: 'center',
              paddingVertical: 14,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: tokens.hairline,
              opacity: pressed || loading ? 0.5 : 1,
            })}
          >
            <Text
              style={{
                fontFamily: 'Manrope_600SemiBold',
                fontSize: 14,
                color: tokens.inkMuted,
              }}
            >
              Симулировать MyID (DEV)
            </Text>
          </Pressable>
        )}
      </View>
    </PhoneFrame>
  );
}

const STEPS = [
  {
    title: 'Сканирование лица',
    desc: 'Liveness-проверка: убедитесь, что у вас хорошее освещение',
  },
  {
    title: 'Проверка документа',
    desc: 'Система сверит данные с базой ГНКР по ПИНФЛ',
  },
  {
    title: 'Данные сохраняются',
    desc: 'ФИО, дата рождения и паспортные данные заполнятся автоматически',
  },
];

function MyIdIcon() {
  return (
    <Svg width={52} height={52} viewBox="0 0 52 52" fill="none">
      {/* ID card background */}
      <Rect x={4} y={12} width={44} height={28} rx={6} fill={tokens.red} opacity={0.12} />
      <Rect x={4} y={12} width={44} height={28} rx={6} stroke={tokens.red} strokeWidth={1.5} />
      {/* Face circle */}
      <Circle cx={18} cy={26} r={7} stroke={tokens.red} strokeWidth={1.5} />
      {/* Face lines */}
      <Path d="M15 26a3 3 0 016 0" stroke={tokens.red} strokeWidth={1.5} strokeLinecap="round" />
      <Circle cx={18} cy={23} r={1.5} fill={tokens.red} />
      {/* Text lines */}
      <Path d="M30 22h12M30 26h9M30 30h10" stroke={tokens.red} strokeWidth={1.5} strokeLinecap="round" opacity={0.5} />
    </Svg>
  );
}
