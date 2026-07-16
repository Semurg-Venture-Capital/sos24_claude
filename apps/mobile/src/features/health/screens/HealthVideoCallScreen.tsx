import { useTranslation } from 'react-i18next';
import { HealthStub } from '../components/HealthStub';

// M14.8 — Видео-консультация (Фаза A: заглушка). Дизайн — SOS24 Design.html секция m14, наполнение по docs/HEALTH.md.
export function HealthVideoCallScreen() {
  const { t } = useTranslation();
  return <HealthStub code="M14.8" title={t('health.videoCall.title')} subtitle={t('health.videoCall.subtitle')} />;
}
