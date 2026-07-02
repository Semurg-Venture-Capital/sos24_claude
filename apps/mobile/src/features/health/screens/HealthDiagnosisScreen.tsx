import { HealthStub } from '../components/HealthStub';

// M14.3 — Предварительный диагноз (Фаза A: заглушка). Дизайн — SOS24 Design.html секция m14, наполнение по docs/HEALTH.md.
export function HealthDiagnosisScreen() {
  return <HealthStub code="M14.3" title="Предварительный диагноз" subtitle="Вердикт ИИ, срочность, уверенность, рекомендации" />;
}
