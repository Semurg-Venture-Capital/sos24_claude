import { Text, View } from 'react-native';
import { SosMark } from '../../../components/icons/SosMark';
import { tokens } from '../../../theme/colors';

const items = [
  { label: 'СТО', sub: '0.4 км', pos: { top: 30, left: 30 } },
  { label: 'Клиника', sub: '1.2 км', pos: { top: 60, left: 220 } },
  { label: 'СТО', sub: '2.1 км', pos: { top: 200, left: 24 } },
  { label: 'Эвакуатор', sub: '3.0 км', pos: { top: 220, left: 200 } },
];

// Иллюстрация для онбординг-слайда 3: центральный пользователь, концентрические
// круги-радиус и пиллы партнёров вокруг.
export function IllusOnboardingPartners() {
  return (
    <View style={{ width: 320, height: 280 }}>
      {/* Concentric rings */}
      {[60, 110, 160].map((r) => (
        <View
          key={r}
          style={{
            position: 'absolute',
            left: 160 - r,
            top: 136 - r,
            width: r * 2,
            height: r * 2,
            borderRadius: 999,
            borderWidth: 1,
            borderColor: 'rgba(20,20,20,0.12)',
            borderStyle: 'dashed',
          }}
        />
      ))}
      {/* Central marker */}
      <View
        style={{
          position: 'absolute',
          left: 140,
          top: 116,
          width: 40,
          height: 40,
          borderRadius: 999,
          backgroundColor: tokens.red,
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: tokens.red,
          shadowOffset: { width: 0, height: 12 },
          shadowOpacity: 0.5,
          shadowRadius: 16,
          elevation: 8,
        }}
      >
        <SosMark size={18} color="#fff" />
      </View>
      {/* Partner pills */}
      {items.map((item, i) => (
        <View
          key={i}
          style={{
            position: 'absolute',
            top: item.pos.top,
            left: item.pos.left,
            backgroundColor: '#fff',
            borderRadius: 999,
            paddingVertical: 8,
            paddingLeft: 8,
            paddingRight: 12,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 12 },
            shadowOpacity: 0.18,
            shadowRadius: 16,
            elevation: 4,
          }}
        >
          <View
            style={{
              width: 26,
              height: 26,
              borderRadius: 999,
              backgroundColor: '#f4f4f4',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontFamily: 'Manrope_700Bold', fontSize: 11, color: tokens.inkDark }}>
              {item.label[0]}
            </Text>
          </View>
          <View style={{ flexDirection: 'column' }}>
            <Text style={{ fontFamily: 'Manrope_600SemiBold', fontSize: 11, color: tokens.inkDark, lineHeight: 13 }}>
              {item.label}
            </Text>
            <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 10, color: tokens.inkMuted, lineHeight: 11 }}>
              {item.sub}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}
