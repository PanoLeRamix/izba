import React from 'react';
import { View } from 'react-native';
import { Skeleton } from '../Skeleton';

/**
 * TasksSkeleton
 * 
 * A specialized skeleton for the Tasks week roster page.
 * Designed to fit inside the PagedCarousel's page container.
 */
export const TasksSkeleton = () => {
  const RowSkeleton = ({ isPrimary = false }: { isPrimary?: boolean }) => (
    <View 
      className={`rounded-3xl border px-6 py-4 mb-4 shadow-sm ${
        isPrimary 
          ? 'bg-surface-container-low border-primary/40' 
          : 'bg-surface-container-low border-outline-variant/10'
      }`}
      style={isPrimary ? { borderWidth: 2 } : undefined}
    >
      {/* Name / Title */}
      <Skeleton.Box width={120} height={24} variant="primary" className="mb-4" />
      
      {/* Task Chips Grid */}
      <View className="flex-row flex-wrap gap-2">
        <Skeleton.Box width={80} height={32} borderRadius={16} variant="primary-container" />
        <Skeleton.Box width={100} height={32} borderRadius={16} variant="primary-container" />
        <Skeleton.Box width={60} height={32} borderRadius={16} variant="primary-container" />
      </View>
    </View>
  );

  return (
    <View className="pt-2 px-6">
      <RowSkeleton isPrimary />
      <RowSkeleton />
      <RowSkeleton />
    </View>
  );
};
