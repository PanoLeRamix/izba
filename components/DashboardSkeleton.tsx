import React from 'react';
import { View } from 'react-native';
import { Skeleton } from './Skeleton';

export const DashboardSkeleton = () => {
  return (
    <Skeleton.Screen headerTitleWidth={200} headerSubtitleWidth={150}>
      {/* Tonight's Kitchen Card Skeleton */}
      <Skeleton.Card height={256} padding={32}>
        <Skeleton.Box width={180} height={32} variant="primary" className="mb-6" />
        <Skeleton.Box width="100%" height={72} borderRadius={16} variant="white" className="mb-6" />
        
        <Skeleton.Box width={80} height={12} variant="primary-container" className="mb-2" />
        <Skeleton.Row className="gap-2">
          <Skeleton.Box width={60} height={24} borderRadius={12} variant="white" />
          <Skeleton.Box width={80} height={24} borderRadius={12} variant="white" />
          <Skeleton.Box width={70} height={24} borderRadius={12} variant="white" />
        </Skeleton.Row>
      </Skeleton.Card>

      {/* My Tasks Card Skeleton */}
      <Skeleton.Card height={192} padding={32} variant="primary-container">
        <Skeleton.Box width={120} height={28} variant="primary" className="mb-8" />

        <View className="space-y-4">
          <Skeleton.Row className="gap-4">
            <Skeleton.Circle size={10} variant="primary" />
            <Skeleton.Box width="60%" height={20} variant="primary" />
          </Skeleton.Row>
          <Skeleton.Row className="gap-4">
            <Skeleton.Circle size={10} variant="primary" />
            <Skeleton.Box width="45%" height={20} variant="primary" />
          </Skeleton.Row>
        </View>
      </Skeleton.Card>
    </Skeleton.Screen>
  );
};
