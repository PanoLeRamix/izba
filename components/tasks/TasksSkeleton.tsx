import React from 'react';
import { View } from 'react-native';
import { Skeleton } from '../Skeleton';

export const TasksSkeleton = () => {
  return (
    <Skeleton.Screen 
      headerTitleWidth={120} 
      headerSubtitleWidth={180}
      isScrollable={true}
    >
      {[1, 2, 3, 4].map((i) => (
        <Skeleton.Card
          key={i}
          className="mb-4 border border-outline-variant/10"
          padding={24}
        >
          {/* Member Name - taking more width */}
          <Skeleton.Box width="100%" height={24} variant="primary" className="mb-4" />
          
          {/* Task Chips placeholders - more substantial */}
          <View className="flex-row flex-wrap gap-2">
            {[1, 2, 3, 4, 5].slice(0, 2 + (i % 3)).map((j) => (
              <Skeleton.Box 
                key={j} 
                width={100 + (j * 30) % 80} 
                height={32} 
                borderRadius={16} 
                variant="primary-container" 
              />
            ))}
          </View>
        </Skeleton.Card>
      ))}
    </Skeleton.Screen>
  );
};
