import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { PoliciesListScreen } from '../features/policies/screens/PoliciesListScreen';
import { PolicyDetailScreen } from '../features/policies/screens/PolicyDetailScreen';
import { PolicyQrFullscreenScreen } from '../features/policies/screens/PolicyQrFullscreenScreen';
import type { PoliciesStackParamList } from './types';

const Stack = createNativeStackNavigator<PoliciesStackParamList>();

export function PoliciesNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: 'rgb(228,228,228)' },
      }}
    >
      <Stack.Screen name="PoliciesList" component={PoliciesListScreen} />
      <Stack.Screen name="PolicyDetail" component={PolicyDetailScreen} />
      <Stack.Screen
        name="PolicyQrFullscreen"
        component={PolicyQrFullscreenScreen}
        options={{ presentation: 'fullScreenModal', animation: 'fade' }}
      />
    </Stack.Navigator>
  );
}
