import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { registerDevice, unregisterDevice } from '../api/notifications';

// Показ уведомлений когда приложение на переднем плане.
export function configurePushHandler(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

// Запрос разрешения + получение НАТИВНОГО push-токена (APNs/FCM) и регистрация на бэке.
// Тихо завершается, если нет устройства/прав/Firebase — in-app уведомления всё равно работают.
export async function registerPushToken(): Promise<void> {
  try {
    if (!Device.isDevice) return;

    const existing = await Notifications.getPermissionsAsync();
    let status = existing.status;
    if (status !== 'granted') {
      status = (await Notifications.requestPermissionsAsync()).status;
    }
    if (status !== 'granted') return;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Уведомления',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }

    const token = await Notifications.getDevicePushTokenAsync();
    if (typeof token.data === 'string' && token.data.length > 0) {
      await registerDevice(token.data, Platform.OS === 'ios' ? 'IOS' : 'ANDROID');
    }
  } catch {
    // Нет Firebase-конфига / прав / симулятор — пропускаем; список уведомлений работает.
  }
}

// Снятие токена при логауте — чтобы на устройство не шли push прошлого аккаунта.
// Вызывать ДО сброса JWT (запрос требует авторизации). Best-effort.
export async function unregisterPushToken(): Promise<void> {
  try {
    if (!Device.isDevice) return;
    const token = await Notifications.getDevicePushTokenAsync();
    if (typeof token.data === 'string' && token.data.length > 0) {
      await unregisterDevice(token.data);
    }
  } catch {
    /* нет токена/прав — пропускаем */
  }
}
