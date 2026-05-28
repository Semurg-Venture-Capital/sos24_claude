import { GlassView } from 'expo-glass-effect';
import { useEffect, useRef } from 'react';
import { Animated, Modal, Pressable, Text, View } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import { tokens } from '../../theme/colors';

interface MenuItem {
  label: string;
  icon: React.ReactNode;
  onPress: () => void;
  destructive?: boolean;
}

interface Props {
  visible: boolean;
  title: string;
  items: MenuItem[];
  onClose: () => void;
}

function DetailIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={tokens.inkDark} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <Path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
    </Svg>
  );
}

function RenewIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={tokens.inkDark} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M23 4v6h-6M1 20v-6h6" />
      <Path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
    </Svg>
  );
}

function PdfIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={tokens.inkDark} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
    </Svg>
  );
}

function ClaimIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={tokens.red} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      <Path d="M12 9v4M12 17h.01" />
    </Svg>
  );
}

export { DetailIcon, RenewIcon, PdfIcon, ClaimIcon };

export function PolicyContextMenu({ visible, title, items, onClose }: Props) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.92)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }),
        Animated.spring(scale, { toValue: 1, damping: 20, stiffness: 300, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 120, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 0.94, duration: 120, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      {/* Backdrop */}
      <Pressable
        onPress={onClose}
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.28)', justifyContent: 'flex-end' }}
      >
        {/* Prevents menu tap from closing */}
        <Pressable onPress={() => {}}>
          <Animated.View style={{ opacity, transform: [{ scale }], paddingHorizontal: 16, paddingBottom: 32 }}>
            {/* Title chip */}
            <View style={{ alignItems: 'center', marginBottom: 10 }}>
              <View
                style={{
                  backgroundColor: 'rgba(255,255,255,0.18)',
                  borderRadius: 999,
                  paddingHorizontal: 14,
                  paddingVertical: 6,
                }}
              >
                <Text
                  style={{
                    fontFamily: 'Manrope_500Medium',
                    fontSize: 12,
                    color: 'rgba(255,255,255,0.9)',
                    letterSpacing: 0.3,
                  }}
                >
                  {title}
                </Text>
              </View>
            </View>

            {/* Menu card */}
            <View
              style={{
                borderRadius: 26,
                overflow: 'hidden',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 20 },
                shadowOpacity: 0.22,
                shadowRadius: 40,
                elevation: 10,
              }}
            >
              <GlassView
                glassEffectStyle="regular"
                style={{ borderRadius: 26, overflow: 'hidden' }}
              >
                {items.map((item, idx) => (
                  <View key={item.label}>
                    <Pressable
                      onPress={() => { onClose(); setTimeout(item.onPress, 150); }}
                      style={({ pressed }) => ({
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingHorizontal: 20,
                        paddingVertical: 16,
                        gap: 14,
                        backgroundColor: pressed ? 'rgba(0,0,0,0.06)' : 'transparent',
                      })}
                    >
                      <View style={{ width: 24, alignItems: 'center' }}>
                        {item.icon}
                      </View>
                      <Text
                        style={{
                          fontFamily: 'Manrope_500Medium',
                          fontSize: 16,
                          color: item.destructive ? tokens.red : tokens.ink,
                          flex: 1,
                        }}
                      >
                        {item.label}
                      </Text>
                    </Pressable>
                    {idx < items.length - 1 && (
                      <View
                        style={{
                          height: 0.5,
                          marginLeft: 58,
                          backgroundColor: tokens.hairline,
                        }}
                      />
                    )}
                  </View>
                ))}
              </GlassView>
            </View>

            {/* Cancel button */}
            <View
              style={{
                marginTop: 10,
                borderRadius: 18,
                overflow: 'hidden',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.1,
                shadowRadius: 16,
              }}
            >
              <GlassView glassEffectStyle="regular" style={{ borderRadius: 18, overflow: 'hidden' }}>
                <Pressable
                  onPress={onClose}
                  style={({ pressed }) => ({
                    paddingVertical: 16,
                    alignItems: 'center',
                    backgroundColor: pressed ? 'rgba(0,0,0,0.06)' : 'transparent',
                  })}
                >
                  <Text style={{ fontFamily: 'Manrope_600SemiBold', fontSize: 16, color: tokens.ink }}>
                    Отмена
                  </Text>
                </Pressable>
              </GlassView>
            </View>
          </Animated.View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
