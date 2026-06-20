import { createNavigationContainerRef } from '@react-navigation/native';

// Глобальный ref навигации — чтобы навигировать из обработчика push-тапа (вне React-дерева).
export const navigationRef = createNavigationContainerRef();

// Отложенный deeplink: если тап по пушу пришёл, когда навигатор/нужные экраны ещё
// не готовы (cold start, экран логина) — запоминаем и применяем позже (flush).
let pending: Record<string, unknown> | null = null;

function dispatch(data: Record<string, unknown>): void {
  // navigate зовём как МЕТОД объекта (иначе теряется this). Типизация вложенной
  // навигации строгая — используем свободную сигнатуру.
  const ref = navigationRef as unknown as { navigate: (name: string, params?: object) => void };
  const screen = data.screen as string | undefined;
  const id = data.id as string | undefined;
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
}

// Пытается навигировать сейчас; возвращает false, если навигатор не готов или
// нужного экрана ещё нет (тогда вызывающий код кладёт deeplink в pending).
function tryNavigate(data: Record<string, unknown>): boolean {
  if (!navigationRef.isReady()) return false;
  try {
    dispatch(data);
    return true;
  } catch {
    return false;
  }
}

export function navigateFromNotification(data?: Record<string, unknown> | null): void {
  if (!data) return;
  if (!tryNavigate(data)) pending = data;
}

// Применить отложенный deeplink — вызывается, когда смонтирован основной навигатор.
export function flushPendingDeeplink(): void {
  if (pending && tryNavigate(pending)) pending = null;
}
