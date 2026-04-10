import React, { useCallback, useRef } from 'react';
import {
  FlatList,
  Platform,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ViewStyle,
} from 'react-native';
import { CalendarArrowDown, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { Colors } from '../constants/Colors';

type WebListStyle = ViewStyle & {
  touchAction?: 'pan-x';
};

interface PagedCarouselProps<T> {
  title: string;
  subtitle: string;
  data: T[];
  activeIndex: number;
  currentIndex: number;
  keyExtractor: (item: T) => string;
  onIndexChange: (index: number) => void;
  renderItem: (item: T, pageWidth: number) => React.ReactElement;
  headerAction?: React.ReactNode;
  headerHeight?: number;
  limitSwipeToAdjacentPage?: boolean;
}

export function PagedCarousel<T>({
  title,
  subtitle,
  data,
  activeIndex,
  currentIndex,
  keyExtractor,
  onIndexChange,
  renderItem,
  headerAction,
  headerHeight = 60,
  limitSwipeToAdjacentPage = false,
}: PagedCarouselProps<T>) {
  const { width: windowWidth } = useWindowDimensions();
  const flatListRef = useRef<FlatList<T>>(null);
  const dragStartIndexRef = useRef(activeIndex);
  const listStyle: WebListStyle = { flex: 1 };

  if (Platform.OS === 'web') {
    listStyle.touchAction = 'pan-x';
  }

  const handleScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offset = event.nativeEvent.contentOffset.x;
      if (offset < 0) return;

      const rawIndex = Math.round(offset / windowWidth);
      const boundedIndex = Math.max(0, Math.min(rawIndex, data.length - 1));
      const nextIndex = limitSwipeToAdjacentPage
        ? Math.max(dragStartIndexRef.current - 1, Math.min(boundedIndex, dragStartIndexRef.current + 1))
        : boundedIndex;

      if (nextIndex !== boundedIndex) {
        flatListRef.current?.scrollToOffset({
          offset: nextIndex * windowWidth,
          animated: true,
        });
      }

      if (nextIndex !== activeIndex) {
        onIndexChange(nextIndex);
      }
    },
    [activeIndex, data.length, limitSwipeToAdjacentPage, onIndexChange, windowWidth],
  );

  const scrollToIndex = useCallback(
    (index: number) => {
      if (index >= 0 && index < data.length) {
        flatListRef.current?.scrollToOffset({
          offset: index * windowWidth,
          animated: true,
        });
        onIndexChange(index);
      }
    },
    [data.length, onIndexChange, windowWidth],
  );

  const navigator = (
    <View className="flex-row items-center bg-white shadow-sm p-1 rounded-2xl border border-sage-light/30 h-[44px]">
      <TouchableOpacity onPress={() => scrollToIndex(activeIndex - 1)} className="p-2 h-full justify-center">
        <ChevronLeft size={24} color={Colors.forest} />
      </TouchableOpacity>

      <TouchableOpacity onPress={() => scrollToIndex(currentIndex)} className="p-2 h-full justify-center">
        <CalendarArrowDown size={22} color={Colors.forest} strokeWidth={2.5} />
      </TouchableOpacity>

      <TouchableOpacity onPress={() => scrollToIndex(activeIndex + 1)} className="p-2 h-full justify-center">
        <ChevronRight size={24} color={Colors.forest} />
      </TouchableOpacity>
    </View>
  );

  return (
    <>
      <View className="px-6 mb-2 flex-row items-center justify-between" style={{ height: headerHeight }}>
        <View className="flex-1 mr-4">
          <Text className="text-3xl font-black text-forest-dark uppercase" numberOfLines={1} adjustsFontSizeToFit>
            {title}
          </Text>
          <Text className="text-xs font-bold text-forest-light uppercase opacity-60">{subtitle}</Text>
        </View>
        <View className="flex-row items-center">
          {headerAction ? <View className="mr-3">{headerAction}</View> : null}
          {navigator}
        </View>
      </View>

      <FlatList
        ref={flatListRef}
        data={data}
        keyExtractor={keyExtractor}
        renderItem={({ item }) => renderItem(item, windowWidth)}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        initialScrollIndex={currentIndex}
        getItemLayout={(_items, index) => ({
          length: windowWidth,
          offset: windowWidth * index,
          index,
        })}
        onScrollBeginDrag={(event) => {
          const offset = event.nativeEvent.contentOffset.x;
          dragStartIndexRef.current = Math.max(0, Math.min(Math.round(offset / windowWidth), data.length - 1));
        }}
        onMomentumScrollEnd={handleScrollEnd}
        onScrollToIndexFailed={(info) => {
          flatListRef.current?.scrollToOffset({
            offset: info.averageItemLength * info.index,
            animated: false,
          });
        }}
        scrollEventThrottle={16}
        disableIntervalMomentum
        snapToInterval={windowWidth}
        initialNumToRender={2}
        windowSize={5}
        maxToRenderPerBatch={2}
        updateCellsBatchingPeriod={50}
        style={listStyle}
      />
    </>
  );
}
