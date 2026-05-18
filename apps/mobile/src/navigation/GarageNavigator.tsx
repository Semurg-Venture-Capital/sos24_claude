import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GarageEditScreen } from '../features/garage/screens/GarageEditScreen';
import { GarageListScreen } from '../features/garage/screens/GarageListScreen';
import type { GarageStackParamList } from './types';

const Stack = createNativeStackNavigator<GarageStackParamList>();

export function GarageNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: 'rgb(228,228,228)' },
      }}
    >
      <Stack.Screen name="GarageList" component={GarageListScreen} />
      <Stack.Screen name="GarageEdit" component={GarageEditScreen} />
    </Stack.Navigator>
  );
}
