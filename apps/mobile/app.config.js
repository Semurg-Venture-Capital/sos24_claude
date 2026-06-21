// Динамический конфиг Expo: наследует app.json и подставляет git hash сборки
// в extra.gitHash. Хэш вычисляется при оценке конфига (старт Metro / prebuild /
// bundle в xcodebuild), поэтому отражает коммит сборки. app.json остаётся
// источником истины для всего остального.
const { execSync } = require('node:child_process');

function gitHash() {
  if (process.env.EXPO_PUBLIC_GIT_HASH) return process.env.EXPO_PUBLIC_GIT_HASH;
  try {
    return execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim();
  } catch {
    return 'dev';
  }
}

module.exports = ({ config }) => ({
  ...config,
  extra: {
    ...config.extra,
    gitHash: gitHash(),
  },
});
