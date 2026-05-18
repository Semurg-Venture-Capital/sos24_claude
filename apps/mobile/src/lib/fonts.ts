import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
} from '@expo-google-fonts/manrope';
import { useFonts } from 'expo-font';

export function useAppFonts() {
  return useFonts({
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    'NeueMontreal-Light': require('../../assets/fonts/NeueMontreal-Light.otf'),
    'NeueMontreal-Regular': require('../../assets/fonts/NeueMontreal-Regular.otf'),
    'NeueMontreal-Medium': require('../../assets/fonts/NeueMontreal-Medium.otf'),
    'NeueMontreal-Bold': require('../../assets/fonts/NeueMontreal-Bold.otf'),
  });
}
