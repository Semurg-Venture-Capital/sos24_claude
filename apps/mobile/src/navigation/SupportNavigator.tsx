import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SupportHubScreen } from '../features/support/screens/SupportHubScreen';
import { SupportTicketsScreen } from '../features/support/screens/SupportTicketsScreen';
import { SupportNewTicketScreen } from '../features/support/screens/SupportNewTicketScreen';
import { SupportChatScreen } from '../features/support/screens/SupportChatScreen';
import type { SupportStackParamList } from './types';

const Stack = createNativeStackNavigator<SupportStackParamList>();

export function SupportNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="SupportHub"
      screenOptions={{ headerShown: false, contentStyle: { backgroundColor: 'rgb(228,228,228)' } }}
    >
      <Stack.Screen name="SupportHub" component={SupportHubScreen} />
      <Stack.Screen name="SupportTickets" component={SupportTicketsScreen} />
      <Stack.Screen name="SupportNewTicket" component={SupportNewTicketScreen} />
      <Stack.Screen name="SupportChat" component={SupportChatScreen} />
    </Stack.Navigator>
  );
}
