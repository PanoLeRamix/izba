import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LAYOUT } from '../../constants/Layout';
import { Skeleton } from '../Skeleton';

export const ShoppingSkeleton = () => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const topPadding = LAYOUT.getTopPadding(insets.top);
  const bottomPadding = Math.max(insets.bottom, LAYOUT.BASE_SCREEN_PADDING) + 84;

  return (
    <View className="flex-1 bg-surface" style={{ paddingTop: topPadding }}>
      <View className="px-6 mb-2 justify-center" style={{ height: LAYOUT.HEADER_HEIGHT - 10 }}>
        <Text className="text-3xl font-black text-primary uppercase">{t('tabs.shopping')}</Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: LAYOUT.BASE_SCREEN_PADDING,
          paddingBottom: bottomPadding,
          paddingTop: 12,
          gap: 16,
        }}
        showsVerticalScrollIndicator={false}
      >
        {[1, 2, 3, 4].map((row) => (
          <View key={`shopping-skeleton-row-${row}`} className="rounded-[28px] border border-outline-variant/20 bg-surface-container-low px-5 py-4">
            <View className="flex-row items-center">
              <Skeleton.Circle size={28} variant="primary-container" />
              <Skeleton width="65%" height={18} variant="primary-container" className="ml-4" />
            </View>
          </View>
        ))}

        <Skeleton width="100%" height={1} borderRadius={1} variant="primary-container" className="my-2" />

        {[1, 2].map((row) => (
          <View key={`shopping-skeleton-checked-${row}`} className="rounded-[28px] border border-outline-variant/20 bg-surface-container px-5 py-4">
            <View className="flex-row items-center">
              <Skeleton.Circle size={28} variant="primary-container" />
              <Skeleton width={row === 1 ? '58%' : '72%'} height={18} variant="primary-container" className="ml-4" />
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};
