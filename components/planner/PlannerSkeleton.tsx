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
    <Skeleton.Screen 
      headerTitleWidth={128} 
      headerSubtitleWidth={96}
      isScrollable={true}
    >
      {/* Tiles Skeleton */}
      <View>
        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
          <Skeleton.Card
            key={i}
            height={tileHeight}
            className="flex-row items-center mb-2 border border-outline-variant/5 px-0 py-0"
            padding={0}
          >
            <Skeleton.Box width={64} height={64} borderRadius={16} variant="white" className="ml-4 border border-outline-variant/5" />
            <View className="ml-4 flex-1">
              <Skeleton.Box width="75%" height={16} variant="primary-container" className="mb-2" />
              <Skeleton.Box width="50%" height={16} variant="primary-container" />
            </View>
            <View className="w-20 h-full border-l border-outline-variant/5 items-center justify-center">
              <Skeleton.Circle size={56} variant="white" className="border border-outline-variant/5" />
            </View>
          </Skeleton.Card>
        ))}
      </View>
    </Skeleton.Screen>
  );
};
