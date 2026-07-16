import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import {
  ActivityIndicator,
  AppState,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import type { Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import {
  connectSupportSocket,
  fetchMessages,
  markTicketRead,
  sendMessage,
  type SupportMessage,
} from '../../../api/support';
import { uploadFileToS3 } from '../../../api/files';
import { Avatar } from '../../../components/ui/Avatar';
import { BackButton } from '../../../components/ui/BackButton';
import { PhoneFrame } from '../../../components/ui/PhoneFrame';
import { tokens } from '../../../theme/colors';
import type { SupportStackParamList } from '../../../navigation/types';

type Nav = NativeStackNavigationProp<SupportStackParamList, 'SupportChat'>;
type Rt = RouteProp<SupportStackParamList, 'SupportChat'>;

function time(iso: string) {
  return new Date(iso).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

export function SupportChatScreen() {
  const nav = useNavigation<Nav>();
  const { t } = useTranslation();
  const { params } = useRoute<Rt>();
  const { ticketId, subject } = params;
  const qc = useQueryClient();

  const [msgs, setMsgs] = useState<SupportMessage[]>([]); // newest-first (inverted)
  const [loading, setLoading] = useState(true);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [typing, setTyping] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const addMessage = useCallback((m: SupportMessage) => {
    setMsgs((prev) => (prev.some((x) => x.id === m.id) ? prev : [m, ...prev]));
  }, []);

  // Первичная загрузка + отметка прочитанным.
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const page = await fetchMessages(ticketId);
        if (!alive) return;
        setMsgs([...page.messages].reverse());
        setCursor(page.nextCursor);
      } finally {
        if (alive) setLoading(false);
      }
      markTicketRead(ticketId).catch(() => {});
      qc.invalidateQueries({ queryKey: ['support'] });
    })();
    return () => {
      alive = false;
    };
  }, [ticketId, qc]);

  // Socket: join комнаты тикета, приём сообщений/печатает/прочитано.
  useEffect(() => {
    const socket = connectSupportSocket();
    socketRef.current = socket;
    const join = () => socket.emit('ticket:join', { ticketId });
    socket.on('connect', join);
    join();

    socket.on('message:new', ({ ticketId: tid, message }: { ticketId: string; message: SupportMessage }) => {
      if (tid !== ticketId) return;
      addMessage(message);
      setTyping(false);
      if (message.senderRole === 'SUPPORT') {
        markTicketRead(ticketId).catch(() => {});
        qc.invalidateQueries({ queryKey: ['support'] });
      }
    });
    socket.on('typing', ({ ticketId: tid, who }: { ticketId: string; who: string }) => {
      if (tid === ticketId && who === 'agent') {
        setTyping(true);
        if (typingTimer.current) clearTimeout(typingTimer.current);
        typingTimer.current = setTimeout(() => setTyping(false), 3000);
      }
    });

    return () => {
      socket.emit('ticket:leave', { ticketId });
      socket.disconnect();
      socketRef.current = null;
    };
  }, [ticketId, addMessage, qc]);

  // Сворачивание приложения = «не в чате»: выходим из комнаты, чтобы пуши приходили
  // (как в Telegram). При возврате — снова заходим, догружаем пропущенное и читаем.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      const socket = socketRef.current;
      if (state === 'active') {
        socket?.emit('ticket:join', { ticketId });
        fetchMessages(ticketId)
          .then((page) => {
            setMsgs([...page.messages].reverse());
            setCursor(page.nextCursor);
          })
          .catch(() => {});
        markTicketRead(ticketId).catch(() => {});
        qc.invalidateQueries({ queryKey: ['support'] });
      } else if (state === 'background') {
        socket?.emit('ticket:leave', { ticketId });
      }
    });
    return () => sub.remove();
  }, [ticketId, qc]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !cursor) return;
    setLoadingMore(true);
    try {
      const page = await fetchMessages(ticketId, cursor);
      setMsgs((prev) => [...prev, ...[...page.messages].reverse()]);
      setCursor(page.nextCursor);
    } finally {
      setLoadingMore(false);
    }
  }, [ticketId, cursor, loadingMore]);

  const send = useCallback(async () => {
    const body = text.trim();
    if (!body || sending) return;
    setSending(true);
    setText('');
    try {
      const m = await sendMessage(ticketId, { body });
      addMessage(m);
      qc.invalidateQueries({ queryKey: ['support'] });
    } catch {
      setText(body);
    } finally {
      setSending(false);
    }
  }, [text, sending, ticketId, addMessage, qc]);

  const attach = useCallback(async () => {
    try {
      const ImagePicker = await import('expo-image-picker');
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) return;
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.7,
      });
      if (res.canceled || !res.assets?.[0]) return;
      setSending(true);
      const { key, contentType } = await uploadFileToS3(res.assets[0].uri, 'image');
      const m = await sendMessage(ticketId, { attachment: { key, mime: contentType, name: 'photo.jpg' } });
      addMessage(m);
      qc.invalidateQueries({ queryKey: ['support'] });
    } catch {
      // тихо игнорируем (нет разрешения / отмена)
    } finally {
      setSending(false);
    }
  }, [ticketId, addMessage, qc]);

  const onChangeText = (v: string) => {
    setText(v);
    socketRef.current?.emit('typing', { ticketId });
  };

  return (
    <PhoneFrame bottomSafeArea={false}>
      {/* Шапка оператора */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          paddingHorizontal: 16,
          paddingBottom: 12,
          paddingTop: 4,
          borderBottomWidth: 1,
          borderBottomColor: tokens.hairline,
        }}
      >
        <BackButton onPress={() => nav.goBack()} />
        <Avatar name="SOS 24" size={40} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={{ fontFamily: 'Manrope_600SemiBold', fontSize: 14, color: tokens.ink }} numberOfLines={1}>
            {t('support.chat.headerTitle')}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <View style={{ width: 6, height: 6, borderRadius: 999, backgroundColor: tokens.green }} />
            <Text style={{ fontFamily: 'Manrope_600SemiBold', fontSize: 11, color: '#0a9466' }} numberOfLines={1}>
              {subject ? subject : t('support.chat.online')}
            </Text>
          </View>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
        {loading ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator color={tokens.red} />
          </View>
        ) : (
          <FlatList
            data={msgs}
            inverted
            keyExtractor={(m) => m.id}
            renderItem={({ item }) => <Bubble m={item} t={t} />}
            contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12, gap: 8 }}
            onEndReached={loadMore}
            onEndReachedThreshold={0.3}
            ListFooterComponent={loadingMore ? <ActivityIndicator color={tokens.inkMuted} style={{ marginVertical: 12 }} /> : null}
            ListHeaderComponent={
              typing ? (
                <View style={{ alignSelf: 'flex-start', backgroundColor: '#fff', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18, borderTopLeftRadius: 6, marginBottom: 4, borderWidth: 1, borderColor: tokens.hairline }}>
                  <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 12, color: tokens.inkMuted }}>{t('support.chat.typing')}</Text>
                </View>
              ) : null
            }
            keyboardShouldPersistTaps="handled"
          />
        )}

        {/* Ввод */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'flex-end',
            gap: 10,
            paddingHorizontal: 16,
            paddingTop: 10,
            paddingBottom: 28,
            backgroundColor: 'rgba(237,237,237,0.96)',
            borderTopWidth: 1,
            borderTopColor: tokens.hairline,
          }}
        >
          <Pressable
            onPress={attach}
            disabled={sending}
            style={{ width: 44, height: 44, borderRadius: 999, backgroundColor: tokens.glass, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: tokens.hairline }}
          >
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={tokens.inkDark} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
              <Path d="M21.4 11.05L12.5 19.95a5.5 5.5 0 11-7.78-7.78L13.62 3.27a3.66 3.66 0 015.17 5.17L9.88 17.33a1.83 1.83 0 11-2.59-2.59L15.83 6.2" />
            </Svg>
          </Pressable>
          <View style={{ flex: 1, minHeight: 44, maxHeight: 120, backgroundColor: '#fff', borderRadius: 22, borderWidth: 1, borderColor: tokens.hairline, paddingHorizontal: 16, justifyContent: 'center' }}>
            <TextInput
              value={text}
              onChangeText={onChangeText}
              placeholder={t('support.chat.inputPlaceholder')}
              placeholderTextColor={tokens.inkMuted}
              multiline
              style={{ fontFamily: 'Manrope_400Regular', fontSize: 15, color: tokens.ink, paddingVertical: Platform.OS === 'ios' ? 12 : 8 }}
            />
          </View>
          <Pressable
            onPress={send}
            disabled={sending || !text.trim()}
            style={{
              width: 44,
              height: 44,
              borderRadius: 999,
              backgroundColor: text.trim() ? tokens.red : 'rgba(230,20,40,0.35)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Svg width={16} height={16} viewBox="0 0 24 24" fill="#fff">
              <Path d="M3 11l18-8-8 18-2-7-8-3z" />
            </Svg>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </PhoneFrame>
  );
}

