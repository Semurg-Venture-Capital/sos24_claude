import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { EuroStartScreen } from '../features/europrotocol/screens/EuroStartScreen';
import { EuroCheckScreen } from '../features/europrotocol/screens/EuroCheckScreen';
import { EuroStep1Screen } from '../features/europrotocol/screens/EuroStep1Screen';
import { EuroStep2Screen } from '../features/europrotocol/screens/EuroStep2Screen';
import { EuroStep3Screen } from '../features/europrotocol/screens/EuroStep3Screen';
import { EuroStep4Screen } from '../features/europrotocol/screens/EuroStep4Screen';
import type { EuroStackParamList } from './types';

const Stack = createNativeStackNavigator<EuroStackParamList>();

export function EuroNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: 'rgb(228,228,228)' } }}>
      <Stack.Screen name="EuroStart" component={EuroStartScreen} />
      <Stack.Screen name="EuroCheck" component={EuroCheckScreen} />
      <Stack.Screen name="EuroStep1" component={EuroStep1Screen} />
      <Stack.Screen name="EuroStep2" component={EuroStep2Screen} />
      <Stack.Screen name="EuroStep3" component={EuroStep3Screen} />
      <Stack.Screen name="EuroStep4" component={EuroStep4Screen} />
    </Stack.Navigator>
  );
}
