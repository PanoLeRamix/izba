import React from 'react';
import { View, Animated, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LAYOUT } from '../../constants/Layout';

export const TaskSkeleton = () => {
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

  return (
    <View className="flex-1 bg-hearth" style={{ paddingTop: topPadding }}>
      {/* Header Skeleton */}
      <View className="px-6 mb-8 flex-row items-center justify-between" style={{ height: LAYOUT.HEADER_HEIGHT - 10 }}>
        <View className="flex-1">
          <Animated.View style={{ opacity }} className="h-10 w-40 bg-forest/10 rounded-xl" />
        </View>
        <Animated.View style={{ opacity }} className="w-12 h-12 bg-white rounded-2xl border border-sage-light/30" />
      </View>

      <ScrollView className="px-6">
        {[1, 2, 3].map((i) => (
          <View key={i} className="mb-8 bg-white/50 rounded-[48px] p-8 border border-black/5">
            <View className="flex-row items-center justify-between mb-8">
              <Animated.View style={{ opacity }} className="h-8 w-32 bg-forest/10 rounded-lg" />
              <Animated.View style={{ opacity }} className="h-6 w-24 bg-chef/10 rounded-full" />
            </View>

            <View className="space-y-4">
              <View className="flex-row items-center bg-white p-6 rounded-[32px] border border-black/5 shadow-sm">
                <Animated.View style={{ opacity }} className="h-6 w-6 rounded-full bg-chef/10 mr-4" />
                <View className="flex-1">
                  <Animated.View style={{ opacity }} className="h-4 w-24 bg-forest/5 rounded-md mb-2" />
                  <Animated.View style={{ opacity }} className="h-6 w-32 bg-forest/10 rounded-lg" />
                </View>
              </View>

              <View className="flex-row bg-white/30 rounded-[32px] p-6 border border-black/5">
                {[1, 2, 3].map((j) => (
                  <View key={j} className="flex-1 items-center border-r border-black/5 last:border-r-0">
                    <Animated.View style={{ opacity }} className="h-3 w-12 bg-forest/5 rounded-md mb-2" />
                    <Animated.View style={{ opacity }} className="h-5 w-16 bg-forest/10 rounded-lg" />
                  </View>
                ))}
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};