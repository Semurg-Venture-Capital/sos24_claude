import { NavigationContainer } from '@react-navigation/native';
import { useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { AuthNavigator } from './AuthNavigator';
import { MainNavigator } from './MainNavigator';
import { SplashScreen } from '../features/auth/screens/SplashScreen';

export function RootNavigator() {
  const status = useAuthStore((s) => s.status);
  const hydrate = useAuthStore((s) => s.hydrate);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  return (
    <NavigationContainer>
      {status === 'loading' && <SplashScreen />}
      {status === 'unauthenticated' && <AuthNavigator />}
      {status === 'authenticated' && <MainNavigator />}
    </NavigationContainer>
  );
}
