import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Platform } from 'react-native';
import { BottomTabBar } from '../components/ui/BottomTabBar';
import { HomeScreen } from '../features/main/screens/HomeScreen';
import { GarageNavigator } from './GarageNavigator';
import { PoliciesNavigator } from './PoliciesNavigator';
import { ProfileNavigator } from './ProfileNavigator';
import { PurchaseNavigator } from './PurchaseNavigator';
import type { MainStackParamList, MainTabParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: 'rgb(228,228,228)' },
      }}
      tabBar={(props) => <BottomTabBar {...props} />}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Policies" component={PoliciesNavigator} />
      <Tab.Screen name="Garage" component={GarageNavigator} />
      <Tab.Screen name="Profile" component={ProfileNavigator} />
    </Tab.Navigator>
  );
}

const Stack = createNativeStackNavigator<MainStackParamList>();

// MainNavigator оборачивает табы в Stack, чтобы поверх можно было показывать
// модальные потоки (покупка полиса, заявление о ДТП и т.п.) поверх tab-бара.
export function MainNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: 'rgb(228,228,228)' },
      }}
    >
      <Stack.Screen name="Tabs" component={MainTabs} />
      <Stack.Screen
        name="Purchase"
        component={PurchaseNavigator}
        options={
          // На native — модалка снизу (нативный feel «купить полис»).
          // На web — обычный push справа: react-native-web модальные
          // презентации native-stack рендерит криво (часто пустой экран),
          // поэтому на вебе используем стандартную push-навигацию.
          Platform.OS === 'web'
            ? {}
            : { presentation: 'modal', animation: 'slide_from_bottom' }
        }
      />
    </Stack.Navigator>
  );
}
