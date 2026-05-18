import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { CatalogScreen } from '../features/purchase/screens/CatalogScreen';
import { ProductDetailScreen } from '../features/purchase/screens/ProductDetailScreen';
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
    </Stack.Navigator>
  );
}
