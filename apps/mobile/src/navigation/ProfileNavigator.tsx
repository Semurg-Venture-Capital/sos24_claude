import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { DocumentScreen } from '../features/profile/screens/DocumentScreen';
import { FinanceScreen } from '../features/profile/screens/FinanceScreen';
import { ProfileEditScreen } from '../features/profile/screens/ProfileEditScreen';
import { ProfileScreen } from '../features/profile/screens/ProfileScreen';
import type { ProfileStackParamList } from './types';

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export function ProfileNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: 'rgb(228,228,228)' },
      }}
    >
      <Stack.Screen name="ProfileMain" component={ProfileScreen} />
      <Stack.Screen name="ProfileEdit" component={ProfileEditScreen} />
      <Stack.Screen name="Document" component={DocumentScreen} />
      <Stack.Screen name="Finance" component={FinanceScreen} />
    </Stack.Navigator>
  );
}
