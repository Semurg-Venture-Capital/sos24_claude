import { useEffect, useState } from 'react';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { tokens } from '../../../theme/colors';
import type { HealthStackParamList } from '../../../navigation/types';
import { BackButton } from '../../../components/ui/BackButton';
import { RedButton } from '../../../components/ui/RedButton';
import { finalizeTriage, type TriageDiagnosis, type Urgency } from '../../../api/health';
import { useTriageStore } from '../triageStore';
import { MedChip, MedSectionLabel, medGlass } from '../components';

type Nav = NativeStackNavigationProp<HealthStackParamList, 'HealthDiagnosis'>;
type Rt = RouteProp<HealthStackParamList, 'HealthDiagnosis'>;

const URGENCY: Record<Urgency, { label: string; bg: string; fg: string }> = {
  low: { label: 'Срочность низкая', bg: 'rgba(245,200,80,0.85)', fg: '#503a07' },
  medium: { label: 'Срочность средняя', bg: 'rgba(255,150,60,0.9)', fg: '#5c2c00' },
  high: { label: 'Срочность высокая', bg: '#E61428', fg: '#fff' },
};

// M14.3 — Предварительный диагноз. Вердикт mock-триажа: срочность, уверенность,
// симптомы, рекомендации + CTA записи к профильному врачу.
export function HealthDiagnosisScreen() {
  const nav = useNavigation<Nav>();
  const { params } = useRoute<Rt>();
  const [d, setD] = useState<TriageDiagnosis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    // Кеш: если диагноз для этой сессии уже получен — берём из стора, без повторного вызова ИИ.
    const store = useTriageStore.getState();
    if (store.diagnosis && store.sessionId === params.sessionId) {
      setD(store.diagnosis);
      setLoading(false);
      return;
    }
    let alive = true;
    finalizeTriage(params.sessionId)
      .then((res) => {
        if (!alive) return;
        setD(res);
        if (useTriageStore.getState().sessionId === params.sessionId) {
          useTriageStore.getState().setDiagnosis(res);
        }
      })
      .catch(() => alive && setError(true))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [params.sessionId]);

  const u = d ? URGENCY[d.urgency] : URGENCY.low;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: tokens.pageBg }} edges={['top']}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 24, paddingTop: 8, paddingBottom: 12 }}>
        <BackButton onPress={() => nav.goBack()} />
        <Text style={{ fontFamily: 'Manrope_600SemiBold', fontSize: 18, color: tokens.ink }}>Результат анализа</Text>
      </View>

      {loading ? (
        <ActivityIndicator color={tokens.red} style={{ marginTop: 48 }} />
      ) : error || !d ? (
        <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 14, color: tokens.inkMuted, textAlign: 'center', marginTop: 40, paddingHorizontal: 24 }}>
          Не удалось получить результат. Вернитесь и попробуйте ещё раз.
        </Text>
      ) : (
        <>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 150, gap: 18 }}>
            {/* Вердикт */}
            <View style={{ backgroundColor: tokens.inkDark, borderRadius: 30, padding: 22, gap: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={{ fontFamily: 'Manrope_600SemiBold', fontSize: 11, color: tokens.inkMutedDark, letterSpacing: 1, textTransform: 'uppercase' }}>
                  Предварительно
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 5, paddingHorizontal: 11, borderRadius: 999, backgroundColor: u.bg }}>
                  <View style={{ width: 6, height: 6, borderRadius: 999, backgroundColor: u.fg }} />
                  <Text style={{ fontFamily: 'Manrope_700Bold', fontSize: 11, color: u.fg }}>{u.label}</Text>
                </View>
              </View>
              <View style={{ gap: 6 }}>
                <Text style={{ fontFamily: 'NeueMontreal-Medium', fontSize: 26, color: '#fff', letterSpacing: -0.26, lineHeight: 30 }}>{d.verdict}</Text>
                <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 13.5, color: tokens.inkMutedDark, lineHeight: 20 }}>{d.description}</Text>
              </View>
              {/* Уверенность */}
              <View style={{ gap: 6 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 11, color: tokens.inkMutedDark }}>Уверенность модели</Text>
                  <Text style={{ fontFamily: 'Manrope_600SemiBold', fontSize: 11, color: '#fff' }}>{d.confidence}%</Text>
                </View>
                <View style={{ height: 6, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.12)', overflow: 'hidden' }}>
                  <View style={{ width: `${d.confidence}%`, height: '100%', borderRadius: 999, backgroundColor: tokens.red }} />
                </View>
              </View>
            </View>

            {/* Симптомы */}
            {d.symptoms.length > 0 ? (
              <View style={{ gap: 10 }}>
                <MedSectionLabel>Вы сообщили</MedSectionLabel>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {d.symptoms.map((s, i) => (
                    <MedChip key={`${s}-${i}`} tone={i === d.symptoms.length - 1 ? 'ink' : 'red'}>
                      {s}
                    </MedChip>
                  ))}
                </View>
              </View>
            ) : null}

            {/* Рекомендации */}
            {d.recommendations.length > 0 ? (
              <View style={{ gap: 10 }}>
                <MedSectionLabel>Что рекомендуем</MedSectionLabel>
                {d.recommendations.map((r, i) => (
                  <View key={i} style={[{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13, paddingHorizontal: 14, borderRadius: 18 }, medGlass]}>
                    <View style={{ width: 34, height: 34, borderRadius: 999, alignItems: 'center', justifyContent: 'center', backgroundColor: r.tone === 'red' ? 'rgba(230,20,40,0.1)' : 'rgba(20,20,20,0.06)' }}>
                      <Text style={{ fontFamily: 'Manrope_700Bold', fontSize: 16, color: r.tone === 'red' ? tokens.red : tokens.inkDark }}>
                        {r.tone === 'red' ? '!' : 'i'}
                      </Text>
                    </View>
                    <Text style={{ flex: 1, fontFamily: 'Manrope_400Regular', fontSize: 14, color: tokens.ink, lineHeight: 19 }}>{r.text}</Text>
                  </View>
                ))}
              </View>
            ) : null}

            {/* Дисклеймер */}
            <View style={{ flexDirection: 'row', gap: 10, padding: 14, borderRadius: 16, backgroundColor: 'rgba(20,20,20,0.04)' }}>
              <Text style={{ flex: 1, fontFamily: 'Manrope_400Regular', fontSize: 12, color: tokens.inkMuted, lineHeight: 17 }}>{d.disclaimer}</Text>
            </View>
          </ScrollView>

          {/* CTA */}
          <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 24, paddingTop: 12, paddingBottom: 32, backgroundColor: 'rgba(237,237,237,0.96)', borderTopWidth: 1, borderTopColor: tokens.hairline }}>
            <RedButton
              trailing={false}
              onPress={() => nav.navigate('HealthDoctors', d.suggestedSpecialty ? { specialty: d.suggestedSpecialty } : undefined)}
            >
              {d.suggestedSpecialty ? `Записаться к врачу · ${d.suggestedSpecialty}` : 'Записаться к врачу'}
            </RedButton>
          </View>
        </>
      )}
    </SafeAreaView>
  );
}
