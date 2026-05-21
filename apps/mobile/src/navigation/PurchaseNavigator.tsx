import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { CalcDriversScreen } from '../features/purchase/screens/CalcDriversScreen';
import { CalcPeriodScreen } from '../features/purchase/screens/CalcPeriodScreen';
import { CalcResultScreen } from '../features/purchase/screens/CalcResultScreen';
import { CalcVehicleScreen } from '../features/purchase/screens/CalcVehicleScreen';
import { CatalogScreen } from '../features/purchase/screens/CatalogScreen';
import { CheckoutScreen } from '../features/purchase/screens/CheckoutScreen';
import { MyCardsScreen } from '../features/purchase/screens/MyCardsScreen';
import { PaymentScreen } from '../features/purchase/screens/PaymentScreen';
import { ProductDetailScreen } from '../features/purchase/screens/ProductDetailScreen';
import { SuccessScreen } from '../features/purchase/screens/SuccessScreen';
import type { PurchaseStackParamList } from './types';

const Stack = createNativeStackNavigator<PurchaseStackParamList>();

export function PurchaseNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: 'rgb(228,228,228)' },
      }}
    >
      <Stack.Screen name="Catalog" component={CatalogScreen} />
      <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
      <Stack.Screen name="CalcVehicle" component={CalcVehicleScreen} />
      <Stack.Screen name="CalcDrivers" component={CalcDriversScreen} />
      <Stack.Screen name="CalcPeriod" component={CalcPeriodScreen} />
      <Stack.Screen name="CalcResult" component={CalcResultScreen} />
      <Stack.Screen name="Checkout" component={CheckoutScreen} />
      <Stack.Screen name="Payment" component={PaymentScreen} />
      <Stack.Screen name="Success" component={SuccessScreen} />
      <Stack.Screen name="MyCards" component={MyCardsScreen} />
    </Stack.Navigator>
  );
}
