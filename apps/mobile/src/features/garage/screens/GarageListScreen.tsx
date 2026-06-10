import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { Glass } from '../../../components/ui/Glass';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Animated, Pressable, RefreshControl, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { useCollapsingHeader } from '../../../lib/useCollapsingHeader';
import { useVehicles } from '../../../api/vehicles';
import { IconCarSimple } from '../../../components/icons/LineIcons';
import { FAB } from '../../../components/ui/FAB';
import { PhoneFrame } from '../../../components/ui/PhoneFrame';
import { RedButton } from '../../../components/ui/RedButton';
import { tokens } from '../../../theme/colors';
import type { GarageStackParamList } from '../../../navigation/types';

type Nav = NativeStackNavigationProp<GarageStackParamList, 'GarageList'>;

function Chevron() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M9 6l6 6-6 6" stroke={tokens.inkMuted} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// M3.1 — Список автомобилей. Пустое состояние или карточки.
export function GarageListScreen() {
  const nav = useNavigation<Nav>();
  const { data: vehicles, isLoading, refetch } = useVehicles();
  const isEmpty = !isLoading && (vehicles?.length ?? 0) === 0;

  // Refetch при входе на экран — чтобы после добавления авто сразу видеть его в списке
  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch]),
  );

  const insets = useSafeAreaInsets();
  const { onScroll, headerAnimatedStyle } = useCollapsingHeader();
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  return (
    <PhoneFrame bottomSafeArea={false} topSafeArea={false}>
      <View style={{ flex: 1 }}>
      <Animated.View
        style={[
        {
          position: 'absolute',
          top: insets.top,
          left: 0,
          right: 0,
          zIndex: 10,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: 24,
          paddingTop: 8,
          paddingBottom: 16,
        },
        headerAnimatedStyle,
        ]}
      >
        <Text
          style={{
            fontFamily: 'NeueMontreal-Medium',
            fontSize: 28,
            letterSpacing: -0.28,
            color: tokens.ink,
          }}
        >
          Гараж
        </Text>
      </Animated.View>

      {isLoading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={tokens.red} />
        </View>
      ) : isEmpty ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 18 }}>
          <View
            style={{
              width: 120,
              height: 120,
              borderRadius: 999,
              backgroundColor: 'rgba(255,255,255,0.55)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <IconCarSimple size={56} color={tokens.inkSubtle} />
          </View>
          <View style={{ alignItems: 'center', gap: 8 }}>
            <Text
              style={{
                fontFamily: 'NeueMontreal-Medium',
                fontSize: 24,
                letterSpacing: -0.12,
                color: tokens.ink,
                textAlign: 'center',
              }}
            >
              Добавьте свой автомобиль
            </Text>
            <Text
              style={{
                fontFamily: 'Manrope_400Regular',
                fontSize: 14,
                color: tokens.inkMuted,
                textAlign: 'center',
                maxWidth: 280,
              }}
            >
              Автомобили сохраняются для быстрого оформления полисов
            </Text>
          </View>
          <View style={{ width: 240, marginTop: 8 }}>
            <RedButton onPress={() => nav.navigate('GarageEdit', {})}>Добавить автомобиль</RedButton>
          </View>
        </View>
      ) : (
        <>
          <Animated.ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingTop: insets.top + 64, paddingHorizontal: 24, paddingBottom: 160, gap: 12 }}
            showsVerticalScrollIndicator={false}
            onScroll={onScroll}
            scrollEventThrottle={16}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={tokens.red}
                colors={[tokens.red]}
                progressViewOffset={insets.top + 60}
              />
            }
          >
            {vehicles?.map((v) => (
              <Pressable
                key={v.id}
                onPress={() => nav.navigate('VehicleDetail', { id: v.id })}
                style={({ pressed }) => ({ borderRadius: 28, overflow: 'hidden', opacity: pressed ? 0.7 : 1 })}
              >
                <Glass
                  intensity={20}
                  tint="light"
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.55)',
                    padding: 18,
                    paddingHorizontal: 20,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 14,
                    borderWidth: 1,
                    borderColor: tokens.hairline,
                  }}
                >
                  <View
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: 16,
                      backgroundColor: 'rgba(20,20,20,0.05)',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <IconCarSimple size={32} color={tokens.inkDark} />
                  </View>
                  <View style={{ flex: 1, gap: 4 }}>
                    <Text
                      style={{
                        fontFamily: 'NeueMontreal-Medium',
                        fontSize: 18,
                        letterSpacing: -0.09,
                        color: tokens.ink,
                      }}
                    >
                      {v.plate}
                    </Text>
                    <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 13, color: tokens.inkMuted }}>
                      {v.brand} {v.model} · {v.year}
                    </Text>
                  </View>
                  <Chevron />
                </Glass>
              </Pressable>
            ))}
          </Animated.ScrollView>
          <FAB onPress={() => nav.navigate('GarageEdit', {})} bottom={110} />
        </>
      )}

      {/* Fade-overlay сверху: контент мягко исчезает за status bar / DI. */}
      <LinearGradient
        pointerEvents="none"
        colors={[tokens.pageBg, 'rgba(228,228,228,0)']}
        style={{ position: 'absolute', left: 0, right: 0, top: 0, height: insets.top + 24 }}
      />
      {/* Fade-overlay снизу: контент мягко исчезает над таб-баром. */}
      <LinearGradient
        pointerEvents="none"
        colors={['rgba(228,228,228,0)', tokens.pageBg]}
        style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 110 }}
      />
      </View>
    </PhoneFrame>
  );
}
