import { HealthStub } from '../components/HealthStub';

// M14.7 — Запись подтверждена (Фаза A: заглушка). Дизайн — SOS24 Design.html секция m14, наполнение по docs/HEALTH.md.
export function HealthBookingDoneScreen() {
  return <HealthStub code="M14.7" title="Запись подтверждена" subtitle="Видео-консультации — скоро" />;
}
