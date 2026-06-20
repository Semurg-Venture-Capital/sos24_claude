import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ActivityIndicator, Image, Pressable, ScrollView, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useCompanies, type InsuranceCompany } from '../../../api/insurance';
import { BackButton } from '../../../components/ui/BackButton';
import { PhoneFrame } from '../../../components/ui/PhoneFrame';
import { ScreenHeading } from '../../../components/ui/ScreenHeading';
import { tokens } from '../../../theme/colors';
import type { PurchaseStackParamList } from '../../../navigation/types';

type Nav = NativeStackNavigationProp<PurchaseStackParamList, 'CompanySelect'>;

// Шаг 1 нового флоу — выбор страховой компании.
export function CompanySelectScreen() {
  const nav = useNavigation<Nav>();
  const { data: companies, isLoading, isError, refetch } = useCompanies();

  return (
    <PhoneFrame>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingTop: 8, paddingBottom: 16 }}>
        <BackButton onPress={() => nav.goBack()} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40, gap: 20 }}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeading title="Страховые компании" subtitle="Выберите компанию, чтобы посмотреть её продукты" />

        {isLoading ? (
          <View style={{ paddingVertical: 60, alignItems: 'center' }}>
            <ActivityIndicator color={tokens.red} />
          </View>
        ) : isError ? (
          <ErrorState onRetry={() => refetch()} />
        ) : !companies?.length ? (
          <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 14, color: tokens.inkMuted, textAlign: 'center', paddingVertical: 40 }}>
            Пока нет доступных компаний
          </Text>
        ) : (
          <View style={{ gap: 12 }}>
            {companies.map((c) => (
              <CompanyCard
                key={c.id}
                company={c}
                onPress={() => nav.navigate('CompanyProducts', { companyId: c.id, companyName: c.name })}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </PhoneFrame>
  );
}

function CompanyCard({ company, onPress }: { company: InsuranceCompany; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        padding: 16,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.6)',
        borderWidth: 1,
        borderColor: tokens.hairline,
        opacity: pressed ? 0.75 : 1,
      })}
    >
      <View
        style={{
          width: 56,
          height: 56,
          borderRadius: 16,
          backgroundColor: '#fff',
          borderWidth: 1,
          borderColor: tokens.hairline,
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        {company.logoUrl ? (
          <Image source={{ uri: company.logoUrl }} style={{ width: 56, height: 56 }} resizeMode="contain" />
        ) : (
          <Text style={{ fontFamily: 'NeueMontreal-Medium', fontSize: 20, color: tokens.red }}>
            {company.name.slice(0, 1).toUpperCase()}
          </Text>
        )}
      </View>

      <View style={{ flex: 1, gap: 3 }}>
        <Text style={{ fontFamily: 'NeueMontreal-Medium', fontSize: 17, color: tokens.inkDark }}>{company.name}</Text>
        <Text style={{ fontFamily: 'Manrope_500Medium', fontSize: 12.5, color: tokens.inkMuted }}>
          {company.productCount} {plural(company.productCount, 'продукт', 'продукта', 'продуктов')}
        </Text>
      </View>

      <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={tokens.inkMuted} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <Path d="M9 6l6 6-6 6" />
      </Svg>
    </Pressable>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <View style={{ paddingVertical: 40, alignItems: 'center', gap: 12 }}>
      <Text style={{ fontFamily: 'Manrope_500Medium', fontSize: 14, color: tokens.inkMuted }}>Не удалось загрузить компании</Text>
      <Pressable onPress={onRetry} style={{ paddingHorizontal: 18, paddingVertical: 10, borderRadius: 14, backgroundColor: tokens.red }}>
        <Text style={{ fontFamily: 'Manrope_600SemiBold', fontSize: 13, color: '#fff' }}>Повторить</Text>
      </Pressable>
    </View>
  );
}

function plural(n: number, one: string, few: string, many: string): string {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return few;
  return many;
}
