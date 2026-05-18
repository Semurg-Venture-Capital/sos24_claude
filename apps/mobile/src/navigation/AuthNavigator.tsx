import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthChooseScreen } from '../features/auth/screens/AuthChooseScreen';
import { OnboardingScreen } from '../features/auth/screens/OnboardingScreen';
import { OtpScreen } from '../features/auth/screens/OtpScreen';
import { PhoneScreen } from '../features/auth/screens/PhoneScreen';
import { ProfileSetupScreen } from '../features/auth/screens/ProfileSetupScreen';
import type { AuthStackParamList } from './types';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export function AuthNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: 'white' } }}>
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="AuthChoose" component={AuthChooseScreen} />
      <Stack.Screen name="Phone" component={PhoneScreen} />
      <Stack.Screen name="Otp" component={OtpScreen} />
      <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
    </Stack.Navigator>
  );
}
