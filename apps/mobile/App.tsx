import './global.css';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as Location from 'expo-location';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { I18nextProvider } from 'react-i18next';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAppFonts } from './src/lib/fonts';
import { hydrateStorage } from './src/lib/storage';
import { RootNavigator } from './src/navigation/RootNavigator';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  const [fontsLoaded] = useAppFonts();
  const [storageReady, setStorageReady] = useState(false);
  const [i18nInstance, setI18nInstance] = useState<unknown>(null);

  useEffect(() => {
    void (async () => {
      await hydrateStorage();
      const { i18next } = await import('./src/lib/i18n');
      setI18nInstance(i18next);
      setStorageReady(true);

      // Запрашиваем геолокацию при старте — iOS покажет системный диалог
      // только если статус ещё 'undetermined' (первый запуск).
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status === 'undetermined') {
        await Location.requestForegroundPermissionsAsync();
      }
    })();
  }, []);

  if (!fontsLoaded || !storageReady || !i18nInstance) {
    return <View style={{ flex: 1, backgroundColor: '#E4E4E4' }} />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <I18nextProvider i18n={i18nInstance as any}>
          <QueryClientProvider client={queryClient}>
            <StatusBar style="dark" />
            <RootNavigator />
          </QueryClientProvider>
        </I18nextProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
