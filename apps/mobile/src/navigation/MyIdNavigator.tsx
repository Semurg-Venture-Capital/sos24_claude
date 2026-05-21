import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MyIdOnboardingScreen } from '../features/myid/screens/MyIdOnboardingScreen';
import type { MyIdStackParamList } from './types';

const Stack = createNativeStackNavigator<MyIdStackParamList>();

export function MyIdNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: 'white' } }}>
      <Stack.Screen name="MyIdOnboarding" component={MyIdOnboardingScreen} />
    </Stack.Navigator>
  );
}
