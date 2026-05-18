import { View } from 'react-native';
import { tokens } from '../../theme/colors';

interface Props {
  count: number;
  active: number;
  color?: string;
}

export function PageDots({ count, active, color = tokens.inkDark }: Props) {
  return (
    <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
      {Array.from({ length: count }).map((_, i) => (
        <View
          key={i}
          style={{
            width: i === active ? 28 : 8,
            height: 8,
            borderRadius: 999,
            backgroundColor: i === active ? color : 'rgba(20,20,20,0.18)',
          }}
        />
      ))}
    </View>
  );
}
