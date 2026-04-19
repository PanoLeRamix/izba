import React from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Skeleton } from '../Skeleton';

export const ShoppingSkeleton = () => {
  const { t } = useTranslation();

  return (
    <Skeleton.Screen hasHeader={false}>
      {/* Manual Header since it uses text */}
      <View className="mb-2 justify-center" style={{ height: 60 }}>
        <Text className="text-3xl font-black text-primary uppercase">{t('tabs.shopping')}</Text>
      </View>

      {[1, 2, 3, 4].map((row) => (
        <Skeleton.Card key={`shopping-skeleton-row-${row}`} padding={16} className="rounded-[28px] border border-outline-variant/20 mb-4 h-auto">
          <Skeleton.Row>
            <Skeleton.Circle size={28} variant="primary-container" />
            <Skeleton.Box width="65%" height={18} variant="primary-container" className="ml-4" />
          </Skeleton.Row>
        </Skeleton.Card>
      ))}

      <Skeleton.Box width="100%" height={1} borderRadius={1} variant="primary-container" className="my-2" />

      {[1, 2].map((row) => (
        <Skeleton.Card key={`shopping-skeleton-checked-${row}`} padding={16} variant="surface-container" className="rounded-[28px] border border-outline-variant/20 mb-4 h-auto bg-surface-container">
          <Skeleton.Row>
            <Skeleton.Circle size={28} variant="primary-container" />
            <Skeleton.Box width={row === 1 ? '58%' : '72%'} height={18} variant="primary-container" className="ml-4" />
          </Skeleton.Row>
        </Skeleton.Card>
      ))}
    </Skeleton.Screen>
  );
};
