import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useCompanyProducts, type ApiProductType, type CompanyProduct } from '../../../api/insurance';
import { BackButton } from '../../../components/ui/BackButton';
import { PhoneFrame } from '../../../components/ui/PhoneFrame';
import { ScreenHeading } from '../../../components/ui/ScreenHeading';
import { Tag } from '../../../components/ui/Tag';
import { tokens } from '../../../theme/colors';
import type { PurchaseStackParamList } from '../../../navigation/types';

type Nav = NativeStackNavigationProp<PurchaseStackParamList, 'CompanyProducts'>;
type R = RouteProp<PurchaseStackParamList, 'CompanyProducts'>;

const TYPE_LABEL: Record<ApiProductType, string> = {
  OSAGO: 'Обязательное',
  KASKO: 'Полное покрытие',
  HEALTH: 'Жизнь и здоровье',
  HOME: 'Имущество',
  FINANCE: 'Финансовая защита',
  LIFE: 'Жизнь',
  TRAVEL: 'Путешествия',
  OTHER: 'Страхование',
};

// Шаг 2 нового флоу — продукты выбранной компании.
export function CompanyProductsScreen() {
  const nav = useNavigation<Nav>();
  const { companyId, companyName } = useRoute<R>().params;
  const { data: products, isLoading, isError, refetch } = useCompanyProducts(companyId);

  return (
    <PhoneFrame>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 8, paddingBottom: 8 }}>
        <BackButton onPress={() => nav.goBack()} />
        <Tag tone="ink">{companyName}</Tag>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40, gap: 20 }}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeading title="Продукты компании" subtitle="Выберите страховой продукт" />

        {isLoading ? (
          <View style={{ paddingVertical: 60, alignItems: 'center' }}>
            <ActivityIndicator color={tokens.red} />
          </View>
        ) : isError ? (
          <View style={{ paddingVertical: 40, alignItems: 'center', gap: 12 }}>
            <Text style={{ fontFamily: 'Manrope_500Medium', fontSize: 14, color: tokens.inkMuted }}>Не удалось загрузить продукты</Text>
            <Pressable onPress={() => refetch()} style={{ paddingHorizontal: 18, paddingVertical: 10, borderRadius: 14, backgroundColor: tokens.red }}>
              <Text style={{ fontFamily: 'Manrope_600SemiBold', fontSize: 13, color: '#fff' }}>Повторить</Text>
            </Pressable>
          </View>
        ) : !products?.length ? (
          <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 14, color: tokens.inkMuted, textAlign: 'center', paddingVertical: 40 }}>
            У компании пока нет продуктов
          </Text>
        ) : (
          <View style={{ gap: 12 }}>
            {products.map((p) => (
              <ProductRow key={p.id} product={p} onPress={() => nav.navigate('ProductDetail', { productId: p.id })} />
            ))}
          </View>
        )}
      </ScrollView>
    </PhoneFrame>
  );
}

function ProductRow({ product, onPress }: { product: CompanyProduct; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        padding: 18,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.6)',
        borderWidth: 1,
        borderColor: tokens.hairline,
        gap: 10,
        opacity: pressed ? 0.75 : 1,
      })}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ fontFamily: 'Manrope_600SemiBold', fontSize: 11, letterSpacing: 0.6, textTransform: 'uppercase', color: tokens.red }}>
          {TYPE_LABEL[product.type]}
        </Text>
        <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={tokens.inkMuted} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <Path d="M9 6l6 6-6 6" />
        </Svg>
      </View>
      <Text style={{ fontFamily: 'NeueMontreal-Medium', fontSize: 19, color: tokens.inkDark }}>{product.name}</Text>
      {product.shortDescription ? (
        <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 13, lineHeight: 18, color: tokens.inkMuted }}>{product.shortDescription}</Text>
      ) : null}
      {product.fromPrice != null ? (
        <Text style={{ fontFamily: 'Manrope_700Bold', fontSize: 15, color: tokens.inkDark, marginTop: 2 }}>
          от {product.fromPrice.toLocaleString('ru-RU')} сум
        </Text>
      ) : null}
    </Pressable>
  );
}
