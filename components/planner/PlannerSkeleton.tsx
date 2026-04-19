import React from 'react';
import { View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LAYOUT } from '../../constants/Layout';
import { Skeleton } from '../Skeleton';

export const PlannerSkeleton = () => {
  const { height: windowHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const topPadding = LAYOUT.getTopPadding(insets.top);
  const bottomBuffer = LAYOUT.getBottomBuffer(insets.bottom);
  const availableHeight = windowHeight - topPadding - (LAYOUT.HEADER_HEIGHT - 10) - LAYOUT.TAB_BAR_HEIGHT - bottomBuffer;
  const tileHeight = LAYOUT.getTileHeight(availableHeight);

  return (
    <View className="flex-1 bg-surface" style={{ paddingTop: topPadding }}>
      {/* Header Skeleton */}
      <View className="px-6 mb-2 flex-row items-center justify-between" style={{ height: LAYOUT.HEADER_HEIGHT - 10 }}>
        <View className="flex-1 mr-4">
          <Skeleton width={128} height={32} variant="primary" className="mb-2" />
          <Skeleton width={96} height={16} variant="primary-container" />
        </View>
        <Skeleton width={96} height={40} borderRadius={16} variant="white" className="border border-outline-variant/10" />
      </View>

      {/* Tiles Skeleton */}
      <View className="px-6">
        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
          <View
            key={i}
            style={{ height: tileHeight }}
            className="flex-row items-center mb-2 rounded-[32px] bg-surface-container-low border border-outline-variant/5"
          >
            <Skeleton width={64} height={64} borderRadius={16} variant="white" className="ml-4 border border-outline-variant/5" />
            <View className="ml-4 flex-1">
              <Skeleton width="75%" height={16} variant="primary-container" className="mb-2" />
              <Skeleton width="50%" height={16} variant="primary-container" />
            </View>
            <View className="w-20 h-full border-l border-outline-variant/5 items-center justify-center">
              <Skeleton.Circle size={56} variant="white" className="border border-outline-variant/5" />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};
