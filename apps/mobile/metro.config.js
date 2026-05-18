const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// 1. Watch all files within the monorepo (для пересборки при изменениях
//    в packages/i18n-strings и других воркспейсах)
config.watchFolders = [monorepoRoot];

// 2. Подсказываем Metro, где искать модули — сначала локальный node_modules
//    проекта, потом hoisted в корне (pnpm 11 + node-linker=hoisted).
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

module.exports = withNativeWind(config, { input: './global.css' });
