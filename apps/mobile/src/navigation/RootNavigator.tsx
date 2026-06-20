import { NavigationContainer } from '@react-navigation/native';
import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { useAuthStore } from '../stores/authStore';
import { markNotificationRead } from '../api/notifications';
import { AuthNavigator } from './AuthNavigator';
import { MainNavigator } from './MainNavigator';
import { MyIdNavigator } from './MyIdNavigator';
import { navigationRef, navigateFromNotification, flushPendingDeeplink } from './navigationRef';
import { SplashScreen } from '../features/auth/screens/SplashScreen';

export function RootNavigator() {
  const status = useAuthStore((s) => s.status);
  const hydrate = useAuthStore((s) => s.hydrate);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  // Тап по push-уведомлению (фон/закрытое и cold start) → отметить прочитанным + deeplink.
  useEffect(() => {
    const handle = (resp: Notifications.NotificationResponse | null) => {
      if (!resp) return;
      const req = resp.notification.request;
      // iOS: кастомные поля бывают в content.data и/или в trigger.payload (сырой APNs).
      const fromContent = (req.content?.data ?? {}) as Record<string, unknown>;
      const fromTrigger = ((req.trigger as { payload?: Record<string, unknown> } | null)?.payload ?? {}) as Record<string, unknown>;
      const data = { ...fromTrigger, ...fromContent };
      if (!data.screen && !data.id) return;
      const nid = data.notificationId as string | undefined;
      if (nid) void markNotificationRead(nid).catch(() => undefined);
      navigateFromNotification(data);
    };
    // cold start (приложение открыто тапом по уведомлению)
    void Notifications.getLastNotificationResponseAsync().then(handle);
    // фон/передний план
    const sub = Notifications.addNotificationResponseReceivedListener(handle);
    return () => sub.remove();
  }, []);

  return (
    <NavigationContainer ref={navigationRef} onReady={flushPendingDeeplink}>
      {status === 'loading' && <SplashScreen />}
      {status === 'unauthenticated' && <AuthNavigator />}
      {status === 'needs_verification' && <MyIdNavigator />}
      {status === 'authenticated' && <MainNavigator />}
    </NavigationContainer>
  );
}
