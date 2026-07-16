import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Animated, Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import { useAdjusterRequest, type AdjusterStatus } from '../../../api/adjuster';
import { BackButton } from '../../../components/ui/BackButton';
import { OutlineButton } from '../../../components/ui/OutlineButton';
import { PhoneFrame } from '../../../components/ui/PhoneFrame';
import { RedButton } from '../../../components/ui/RedButton';
import { tokens } from '../../../theme/colors';
import type { AdjusterStackParamList } from '../../../navigation/types';

type Nav = NativeStackNavigationProp<AdjusterStackParamList, 'AdjusterStatus'>;
type Route = RouteProp<AdjusterStackParamList, 'AdjusterStatus'>;

const DISPATCHER_PHONE = '+998712345600';

const STEP_KEYS: AdjusterStatus[] = ['NEW', 'ACCEPTED', 'EN_ROUTE', 'COMPLETED'];

const STATUS_ORDER: AdjusterStatus[] = ['NEW', 'ACCEPTED', 'EN_ROUTE', 'COMPLETED'];

const INCIDENT_KEYS = ['ACCIDENT', 'DAMAGE', 'THEFT'];

function PulsingDot({ color }: { color: string }) {
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.25, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, []);
  return (
    <Animated.View
      style={{
        width: 10, height: 10, borderRadius: 5,
        backgroundColor: color,
        opacity: pulse,
      }}
    />
  );
}

function StepRow({
  label,
  desc,
  state,
  isLast,
}: {
  label: string;
  desc: string;
  state: 'done' | 'active' | 'pending';
  isLast: boolean;
}) {
  const dotColor =
    state === 'done' ? tokens.green :
    state === 'active' ? tokens.red :
    tokens.hairline;

  const lineColor = state === 'done' ? tokens.green : tokens.hairline;

  return (
    <View style={{ flexDirection: 'row', gap: 16 }}>
      {/* Timeline column */}
      <View style={{ alignItems: 'center', width: 20 }}>
        <View style={{
          width: 20, height: 20, borderRadius: 10,
          backgroundColor: state === 'done' ? tokens.green : state === 'active' ? 'rgba(230,20,40,0.12)' : 'rgba(20,20,20,0.06)',
          borderWidth: state === 'pending' ? 1.5 : 0,
          borderColor: tokens.hairline,
          alignItems: 'center', justifyContent: 'center',
        }}>
          {state === 'done' && (
            <Svg width={10} height={10} viewBox="0 0 10 10" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <Path d="M1.5 5l2.5 2.5 4.5-4.5" />
            </Svg>
          )}
          {state === 'active' && (
            <PulsingDot color={tokens.red} />
          )}
        </View>
        {!isLast && (
          <View style={{ width: 1.5, flex: 1, backgroundColor: lineColor, marginVertical: 4, minHeight: 24 }} />
        )}
      </View>

      {/* Content */}
      <View style={{ flex: 1, paddingBottom: isLast ? 0 : 20, paddingTop: 1 }}>
        <Text style={{
          fontFamily: 'Manrope_600SemiBold',
          fontSize: 15,
          color: state === 'pending' ? tokens.inkMuted : tokens.ink,
          letterSpacing: -0.1,
        }}>
          {label}
        </Text>
        <Text style={{
          fontFamily: 'Manrope_400Regular',
          fontSize: 13,
          color: tokens.inkMuted,
          marginTop: 2,
        }}>
          {desc}
        </Text>
      </View>
    </View>
  );
}

