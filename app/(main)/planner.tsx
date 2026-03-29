import React, { useState, useMemo, useCallback, memo, useRef } from 'react';
import { View, Text, FlatList, TouchableOpacity, useWindowDimensions, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import { 
  format, 
  startOfWeek, 
  addDays, 
  addWeeks, 
  isToday,
  isSameMonth,
} from 'date-fns';
import { fr, enUS } from 'date-fns/locale';
import { Check, X, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type DayStatus = 'none' | 'available' | 'unavailable';

interface DayData {
  date: Date;
  dateKey: string;
}

interface WeekData {
  id: string;
  days: DayData[];
  startDate: Date;
}

const STATUS_CYCLE: DayStatus[] = ['none', 'available', 'unavailable'];
const INITIAL_WEEK_INDEX = 5;

const DayTile = memo(({ 
  date, 
  dateKey, 
  status, 
  onPress, 
  locale,
  isToday: today,
  tileHeight
}: { 
  date: Date; 
  dateKey: string; 
  status: DayStatus; 
  onPress: (key: string) => void;
  locale: any;
  isToday: boolean;
  tileHeight: number;
}) => {
  let iconColor = '#92400e'; // amber-800
  let bgColor = 'bg-amber-50';
  let borderColor = 'border-amber-200';

  if (status === 'available') {
    iconColor = '#1B3617'; // forest-dark
    bgColor = 'bg-[#E9F0E9]'; // Solid light forest to avoid Android transparency "box" issues
    borderColor = 'border-forest/20';
  } else if (status === 'unavailable') {
    iconColor = '#991b1b'; // red-800
    bgColor = 'bg-red-50';
    borderColor = 'border-red-200';
  }

  const renderIcon = () => {
    if (status === 'available') {
      return <Check size={32} color={iconColor} strokeWidth={4} />;
    }
    if (status === 'unavailable') {
      return <X size={32} color={iconColor} strokeWidth={4} />;
    }
    // Regular '?' for unknown state
    return <Text style={{ color: iconColor, fontSize: 32, fontWeight: '900' }}>?</Text>;
  };

  return (
    <TouchableOpacity
      onPress={() => onPress(dateKey)}
      activeOpacity={0.7}
      style={{ 
        height: today ? tileHeight + 4 : tileHeight,
        shadowColor: today ? '#1B3617' : '#000',
        shadowOffset: { width: 0, height: today ? 6 : 1 },
        shadowOpacity: today ? 0.4 : 0.05,
        shadowRadius: today ? 8 : 2,
        elevation: today ? 8 : 1,
        zIndex: today ? 10 : 1,
      }}
      className={`flex-row items-center justify-between p-4 mb-2 rounded-[32px] ${bgColor} ${today ? 'border-[3px] border-forest-dark scale-[1.05]' : `border-[0.5px] ${borderColor}`}`}
    >
      <View className="flex-row items-center">
        {/* Calendar Tile Style */}
        <View className={`w-16 h-16 items-center justify-center rounded-2xl bg-white border ${today ? 'border-forest/40' : 'border-black/5'}`}>
          <Text className="text-xs font-black text-forest uppercase tracking-widest mb-0.5">
            {format(date, 'EEE', { locale })}
          </Text>
          <Text className="text-2xl font-black text-forest-dark leading-none">
            {format(date, 'd', { locale })}
          </Text>
        </View>
      </View>
      
      <View className={`w-14 h-14 items-center justify-center rounded-full bg-white border ${today ? 'border-forest/30' : 'border-black/5'}`}>
        {renderIcon()}
      </View>
    </TouchableOpacity>
  );
});

const WeekPage = memo(({ 
  item, 
  windowWidth, 
  plans, 
  onToggleStatus, 
  locale,
  tileHeight
}: { 
  item: WeekData; 
  windowWidth: number; 
  plans: Record<string, DayStatus>;
  onToggleStatus: (key: string) => void;
  locale: any;
  tileHeight: number;
}) => {
  return (
    <View style={{ width: windowWidth }} className="px-6">
      {item.days.map((day) => (
        <DayTile
          key={day.dateKey}
          date={day.date}
          dateKey={day.dateKey}
          status={plans[day.dateKey] || 'none'}
          onPress={onToggleStatus}
          locale={locale}
          isToday={isToday(day.date)}
          tileHeight={tileHeight}
        />
      ))}
    </View>
  );
});

export default function Planner() {
  const { t, i18n } = useTranslation();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const locale = i18n.language === 'fr' ? fr : enUS;
  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(INITIAL_WEEK_INDEX);

  // Dynamic Height Calculation
  const topPadding = insets.top + (Platform.OS === 'android' ? 8 : 16);
  const headerHeight = 70; 
  const tabBarHeight = 60 + (insets.bottom > 0 ? insets.bottom / 2 : 0);
  const bottomBuffer = insets.bottom > 0 ? insets.bottom : 16;
  
  const availableHeightForList = windowHeight - topPadding - headerHeight - tabBarHeight - bottomBuffer;
  const tileHeight = Math.floor((availableHeightForList - (6 * 8) - 12) / 7); // Extra buffer for today's scale

  const [plans, setPlans] = useState<Record<string, DayStatus>>({});

  const weeks = useMemo(() => {
    const currentStartOfWeek = startOfWeek(new Date(), { weekStartsOn: 1 });
    const result: WeekData[] = [];
    
    for (let i = -5; i < 15; i++) {
      const weekStart = addWeeks(currentStartOfWeek, i);
      const days: DayData[] = [];
      for (let j = 0; j < 7; j++) {
        const date = addDays(weekStart, j);
        days.push({
          date,
          dateKey: format(date, 'yyyy-MM-dd'),
        });
      }
      result.push({
        id: `week-${i}`,
        days,
        startDate: weekStart,
      });
    }
    return result;
  }, []);

  const toggleStatus = useCallback((dateKey: string) => {
    setPlans(prev => {
      const currentStatus = prev[dateKey] || 'none';
      const currentIndex = STATUS_CYCLE.indexOf(currentStatus);
      const nextIndex = (currentIndex + 1) % STATUS_CYCLE.length;
      return {
        ...prev,
        [dateKey]: STATUS_CYCLE[nextIndex],
      };
    });
  }, []);

  const goToToday = useCallback(() => {
    flatListRef.current?.scrollToIndex({ index: INITIAL_WEEK_INDEX, animated: true });
    setCurrentIndex(INITIAL_WEEK_INDEX);
  }, []);

  const moveWeek = useCallback((direction: 'prev' | 'next') => {
    const nextIndex = direction === 'prev' ? currentIndex - 1 : currentIndex + 1;
    if (nextIndex >= 0 && nextIndex < weeks.length) {
      flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
      setCurrentIndex(nextIndex);
    }
  }, [currentIndex, weeks.length]);

  const renderWeek = useCallback(({ item }: { item: WeekData }) => (
    <WeekPage 
      item={item} 
      windowWidth={windowWidth} 
      plans={plans} 
      onToggleStatus={toggleStatus}
      locale={locale}
      tileHeight={tileHeight}
    />
  ), [windowWidth, plans, toggleStatus, locale, tileHeight]);

  const onMomentumScrollEnd = (event: any) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / windowWidth);
    setCurrentIndex(index);
  };

  const currentWeekLabel = useMemo(() => {
    const startDate = weeks[currentIndex].startDate;
    const endDate = addDays(startDate, 6);
    
    if (isSameMonth(startDate, endDate)) {
      return format(startDate, 'MMMM yyyy', { locale });
    } else {
      const month1 = format(startDate, 'MMM.', { locale });
      const month2 = format(endDate, 'MMM.', { locale });
      const year = format(endDate, 'yyyy', { locale });
      return `${month1} / ${month2} ${year}`;
    }
  }, [currentIndex, weeks, locale]);

  return (
    <View className="flex-1 bg-hearth" style={{ paddingTop: topPadding }}>
      {/* Header */}
      <View className="px-6 mb-4 flex-row items-center justify-between h-[60px]">
        <View className="flex-1 mr-4">
          <Text className="text-3xl font-black text-forest-dark tracking-tighter uppercase">{t('tabs.planner')}</Text>
          <Text className="text-xs font-bold text-forest-light uppercase tracking-widest opacity-60">
            {currentWeekLabel}
          </Text>
        </View>
        
        <View className="flex-row items-center bg-white shadow-sm p-1 rounded-2xl border border-sage-light/30">
          <TouchableOpacity 
            onPress={() => moveWeek('prev')} 
            className="p-2 mr-1"
            disabled={currentIndex === 0}
          >
            <ChevronLeft size={24} color={currentIndex === 0 ? '#ccc' : '#2D5A27'} />
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={goToToday}
            activeOpacity={0.7}
            className={`px-4 py-2 rounded-xl border ${currentIndex === INITIAL_WEEK_INDEX ? 'bg-forest border-forest' : 'bg-hearth border-sage-light/20'}`}
          >
            <Text className={`text-xs font-black uppercase tracking-widest ${currentIndex === INITIAL_WEEK_INDEX ? 'text-white' : 'text-forest'}`}>
              {t('common.today')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => moveWeek('next')} 
            className="p-2 ml-1"
            disabled={currentIndex === weeks.length - 1}
          >
            <ChevronRight size={24} color={currentIndex === weeks.length - 1 ? '#ccc' : '#2D5A27'} />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        ref={flatListRef}
        data={weeks}
        keyExtractor={(item) => item.id}
        renderItem={renderWeek}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        initialScrollIndex={INITIAL_WEEK_INDEX}
        getItemLayout={(data, index) => ({
          length: windowWidth,
          offset: windowWidth * index,
          index,
        })}
        onMomentumScrollEnd={onMomentumScrollEnd}
        removeClippedSubviews={true}
        initialNumToRender={3}
        windowSize={5}
        maxToRenderPerBatch={2}
      />
    </View>
  );
}
