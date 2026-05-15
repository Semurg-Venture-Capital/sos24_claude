// Базовый ESLint flat-конфиг для всех TS-проектов SOS24.
// Конкретные приложения дополняют его своими правилами (next.js, react-native.js).

export default [
  {
    ignores: ['**/node_modules/**', '**/dist/**', '**/build/**', '**/.next/**', '**/.expo/**'],
  },
];
