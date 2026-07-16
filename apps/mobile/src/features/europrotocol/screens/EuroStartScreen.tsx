import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { Alert, ScrollView, Text, View } from 'react-native';
import { QuickIconAdjuster, QuickIconEuroProtocol } from '../../../components/icons/QuickActionIcons';
import { BackButton } from '../../../components/ui/BackButton';
import { Glass } from '../../../components/ui/Glass';
import { PhoneFrame } from '../../../components/ui/PhoneFrame';
import { RedButton } from '../../../components/ui/RedButton';
import { ScreenHeading } from '../../../components/ui/ScreenHeading';
import { TextLink } from '../../../components/ui/TextLink';
import { tokens } from '../../../theme/colors';
import type { EuroStackParamList, MainStackParamList } from '../../../navigation/types';

type Nav = NativeStackNavigationProp<EuroStackParamList, 'EuroStart'>;

// M9.1 — «Произошло ДТП?»: выбор формата оформления.
//   • Электронный европротокол → визард (рисуем дальше)
//   • Вызвать инспектора → существующий модуль Аджастер (переиспользуем)
//   • Подать обычное заявление → позже (M9.4)
export function EuroStartScreen() {
  const nav = useNavigation<Nav>();
  const { t } = useTranslation();

  const openEuroWizard = () => {
    nav.navigate('EuroCheck');
  };

  const callInspector = () => {
    // Переиспользуем готовый модуль Аджастер (вызов инспектора на место).
    nav.getParent<NativeStackNavigationProp<MainStackParamList>>()?.navigate('Adjuster');
  };

  const openRegularClaim = () => {
    Alert.alert(t('common.comingSoon'), t('euro.start.regularClaimSoon'));
  };

  return (
    <PhoneFrame>
      <View style={{ paddingHorizontal: 24, paddingTop: 8, paddingBottom: 12 }}>
        <BackButton onPress={() => nav.goBack()} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40, gap: 20 }}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeading title={t('euro.start.title')} subtitle={t('euro.start.subtitle')} />

        {/* Инструкция «что сделать сейчас» */}
        <View style={{ borderRadius: 24, overflow: 'hidden' }}>
          <Glass
            intensity={20}
            tint="light"
            style={{
              backgroundColor: 'rgba(255,255,255,0.55)',
              padding: 18,
              borderWidth: 1,
              borderColor: tokens.hairline,
              gap: 14,
            }}
          >
            <Text
              style={{
                fontFamily: 'Manrope_600SemiBold',
                fontSize: 11,
                letterSpacing: 0.88,
                textTransform: 'uppercase',
                color: tokens.inkMuted,
              }}
            >
              {t('euro.start.whatToDoNow')}
            </Text>
            <Step num="1" text={t('euro.start.step1')} />
            <Step num="2" text={t('euro.start.step2')} />
            <Step num="3" text={t('euro.start.step3')} />
          </Glass>
        </View>

        {/* Две карточки выбора */}
        <View style={{ gap: 12 }}>
          <ChoiceCard
            tone="light"
            eyebrow={t('euro.start.euroEyebrow')}
            name={t('euro.start.euroName')}
            desc={t('euro.start.euroDesc')}
            cta={t('euro.start.euroCta')}
            icon={<QuickIconEuroProtocol size={28} color={tokens.red} />}
            onPress={openEuroWizard}
          />
          <ChoiceCard
            tone="dark"
            eyebrow={t('euro.start.inspectorEyebrow')}
            name={t('euro.start.inspectorName')}
            desc={t('euro.start.inspectorDesc')}
            cta={t('euro.start.inspectorCta')}
            status={t('euro.start.inspectorStatus')}
            icon={<QuickIconAdjuster size={28} color="#fff" />}
            onPress={callInspector}
          />

          <View style={{ alignItems: 'center', marginTop: 4 }}>
            <TextLink color={tokens.inkSubtle} onPress={openRegularClaim}>
              {t('euro.start.regularClaim')}
            </TextLink>
          </View>
        </View>
      </ScrollView>
    </PhoneFrame>
  );
}

function Step({ num, text }: { num: string; text: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <View
        style={{
          width: 24,
          height: 24,
          borderRadius: 999,
          backgroundColor: tokens.inkDark,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ fontFamily: 'NeueMontreal-Medium', fontSize: 12, color: '#fff' }}>{num}</Text>
      </View>
      <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 14, color: tokens.ink, letterSpacing: -0.07, flex: 1 }}>
        {text}
      </Text>
    </View>
  );
}

function ChoiceCard({
  tone,
  eyebrow,
  name,
  desc,
  cta,
  status,
  icon,
  onPress,
}: {
  tone: 'light' | 'dark';
  eyebrow: string;
  name: string;
  desc: string;
  cta: string;
  status?: string;
  icon: React.ReactNode;
  onPress: () => void;
}) {
  const dark = tone === 'dark';
  const body = (
    <>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <View style={{ flex: 1, gap: 6 }}>
          <Text
            style={{
              fontFamily: 'Manrope_600SemiBold',
              fontSize: 11,
              letterSpacing: 0.88,
              textTransform: 'uppercase',
              color: dark ? 'rgba(255,255,255,0.55)' : tokens.inkMuted,
            }}
          >
            {eyebrow}
          </Text>
          <Text
            style={{
              fontFamily: 'NeueMontreal-Medium',
              fontSize: 22,
              letterSpacing: -0.22,
              lineHeight: 26,
              color: dark ? '#fff' : tokens.ink,
            }}
          >
            {name}
          </Text>
        </View>
        <View
          style={{
            width: 56,
            height: 56,
            borderRadius: 999,
            backgroundColor: dark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.9)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {icon}
        </View>
      </View>

      <Text
        style={{
          fontFamily: 'Manrope_400Regular',
          fontSize: 14,
          lineHeight: 20,
          color: dark ? tokens.inkMutedDark : tokens.inkMuted,
        }}
      >
        {desc}
      </Text>

      {status && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View style={{ width: 8, height: 8, borderRadius: 999, backgroundColor: tokens.green }} />
          <Text
            style={{
              fontFamily: 'Manrope_500Medium',
              fontSize: 12,
              color: dark ? tokens.inkMutedDark : tokens.inkMuted,
            }}
          >
            {status}
          </Text>
        </View>
      )}

      <RedButton onPress={onPress} style={{ height: 56, marginTop: 4 }}>
        {cta}
      </RedButton>
    </>
  );

  if (dark) {
    return (
      <View
        style={{
          padding: 22,
          borderRadius: 32,
          backgroundColor: tokens.inkDark,
          gap: 16,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 16 },
          shadowOpacity: 0.32,
          shadowRadius: 20,
          elevation: 8,
        }}
      >
        {body}
      </View>
    );
  }
  return (
    <View style={{ borderRadius: 32, overflow: 'hidden' }}>
      <Glass
        intensity={20}
        tint="light"
        style={{
          backgroundColor: 'rgba(255,255,255,0.6)',
          padding: 22,
          borderWidth: 1,
          borderColor: tokens.hairline,
          gap: 16,
        }}
      >
        {body}
      </Glass>
    </View>
  );
}
