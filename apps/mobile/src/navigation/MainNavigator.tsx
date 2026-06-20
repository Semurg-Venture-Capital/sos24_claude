import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeBottomTabNavigator } from '@react-navigation/bottom-tabs/unstable';
import { getFocusedRouteNameFromRoute, type RouteProp } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Platform } from 'react-native';
import { AdjusterNavigator } from './AdjusterNavigator';
import { EuroNavigator } from './EuroNavigator';
import { GarageNavigator } from './GarageNavigator';
import { HomeScreen } from '../features/main/screens/HomeScreen';
import { NotificationsScreen } from '../features/notifications/screens/NotificationsScreen';
import { PoliciesNavigator } from './PoliciesNavigator';
import { ProfileNavigator } from './ProfileNavigator';
import { PurchaseNavigator } from './PurchaseNavigator';
import { FloatingTabBar } from '../components/ui/FloatingTabBar';
import { tokens } from '../theme/colors';
import type { MainStackParamList, MainTabParamList } from './types';

const isIOS = Platform.OS === 'ios';

// Нижнее меню показываем только на корневом экране вкладки. На любом внутреннем
// экране стека (деталь/редактирование/…) — скрываем: у них своя кнопка «назад» сверху.
// display:'none' читают и нативный iOS-таб (→ tabBarHidden), и FloatingTabBar (Android).
function tabBarStyleFor(
  route: RouteProp<MainTabParamList, 'Policies' | 'Garage' | 'Profile'>,
  rootName: string,
): { display: 'flex' | 'none' } {
  const focused = getFocusedRouteNameFromRoute(route);
  const hide = focused !== undefined && focused !== rootName;
  return { display: hide ? 'none' : 'flex' };
}

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
        options={({ route }) => ({
          tabBarLabel: 'Полисы',
          tabBarIcon: isIOS
            ? ({ focused }) => ({ type: 'sfSymbol', name: focused ? 'shield.fill' : 'shield' })
            : undefined,
          tabBarStyle: tabBarStyleFor(route, 'PoliciesList'),
        })}
      />
      <Tab.Screen
        name="Garage"
        component={GarageNavigator}
        options={({ route }) => ({
          tabBarLabel: 'Гараж',
          tabBarIcon: isIOS
            ? ({ focused }) => ({ type: 'sfSymbol', name: focused ? 'car.fill' : 'car' })
            : undefined,
          tabBarStyle: tabBarStyleFor(route, 'GarageList'),
        })}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileNavigator}
        options={({ route }) => ({
          tabBarLabel: 'Профиль',
          tabBarIcon: isIOS
            ? ({ focused }) => ({ type: 'sfSymbol', name: focused ? 'person.fill' : 'person' })
            : undefined,
          tabBarStyle: tabBarStyleFor(route, 'ProfileMain'),
        })}
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
      <JsTab.Screen
        name="Policies"
        component={PoliciesNavigator}
        options={({ route }) => ({ tabBarStyle: tabBarStyleFor(route, 'PoliciesList') })}
      />
      <JsTab.Screen
        name="Garage"
        component={GarageNavigator}
        options={({ route }) => ({ tabBarStyle: tabBarStyleFor(route, 'GarageList') })}
      />
      <JsTab.Screen
        name="Profile"
        component={ProfileNavigator}
        options={({ route }) => ({ tabBarStyle: tabBarStyleFor(route, 'ProfileMain') })}
      />
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
      {/* Покупка полиса — обычные push-страницы (НЕ модалка): экран идёт как
          полноценная страница, чтобы поток компания → продукт → оформление
          читался как навигация, а не выезжающее снизу окно. */}
      <Stack.Screen name="Purchase" component={PurchaseNavigator} />
      <Stack.Screen
        name="Adjuster"
        component={AdjusterNavigator}
        options={
          Platform.OS === 'web'
            ? {}
            : { presentation: 'modal', animation: 'slide_from_bottom' }
        }
      />
      {/* Европротокол — обычные push-страницы (НЕ модалка): иначе нативный MyID SDK
          не может презентовать свой экран поверх модального стека (зависает спиннер). */}
      <Stack.Screen name="EuroProtocol" component={EuroNavigator} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
    </Stack.Navigator>
  );
}
