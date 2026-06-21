import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { PartnersCatalogScreen } from '../features/partners/screens/PartnersCatalogScreen';
import { PartnerDetailScreen } from '../features/partners/screens/PartnerDetailScreen';
import { PartnerBookingScreen } from '../features/partners/screens/PartnerBookingScreen';
import { PartnerBookingSuccessScreen } from '../features/partners/screens/PartnerBookingSuccessScreen';
import { MyBookingsScreen } from '../features/partners/screens/MyBookingsScreen';
import type { PartnersStackParamList } from './types';

const Stack = createNativeStackNavigator<PartnersStackParamList>();

export function PartnersNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="PartnersCatalog"
      screenOptions={{ headerShown: false, contentStyle: { backgroundColor: 'rgb(228,228,228)' } }}
    >
      <Stack.Screen name="PartnersCatalog" component={PartnersCatalogScreen} />
      <Stack.Screen name="PartnerDetail" component={PartnerDetailScreen} />
      <Stack.Screen name="PartnerBooking" component={PartnerBookingScreen} />
      <Stack.Screen name="PartnerBookingSuccess" component={PartnerBookingSuccessScreen} options={{ gestureEnabled: false }} />
      <Stack.Screen name="MyBookings" component={MyBookingsScreen} />
    </Stack.Navigator>
  );
}
