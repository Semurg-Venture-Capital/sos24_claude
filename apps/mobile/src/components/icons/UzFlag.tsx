import { View } from 'react-native';

// Флаг Узбекистана: голубой / белый / красный (тонкий) / белый / зелёный
export function UzFlag() {
  return (
    <View style={{ width: 28, height: 20, borderRadius: 4, overflow: 'hidden', flexDirection: 'column' }}>
      <View style={{ flex: 5, backgroundColor: '#0099b5' }} />
      <View style={{ flex: 1, backgroundColor: '#ffffff' }} />
      <View style={{ flex: 0.6, backgroundColor: '#ce1126' }} />
      <View style={{ flex: 1, backgroundColor: '#ffffff' }} />
      <View style={{ flex: 5, backgroundColor: '#1eb53a' }} />
    </View>
  );
}
