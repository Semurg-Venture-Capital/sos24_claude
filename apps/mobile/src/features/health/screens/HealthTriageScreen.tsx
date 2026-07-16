import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { tokens } from '../../../theme/colors';
import type { HealthStackParamList } from '../../../navigation/types';
import { BackButton } from '../../../components/ui/BackButton';
import { RedButton } from '../../../components/ui/RedButton';
import { MicIcon, StethoscopeIcon } from '../../../components/icons/MedIcons';
import { sendTriageMessage, startTriage } from '../../../api/health';
import { useTriageStore } from '../triageStore';

type Nav = NativeStackNavigationProp<HealthStackParamList, 'HealthTriage'>;

// M14.2 — ИИ-триаж (чат). Сессия на бэкенде (mock-провайдер), уточняющие
// вопросы + быстрые ответы. По готовности → предв. диагноз (M14.3).
export function HealthTriageScreen() {
  const { t } = useTranslation();
  const nav = useNavigation<Nav>();
  const scrollRef = useRef<ScrollView>(null);

  const { messages, quickReplies, canFinalize, disclaimer, diagnosis, sessionId } = useTriageStore();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(!useTriageStore.getState().sessionId);
  const [sending, setSending] = useState(false);
  const hasResult = canFinalize || !!diagnosis;

  // Начать новый триаж на бэкенде и сохранить в стор. Возвращает cleanup (для useEffect).
  const beginNew = () => {
    setLoading(true);
    let alive = true;
    startTriage()
      .then((t) => {
        if (!alive) return;
        useTriageStore.getState().setTurn({
          sessionId: t.sessionId ?? null,
          messages: t.messages,
          quickReplies: t.quickReplies,
          canFinalize: t.canFinalize,
          disclaimer: t.disclaimer,
        });
      })
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  };

  // На входе: есть сохранённый чат → восстанавливаем; иначе — начинаем новый.
  useEffect(() => {
    if (useTriageStore.getState().sessionId) {
      setLoading(false);
      return;
    }
    return beginNew();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const t = setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 60);
    return () => clearTimeout(t);
  }, [messages, sending]);

  const send = async (text: string) => {
    const value = text.trim();
    const store = useTriageStore.getState();
    if (!value || !store.sessionId || sending) return;
    setInput('');
    store.appendUser(value);
    setSending(true);
    try {
      const t = await sendTriageMessage(store.sessionId, value);
      useTriageStore.getState().setTurn({ messages: t.messages, quickReplies: t.quickReplies, canFinalize: t.canFinalize });
    } catch {
      const cur = useTriageStore.getState();
      cur.setTurn({
        messages: [...cur.messages, { role: 'assistant', text: t('health.triage.sendError'), at: new Date().toISOString() }],
        quickReplies: [],
        canFinalize: cur.canFinalize,
      });
    } finally {
      setSending(false);
    }
  };

  // «Начать сначала» — с подтверждением (переписка удаляется).
  const restart = () => {
    Alert.alert(t('health.triage.restartTitle'), t('health.triage.restartMsg'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('health.triage.restartConfirm'),
        style: 'destructive',
        onPress: () => {
          useTriageStore.getState().reset();
          beginNew();
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: tokens.pageBg }} edges={['top']}>
      {/* Хедер */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 20, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: tokens.hairline }}>
        <BackButton onPress={() => nav.goBack()} />
        <LinearGradient
          colors={['#E61428', '#3A1117']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ width: 40, height: 40, borderRadius: 999, alignItems: 'center', justifyContent: 'center' }}
        >
          <StethoscopeIcon size={18} color="#fff" />
        </LinearGradient>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={{ fontFamily: 'Manrope_600SemiBold', fontSize: 14, color: tokens.ink }}>{t('health.triage.headerTitle')}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <View style={{ width: 6, height: 6, borderRadius: 999, backgroundColor: tokens.green }} />
            <Text style={{ fontFamily: 'Manrope_600SemiBold', fontSize: 11, color: '#0a3a26' }}>{t('health.triage.analyzing')}</Text>
          </View>
        </View>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={8}>
        {loading ? (
          <ActivityIndicator color={tokens.red} style={{ marginTop: 40 }} />
        ) : (
          <ScrollView ref={scrollRef} contentContainerStyle={{ padding: 16, gap: 10 }} showsVerticalScrollIndicator={false}>
            {messages.map((m, i) =>
              m.role === 'assistant' ? <AiCard key={i} text={m.text} /> : <UserBubble key={i} text={m.text} />,
            )}
            {sending ? <TypingDots /> : null}
          </ScrollView>
        )}

        {/* Результат / быстрые ответы / начать сначала */}
        {!loading ? (
          <View style={{ paddingHorizontal: 16, gap: 10 }}>
            {hasResult ? (
              <RedButton trailing={false} onPress={() => sessionId && nav.navigate('HealthDiagnosis', { sessionId })}>
                {diagnosis ? t('health.triage.showResult') : t('health.triage.showPrelimResult')}
              </RedButton>
            ) : quickReplies.length > 0 ? (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                {quickReplies.map((qr) => (
                  <Pressable
                    key={qr}
                    onPress={() => send(qr)}
                    style={{ paddingVertical: 8, paddingHorizontal: 14, borderRadius: 999, backgroundColor: 'rgba(20,20,20,0.05)', borderWidth: 1, borderColor: tokens.hairline }}
                  >
                    <Text style={{ fontFamily: 'Manrope_500Medium', fontSize: 13, color: tokens.inkDark }}>{qr}</Text>
                  </Pressable>
                ))}
              </View>
            ) : null}
            {messages.length > 1 ? (
              <Pressable onPress={restart} hitSlop={8} style={{ alignSelf: 'center', paddingVertical: 4, paddingHorizontal: 12 }}>
                <Text style={{ fontFamily: 'Manrope_600SemiBold', fontSize: 12.5, color: tokens.inkMuted }}>↺ {t('health.triage.restartConfirm')}</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}

        {/* Композер */}
        <View style={{ paddingHorizontal: 16, paddingTop: 10, paddingBottom: 20, gap: 8 }}>
          <Text style={{ alignSelf: 'center', fontFamily: 'Manrope_400Regular', fontSize: 11, color: tokens.inkMuted }}>
            ⓘ {disclaimer}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={{ flex: 1, minHeight: 44, borderRadius: 22, backgroundColor: '#fff', borderWidth: 1, borderColor: tokens.hairline, paddingHorizontal: 18, justifyContent: 'center' }}>
              <TextInput
                value={input}
                onChangeText={setInput}
                placeholder={t('health.triage.inputPlaceholder')}
                placeholderTextColor={tokens.inkMuted}
                onSubmitEditing={() => send(input)}
                returnKeyType="send"
                style={{ fontFamily: 'Manrope_400Regular', fontSize: 15, color: tokens.ink, paddingVertical: Platform.OS === 'ios' ? 12 : 6 }}
              />
            </View>
            <Pressable
              onPress={() => (input.trim() ? send(input) : undefined)}
              style={({ pressed }) => ({ width: 52, height: 52, borderRadius: 999, backgroundColor: tokens.red, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.85 : 1 })}
            >
              {input.trim() ? (
                <Text style={{ fontSize: 20, color: '#fff', lineHeight: 22 }}>↑</Text>
              ) : (
                <MicIcon size={20} color="#fff" />
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function AiCard({ text }: { text: string }) {
  return (
    <View style={{ alignSelf: 'flex-start', maxWidth: '86%', backgroundColor: '#fff', borderRadius: 20, borderBottomLeftRadius: 8, borderWidth: 1, borderColor: tokens.hairline, paddingVertical: 12, paddingHorizontal: 16 }}>
      <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 14, color: tokens.ink, lineHeight: 21 }}>{text}</Text>
    </View>
  );
}

function UserBubble({ text }: { text: string }) {
  return (
    <View style={{ alignSelf: 'flex-end', maxWidth: '82%', backgroundColor: tokens.red, borderRadius: 20, borderBottomRightRadius: 6, paddingVertical: 12, paddingHorizontal: 16 }}>
      <Text style={{ fontFamily: 'Manrope_500Medium', fontSize: 14, color: '#fff', lineHeight: 20 }}>{text}</Text>
    </View>
  );
}

function TypingDots() {
  return (
    <View style={{ alignSelf: 'flex-start', flexDirection: 'row', gap: 5, backgroundColor: '#fff', borderRadius: 20, borderBottomLeftRadius: 8, borderWidth: 1, borderColor: tokens.hairline, paddingVertical: 14, paddingHorizontal: 16 }}>
      {[0, 1, 2].map((i) => (
        <View key={i} style={{ width: 7, height: 7, borderRadius: 999, backgroundColor: 'rgba(20,20,20,0.3)' }} />
      ))}
    </View>
  );
}