function Bubble({ m, t }: { m: SupportMessage; t: TFunction }) {
  if (m.senderRole === 'SYSTEM') {
    return (
      <View style={{ alignSelf: 'center', backgroundColor: 'rgba(20,20,20,0.05)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999 }}>
        <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 11, color: tokens.inkMuted }}>
          {m.body} · {time(m.createdAt)}
        </Text>
      </View>
    );
  }
  const me = m.senderRole === 'USER';
  const isImage = (m.attachment?.mime ?? '').startsWith('image/');
  return (
    <View style={{ maxWidth: '82%', alignSelf: me ? 'flex-end' : 'flex-start', alignItems: me ? 'flex-end' : 'flex-start', gap: 2 }}>
      {!me && (
        <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 11, color: tokens.inkMuted, paddingLeft: 12 }}>
          {t('support.chat.operator')}
        </Text>
      )}
      <View
        style={{
          backgroundColor: me ? tokens.red : '#fff',
          paddingHorizontal: 14,
          paddingVertical: 10,
          borderRadius: 20,
          borderBottomRightRadius: me ? 6 : 20,
          borderBottomLeftRadius: me ? 20 : 6,
          borderWidth: me ? 0 : 1,
          borderColor: tokens.hairline,
          gap: 6,
        }}
      >
        {m.attachment && isImage && m.attachment.url && (
          <Image source={{ uri: m.attachment.url }} style={{ width: 200, height: 200, borderRadius: 12 }} resizeMode="cover" />
        )}
        {m.attachment && !isImage && (
          <Text style={{ fontFamily: 'Manrope_500Medium', fontSize: 13, color: me ? '#fff' : tokens.blue }}>
            📎 {m.attachment.name ?? t('support.chat.file')}
          </Text>
        )}
        {m.body ? (
          <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 14, lineHeight: 20, color: me ? '#fff' : tokens.ink }}>
            {m.body}
          </Text>
        ) : null}
      </View>
      <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 10, color: tokens.inkSubtle, paddingHorizontal: 12 }}>
        {time(m.createdAt)}
      </Text>
    </View>
  );
}
