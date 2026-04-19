import React, { useEffect, useRef } from 'react';
import { Animated, ScrollView, View, ViewProps, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LAYOUT } from '../constants/Layout';

interface SkeletonProps extends ViewProps {
  width?: ViewStyle['width'];
  height?: ViewStyle['height'];
  borderRadius?: number;
  style?: ViewStyle;
  variant?: 'primary' | 'white' | 'primary-container' | 'surface-container';
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
      case 'surface-container':
        return 'rgba(22, 53, 38, 0.03)';
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

// Specialized Sub-components
Skeleton.Circle = ({ size, ...props }: { size: number } & Omit<SkeletonProps, 'width' | 'height' | 'borderRadius'>) => (
  <Skeleton width={size} height={size} borderRadius={size / 2} {...props} />
);

Skeleton.Box = ({ width = '100%', height = 20, ...props }: SkeletonProps) => (
  <Skeleton width={width} height={height} {...props} />
);

Skeleton.Row = ({ children, className = '', style }: { children: React.ReactNode; className?: string; style?: ViewStyle }) => (
  <View className={`flex-row items-center ${className}`} style={style}>
    {children}
  </View>
);

Skeleton.Card = ({ children, className = '', height, padding = 24, variant = 'surface-container' }: { children?: React.ReactNode; className?: string; height?: number; padding?: number; variant?: 'white' | 'primary-container' | 'surface-container' }) => {
  const getBgClass = () => {
    switch (variant) {
      case 'white': return 'bg-white';
      case 'primary-container': return 'bg-primary/10';
      case 'surface-container': return 'bg-surface-container-low';
      default: return 'bg-surface-container-low';
    }
  };

  return (
    <View 
      className={`${getBgClass()} rounded-[2rem] mb-6 ${className}`}
      style={{ height, padding }}
    >
      {children}
    </View>
  );
};

Skeleton.Screen = ({ 
  children, 
  headerTitleWidth = 150, 
  headerSubtitleWidth = 100,
  hasHeader = true,
  isScrollable = true
}: { 
  children: React.ReactNode; 
  headerTitleWidth?: number; 
  headerSubtitleWidth?: number;
  hasHeader?: boolean;
  isScrollable?: boolean;
}) => {
  const insets = useSafeAreaInsets();
  const topPadding = LAYOUT.getTopPadding(insets.top);
  const bottomPadding = Math.max(insets.bottom, LAYOUT.BASE_SCREEN_PADDING);

  const Content = isScrollable ? ScrollView : View;

  return (
    <View className="flex-1 bg-surface" style={{ paddingTop: topPadding }}>
      {hasHeader && (
        <View className="px-6 mb-2 justify-center" style={{ height: LAYOUT.HEADER_HEIGHT - 10 }}>
          <Skeleton.Box width={headerTitleWidth} height={32} variant="primary" className="mb-2" />
          {headerSubtitleWidth > 0 && <Skeleton.Box width={headerSubtitleWidth} height={12} variant="primary-container" />}
        </View>
      )}
      
      <Content 
        className="flex-1"
        contentContainerStyle={isScrollable ? { 
          paddingHorizontal: LAYOUT.BASE_SCREEN_PADDING,
          paddingBottom: bottomPadding,
          paddingTop: 12,
        } : { flex: 1, paddingHorizontal: LAYOUT.BASE_SCREEN_PADDING }}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </Content>
    </View>
  );
};