export function AdjusterStatusScreen() {
  const nav = useNavigation<Nav>();
  const { t } = useTranslation();
  const route = useRoute<Route>();
  const { requestId } = route.params;
  const { data: req } = useAdjusterRequest(requestId);

  const handleCallAdjuster = () => {
    if (req?.adjusterDisplayPhone) void Linking.openURL(`tel:${req.adjusterDisplayPhone}`);
  };
  const handleCallDispatcher = () => void Linking.openURL(`tel:${DISPATCHER_PHONE}`);
  const handleHome = () => nav.getParent()?.goBack();

  const hasAdjuster = !!(req?.adjusterDisplayName);
  const adjusterHasPhone = !!(req?.adjusterDisplayPhone);

  const isCancelled = req?.status === 'CANCELLED';
  const currentIdx = req ? STATUS_ORDER.indexOf(req.status as AdjusterStatus) : 0;

  return (
    <PhoneFrame>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingTop: 8, paddingBottom: 8, gap: 12 }}>
        <BackButton onPress={() => nav.goBack()} />
        <Text style={{ fontFamily: 'NeueMontreal-Medium', fontSize: 18, color: tokens.ink, letterSpacing: -0.09 }}>
          {t('adjuster.statusTitle')}
        </Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 260, gap: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Status card */}
        {req && (
          <View style={{
            backgroundColor: isCancelled ? 'rgba(230,20,40,0.06)' : 'rgba(255,255,255,0.7)',
            borderRadius: 20, padding: 18, gap: 6,
            borderWidth: 1.5,
            borderColor: isCancelled ? 'rgba(230,20,40,0.2)' : tokens.hairline,
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              {!isCancelled && <PulsingDot color={req.status === 'COMPLETED' ? tokens.green : tokens.red} />}
              <Text style={{ fontFamily: 'Manrope_600SemiBold', fontSize: 13, color: isCancelled ? tokens.red : tokens.ink, letterSpacing: 0.3, textTransform: 'uppercase' }}>
                {isCancelled
                  ? t('adjuster.cancelled')
                  : STEP_KEYS.includes(req.status as AdjusterStatus)
                    ? t(`adjuster.steps.${req.status}.label`)
                    : req.status}
              </Text>
            </View>
            <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 14, color: tokens.inkMuted }}>
              {INCIDENT_KEYS.includes(req.incidentType) ? t(`adjuster.incident.${req.incidentType}.label`) : req.incidentType} · {req.address}
            </Text>
          </View>
        )}

        {/* Steps timeline */}
        {!isCancelled && (
          <View style={{
            backgroundColor: 'rgba(255,255,255,0.7)',
            borderRadius: 20, padding: 20,
            borderWidth: 1.5, borderColor: tokens.hairline,
          }}>
            <Text style={{ fontFamily: 'Manrope_600SemiBold', fontSize: 13, color: tokens.inkMuted, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 16 }}>
              {t('adjuster.progress')}
            </Text>
            {STEP_KEYS.map((stepKey, idx) => {
              const state =
                idx < currentIdx ? 'done' :
                idx === currentIdx ? 'active' :
                'pending';
              return (
                <StepRow
                  key={stepKey}
                  label={t(`adjuster.steps.${stepKey}.label`)}
                  desc={t(`adjuster.steps.${stepKey}.desc`)}
                  state={state}
                  isLast={idx === STEP_KEYS.length - 1}
                />
              );
            })}
          </View>
        )}

        {/* Cancelled info */}
        {isCancelled && (
          <View style={{
            backgroundColor: 'rgba(255,255,255,0.7)',
            borderRadius: 20, padding: 20, alignItems: 'center', gap: 12,
            borderWidth: 1.5, borderColor: tokens.hairline,
          }}>
            <View style={{
              width: 56, height: 56, borderRadius: 28,
              backgroundColor: 'rgba(230,20,40,0.1)',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={tokens.red} strokeWidth={2} strokeLinecap="round">
                <Path d="M18 6L6 18M6 6l12 12" />
              </Svg>
            </View>
            <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 14, color: tokens.inkMuted, textAlign: 'center', lineHeight: 20 }}>
              {t('adjuster.cancelledInfo')}
            </Text>
          </View>
        )}

        {/* Assigned adjuster card — shown from ACCEPTED onwards */}
        {req?.adjusterDisplayName && req.status !== 'NEW' && req.status !== 'CANCELLED' && (
          <View style={{
            backgroundColor: 'rgba(245,200,80,0.08)',
            borderRadius: 20, padding: 18,
            borderWidth: 1.5, borderColor: 'rgba(245,200,80,0.3)',
            flexDirection: 'row', alignItems: 'center', gap: 14,
          }}>
            <View style={{
              width: 44, height: 44, borderRadius: 22,
              backgroundColor: 'rgba(245,200,80,0.2)',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <Text style={{ fontFamily: 'Manrope_700Bold', fontSize: 18, color: '#b07d00' }}>
                {req.adjusterDisplayName[0].toUpperCase()}
              </Text>
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={{ fontFamily: 'Manrope_600SemiBold', fontSize: 15, color: tokens.ink }}>
                {req.adjusterDisplayName}
              </Text>
              <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 13, color: tokens.inkMuted }}>
                {req.adjusterDisplayPhone ?? t('adjuster.specialistAssigned')}
              </Text>
              {req.adjusterNote && (
                <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 12, color: tokens.inkMuted, marginTop: 2 }}>
                  {req.adjusterNote}
                </Text>
              )}
            </View>
            {req.adjusterDisplayPhone && (
              <Pressable
                onPress={() => void Linking.openURL(`tel:${req.adjusterDisplayPhone}`)}
                style={({ pressed }) => ({
                  width: 38, height: 38, borderRadius: 19,
                  backgroundColor: 'rgba(52,211,153,0.12)',
                  alignItems: 'center', justifyContent: 'center',
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={tokens.green} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                  <Path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.7A2 2 0 012.18 1h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 8.09a16 16 0 006 6l.56-.56a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
                </Svg>
              </Pressable>
            )}
          </View>
        )}

        {/* Dispatcher fallback card */}
        <View style={{
          backgroundColor: 'rgba(255,255,255,0.7)',
          borderRadius: 20, padding: 18,
          borderWidth: 1.5, borderColor: tokens.hairline,
          flexDirection: 'row', alignItems: 'center', gap: 14,
        }}>
          <View style={{
            width: 40, height: 40, borderRadius: 20,
            backgroundColor: tokens.inkDark,
            alignItems: 'center', justifyContent: 'center',
          }}>
            <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
              <Path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.7A2 2 0 012.18 1h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 8.09a16 16 0 006 6l.56-.56a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
            </Svg>
          </View>
          <View style={{ flex: 1, gap: 1 }}>
            <Text style={{ fontFamily: 'Manrope_600SemiBold', fontSize: 14, color: tokens.ink }}>
              {t('adjuster.dispatcher')}
            </Text>
            <Text style={{ fontFamily: 'NeueMontreal-Medium', fontSize: 16, color: tokens.ink, letterSpacing: 0.4 }}>
              {DISPATCHER_PHONE}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom buttons */}
      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0 }}>
        <LinearGradient
          colors={['rgba(228,228,228,0)', 'rgba(228,228,228,0.92)', tokens.pageBg]}
          locations={[0, 0.4, 1]}
          style={{ height: 28 }}
          pointerEvents="none"
        />
        <View style={{ backgroundColor: tokens.pageBg, paddingHorizontal: 24, paddingBottom: 24, paddingTop: 4, gap: 10 }}>
        {/* Primary call: adjuster if assigned, dispatcher otherwise */}
        {req?.status !== 'COMPLETED' && (
          adjusterHasPhone ? (
            <RedButton trailing={false} onPress={handleCallAdjuster}>
              {t('adjuster.callSpecialist')}
            </RedButton>
          ) : (
            <OutlineButton style={{ height: 52 }} onPress={handleCallDispatcher}>
              {t('adjuster.callDispatcher')}
            </OutlineButton>
          )
        )}
        {/* Secondary: always show dispatcher when adjuster is assigned */}
        {req?.status !== 'COMPLETED' && hasAdjuster && adjusterHasPhone && (
          <OutlineButton style={{ height: 52 }} onPress={handleCallDispatcher}>
            {t('adjuster.callDispatcher')}
          </OutlineButton>
        )}
        <OutlineButton style={{ height: 52 }} onPress={handleHome}>
          {t('adjuster.toHome')}
        </OutlineButton>
        </View>
      </View>
    </PhoneFrame>
  );
}
