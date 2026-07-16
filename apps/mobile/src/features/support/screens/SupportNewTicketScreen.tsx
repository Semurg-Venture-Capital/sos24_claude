import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useCreateTicket, type SupportCategory } from '../../../api/support';
import { BackButton } from '../../../components/ui/BackButton';
import { DismissKeyboardView } from '../../../components/ui/DismissKeyboardView';
import { PhoneFrame } from '../../../components/ui/PhoneFrame';
import { RedButton } from '../../../components/ui/RedButton';
import { TextField } from '../../../components/ui/TextField';
import { tokens } from '../../../theme/colors';
import type { SupportStackParamList } from '../../../navigation/types';

type Nav = NativeStackNavigationProp<SupportStackParamList, 'SupportNewTicket'>;

const CATEGORIES: SupportCategory[] = ['POLICY', 'PAYMENT', 'ACCIDENT', 'ACCOUNT', 'OTHER'];

export function SupportNewTicketScreen() {
  const nav = useNavigation<Nav>();
  const { t } = useTranslation();
  const create = useCreateTicket();
  const [category, setCategory] = useState<SupportCategory>('OTHER');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');

  const canSubmit = subject.trim().length >= 2 && !create.isPending;

  const submit = async () => {
    if (!canSubmit) return;
    const ticket = await create.mutateAsync({
      subject: subject.trim(),
      category,
      body: body.trim() || undefined,
    });
    nav.replace('SupportChat', { ticketId: ticket.id, subject: ticket.subject });
  };

  return (
    <PhoneFrame>
      <DismissKeyboardView style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 24, paddingTop: 8, paddingBottom: 12 }}>
          <BackButton onPress={() => nav.goBack()} />
          <Text style={{ fontFamily: 'NeueMontreal-Medium', fontSize: 26, letterSpacing: -0.26, color: tokens.ink }}>
            {t('support.newTicket.title')}
          </Text>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40, gap: 20 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={{ gap: 10 }}>
            <Text style={{ fontFamily: 'Manrope_600SemiBold', fontSize: 13, color: tokens.inkMuted }}>{t('support.newTicket.categoryLabel')}</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {CATEGORIES.map((c) => {
                const active = c === category;
                return (
                  <Pressable
                    key={c}
                    onPress={() => setCategory(c)}
                    style={{
                      paddingHorizontal: 14,
                      paddingVertical: 9,
                      borderRadius: 999,
                      backgroundColor: active ? tokens.inkDark : tokens.glass,
                      borderWidth: active ? 0 : 1,
                      borderColor: tokens.hairline,
                    }}
                  >
                    <Text style={{ fontFamily: 'Manrope_500Medium', fontSize: 13, color: active ? '#fff' : tokens.inkDark }}>
                      {t('support.map.' + c)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <TextField
            label={t('support.newTicket.subjectLabel')}
            placeholder={t('support.newTicket.subjectPlaceholder')}
            value={subject}
            onChangeText={setSubject}
            maxLength={120}
          />

          <TextField
            label={t('support.newTicket.bodyLabel')}
            placeholder={t('support.newTicket.bodyPlaceholder')}
            value={body}
            onChangeText={setBody}
            multiline
            numberOfLines={5}
            maxLength={4000}
            containerStyle={{ minHeight: 120 }}
          />
        </ScrollView>

        <View style={{ paddingHorizontal: 24, paddingBottom: 12, paddingTop: 4 }}>
          <RedButton onPress={submit} disabled={!canSubmit}>
            {create.isPending ? t('support.newTicket.creating') : t('support.newTicket.submit')}
          </RedButton>
        </View>
      </DismissKeyboardView>
    </PhoneFrame>
  );
}
