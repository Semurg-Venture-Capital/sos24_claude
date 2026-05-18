import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BlurView } from 'expo-blur';
import { StatusBar } from 'expo-status-bar';
import { Pressable, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { SosLogo } from '../../../components/ui/SosLogo';
import { PolicyQR } from '../../../components/ui/PolicyQR';
import { getPolicyById } from '../mockPolicies';
import type { PoliciesStackParamList } from '../../../navigation/types';

type Nav = NativeStackNavigationProp<PoliciesStackParamList, 'PolicyQrFullscreen'>;
type R = RouteProp<PoliciesStackParamList, 'PolicyQrFullscreen'>;

// M8.3 — QR на весь экран, тёмный фон, максимум контраста для инспектора.
export function PolicyQrFullscreenScreen() {
  const nav = useNavigation<Nav>();
  const route = useRoute<R>();
  const policy = getPolicyById(route.params.id);

  if (!policy) {
    return (
      <View style={{ flex: 1, backgroundColor: '#121212', alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: 'rgba(255,255,255,0.6)' }}>Полис не найден</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#121212' }}>
      <StatusBar style="light" />

      {/* Top bar: close + logo + share */}
      <View
        style={{
          position: 'absolute',
          top: 56,
          left: 24,
          right: 24,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          zIndex: 5,
        }}
      >
        <Pressable
          onPress={() => nav.goBack()}
          style={({ pressed }) => ({
            width: 48,
            height: 48,
            borderRadius: 999,
            overflow: 'hidden',
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <BlurView
            intensity={20}
            tint="dark"
            style={{
              flex: 1,
              backgroundColor: 'rgba(255,255,255,0.08)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Svg width={14} height={14} viewBox="0 0 14 14" fill="none" stroke="#fff" strokeWidth={1.8} strokeLinecap="round">
              <Path d="M2 2l10 10M12 2L2 12" />
            </Svg>
          </BlurView>
        </Pressable>

        <SosLogo size="md" color="#fff" />

        <Pressable
          style={({ pressed }) => ({
            width: 48,
            height: 48,
            borderRadius: 999,
            overflow: 'hidden',
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <BlurView
            intensity={20}
            tint="dark"
            style={{
              flex: 1,
              backgroundColor: 'rgba(255,255,255,0.08)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
              <Path d="M4 12v7a2 2 0 002 2h12a2 2 0 002-2v-7M16 6l-4-4-4 4M12 2v14" />
            </Svg>
          </BlurView>
        </Pressable>
      </View>

      {/* Title block */}
      <View style={{ position: 'absolute', top: 140, left: 24, right: 24, alignItems: 'center' }}>
        <Text
          style={{
            fontFamily: 'Manrope_400Regular',
            fontSize: 12,
            color: 'rgba(255,255,255,0.5)',
            letterSpacing: 1.2,
            textTransform: 'uppercase',
          }}
        >
          Электронный полис
        </Text>
        <Text
          style={{
            marginTop: 6,
            fontFamily: 'NeueMontreal-Medium',
            fontSize: 28,
            letterSpacing: -0.28,
            color: '#fff',
            textAlign: 'center',
            lineHeight: 30,
          }}
        >
          {policy.type} · {policy.plate}
        </Text>
      </View>

      {/* Big QR */}
      <View style={{ position: 'absolute', top: 240, left: 0, right: 0, alignItems: 'center', gap: 24 }}>
        <View
          style={{
            padding: 16,
            borderRadius: 36,
            backgroundColor: '#fff',
            shadowColor: '#fff',
            shadowOffset: { width: 0, height: 30 },
            shadowOpacity: 0.18,
            shadowRadius: 60,
            elevation: 12,
          }}
        >
          <PolicyQR value={`sos24:${policy.number}`} size={260} padding={0} />
        </View>

        <View style={{ alignItems: 'center', gap: 4 }}>
          <Text
            style={{
              fontFamily: 'NeueMontreal-Medium',
              fontSize: 18,
              letterSpacing: 0.72,
              color: '#fff',
            }}
          >
            {policy.formattedNumber}
          </Text>
          <Text
            style={{
              fontFamily: 'Manrope_400Regular',
              fontSize: 12,
              color: 'rgba(255,255,255,0.5)',
              letterSpacing: 0.72,
            }}
          >
            SOS24 · sos24.uz
          </Text>
        </View>
      </View>

      {/* Tip pill at bottom */}
      <View style={{ position: 'absolute', left: 24, right: 24, bottom: 36, alignItems: 'center' }}>
        <View style={{ borderRadius: 999, overflow: 'hidden' }}>
          <BlurView
            intensity={20}
            tint="dark"
            style={{
              backgroundColor: 'rgba(255,255,255,0.08)',
              paddingVertical: 12,
              paddingHorizontal: 18,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth={1.8} strokeLinecap="round">
              <Circle cx={12} cy={12} r={3} />
              <Path d="M12 1v2M12 21v2M1 12h2M21 12h2" />
            </Svg>
            <Text style={{ color: 'rgba(255,255,255,0.85)', fontFamily: 'Manrope_400Regular', fontSize: 13 }}>
              Покажите инспектору или сохраните
            </Text>
          </BlurView>
        </View>
      </View>
    </View>
  );
}
