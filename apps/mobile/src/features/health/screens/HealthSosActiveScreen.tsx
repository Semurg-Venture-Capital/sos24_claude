import { HealthStub } from '../components/HealthStub';

// M14.12 — Экран ЧП/SOS (Фаза A: заглушка). Корневой модал поверх табов.
// Дизайн — SOS24 Design.html секция m14; наполнение по docs/HEALTH.md (фаза F).
export function HealthSosActiveScreen() {
  return (
    <HealthStub
      code="M14.12"
      title="Экстренная помощь"
      subtitle="Оповещаем близких и передаём геолокацию диспетчеру"
      showBack={false}
    />
  );
}
