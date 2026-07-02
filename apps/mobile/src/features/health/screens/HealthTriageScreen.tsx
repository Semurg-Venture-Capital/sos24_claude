import { HealthStub } from '../components/HealthStub';

// M14.2 — ИИ-триаж (Фаза A: заглушка). Дизайн — SOS24 Design.html секция m14, наполнение по docs/HEALTH.md.
export function HealthTriageScreen() {
  return <HealthStub code="M14.2" title="ИИ-триаж" subtitle="Чат с медицинским ИИ (текст + голос), уточняющие вопросы" />;
}
