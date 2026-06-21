import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMemo, useState } from 'react';
import { Linking, Pressable, ScrollView, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { BackButton } from '../../../components/ui/BackButton';
import { Glass } from '../../../components/ui/Glass';
import { PhoneFrame } from '../../../components/ui/PhoneFrame';
import { ScreenHeading } from '../../../components/ui/ScreenHeading';
import { tokens } from '../../../theme/colors';
import { FAQ, FAQ_CATEGORIES } from '../data/faq';
import type { SupportStackParamList } from '../../../navigation/types';

type Nav = NativeStackNavigationProp<SupportStackParamList, 'SupportHub'>;

const SUPPORT_PHONE = '+998993286300';

export function SupportHubScreen() {
  const nav = useNavigation<Nav>();
  const [cat, setCat] = useState<string>('Все');
  const [open, setOpen] = useState<number | null>(0);

  const items = useMemo(() => (cat === 'Все' ? FAQ : FAQ.filter((f) => f.category === cat)), [cat]);

  return (
    <PhoneFrame>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 24, paddingTop: 8, paddingBottom: 4 }}>
        <BackButton onPress={() => nav.goBack()} />
      </View>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 60, gap: 20 }}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeading title="Поддержка" subtitle="Ответим в среднем за 5 минут · 24/7" style={{ marginTop: 8 }} />

        {/* Hero — написать в чат */}
        <Pressable
          onPress={() => nav.navigate('SupportTickets')}
          style={({ pressed }) => ({
            backgroundColor: tokens.inkDark,
            borderRadius: 28,
            padding: 22,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 16,
            opacity: pressed ? 0.92 : 1,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 18 },
            shadowOpacity: 0.28,
            shadowRadius: 28,
            elevation: 8,
          })}
        >
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: 999,
              backgroundColor: tokens.red,
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: tokens.red,
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.5,
              shadowRadius: 14,
            }}
          >
            <ChatIcon color="#fff" size={24} />
          </View>
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={{ fontFamily: 'NeueMontreal-Medium', fontSize: 20, color: '#fff', letterSpacing: -0.1 }}>
              Написать в чат
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View style={{ width: 6, height: 6, borderRadius: 999, backgroundColor: tokens.green }} />
              <Text style={{ fontFamily: 'Manrope_600SemiBold', fontSize: 12, color: tokens.green, letterSpacing: 0.2 }}>
                онлайн · отвечаем 24/7
              </Text>
            </View>
          </View>
          <Svg width={10} height={16} viewBox="0 0 10 16" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth={2} strokeLinecap="round">
            <Path d="M2 2l6 6-6 6" />
          </Svg>
        </Pressable>

        {/* Вторичные действия */}
        <View style={{ gap: 8 }}>
          <SupportRow
            icon={<PhoneIcon color={tokens.red} />}
            title="Позвонить в SOS24"
            meta={`${SUPPORT_PHONE} · бесплатно`}
            onPress={() => Linking.openURL(`tel:${SUPPORT_PHONE}`)}
          />
        </View>

        {/* FAQ */}
        <View style={{ gap: 14 }}>
          <Text style={{ fontFamily: 'NeueMontreal-Medium', fontSize: 18, color: tokens.ink, letterSpacing: -0.1 }}>
            Частые вопросы
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {FAQ_CATEGORIES.map((c) => {
              const active = c === cat;
              return (
                <Pressable
                  key={c}
                  onPress={() => {
                    setCat(c);
                    setOpen(null);
                  }}
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                    borderRadius: 999,
                    backgroundColor: active ? tokens.inkDark : tokens.glass,
                    borderWidth: active ? 0 : 1,
                    borderColor: tokens.hairline,
                  }}
                >
                  <Text style={{ fontFamily: 'Manrope_500Medium', fontSize: 12, color: active ? '#fff' : tokens.inkDark }}>
                    {c}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <Glass intensity={20} tint="light" style={{ backgroundColor: tokens.glass, borderRadius: 22, borderWidth: 1, borderColor: tokens.hairline, overflow: 'hidden' }}>
            {items.map((f, i) => {
              const isOpen = open === i;
              return (
                <Pressable
                  key={f.question}
                  onPress={() => setOpen(isOpen ? null : i)}
                  style={{
                    paddingHorizontal: 18,
                    paddingVertical: 14,
                    borderBottomWidth: i === items.length - 1 ? 0 : 1,
                    borderBottomColor: tokens.hairline,
                    gap: isOpen ? 8 : 0,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                    <Text style={{ flex: 1, fontFamily: 'Manrope_500Medium', fontSize: 14, color: tokens.ink, letterSpacing: -0.07 }}>
                      {f.question}
                    </Text>
                    <Svg
                      width={14}
                      height={14}
                      viewBox="0 0 14 14"
                      fill="none"
                      stroke={tokens.inkMuted}
                      strokeWidth={1.8}
                      strokeLinecap="round"
                      style={{ transform: [{ rotate: isOpen ? '180deg' : '0deg' }] }}
                    >
                      <Path d="M3 5l4 4 4-4" />
                    </Svg>
                  </View>
                  {isOpen && (
                    <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 13, color: tokens.inkMuted, lineHeight: 19 }}>
                      {f.answer}
                    </Text>
                  )}
                </Pressable>
              );
            })}
          </Glass>
        </View>
      </ScrollView>
    </PhoneFrame>
  );
}

function SupportRow({ icon, title, meta, onPress }: { icon: React.ReactNode; title: string; meta: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ borderRadius: 20, overflow: 'hidden', opacity: pressed ? 0.7 : 1 })}>
      <Glass intensity={20} tint="light" style={{ backgroundColor: tokens.glass, borderRadius: 20, borderWidth: 1, borderColor: tokens.hairline, flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14 }}>
        <View style={{ width: 36, height: 36, borderRadius: 999, backgroundColor: tokens.glassStrong, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: tokens.hairline }}>
          {icon}
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={{ fontFamily: 'Manrope_600SemiBold', fontSize: 14, color: tokens.ink, letterSpacing: -0.07 }}>{title}</Text>
          <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 12, color: tokens.inkMuted }}>{meta}</Text>
        </View>
        <Svg width={8} height={14} viewBox="0 0 8 14" fill="none" stroke={tokens.inkMuted} strokeWidth={2} strokeLinecap="round">
          <Path d="M1 1l6 6-6 6" />
        </Svg>
      </Glass>
    </Pressable>
  );
}

function ChatIcon({ color = tokens.ink, size = 20 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />
    </Svg>
  );
}

function PhoneIcon({ color = tokens.ink, size = 17 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.13.96.36 1.9.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0122 16.92z" />
    </Svg>
  );
}
