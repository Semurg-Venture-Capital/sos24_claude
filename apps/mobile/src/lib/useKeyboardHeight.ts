import { useEffect, useState } from 'react';
import { Keyboard, Platform } from 'react-native';

// Возвращает текущую высоту клавиатуры в px (0 если закрыта).
// Используется для поднятия absolutely-positioned bottom-кнопок над клавиатурой.
// iOS использует Will-события (до анимации) — позволяет синхронно поднимать UI,
// Android — Did-события (нативные предсказания пользовательских инпутов
// показываются в самой клавиатуре).
export function useKeyboardHeight() {
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (e) => {
      setHeight(e.endCoordinates.height);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setHeight(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  return height;
}
