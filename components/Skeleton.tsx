import React, { useEffect, useRef } from 'react';
import { Animated, ViewProps, ViewStyle } from 'react-native';

interface SkeletonProps extends ViewProps {
  width?: ViewStyle['width'];
  height?: ViewStyle['height'];
  borderRadius?: number;
  style?: ViewStyle;
  variant?: 'primary' | 'white' | 'primary-container';
}

export const Skeleton = ({ 
  width, 
  height, 
  borderRadius = 8, 
  style, 
  variant = 'primary',
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
      case 'primary-container':
        return 'rgba(22, 53, 38, 0.05)';
      case 'primary':
      default:
        return 'rgba(22, 53, 38, 0.1)';
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
