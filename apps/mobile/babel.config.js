module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      // ВРЕМЕННО: убрали jsxImportSource: 'nativewind' и nativewind/babel,
      // потому что NativeWind v4 wrapper ломал inline-style функции на Pressable
      // в Expo Go iOS (контейнер-стили не применялись — см. скрин 2026-05-18).
      // className в проекте нигде не используется (только inline style={}),
      // так что это безопасно. Tailwind-токены остаются в tailwind.config.js
      // и theme/colors.ts как справочник; можно вернуть позже через альтернативный
      // паттерн (например, обёрнуть руками только там где нужен className).
      'babel-preset-expo',
    ],
    plugins: [
      // Reanimated 4 переехал на отдельный пакет react-native-worklets.
      // Babel-плагин теперь react-native-worklets/plugin (не react-native-reanimated/plugin).
      // Должен быть последним в списке плагинов.
      'react-native-worklets/plugin',
    ],
  };
};
