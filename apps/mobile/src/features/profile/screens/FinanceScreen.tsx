import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { useCards, useCreateCard, useDeleteCard, useSetDefaultCard } from '../../../api/cards';
import { usePaymentHistory } from '../../../api/payments';
import type { CardBrandApi } from '../../../api/types';
import { useTopupWallet, useWallet } from '../../../api/wallet';
import { AddTile } from '../../../components/ui/AddTile';
import { BackButton } from '../../../components/ui/BackButton';
import { PhoneFrame } from '../../../components/ui/PhoneFrame';
import { RedButton } from '../../../components/ui/RedButton';
import { SavedCardBig } from '../../../components/ui/SavedCardBig';
import { ScreenHeading } from '../../../components/ui/ScreenHeading';
import { Segmented } from '../../../components/ui/Segmented';
import { TextField } from '../../../components/ui/TextField';
import { useMe } from '../../../api/auth';
import { tokens } from '../../../theme/colors';
import type { ProfileStackParamList } from '../../../navigation/types';

type Nav = NativeStackNavigationProp<ProfileStackParamList, 'Finance'>;

const TX_ICONS: Record<string, string> = {
  TOPUP: '↑',
  PAYMENT: '↓',
  REFUND: '↩',
  BONUS: '★',
};

const PAYMENT_METHOD_LABEL: Record<string, string> = {
  WALLET: 'Кошелёк',
  CARD: 'Карта',
  PAYME: 'Payme',
  CLICK: 'Click',
};

