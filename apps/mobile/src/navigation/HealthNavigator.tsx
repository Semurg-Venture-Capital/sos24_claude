import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HealthHubScreen } from '../features/health/screens/HealthHubScreen';
import { HealthTriageScreen } from '../features/health/screens/HealthTriageScreen';
import { HealthDiagnosisScreen } from '../features/health/screens/HealthDiagnosisScreen';
import { HealthDoctorsScreen } from '../features/health/screens/HealthDoctorsScreen';
import { HealthDoctorProfileScreen } from '../features/health/screens/HealthDoctorProfileScreen';
import { HealthBookingScreen } from '../features/health/screens/HealthBookingScreen';
import { HealthBookingDoneScreen } from '../features/health/screens/HealthBookingDoneScreen';
import { HealthVideoCallScreen } from '../features/health/screens/HealthVideoCallScreen';
import { HealthMedCardScreen } from '../features/health/screens/HealthMedCardScreen';
import { HealthMedCardEditScreen } from '../features/health/screens/HealthMedCardEditScreen';
import { HealthContactsScreen } from '../features/health/screens/HealthContactsScreen';
import type { HealthStackParamList } from './types';

const Stack = createNativeStackNavigator<HealthStackParamList>();

// Навигатор вкладки «Здоровье и SOS-Медицина» (M14). Экран ЧП/SOS (M14.12) —
// корневой модал в MainNavigator, не здесь.
export function HealthNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="HealthHub"
      screenOptions={{ headerShown: false, contentStyle: { backgroundColor: 'rgb(228,228,228)' } }}
    >
      <Stack.Screen name="HealthHub" component={HealthHubScreen} />
      <Stack.Screen name="HealthTriage" component={HealthTriageScreen} />
      <Stack.Screen name="HealthDiagnosis" component={HealthDiagnosisScreen} />
      <Stack.Screen name="HealthDoctors" component={HealthDoctorsScreen} />
      <Stack.Screen name="HealthDoctorProfile" component={HealthDoctorProfileScreen} />
      <Stack.Screen name="HealthBooking" component={HealthBookingScreen} />
      <Stack.Screen name="HealthBookingDone" component={HealthBookingDoneScreen} options={{ gestureEnabled: false }} />
      <Stack.Screen name="HealthVideoCall" component={HealthVideoCallScreen} />
      <Stack.Screen name="HealthMedCard" component={HealthMedCardScreen} />
      <Stack.Screen name="HealthMedCardEdit" component={HealthMedCardEditScreen} />
      <Stack.Screen name="HealthContacts" component={HealthContactsScreen} />
    </Stack.Navigator>
  );
}
