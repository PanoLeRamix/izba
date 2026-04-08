import React from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LAYOUT } from '../../constants/Layout';
import { Skeleton } from '../Skeleton';

export const TasksSkeleton = () => {
  const insets = useSafeAreaInsets();

  const RowSkeleton = ({ highlight = false }: { highlight?: boolean }) => (
    <View 
      className={`rounded-2xl border px-4 py-3 mb-3 shadow-sm ${highlight ? 'bg-hearth border-forest-dark' : 'bg-white border-sage/30'}`}
      style={highlight ? { borderWidth: 3 } : undefined}
    >
      <Skeleton width={120} height={24} variant={highlight ? 'forest' : 'forest-light'} className="mb-4" />
      
      <View className="mt-2 flex-row flex-wrap gap-2">
        <Skeleton width={80} height={32} borderRadius={16} variant="forest-light" />
        <Skeleton width={100} height={32} borderRadius={16} variant="forest-light" />
        <Skeleton width={60} height={32} borderRadius={16} variant="forest-light" />
      </View>
    </View>
  );

  return (
    <ScrollView 
      className="flex-1"
      contentContainerStyle={{ 
        paddingHorizontal: 24,
        paddingTop: 8,
        paddingBottom: Math.max(insets.bottom, LAYOUT.BASE_SCREEN_PADDING),
      }}
    >
      <RowSkeleton highlight />
      <RowSkeleton />
      <RowSkeleton />
      <RowSkeleton />
    </ScrollView>
  );
};
