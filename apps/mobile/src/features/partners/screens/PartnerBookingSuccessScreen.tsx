import { CommonActions, useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Text, View } from 'react-native';
import { PhoneFrame } from '../../../components/ui/PhoneFrame';
import { RedButton } from '../../../components/ui/RedButton';
import { OutlineButton } from '../../../components/ui/OutlineButton';
import { SuccessTick } from '../../../components/ui/SuccessTick';
import { tokens } from '../../../theme/colors';
import type { PartnersStackParamList } from '../../../navigation/types';

type Nav = NativeStackNavigationProp<PartnersStackParamList, 'PartnerBookingSuccess'>;
type Rt = RouteProp<PartnersStackParamList, 'PartnerBookingSuccess'>;

export function PartnerBookingSuccessScreen() {
  const nav = useNavigation<Nav>();
  const { params } = useRoute<Rt>();
  const when = new Date(params.scheduledAt).toLocaleString('ru-RU', {
    day: '2-digit',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  });

  const goBookings = () =>
    nav.dispatch(
      CommonActions.reset({ index: 1, routes: [{ name: 'PartnersCatalog' }, { name: 'MyBookings' }] }),
    );

  return (
    <PhoneFrame>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, gap: 16 }}>
        <SuccessTick />
        <Text style={{ fontFamily: 'NeueMontreal-Medium', fontSize: 24, color: tokens.ink, textAlign: 'center' }}>Запись создана</Text>
        <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 15, color: tokens.inkMuted, textAlign: 'center' }}>
          {params.partnerName}
          {'\n'}
          {when}
        </Text>
        <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 13, color: tokens.inkMuted, textAlign: 'center' }}>
          Партнёр подтвердит запись — придёт уведомление.
        </Text>
        <View style={{ width: '100%', gap: 10, marginTop: 12 }}>
          <RedButton onPress={goBookings}>Мои записи</RedButton>
          <OutlineButton onPress={() => nav.navigate('PartnersCatalog')}>К партнёрам</OutlineButton>
        </View>
      </View>
    </PhoneFrame>
  );
}
