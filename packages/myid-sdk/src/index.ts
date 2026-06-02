import { NativeModules, Platform } from 'react-native';

export interface MyIdStartOptions {
  sessionId: string;
  clientHash: string;
  clientHashId: string;
  environment: 'debug' | 'production';
}

export interface MyIdSdkResult {
  code: string;
}

/**
 * Запускает нативный MyID SDK для верификации личности.
 * Возвращает одноразовый code (TTL 5 мин) для передачи на бэкенд.
 * Только iOS — регистрируется через RCT_EXTERN_MODULE.
 */
export async function startMyIdSdk(options: MyIdStartOptions): Promise<MyIdSdkResult> {
  if (Platform.OS !== 'ios') {
    throw new Error('MyID SDK поддерживается только на iOS');
  }

  const { MyIdSdkModule } = NativeModules;
  if (!MyIdSdkModule) {
    throw new Error('MyIdSdkModule не найден. Пересоберите приложение с нативным кодом.');
  }

  return MyIdSdkModule.start(
    options.sessionId,
    options.clientHash,
    options.clientHashId,
    options.environment,
  );
}
