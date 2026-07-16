import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import type { CardBrand } from './CardOption';
import { Tag } from './Tag';

interface Props {
  brand: CardBrand;
  last4: string;
  expiry: string;
  holder: string;
  primary?: boolean;
  balance?: number;
}

const brandStyles: Record<CardBrand, { gradient: [string, string]; brandTextColor: string }> = {
  uzcard: { gradient: ['#121212', '#1f2a37'], brandTextColor: '#0099d8' },
  humo: { gradient: ['#0a8a3a', '#34d399'], brandTextColor: '#0a6a2a' },
};

const brandLabels: Record<CardBrand, string> = { uzcard: 'Uzcard', humo: 'Humo' };

// Большая «реальная» карточка платёжного инструмента (M7.3 Мои карты).
export function SavedCardBig({ brand, last4, expiry, holder, primary, balance }: Props) {
  const { t } = useTranslation();
  const s = brandStyles[brand];

  return (
    <View
      style={{
        height: 200,
        borderRadius: 28,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 24 },
        shadowOpacity: 0.32,
        shadowRadius: 28,
        elevation: 6,
      }}
    >
      <LinearGradient
        colors={s.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ flex: 1, padding: 22, paddingHorizontal: 24, justifyContent: 'space-between' }}
      >
        {/* Decorative orbs */}
        <View
          style={{
            position: 'absolute',
            right: -40,
            top: -40,
            width: 160,
            height: 160,
            borderRadius: 999,
            backgroundColor: 'rgba(255,255,255,0.06)',
          }}
        />
        <View
          style={{
            position: 'absolute',
            right: 30,
            bottom: -60,
            width: 120,
            height: 120,
            borderRadius: 999,
            backgroundColor: 'rgba(255,255,255,0.05)',
          }}
        />

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View style={{ gap: 4 }}>
            {primary && <Tag tone="glass">{t('ui.card.primary')}</Tag>}
          </View>
          <View
            style={{
              paddingHorizontal: 12,
              paddingVertical: 4,
              borderRadius: 8,
              backgroundColor: 'rgba(255,255,255,0.9)',
            }}
          >
            <Text
              style={{
                fontFamily: 'NeueMontreal-Bold',
                fontSize: 12,
                color: s.brandTextColor,
                letterSpacing: 0.24,
              }}
            >
              {brandLabels[brand]}
            </Text>
          </View>
        </View>

        <View style={{ gap: 14 }}>
          <View style={{ gap: 4 }}>
            <Text
              style={{
                fontFamily: 'NeueMontreal-Medium',
                fontSize: 22,
                color: '#fff',
                letterSpacing: 3.96,
              }}
            >
              •••• •••• •••• {last4}
            </Text>
            {balance !== undefined && (
              <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 12, color: 'rgba(255,255,255,0.55)' }}>
                {balance.toLocaleString('ru-RU')} {t('ui.card.sum')}
              </Text>
            )}
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <View style={{ gap: 2 }}>
              <Text
                style={{
                  fontFamily: 'Manrope_400Regular',
                  fontSize: 9,
                  color: 'rgba(255,255,255,0.6)',
                  letterSpacing: 0.9,
                  textTransform: 'uppercase',
                }}
              >
                {t('ui.card.holder')}
              </Text>
              <Text
                style={{
                  fontFamily: 'NeueMontreal-Medium',
                  fontSize: 13,
                  color: '#fff',
                  letterSpacing: 0.78,
                }}
              >
                {holder}
              </Text>
            </View>
            <View style={{ gap: 2, alignItems: 'flex-end' }}>
              <Text
                style={{
                  fontFamily: 'Manrope_400Regular',
                  fontSize: 9,
                  color: 'rgba(255,255,255,0.6)',
                  letterSpacing: 0.9,
                  textTransform: 'uppercase',
                }}
              >
                {t('ui.card.expiry')}
              </Text>
              <Text
                style={{
                  fontFamily: 'NeueMontreal-Medium',
                  fontSize: 13,
                  color: '#fff',
                  letterSpacing: 0.78,
                }}
              >
                {expiry}
              </Text>
            </View>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}
