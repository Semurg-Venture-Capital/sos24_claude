import { Pressable, Text, View } from 'react-native';
import { useAuthStore } from '../../../stores/authStore';

export function HomeScreen() {
  const signOut = useAuthStore((s) => s.signOut);
  return (
    <View className="flex-1 items-center justify-center bg-brand-white px-6">
      <Text className="font-mont-medium text-3xl text-ink">Главная</Text>
      <Text className="mt-2 font-manrope text-base text-ink-muted">
        Тут будет Home по дизайну (Этап C)
      </Text>
      <Pressable
        onPress={() => void signOut()}
        className="mt-8 rounded-2xl border border-hairline px-6 py-3"
      >
        <Text className="font-manrope-medium text-base text-ink">Выйти</Text>
      </Pressable>
    </View>
  );
}
