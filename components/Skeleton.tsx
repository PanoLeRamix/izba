import React, { useEffect, useRef } from 'react';
import { Animated, ViewProps, ViewStyle } from 'react-native';

interface SkeletonProps extends ViewProps {
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  style?: ViewStyle;
  variant?: 'forest' | 'white' | 'forest-light';
}

export const Skeleton = ({ 
  width, 
  height, 
  borderRadius = 8, 
  style, 
  variant = 'forest',
  ...props 
}: SkeletonProps) => {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
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
  }, [opacity]);

  const getBackgroundColor = () => {
    switch (variant) {
      case 'white':
        return 'rgba(255, 255, 255, 0.5)';
      case 'forest-light':
        return 'rgba(45, 90, 39, 0.05)';
      case 'forest':
      default:
        return 'rgba(45, 90, 39, 0.1)';
    }
  };

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: getBackgroundColor(),
          opacity,
        },
        style,
      ]}
      {...props}
    />
  );
};

Skeleton.Circle = ({ size, ...props }: { size: number } & Omit<SkeletonProps, 'width' | 'height' | 'borderRadius'>) => (
  <Skeleton width={size} height={size} borderRadius={size / 2} {...props} />
);
