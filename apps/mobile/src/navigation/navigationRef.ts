import { createNavigationContainerRef } from '@react-navigation/native';

// Глобальный ref навигации — чтобы навигировать из обработчика push-тапа (вне React-дерева).
export const navigationRef = createNavigationContainerRef();

// Переход по данным уведомления (data.screen / data.id). Безопасно: если навигатор
// не готов или экран неизвестен — уводим в список «Уведомления».
export function navigateFromNotification(data?: Record<string, unknown> | null): void {
  if (!navigationRef.isReady()) return;
  // Вложенная навигация — типизация ref'а строгая, используем свободную сигнатуру.
  const go = navigationRef.navigate as unknown as (name: string, params?: object) => void;
  const screen = data?.screen as string | undefined;
  const id = data?.id as string | undefined;
  try {
    switch (screen) {
      case 'PolicyDetail':
        if (id) go('Tabs', { screen: 'Policies', params: { screen: 'PolicyDetail', params: { id } } });
        break;
      case 'AdjusterStatus':
        if (id) go('Adjuster', { screen: 'AdjusterStatus', params: { requestId: id } });
        break;
      case 'EuroDetail':
        if (id) go('EuroProtocol', { screen: 'EuroDetail', params: { id } });
        break;
      case 'Notifications':
      default:
        go('Notifications');
    }
  } catch {
    go('Notifications');
  }
}
