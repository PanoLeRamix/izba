import React from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LAYOUT } from '../../constants/Layout';
import { Skeleton } from '../Skeleton';

export const SettingsSkeleton = () => {
  const insets = useSafeAreaInsets();

  const TileSkeleton = () => (
    <View className="p-6 rounded-3xl mb-6 border border-outline-variant/10 bg-surface-container-lowest h-32 flex-row items-center">
      <Skeleton width={48} height={48} borderRadius={16} variant="primary-light" className="mr-4" />
      <View className="flex-1">
        <Skeleton width={80} height={12} variant="primary-light" className="mb-2" />
        <Skeleton width={128} height={24} variant="primary" />
      </View>
    </View>
  );

  return (
    <ScrollView 
      className="flex-1 bg-surface"
      contentContainerStyle={{ 
        paddingTop: insets.top,
        paddingBottom: Math.max(insets.bottom, LAYOUT.BASE_SCREEN_PADDING),
        paddingHorizontal: 24
      }}
    >
      <View className="items-center mb-12" style={{ marginTop: LAYOUT.BASE_SCREEN_PADDING }}>
        <Skeleton.Circle size={48} variant="primary-light" className="mb-2" />
        <Skeleton width={192} height={32} borderRadius={8} variant="primary" />
      </View>

      <TileSkeleton />
      <TileSkeleton />
      
      <Skeleton width="100%" height={64} borderRadius={24} variant="white" className="border border-outline-variant/10 mb-6" />
      <Skeleton width="100%" height={56} borderRadius={16} variant="primary-light" />
    </ScrollView>
  );
};
