import React from 'react';
import { View, Animated, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LAYOUT } from '../../constants/Layout';

export const SettingsSkeleton = () => {
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

  const TileSkeleton = () => (
    <Animated.View 
      style={{ opacity }}
      className="p-6 rounded-3xl mb-6 border border-sage/10 bg-white/50 h-32 flex-row items-center"
    >
      <View className="bg-forest/5 p-3 rounded-2xl mr-4 w-12 h-12" />
      <View className="flex-1">
        <View className="h-3 w-20 bg-forest/5 rounded mb-2" />
        <View className="h-6 w-32 bg-forest/10 rounded" />
      </View>
    </Animated.View>
  );

  return (
    <ScrollView 
      className="flex-1 bg-hearth"
      contentContainerStyle={{ 
        paddingTop: insets.top,
        paddingBottom: Math.max(insets.bottom, LAYOUT.BASE_SCREEN_PADDING),
        paddingHorizontal: 24
      }}
    >
      <View className="items-center mb-12" style={{ marginTop: LAYOUT.BASE_SCREEN_PADDING }}>
        <Animated.View style={{ opacity }} className="text-4xl mb-2 w-12 h-12 bg-forest/5 rounded-full" />
        <Animated.View style={{ opacity }} className="h-8 w-48 bg-forest/10 rounded-lg" />
      </View>

      <TileSkeleton />
      <TileSkeleton />
      
      <Animated.View style={{ opacity }} className="h-16 w-full bg-white/50 rounded-3xl border border-sage/10 mb-6" />
      <Animated.View style={{ opacity }} className="h-14 w-full bg-forest/5 rounded-2xl" />
    </ScrollView>
  );
};
