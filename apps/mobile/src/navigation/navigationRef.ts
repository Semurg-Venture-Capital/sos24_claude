import { createNavigationContainerRef } from '@react-navigation/native';

// Глобальный ref навигации — чтобы навигировать из обработчика push-тапа (вне React-дерева).
export const navigationRef = createNavigationContainerRef();

// Переход по данным уведомления (data.screen / data.id). Безопасно: если навигатор
// не готов или экран неизвестен — уводим в список «Уведомления».
export function navigateFromNotification(data?: Record<string, unknown> | null): void {
  if (!navigationRef.isReady()) return;
  // Звать navigate как МЕТОД объекта (иначе теряется this и вызов падает).
  // Типизация ref'а строгая для вложенной навигации — используем свободную сигнатуру.
  const ref = navigationRef as unknown as { navigate: (name: string, params?: object) => void };
  const screen = data?.screen as string | undefined;
  const id = data?.id as string | undefined;
  try {
    switch (screen) {
      case 'PolicyDetail':
        if (id) ref.navigate('Tabs', { screen: 'Policies', params: { screen: 'PolicyDetail', params: { id } } });
        break;
      case 'AdjusterStatus':
        if (id) ref.navigate('Adjuster', { screen: 'AdjusterStatus', params: { requestId: id } });
        break;
      case 'EuroDetail':
        if (id) ref.navigate('EuroProtocol', { screen: 'EuroDetail', params: { id } });
        break;
      case 'Notifications':
      default:
        ref.navigate('Notifications');
    }
  } catch {
    ref.navigate('Notifications');
  }
}
