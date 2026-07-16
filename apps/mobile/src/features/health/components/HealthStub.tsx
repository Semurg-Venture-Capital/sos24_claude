import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BackButton } from '../../../components/ui/BackButton';
import { tokens } from '../../../theme/colors';

// Заглушка экрана раздела «Здоровье» (Фаза A — каркас).
// Реальный UI наполняется в фазах B–G по docs/HEALTH.md.
export function HealthStub({
  code,
  title,
  subtitle,
  showBack = true,
}: {
  code: string;
  title: string;
  subtitle?: string;
  showBack?: boolean;
}) {
  const nav = useNavigation();
  const { t } = useTranslation();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: tokens.pageBg }} edges={['top']}>
      {showBack ? (
        <View style={{ paddingHorizontal: 20, paddingTop: 8 }}>
          <BackButton onPress={() => nav.goBack()} />
        </View>
      ) : null}
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 8 }}>
        <View
          style={{
            paddingHorizontal: 12,
            paddingVertical: 5,
            borderRadius: 999,
            backgroundColor: 'rgba(230,20,40,0.1)',
            marginBottom: 4,
          }}
        >
          <Text style={{ fontFamily: 'Manrope_700Bold', fontSize: 12, color: tokens.red, letterSpacing: 0.3 }}>
            {code}
          </Text>
        </View>
        <Text style={{ fontFamily: 'Manrope_700Bold', fontSize: 22, color: tokens.ink, textAlign: 'center' }}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 14, color: tokens.inkMuted, textAlign: 'center', lineHeight: 20 }}>
            {subtitle}
          </Text>
        ) : null}
        <Text style={{ fontFamily: 'Manrope_500Medium', fontSize: 12, color: tokens.inkSubtle, marginTop: 8 }}>
          {t('healthCard.stub.inDev')}
        </Text>
      </View>
    </SafeAreaView>
  );
}
