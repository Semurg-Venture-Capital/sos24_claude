import { HealthStub } from '../components/HealthStub';

// M14.9 — Мед.карта (Medical ID) (Фаза A: заглушка). Дизайн — SOS24 Design.html секция m14, наполнение по docs/HEALTH.md.
export function HealthMedCardScreen() {
  return <HealthStub code="M14.9" title="Мед.карта (Medical ID)" subtitle="Группа крови, аллергии, хронические, лекарства" />;
}
