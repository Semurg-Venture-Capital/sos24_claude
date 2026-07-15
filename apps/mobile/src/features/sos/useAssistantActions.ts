import { useCallback } from 'react';
import { Alert, Linking } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../../navigation/types';
import type { AssistantAction } from '../../api/assistant';

type Nav = NativeStackNavigationProp<MainStackParamList, 'SosAssistant'>;

const SOS_HOTLINE = '1024';

// Исполнитель действий SOS-ассистента. Навигацию делает КЛИЕНТ по закрытому
// набору (LLM только предлагает тип). См. docs/SOS_ASSISTANT_SPEC.md §4.4.
export function useAssistantActions() {
  const nav = useNavigation<Nav>();

  return useCallback(
    (action: AssistantAction) => {
      switch (action.type) {
        case 'europrotocol':
          nav.navigate('EuroProtocol');
          break;
        case 'onsite_help':
          nav.navigate('Adjuster');
          break;
        case 'health_triage':
          nav.navigate('Tabs', { screen: 'Health', params: { screen: 'HealthTriage' } } as never);
          break;
        case 'buy_policy':
          nav.navigate('Purchase', { screen: 'CompanySelect' } as never);
          break;
        case 'support':
          nav.navigate('Support', { screen: 'SupportHub' });
          break;
        case 'panic_alarm':
          nav.navigate('HealthSosActive');
          break;
        case 'emergency_call': {
          const number = (action.hint || '').replace(/[^\d+]/g, '') || SOS_HOTLINE;
          Linking.openURL(`tel:${number}`).catch(() =>
            Alert.alert('Не удалось позвонить', `Наберите ${number} вручную.`),
          );
          break;
        }
        case 'navigate':
          switch (action.param) {
            case 'policies':
              nav.navigate('Tabs', { screen: 'Policies' } as never);
              break;
            case 'garage':
              nav.navigate('Tabs', { screen: 'Garage' } as never);
              break;
            case 'health':
              nav.navigate('Tabs', { screen: 'Health' } as never);
              break;
            case 'catalog':
              nav.navigate('Purchase', { screen: 'CompanySelect' } as never);
              break;
            case 'documents':
              nav.navigate('Profile', { screen: 'Document', params: { kind: 'passport' } });
              break;
            default:
              break;
          }
          break;
        default:
          break;
      }
    },
    [nav],
  );
}
