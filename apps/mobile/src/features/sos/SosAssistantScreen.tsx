import { useEffect, useRef, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { tokens } from '../../theme/colors';
import type { MainStackParamList } from '../../navigation/types';
import { BackButton } from '../../components/ui/BackButton';
import { SosMark } from '../../components/icons/SosMark';
import { ChevronRight } from '../../components/icons/ChevronRight';
import { PhoneFillIcon, StethoscopeIcon } from '../../components/icons/MedIcons';
import { BenefitCarHit, BenefitCarLock, BenefitProperty } from '../../components/icons/BenefitIcons';
import { IconQuestion } from '../../components/icons/LineIcons';
import {
  fetchAssistantSession,
  sendAssistantMessage,
  type AssistantAction,
  type AssistantMessage,
} from '../../api/assistant';
import { useAssistantStore } from './assistantStore';
import { useAssistantActions } from './useAssistantActions';

type Nav = NativeStackNavigationProp<MainStackParamList, 'SosAssistant'>;

const SOS_HOTLINE = '1024';

// Локальные категории для стартового экрана (до первого сообщения). Тап →
// отправляем сид-фразу, дальше LLM-роутер ведёт диалог.
const CATEGORIES: {
  key: string;
  title: string;
  sub: string;
  seed: string;
  tone: { bg: string; fg: string };
  Icon: (p: { size?: number; color?: string }) => React.ReactElement;
}[] = [
  { key: 'accident', title: 'ДТП', sub: 'столкновение, наезд, повреждение', seed: 'Я попал в ДТП', tone: { bg: 'rgba(230,20,40,0.12)', fg: tokens.red }, Icon: BenefitCarHit },
  { key: 'medical', title: 'Мед. помощь', sub: 'травма, плохое самочувствие', seed: 'Нужна медицинская помощь', tone: { bg: 'rgba(105,228,183,0.55)', fg: '#0a3a26' }, Icon: StethoscopeIcon },
  { key: 'theft', title: 'Угон / кража', sub: 'нет авто на месте', seed: 'У меня угнали машину', tone: { bg: 'rgba(245,200,80,0.55)', fg: '#503a07' }, Icon: BenefitCarLock },
  { key: 'property', title: 'Имущество', sub: 'пожар, залив, стихия', seed: 'Проблема с имуществом', tone: { bg: 'rgba(86,140,255,0.18)', fg: '#1a3577' }, Icon: BenefitProperty },
  { key: 'other', title: 'Другое', sub: 'опишите ситуацию', seed: '', tone: { bg: 'rgba(20,20,20,0.08)', fg: tokens.inkDark }, Icon: IconQuestion },
];

const GREETING =
  'Здравствуйте! Я SOS24-помощник. Помогу разобраться в любой ситуации — выберите категорию ниже или опишите словами.';

// SOS-ассистент (центральный ИИ-роутер). Вход — красная SOS-кнопка на Home.
// См. docs/SOS_ASSISTANT_SPEC.md.
export function SosAssistantScreen() {
  const nav = useNavigation<Nav>();
  const scrollRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);
  const runAction = useAssistantActions();

  const { sessionId, messages, hasChat, hydrate, appendUser, appendAi, reset } = useAssistantStore();
  const [input, setInput] = useState('');
  const [restoring, setRestoring] = useState(!useAssistantStore.getState().hasChat());
  const [sending, setSending] = useState(false);

  // На входе восстанавливаем серверную сессию (диалог переживает выход).
  useEffect(() => {
    let alive = true;
    fetchAssistantSession()
      .then((s) => {
        if (!alive || !s.messages.length) return;
        hydrate({ sessionId: s.sessionId, messages: s.messages });
      })
      .catch(() => {
        // офлайн — покажем локально сохранённый диалог (persist)
      })
      .finally(() => alive && setRestoring(false));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const t = setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 60);
    return () => clearTimeout(t);
  }, [messages, sending]);

  const send = async (text: string) => {
    const value = text.trim();
    if (!value || sending) return;
    setInput('');
    const curSessionId = useAssistantStore.getState().sessionId ?? undefined;
    appendUser(value);
    setSending(true);
    try {
      const turn = await sendAssistantMessage(value, curSessionId);
      appendAi(
        {
          role: 'ai',
          text: turn.reply,
          at: new Date().toISOString(),
          actions: turn.actions,
          quickReplies: turn.quickReplies,
        },
        turn.sessionId,
      );
    } catch {
      appendAi(
        {
          role: 'ai',
          text: 'Не удалось обработать запрос. Попробуйте ещё раз или позвоните диспетчеру 1024.',
          at: new Date().toISOString(),
          actions: [{ type: 'emergency_call', label: 'Позвонить диспетчеру', hint: SOS_HOTLINE }],
          quickReplies: [],
        },
        useAssistantStore.getState().sessionId ?? '',
      );
    } finally {
      setSending(false);
    }
  };

  const onCategory = (c: (typeof CATEGORIES)[number]) => {
    if (c.seed) send(c.seed);
    else inputRef.current?.focus();
  };

  const callHotline = () =>
    Linking.openURL(`tel:${SOS_HOTLINE}`).catch(() =>
      Alert.alert('Не удалось позвонить', `Наберите ${SOS_HOTLINE} вручную.`),
    );

  const restart = () => {
    Alert.alert('Начать новый диалог?', 'Текущая переписка будет удалена.', [
      { text: 'Отмена', style: 'cancel' },
      { text: 'Начать сначала', style: 'destructive', onPress: () => reset() },
    ]);
  };

  // Быстрые ответы берём из последнего сообщения ассистента.
  const lastAi = [...messages].reverse().find((m) => m.role === 'ai');
  const quickReplies = sending ? [] : lastAi?.quickReplies ?? [];
  const started = hasChat();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: tokens.pageBg }} edges={['top']}>
      {/* Хедер */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 20, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: tokens.hairline }}>
        <BackButton onPress={() => nav.goBack()} />
        <View style={{ width: 40, height: 40 }}>
          <LinearGradient
            colors={['#E61428', '#3A1117']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ width: 40, height: 40, borderRadius: 999, alignItems: 'center', justifyContent: 'center' }}
          >
            <SosMark size={18} color="#fff" />
          </LinearGradient>
          <View style={{ position: 'absolute', right: -1, bottom: -1, width: 13, height: 13, borderRadius: 999, backgroundColor: tokens.green, borderWidth: 2.5, borderColor: tokens.pageBg }} />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={{ fontFamily: 'Manrope_600SemiBold', fontSize: 14, color: tokens.ink }}>SOS24 · ИИ-помощник</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <View style={{ width: 6, height: 6, borderRadius: 999, backgroundColor: tokens.green }} />
            <Text style={{ fontFamily: 'Manrope_600SemiBold', fontSize: 11, color: '#0a3a26' }}>на связи · SOS 24/7</Text>
          </View>
        </View>
        <Pressable onPress={callHotline} hitSlop={8} style={({ pressed }) => ({ width: 40, height: 40, borderRadius: 999, backgroundColor: 'rgba(20,20,20,0.05)', alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.7 : 1 })}>
          <PhoneFillIcon size={16} color={tokens.red} />
        </Pressable>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={8}>
        {restoring ? (
          <ActivityIndicator color={tokens.red} style={{ marginTop: 40 }} />
        ) : (
          <ScrollView ref={scrollRef} contentContainerStyle={{ padding: 16, gap: 10 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {/* Стартовый экран: приветствие + категории (до первого сообщения) */}
            {!started ? (
              <>
                <AiCard>
                  <Text style={cardText}>{GREETING}</Text>
                </AiCard>
                <View style={{ gap: 6, marginTop: 2 }}>
                  {CATEGORIES.map((c) => (
                    <CategoryRow key={c.key} c={c} onPress={() => onCategory(c)} />
                  ))}
                </View>
              </>
            ) : (
              messages.map((m, i) =>
                m.role === 'ai' ? (
                  <AiMessage key={i} m={m} onAction={runAction} />
                ) : (
                  <UserBubble key={i} text={m.text} />
                ),
              )
            )}
            {sending ? <TypingDots /> : null}
          </ScrollView>
        )}

        {/* Быстрые ответы + «Начать сначала» */}
        {!restoring && started ? (
          <View style={{ paddingHorizontal: 16, gap: 10 }}>
            {quickReplies.length > 0 ? (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                {quickReplies.map((qr) => (
                  <Pressable key={qr} onPress={() => send(qr)} style={{ paddingVertical: 8, paddingHorizontal: 14, borderRadius: 999, backgroundColor: 'rgba(20,20,20,0.05)', borderWidth: 1, borderColor: tokens.hairline }}>
                    <Text style={{ fontFamily: 'Manrope_500Medium', fontSize: 13, color: tokens.inkDark }}>{qr}</Text>
                  </Pressable>
                ))}
              </View>
            ) : null}
            <Pressable onPress={restart} hitSlop={8} style={{ alignSelf: 'center', paddingVertical: 4, paddingHorizontal: 12 }}>
              <Text style={{ fontFamily: 'Manrope_600SemiBold', fontSize: 12.5, color: tokens.inkMuted }}>↺ Начать сначала</Text>
            </Pressable>
          </View>
        ) : null}

        {/* Композер */}
        <View style={{ paddingHorizontal: 16, paddingTop: 10, paddingBottom: 20, gap: 10 }}>
          <Pressable onPress={callHotline} style={({ pressed }) => ({ height: 44, borderRadius: 999, backgroundColor: 'rgba(20,20,20,0.06)', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: pressed ? 0.8 : 1 })}>
            <PhoneFillIcon size={14} color={tokens.red} />
            <Text style={{ fontFamily: 'Manrope_500Medium', fontSize: 13, color: tokens.inkDark }}>Экстренный звонок — диспетчер 1024</Text>
          </Pressable>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={{ flex: 1, minHeight: 44, borderRadius: 22, backgroundColor: '#fff', borderWidth: 1, borderColor: tokens.hairline, paddingHorizontal: 18, justifyContent: 'center' }}>
              <TextInput
                ref={inputRef}
                value={input}
                onChangeText={setInput}
                placeholder="Опишите ситуацию…"
                placeholderTextColor={tokens.inkMuted}
                onSubmitEditing={() => send(input)}
                returnKeyType="send"
                multiline
                style={{ fontFamily: 'Manrope_400Regular', fontSize: 15, color: tokens.ink, maxHeight: 120, paddingVertical: Platform.OS === 'ios' ? 12 : 6 }}
              />
            </View>
            <Pressable onPress={() => send(input)} style={({ pressed }) => ({ width: 52, height: 52, borderRadius: 999, backgroundColor: tokens.red, alignItems: 'center', justifyContent: 'center', opacity: pressed || !input.trim() ? 0.85 : 1 })}>
              <Text style={{ fontSize: 20, color: '#fff', lineHeight: 22 }}>↑</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const cardText = { fontFamily: 'Manrope_400Regular', fontSize: 14, color: tokens.ink, lineHeight: 21 } as const;

function AiCard({ children }: { children: React.ReactNode }) {
  return (
    <View style={{ alignSelf: 'flex-start', maxWidth: '92%', backgroundColor: '#fff', borderRadius: 20, borderBottomLeftRadius: 8, borderWidth: 1, borderColor: tokens.hairline, paddingVertical: 12, paddingHorizontal: 16, gap: 6 }}>
      {children}
    </View>
  );
}

function AiMessage({ m, onAction }: { m: AssistantMessage; onAction: (a: AssistantAction) => void }) {
  const actions = m.actions ?? [];
  return (
    <AiCard>
      <Text style={cardText}>{m.text}</Text>
      {actions.length > 0 ? (
        <View style={{ gap: 6, marginTop: 6 }}>
          {actions.map((a, i) => (
            <ActionButton key={`${a.type}-${i}`} action={a} primary={i === 0} onPress={() => onAction(a)} />
          ))}
        </View>
      ) : null}
    </AiCard>
  );
}

function ActionButton({ action, primary, onPress }: { action: AssistantAction; primary: boolean; onPress: () => void }) {
  const call = action.type === 'emergency_call';
  const bg = primary ? tokens.inkDark : 'rgba(20,20,20,0.04)';
  const fg = primary ? '#fff' : tokens.inkDark;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 14, backgroundColor: bg, opacity: pressed ? 0.85 : 1 })}>
      {call ? <PhoneFillIcon size={14} color={primary ? '#fff' : tokens.red} /> : null}
      <View style={{ flex: 1, gap: 1 }}>
        <Text style={{ fontFamily: 'Manrope_600SemiBold', fontSize: 13, color: fg }}>{action.label}</Text>
        {action.hint ? (
          <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 11, color: primary ? tokens.inkMutedDark : tokens.inkMuted }}>{action.hint}</Text>
        ) : null}
      </View>
      <ChevronRight size={14} color={primary ? 'rgba(255,255,255,0.5)' : 'rgba(20,20,20,0.32)'} />
    </Pressable>
  );
}

function CategoryRow({ c, onPress }: { c: (typeof CATEGORIES)[number]; onPress: () => void }) {
  const { Icon } = c;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ alignSelf: 'stretch', maxWidth: '92%', flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 18, backgroundColor: '#fff', borderWidth: 1, borderColor: tokens.hairline, opacity: pressed ? 0.9 : 1 })}>
      <View style={{ width: 36, height: 36, borderRadius: 999, backgroundColor: c.tone.bg, alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={18} color={c.tone.fg} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={{ fontFamily: 'Manrope_600SemiBold', fontSize: 14, color: tokens.ink }}>{c.title}</Text>
        <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 12, color: tokens.inkMuted }}>{c.sub}</Text>
      </View>
      <ChevronRight size={14} color="rgba(20,20,20,0.32)" />
    </Pressable>
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
