#!/usr/bin/env bash
# Окружение для Android-сборки/эмулятора (macOS, Android Studio).
# Использование:  source apps/mobile/scripts/android-env.sh
# После этого доступны: adb, emulator, sdkmanager, avdmanager, JAVA_HOME для gradle.

export ANDROID_HOME="$HOME/Library/Android/sdk"
export ANDROID_SDK_ROOT="$ANDROID_HOME"
# JDK 17 — официально поддерживаемая для Expo/RN. JBR из Android Studio = JDK 21,
# с ним Gradle падает (JvmVendorSpec IBM_SEMERU). Ставится без sudo в ~/.jdks
# (см. docs/ANDROID.md). Резолвим путь по глобу.
export JAVA_HOME="$(/bin/ls -d "$HOME"/.jdks/jdk-17*/Contents/Home 2>/dev/null | head -1)"
export PATH="$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator:$JAVA_HOME/bin:$PATH"

echo "Android env готов:"
echo "  ANDROID_HOME = $ANDROID_HOME"
echo "  JAVA_HOME    = $JAVA_HOME"
command -v adb >/dev/null && echo "  adb          = $(adb --version 2>/dev/null | head -1)"
command -v emulator >/dev/null && echo "  emulator     = $(emulator -version 2>/dev/null | head -1)"
echo "Запуск эмулятора:   emulator -avd sos24_pixel &"
echo "Список AVD:          emulator -list-avds"
