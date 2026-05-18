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
      // react-native-reanimated/plugin must come last
      'react-native-reanimated/plugin',
    ],
  };
};
