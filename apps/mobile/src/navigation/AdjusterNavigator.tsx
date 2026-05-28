import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AdjusterRequestScreen } from '../features/adjuster/screens/AdjusterRequestScreen';
import { AdjusterSentScreen } from '../features/adjuster/screens/AdjusterSentScreen';
import { AdjusterStatusScreen } from '../features/adjuster/screens/AdjusterStatusScreen';
import type { AdjusterStackParamList } from './types';

const Stack = createNativeStackNavigator<AdjusterStackParamList>();

export function AdjusterNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: 'rgb(228,228,228)' } }}>
      <Stack.Screen name="AdjusterRequest" component={AdjusterRequestScreen} />
      <Stack.Screen name="AdjusterSent" component={AdjusterSentScreen} />
      <Stack.Screen name="AdjusterStatus" component={AdjusterStatusScreen} />
    </Stack.Navigator>
  );
}
