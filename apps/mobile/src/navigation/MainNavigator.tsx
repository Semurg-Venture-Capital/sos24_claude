import { createNativeBottomTabNavigator } from '@react-navigation/bottom-tabs/unstable';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Platform } from 'react-native';
import { GarageNavigator } from './GarageNavigator';
import { HomeScreen } from '../features/main/screens/HomeScreen';
import { PoliciesNavigator } from './PoliciesNavigator';
import { ProfileNavigator } from './ProfileNavigator';
import { PurchaseNavigator } from './PurchaseNavigator';
import { tokens } from '../theme/colors';
import type { MainStackParamList, MainTabParamList } from './types';

const Tab = createNativeBottomTabNavigator<MainTabParamList>();

// Нативный bottom tab bar — на iOS это родной UITabBarController, на iOS 26+
// автоматически с Liquid Glass. Иконки — SF Symbols.
// TODO(android): SF Symbols на Android не работают, нужны PNG-иконки
// (type: 'image', source: require(...)). Добавим когда дойдём до Android.
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: tokens.red,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Главная',
          tabBarIcon: ({ focused }) => ({
            type: 'sfSymbol',
            name: focused ? 'house.fill' : 'house',
          }),
        }}
      />
      <Tab.Screen
        name="Policies"
        component={PoliciesNavigator}
        options={{
          tabBarLabel: 'Полисы',
          tabBarIcon: ({ focused }) => ({
            type: 'sfSymbol',
            name: focused ? 'shield.fill' : 'shield',
          }),
        }}
      />
      <Tab.Screen
        name="Garage"
        component={GarageNavigator}
        options={{
          tabBarLabel: 'Гараж',
          tabBarIcon: ({ focused }) => ({
            type: 'sfSymbol',
            name: focused ? 'car.fill' : 'car',
          }),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileNavigator}
        options={{
          tabBarLabel: 'Профиль',
          tabBarIcon: ({ focused }) => ({
            type: 'sfSymbol',
            name: focused ? 'person.fill' : 'person',
          }),
        }}
      />
    </Tab.Navigator>
  );
}

const Stack = createNativeStackNavigator<MainStackParamList>();

// MainNavigator оборачивает нативные табы в Stack, чтобы поверх можно было
// показывать модальные потоки (покупка полиса и т.п.) поверх tab-бара.
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
          Platform.OS === 'web'
            ? {}
            : { presentation: 'modal', animation: 'slide_from_bottom' }
        }
      />
    </Stack.Navigator>
  );
}
