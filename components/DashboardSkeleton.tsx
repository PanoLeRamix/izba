import React from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LAYOUT } from '../constants/Layout';
import { Skeleton } from './Skeleton';

export const DashboardSkeleton = () => {
  const insets = useSafeAreaInsets();
  const topPadding = LAYOUT.getTopPadding(insets.top);

  return (
    <View className="flex-1 bg-surface" style={{ paddingTop: topPadding }}>
      {/* Fixed Header Skeleton */}
      <View className="px-6 mb-2 justify-center" style={{ height: LAYOUT.HEADER_HEIGHT - 10 }}>
        <Skeleton width={200} height={32} variant="primary" className="mb-2" />
        <Skeleton width={150} height={12} variant="primary-container" />
      </View>

      <ScrollView 
        className="flex-1"
        contentContainerStyle={{ 
          paddingBottom: Math.max(insets.bottom, LAYOUT.BASE_SCREEN_PADDING),
          paddingHorizontal: 24,
          paddingTop: 12,
        }}
      >
        {/* Tonight's Kitchen Card Skeleton */}
        <View className="bg-surface-container-low rounded-[2rem] p-8 mb-6 h-64">
          <View className="flex-row justify-between items-end mb-6">
            <Skeleton width={180} height={32} variant="primary" />
          </View>
          
          <View className="flex-row gap-8 mb-6">
            <Skeleton width="100%" height={72} borderRadius={16} variant="white" />
          </View>

          <View className="space-y-4">
            <Skeleton width={80} height={12} variant="primary-container" className="mb-2" />
            <View className="flex-row gap-2">
              <Skeleton width={60} height={24} borderRadius={12} variant="white" />
              <Skeleton width={80} height={24} borderRadius={12} variant="white" />
              <Skeleton width={70} height={24} borderRadius={12} variant="white" />
            </View>
          </View>
        </View>

        {/* My Tasks Card Skeleton */}
        <View className="bg-primary/10 rounded-[2rem] p-8 h-48">
          <View className="flex-row justify-between items-start mb-8">
            <Skeleton width={120} height={28} variant="primary" />
          </View>

          <View className="space-y-4">
            <View className="flex-row items-center gap-4">
              <Skeleton width={10} height={10} borderRadius={5} variant="primary" />
              <Skeleton width="60%" height={20} variant="primary" />
            </View>
            <View className="flex-row items-center gap-4">
              <Skeleton width={10} height={10} borderRadius={5} variant="primary" />
              <Skeleton width="45%" height={20} variant="primary" />
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};
