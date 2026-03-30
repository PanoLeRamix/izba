import React from 'react';
import { View, useWindowDimensions, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LAYOUT } from '../../constants/Layout';

export const PlannerSkeleton = () => {
  const { height: windowHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const opacity = React.useRef(new Animated.Value(0.3)).current;

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const topPadding = LAYOUT.getTopPadding(insets.top);
  const bottomBuffer = LAYOUT.getBottomBuffer(insets.bottom);
  const availableHeight = windowHeight - topPadding - (LAYOUT.HEADER_HEIGHT - 10) - LAYOUT.TAB_BAR_HEIGHT - bottomBuffer;
  const tileHeight = LAYOUT.getTileHeight(availableHeight);

  return (
    <View className="flex-1 bg-hearth" style={{ paddingTop: topPadding }}>
      {/* Header Skeleton */}
      <View className="px-6 mb-2 flex-row items-center justify-between" style={{ height: LAYOUT.HEADER_HEIGHT - 10 }}>
        <View className="flex-1 mr-4">
          <Animated.View style={{ opacity }} className="h-8 w-32 bg-forest/10 rounded-lg mb-2" />
          <Animated.View style={{ opacity }} className="h-4 w-24 bg-forest/5 rounded-md" />
        </View>
        <Animated.View style={{ opacity }} className="w-24 h-10 bg-white rounded-2xl border border-sage-light/30" />
      </View>

      {/* Tiles Skeleton */}
      <View className="px-6">
        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
          <Animated.View
            key={i}
            style={{ height: tileHeight, opacity }}
            className="flex-row items-center mb-2 rounded-[32px] bg-white/50 border border-black/5"
          >
            <View className="w-16 h-16 ml-4 rounded-2xl bg-white border border-black/5" />
            <View className="ml-4 flex-1">
              <View className="h-4 w-3/4 bg-forest/5 rounded-md mb-2" />
              <View className="h-4 w-1/2 bg-forest/5 rounded-md" />
            </View>
            <View className="w-20 h-full border-l border-black/5 items-center justify-center">
              <View className="w-14 h-14 rounded-full bg-white border border-black/5" />
            </View>
          </Animated.View>
        ))}
      </View>
    </View>
  );
};
