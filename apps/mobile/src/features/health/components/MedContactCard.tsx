import { Linking, Pressable, Text, View } from 'react-native';
import { Avatar } from '../../../components/ui/Avatar';
import { PhoneFillIcon } from '../../../components/icons/MedIcons';
import { tokens } from '../../../theme/colors';
import { medGlass } from './medGlass';

// Карточка экстренного контакта (M14.11): аватар, имя/отношение/телефон, звонок в 1 тап.
// onDelete — опциональная кнопка удаления (экран управления контактами).
export function MedContactCard({
  name,
  relation,
  phone,
  onCall,
  onDelete,
}: {
  name: string;
  relation?: string;
  phone: string;
  onCall?: () => void;
  onDelete?: () => void;
}) {
  const call = onCall ?? (() => Linking.openURL(`tel:${phone.replace(/\s/g, '')}`));
  return (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 14,
          paddingVertical: 14,
          paddingHorizontal: 16,
          borderRadius: 22,
        },
        medGlass,
      ]}
    >
      <Avatar name={name} size={48} />
      <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
        <Text numberOfLines={1} style={{ fontFamily: 'Manrope_600SemiBold', fontSize: 15, color: tokens.ink }}>
          {name}
        </Text>
        <Text numberOfLines={1} style={{ fontFamily: 'Manrope_400Regular', fontSize: 13, color: tokens.inkMuted }}>
          {relation ? `${relation} · ` : ''}
          {phone}
        </Text>
      </View>
      {onDelete ? (
        <Pressable
          onPress={onDelete}
          hitSlop={6}
          style={({ pressed }) => ({
            width: 40,
            height: 40,
            borderRadius: 999,
            backgroundColor: 'rgba(230,20,40,0.1)',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: pressed ? 0.6 : 1,
          })}
        >
          <Text style={{ fontSize: 18, color: tokens.red, lineHeight: 20 }}>×</Text>
        </Pressable>
      ) : null}
      <Pressable
        onPress={call}
        style={({ pressed }) => ({
          width: 40,
          height: 40,
          borderRadius: 999,
          backgroundColor: 'rgba(105,228,183,0.4)',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: pressed ? 0.7 : 1,
        })}
      >
        <PhoneFillIcon size={15} color="#0a3a26" />
      </Pressable>
    </View>
  );
}
