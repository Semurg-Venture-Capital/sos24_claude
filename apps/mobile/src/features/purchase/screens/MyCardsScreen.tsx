import { useNavigation } from '@react-navigation/native';
import { Glass } from '../../../components/ui/Glass';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { useMe } from '../../../api/auth';
import { useCards, useCreateCard, useDeleteCard } from '../../../api/cards';
import type { CardBrandApi } from '../../../api/types';
import { AddTile } from '../../../components/ui/AddTile';
import { BackButton } from '../../../components/ui/BackButton';
import { PhoneFrame } from '../../../components/ui/PhoneFrame';
import { RedButton } from '../../../components/ui/RedButton';
import { SavedCardBig } from '../../../components/ui/SavedCardBig';
import { ScreenHeading } from '../../../components/ui/ScreenHeading';
import { Segmented } from '../../../components/ui/Segmented';
import { TextField } from '../../../components/ui/TextField';
import { tokens } from '../../../theme/colors';

// M7.3 — Управление сохранёнными картами.
export function MyCardsScreen() {
  const nav = useNavigation();
  const { data: cards, isLoading } = useCards();
  const { data: me } = useMe();
  const deleteCard = useDeleteCard();
  const createCard = useCreateCard();

  const [showAddModal, setShowAddModal] = useState(false);
  const [addBrand, setAddBrand] = useState<'UZCARD' | 'HUMO'>('UZCARD');
  const [addLast4, setAddLast4] = useState('');
  const [addExpiry, setAddExpiry] = useState('');

  const holderName =
    me && (me.name || me.surname)
      ? `${me.name?.[0] ?? ''}. ${(me.surname ?? '').toUpperCase()}`.trim()
      : '—';

  const handleDelete = (id: string, last4: string) => {
    Alert.alert('Удалить карту', `Карта •••• ${last4} будет удалена`, [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Удалить',
        style: 'destructive',
        onPress: () => deleteCard.mutate(id),
      },
    ]);
  };

  const handleAddCard = async () => {
    if (addLast4.length < 4 || addExpiry.length < 5) return;
    try {
      await createCard.mutateAsync({ brand: addBrand as CardBrandApi, last4: addLast4, expiry: addExpiry });
      setShowAddModal(false);
      setAddLast4('');
      setAddExpiry('');
      setAddBrand('UZCARD');
    } catch {
      Alert.alert('Ошибка', 'Не удалось добавить карту');
    }
  };

  const supportedCards = cards?.filter((c) => c.brand === 'UZCARD' || c.brand === 'HUMO');

  return (
    <PhoneFrame>
      <View
        style={{
          flexDirection: 'row',
          paddingHorizontal: 24,
          paddingTop: 8,
          paddingBottom: 16,
        }}
      >
        <BackButton onPress={() => nav.goBack()} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40, gap: 14 }}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeading title="Мои карты" subtitle="Управление сохранёнными способами оплаты" />

        {isLoading ? (
          <View style={{ paddingTop: 40, alignItems: 'center' }}>
            <ActivityIndicator color={tokens.red} />
          </View>
        ) : (
          <View style={{ gap: 14, marginTop: 8 }}>
            {supportedCards?.map((card) => (
              <Pressable
                key={card.id}
                onLongPress={() => handleDelete(card.id, card.last4)}
                delayLongPress={500}
              >
                <SavedCardBig
                  brand={card.brand === 'UZCARD' ? 'uzcard' : 'humo'}
                  last4={card.last4}
                  expiry={card.expiry}
                  holder={holderName}
                  primary={card.isDefault}
                />
              </Pressable>
            ))}

            {(!supportedCards || supportedCards.length === 0) && (
              <View style={{ paddingVertical: 24, alignItems: 'center' }}>
                <Text
                  style={{
                    fontFamily: 'Manrope_400Regular',
                    fontSize: 14,
                    color: tokens.inkMuted,
                    textAlign: 'center',
                  }}
                >
                  Нет сохранённых карт
                </Text>
              </View>
            )}

            <View style={{ marginTop: 6 }}>
              <AddTile onPress={() => setShowAddModal(true)}>Добавить карту</AddTile>
            </View>

            <View style={{ borderRadius: 20, overflow: 'hidden', marginTop: 6 }}>
              <Glass
                intensity={20}
                tint="light"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.5)',
                  padding: 14,
                  paddingHorizontal: 16,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                <View
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 999,
                    backgroundColor: 'rgba(20,20,20,0.06)',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={tokens.inkDark} strokeWidth={1.8} strokeLinecap="round">
                    <Circle cx={12} cy={12} r={9} />
                    <Path d="M12 8v4M12 16h.01" />
                  </Svg>
                </View>
                <Text
                  style={{
                    flex: 1,
                    fontFamily: 'Manrope_400Regular',
                    fontSize: 13,
                    color: tokens.inkMuted,
                    lineHeight: 18,
                  }}
                >
                  Поддерживаются карты Uzcard и Humo. Visa и Mastercard скоро.{'\n'}Удержите карту для удаления.
                </Text>
              </Glass>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Add card modal */}
      <Modal visible={showAddModal} transparent animationType="slide" onRequestClose={() => setShowAddModal(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' }}
        >
          <View
            style={{
              backgroundColor: '#fff',
              borderTopLeftRadius: 32,
              borderTopRightRadius: 32,
              padding: 24,
              paddingBottom: 40,
              gap: 16,
            }}
          >
            <Text
              style={{
                fontFamily: 'NeueMontreal-Medium',
                fontSize: 22,
                letterSpacing: -0.11,
                color: tokens.ink,
              }}
            >
              Добавить карту
            </Text>

            <Segmented
              options={['Uzcard', 'Humo']}
              active={addBrand === 'UZCARD' ? 0 : 1}
              onChange={(i) => setAddBrand(i === 0 ? 'UZCARD' : 'HUMO')}
            />

            <TextField
              label="Последние 4 цифры"
              value={addLast4}
              onChangeText={setAddLast4}
              placeholder="1234"
              keyboardType="number-pad"
              maxLength={4}
            />

            <TextField
              label="Срок действия (ММ/ГГ)"
              value={addExpiry}
              onChangeText={setAddExpiry}
              placeholder="08/27"
              maxLength={5}
            />

            <View style={{ marginTop: 4 }}>
              <RedButton
                onPress={handleAddCard}
                disabled={addLast4.length < 4 || addExpiry.length < 5 || createCard.isPending}
              >
                {createCard.isPending ? 'Сохранение...' : 'Сохранить'}
              </RedButton>
            </View>

            <Pressable onPress={() => setShowAddModal(false)}>
              <Text
                style={{
                  textAlign: 'center',
                  color: tokens.inkMuted,
                  fontFamily: 'Manrope_500Medium',
                  fontSize: 14,
                }}
              >
                Отмена
              </Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </PhoneFrame>
  );
}
