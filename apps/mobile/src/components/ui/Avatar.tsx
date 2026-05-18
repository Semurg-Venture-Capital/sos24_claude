import { LinearGradient } from 'expo-linear-gradient';
import { Text } from 'react-native';
import { tokens } from '../../theme/colors';

interface Props {
  name: string;
  size?: number;
}

// Аватар с инициалами в круглом градиенте — заглушка пока фото не загружено.
export function Avatar({ name, size = 64 }: Props) {
  const initials = name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <LinearGradient
      colors={['#d6d6d6', '#f4f4f4']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{
        width: size,
        height: size,
        borderRadius: 999,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text
        style={{
          fontFamily: 'NeueMontreal-Medium',
          fontSize: size * 0.36,
          color: tokens.inkDark,
          letterSpacing: -0.01 * size,
        }}
      >
        {initials}
      </Text>
    </LinearGradient>
  );
}
