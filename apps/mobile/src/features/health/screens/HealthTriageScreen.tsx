import { useEffect, useRef, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  ActivityIndicator,
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
import { sendTriageMessage, startTriage, type TriageMessage } from '../../../api/health';

type Nav = NativeStackNavigationProp<HealthStackParamList, 'HealthTriage'>;

// M14.2 — ИИ-триаж (чат). Сессия на бэкенде (mock-провайдер), уточняющие
// вопросы + быстрые ответы. По готовности → предв. диагноз (M14.3).
export function HealthTriageScreen() {
  const nav = useNavigation<Nav>();
  const scrollRef = useRef<ScrollView>(null);

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<TriageMessage[]>([]);
  const [quickReplies, setQuickReplies] = useState<string[]>([]);
  const [canFinalize, setCanFinalize] = useState(false);
  const [disclaimer, setDisclaimer] = useState('Это не диагноз. ИИ помогает сориентироваться.');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    let alive = true;
    startTriage()
      .then((t) => {
        if (!alive) return;
        setSessionId(t.sessionId ?? null);
        setMessages(t.messages);
        setQuickReplies(t.quickReplies);
        setCanFinalize(t.canFinalize);
        setDisclaimer(t.disclaimer);
      })
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    const t = setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 60);
    return () => clearTimeout(t);
  }, [messages, sending]);

  const send = async (text: string) => {
    const value = text.trim();
    if (!value || !sessionId || sending) return;
    setInput('');
    setQuickReplies([]);
    setMessages((prev) => [...prev, { role: 'user', text: value, at: new Date().toISOString() }]);
    setSending(true);
    try {
      const t = await sendTriageMessage(sessionId, value);
      setMessages(t.messages);
      setQuickReplies(t.quickReplies);
      setCanFinalize(t.canFinalize);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', text: 'Не удалось отправить. Проверьте соединение и попробуйте ещё раз.', at: new Date().toISOString() },
      ]);
    } finally {
      setSending(false);
    }
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
          <Text style={{ fontFamily: 'Manrope_600SemiBold', fontSize: 14, color: tokens.ink }}>SOS24 · Медицинский ИИ</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <View style={{ width: 6, height: 6, borderRadius: 999, backgroundColor: tokens.green }} />
            <Text style={{ fontFamily: 'Manrope_600SemiBold', fontSize: 11, color: '#0a3a26' }}>анализирует симптомы</Text>
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

        {/* Быстрые ответы / CTA финала */}
        {!loading ? (
          <View style={{ paddingHorizontal: 16, gap: 10 }}>
            {canFinalize ? (
              <RedButton trailing={false} onPress={() => sessionId && nav.navigate('HealthDiagnosis', { sessionId })}>
                Показать предварительный результат
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
                placeholder="Опишите симптомы…"
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
