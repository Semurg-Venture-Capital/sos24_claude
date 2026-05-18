import { View } from 'react-native';
import { tokens } from '../../theme/colors';

interface Props {
  current: number;
  total: number;
}

export function StepperBar({ current, total }: Props) {
  return (
    <View style={{ flexDirection: 'row', gap: 4, flex: 1 }}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={{
            flex: 1,
            height: 3,
            borderRadius: 999,
            backgroundColor: i < current ? tokens.inkDark : 'rgba(20,20,20,0.12)',
          }}
        />
      ))}
    </View>
  );
}
