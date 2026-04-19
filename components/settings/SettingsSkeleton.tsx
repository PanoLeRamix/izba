import React from 'react';
import { View } from 'react-native';
import { LAYOUT } from '../../constants/Layout';
import { Skeleton } from '../Skeleton';

export const SettingsSkeleton = () => {
  const TileSkeleton = () => (
    <Skeleton.Card height={128} className="border border-outline-variant/10 bg-surface-container-lowest flex-row items-center px-6">
      <Skeleton.Box width={48} height={48} borderRadius={16} variant="primary-container" className="mr-4" />
      <View className="flex-1">
        <Skeleton.Box width={80} height={12} variant="primary-container" className="mb-2" />
        <Skeleton.Box width={128} height={24} variant="primary" />
      </View>
    </Skeleton.Card>
  );

  return (
    <Skeleton.Screen hasHeader={false}>
      <View className="items-center mb-12" style={{ marginTop: LAYOUT.BASE_SCREEN_PADDING }}>
        <Skeleton.Circle size={48} variant="primary-container" className="mb-2" />
        <Skeleton.Box width={192} height={32} borderRadius={8} variant="primary" />
      </View>

      <TileSkeleton />
      <TileSkeleton />
      
      <Skeleton.Box width="100%" height={64} borderRadius={24} variant="white" className="border border-outline-variant/10 mb-6" />
      <Skeleton.Box width="100%" height={56} borderRadius={16} variant="primary-container" />
    </Skeleton.Screen>
  );
};