// M-Finance — Финансы: кошелёк + карты + история операций
export function FinanceScreen() {
  const nav = useNavigation<Nav>();
  const { data: wallet, isLoading: walletLoading } = useWallet();
  const { data: cards, isLoading: cardsLoading } = useCards();
  const { data: payments } = usePaymentHistory();
  const { data: me } = useMe();
  const topup = useTopupWallet();
  const createCard = useCreateCard();
  const deleteCard = useDeleteCard();
  const setDefault = useSetDefaultCard();

  const [showAddCard, setShowAddCard] = useState(false);
  const [showTopup, setShowTopup] = useState(false);
  const [addBrand, setAddBrand] = useState<'UZCARD' | 'HUMO'>('UZCARD');
  const [addLast4, setAddLast4] = useState('');
  const [addExpiry, setAddExpiry] = useState('');
  const [topupAmount, setTopupAmount] = useState('');

  const holderName =
    me && (me.name || me.surname)
      ? `${me.name?.[0] ?? ''}. ${(me.surname ?? '').toUpperCase()}`.trim()
      : '—';

  const supportedCards = cards?.filter((c) => c.brand === 'UZCARD' || c.brand === 'HUMO') ?? [];

  const handleAddCard = async () => {
    if (addLast4.length < 4 || addExpiry.length < 5) return;
    try {
      await createCard.mutateAsync({ brand: addBrand as CardBrandApi, last4: addLast4, expiry: addExpiry });
      setShowAddCard(false);
      setAddLast4('');
      setAddExpiry('');
    } catch {
      Alert.alert('Ошибка', 'Не удалось добавить карту');
    }
  };

  const handleDeleteCard = (id: string, last4: string) => {
    Alert.alert('Удалить карту', `Карта •••• ${last4} будет удалена`, [
      { text: 'Отмена', style: 'cancel' },
      { text: 'Удалить', style: 'destructive', onPress: () => deleteCard.mutate(id) },
    ]);
  };

  const handleSetDefault = (id: string) => {
    setDefault.mutate(id);
  };

  const handleTopup = async () => {
    const amount = parseInt(topupAmount.replace(/\D/g, ''), 10);
    if (!amount || amount < 1000) {
      Alert.alert('Ошибка', 'Минимальная сумма пополнения 1 000 сум');
      return;
    }
    try {
      await topup.mutateAsync(amount);
      setShowTopup(false);
      setTopupAmount('');
    } catch {
      Alert.alert('Ошибка', 'Не удалось пополнить кошелёк');
    }
  };

  return (
    <PhoneFrame>
      <View style={{ flexDirection: 'row', paddingHorizontal: 24, paddingTop: 8, paddingBottom: 16 }}>
        <BackButton onPress={() => nav.goBack()} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 60, gap: 28 }}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeading title="Финансы" subtitle="Кошелёк, карты и история платежей" />

        {/* Wallet card */}
        <View style={{ borderRadius: 28, overflow: 'hidden' }}>
          <LinearGradient
            colors={['#0a0a0a', '#1a1a2e']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ padding: 24, gap: 16 }}
          >
            {/* Decorative orbs */}
            <View style={{ position: 'absolute', right: -30, top: -30, width: 120, height: 120, borderRadius: 999, backgroundColor: 'rgba(230,20,40,0.12)' }} />
            <View style={{ position: 'absolute', left: -20, bottom: -20, width: 80, height: 80, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.04)' }} />

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 12, color: 'rgba(255,255,255,0.5)', letterSpacing: 1, textTransform: 'uppercase' }}>
                SOS24 Кошелёк
              </Text>
            </View>

            {walletLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <View style={{ gap: 4 }}>
                <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
                  <Text style={{ fontFamily: 'NeueMontreal-Medium', fontSize: 36, color: '#fff', letterSpacing: -0.72 }}>
                    {(wallet?.balance ?? 0).toLocaleString('ru-RU')}
                  </Text>
                  <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 14, color: 'rgba(255,255,255,0.5)' }}>
                    сум
                  </Text>
                </View>
              </View>
            )}

            <Pressable
              onPress={() => setShowTopup(true)}
              style={({ pressed }) => ({
                alignSelf: 'flex-start',
                backgroundColor: tokens.red,
                borderRadius: 12,
                paddingHorizontal: 20,
                paddingVertical: 10,
                opacity: pressed ? 0.8 : 1,
              })}
            >
              <Text style={{ fontFamily: 'Manrope_600SemiBold', fontSize: 13, color: '#fff' }}>
                Пополнить
              </Text>
            </Pressable>
          </LinearGradient>
        </View>

        {/* Cards section */}
        <View style={{ gap: 12 }}>
          <Text style={{ fontFamily: 'Manrope_600SemiBold', fontSize: 11, color: tokens.inkSubtle, letterSpacing: 0.88, textTransform: 'uppercase' }}>
            Мои карты
          </Text>

          {cardsLoading ? (
            <ActivityIndicator color={tokens.red} />
          ) : (
            <View style={{ gap: 12 }}>
              {supportedCards.map((card) => (
                <Pressable
                  key={card.id}
                  onLongPress={() =>
                    Alert.alert(
                      `•••• ${card.last4}`,
                      `Баланс: ${card.balance.toLocaleString('ru-RU')} сум`,
                      [
                        { text: 'Отмена', style: 'cancel' },
                        !card.isDefault
                          ? { text: 'Сделать основной', onPress: () => handleSetDefault(card.id) }
                          : { text: 'Основная карта', style: 'destructive' },
                        { text: 'Удалить', style: 'destructive', onPress: () => handleDeleteCard(card.id, card.last4) },
                      ],
                    )
                  }
                  delayLongPress={400}
                >
                  <View>
                    <SavedCardBig
                      brand={card.brand === 'UZCARD' ? 'uzcard' : 'humo'}
                      last4={card.last4}
                      expiry={card.expiry}
                      holder={holderName}
                      primary={card.isDefault}
                      balance={card.balance}
                    />
                  </View>
                </Pressable>
              ))}

              {supportedCards.length === 0 && (
                <View style={{ paddingVertical: 16, alignItems: 'center' }}>
                  <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 14, color: tokens.inkMuted }}>
                    Нет сохранённых карт
                  </Text>
                </View>
              )}

              <AddTile onPress={() => setShowAddCard(true)}>Добавить карту</AddTile>

              <View style={{ borderRadius: 14, backgroundColor: 'rgba(20,20,20,0.04)', padding: 14 }}>
                <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 12, color: tokens.inkMuted, lineHeight: 18 }}>
                  Поддерживаются Uzcard и Humo. Удержите карту для управления.
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Transaction history */}
        <View style={{ gap: 12 }}>
          <Text style={{ fontFamily: 'Manrope_600SemiBold', fontSize: 11, color: tokens.inkSubtle, letterSpacing: 0.88, textTransform: 'uppercase' }}>
            История операций
          </Text>

          {/* Wallet transactions */}
          {wallet?.transactions && wallet.transactions.length > 0 ? (
            <View style={{ gap: 1, borderRadius: 20, overflow: 'hidden' }}>
              {wallet.transactions.slice(0, 10).map((tx) => (
                <View
                  key={tx.id}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                    backgroundColor: 'rgba(255,255,255,0.7)',
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                  }}
                >
                  <View style={{
                    width: 36,
                    height: 36,
                    borderRadius: 999,
                    backgroundColor: tx.amount > 0 ? 'rgba(16,185,129,0.1)' : 'rgba(230,20,40,0.08)',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <Text style={{ fontSize: 16, color: tx.amount > 0 ? '#059669' : tokens.red }}>
                      {TX_ICONS[tx.type] ?? '·'}
                    </Text>
                  </View>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={{ fontFamily: 'Manrope_500Medium', fontSize: 14, color: tokens.ink }} numberOfLines={1}>
                      {tx.description ?? tx.type}
                    </Text>
                    <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 12, color: tokens.inkMuted }}>
                      {new Date(tx.createdAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                  <Text style={{
                    fontFamily: 'NeueMontreal-Medium',
                    fontSize: 15,
                    color: tx.amount > 0 ? '#059669' : tokens.ink,
                    letterSpacing: -0.3,
                  }}>
                    {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString('ru-RU')}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}

          {/* Card payments */}
          {payments && payments.filter((p) => p.method === 'CARD' && p.status === 'SUCCESS').length > 0 ? (
            <View style={{ gap: 1, borderRadius: 20, overflow: 'hidden' }}>
              {payments.filter((p) => p.method === 'CARD' && p.status === 'SUCCESS').slice(0, 10).map((p) => (
                <View
                  key={p.id}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                    backgroundColor: 'rgba(255,255,255,0.7)',
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                  }}
                >
                  <View style={{
                    width: 36,
                    height: 36,
                    borderRadius: 999,
                    backgroundColor: 'rgba(230,20,40,0.08)',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <Text style={{ fontSize: 14, color: tokens.red }}>↓</Text>
                  </View>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={{ fontFamily: 'Manrope_500Medium', fontSize: 14, color: tokens.ink }}>
                      Оплата полиса · {PAYMENT_METHOD_LABEL[p.method]}
                    </Text>
                    <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 12, color: tokens.inkMuted }}>
                      {new Date(p.createdAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                  <Text style={{ fontFamily: 'NeueMontreal-Medium', fontSize: 15, color: tokens.ink, letterSpacing: -0.3 }}>
                    -{p.amount.toLocaleString('ru-RU')}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}

          {(!wallet?.transactions || wallet.transactions.length === 0) &&
            (!payments || payments.filter((p) => p.method === 'CARD' && p.status === 'SUCCESS').length === 0) && (
            <View style={{ paddingVertical: 24, alignItems: 'center' }}>
              <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 14, color: tokens.inkMuted }}>
                Операций пока нет
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Add card modal */}
      <Modal visible={showAddCard} transparent animationType="slide" onRequestClose={() => setShowAddCard(false)}>
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <View style={{ backgroundColor: '#fff', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingBottom: 40, gap: 16 }}>
            <Text style={{ fontFamily: 'NeueMontreal-Medium', fontSize: 22, letterSpacing: -0.11, color: tokens.ink }}>
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
            <Pressable onPress={() => setShowAddCard(false)}>
              <Text style={{ textAlign: 'center', color: tokens.inkMuted, fontFamily: 'Manrope_500Medium', fontSize: 14 }}>
                Отмена
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Topup modal */}
      <Modal visible={showTopup} transparent animationType="slide" onRequestClose={() => setShowTopup(false)}>
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <View style={{ backgroundColor: '#fff', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingBottom: 40, gap: 16 }}>
            <Text style={{ fontFamily: 'NeueMontreal-Medium', fontSize: 22, letterSpacing: -0.11, color: tokens.ink }}>
              Пополнить кошелёк
            </Text>
            <TextField
              label="Сумма пополнения"
              value={topupAmount}
              onChangeText={setTopupAmount}
              placeholder="100 000"
              keyboardType="number-pad"
            />
            <View style={{ marginTop: 4 }}>
              <RedButton
                onPress={handleTopup}
                disabled={!topupAmount || topup.isPending}
              >
                {topup.isPending ? 'Пополнение...' : 'Пополнить'}
              </RedButton>
            </View>
            <Pressable onPress={() => setShowTopup(false)}>
              <Text style={{ textAlign: 'center', color: tokens.inkMuted, fontFamily: 'Manrope_500Medium', fontSize: 14 }}>
                Отмена
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </PhoneFrame>
  );
}
