import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeBottomTabNavigator } from '@react-navigation/bottom-tabs/unstable';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Platform } from 'react-native';
import { AdjusterNavigator } from './AdjusterNavigator';
import { GarageNavigator } from './GarageNavigator';
import { HomeScreen } from '../features/main/screens/HomeScreen';
import { PoliciesNavigator } from './PoliciesNavigator';
import { ProfileNavigator } from './ProfileNavigator';
import { PurchaseNavigator } from './PurchaseNavigator';
import { FloatingTabBar } from '../components/ui/FloatingTabBar';
import { tokens } from '../theme/colors';
import type { MainStackParamList, MainTabParamList } from './types';

const isIOS = Platform.OS === 'ios';

// ───────────────────────── iOS: нативный таб-бар ─────────────────────────
// На iOS это родной UITabBarController, на iOS 26+ автоматически с Liquid Glass.
// Иконки — SF Symbols.
const Tab = createNativeBottomTabNavigator<MainTabParamList>();

function IosTabs() {
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
          tabBarIcon: isIOS
            ? ({ focused }) => ({ type: 'sfSymbol', name: focused ? 'house.fill' : 'house' })
            : undefined,
        }}
      />
      <Tab.Screen
        name="Policies"
        component={PoliciesNavigator}
        options={{
          tabBarLabel: 'Полисы',
          tabBarIcon: isIOS
            ? ({ focused }) => ({ type: 'sfSymbol', name: focused ? 'shield.fill' : 'shield' })
            : undefined,
        }}
      />
      <Tab.Screen
        name="Garage"
        component={GarageNavigator}
        options={{
          tabBarLabel: 'Гараж',
          tabBarIcon: isIOS
            ? ({ focused }) => ({ type: 'sfSymbol', name: focused ? 'car.fill' : 'car' })
            : undefined,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileNavigator}
        options={{
          tabBarLabel: 'Профиль',
          tabBarIcon: isIOS
            ? ({ focused }) => ({ type: 'sfSymbol', name: focused ? 'person.fill' : 'person' })
            : undefined,
        }}
      />
    </Tab.Navigator>
  );
}

// ──────────────── Android: JS-табы + плавающий бар (Вариант 3) ────────────────
const JsTab = createBottomTabNavigator<MainTabParamList>();

function AndroidTabs() {
  return (
    <JsTab.Navigator
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <FloatingTabBar {...props} />}
    >
      <JsTab.Screen name="Home" component={HomeScreen} />
      <JsTab.Screen name="Policies" component={PoliciesNavigator} />
      <JsTab.Screen name="Garage" component={GarageNavigator} />
      <JsTab.Screen name="Profile" component={ProfileNavigator} />
    </JsTab.Navigator>
  );
}

// Селектор: нативный таб-бар на iOS, плавающий — на Android.
function MainTabs() {
  return isIOS ? <IosTabs /> : <AndroidTabs />;
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
      <Stack.Screen
        name="Adjuster"
        component={AdjusterNavigator}
        options={
          Platform.OS === 'web'
            ? {}
            : { presentation: 'modal', animation: 'slide_from_bottom' }
        }
      />
    </Stack.Navigator>
  );
}
