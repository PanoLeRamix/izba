import React, { useState, useMemo, useCallback, useRef } from 'react';
import { View, Text, FlatList, TouchableOpacity, useWindowDimensions, ActivityIndicator, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import { format, addDays, isSameMonth } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, CalendarArrowDown } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePlanner, CURRENT_WEEK_INDEX } from '../../hooks/usePlanner';
import { WeekPage } from '../../components/planner/WeekPage';
import { DetailModal } from '../../components/planner/DetailModal';
import { LAYOUT } from '../../constants/Layout';
import { Colors } from '../../constants/Colors';

export default function Planner() {
  const { t, i18n } = useTranslation();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const locale = i18n.language === 'fr' ? fr : enUS;
  const flatListRef = useRef<FlatList>(null);
  
  const [activeWeekIndex, setActiveWeekIndex] = useState(CURRENT_WEEK_INDEX);
  // Ref for Button navigation (avoids stale state during fast clicks)
  const targetWeekIndex = useRef(CURRENT_WEEK_INDEX);
  
  const [selectedDayKey, setSelectedDayKey] = useState<string | null>(null);

  const { weeks, userPlans, processedData, isLoading, actions } = usePlanner();

  const handleScroll = useCallback((e: any) => {
    const offset = e.nativeEvent.contentOffset.x;
    if (offset < 0) return; // Ignore bounce
    
    const index = Math.round(offset / windowWidth);
    
    if (index >= 0 && index < weeks.length && index !== activeWeekIndex) {
      setActiveWeekIndex(index);
      targetWeekIndex.current = index;
    }
  }, [windowWidth, weeks.length, activeWeekIndex]);

  const openDetails = useCallback((dateKey: string) => {
    setSelectedDayKey(dateKey);
  }, []);

  const scrollToWeek = useCallback((index: number) => {
    if (index >= 0 && index < weeks.length) {
      targetWeekIndex.current = index;
      flatListRef.current?.scrollToOffset({ 
        offset: index * windowWidth, 
        animated: true 
      });
    }
  }, [weeks.length, windowWidth]);

  const currentMonthLabel = useMemo(() => {
    const week = weeks[activeWeekIndex];
    const start = week.startDate;
    const end = addDays(start, 6);
    
    if (isSameMonth(start, end)) {
      return format(start, 'MMMM yyyy', { locale });
    }
    
    return `${format(start, 'MMM.', { locale })} / ${format(end, 'MMM.', { locale })} ${format(end, 'yyyy', { locale })}`;
  }, [activeWeekIndex, locale, weeks]);

  const topPadding = LAYOUT.getTopPadding(insets.top);
  const bottomBuffer = LAYOUT.getBottomBuffer(insets.bottom);
  const availableHeight = windowHeight - topPadding - (LAYOUT.HEADER_HEIGHT - 10) - LAYOUT.TAB_BAR_HEIGHT - bottomBuffer;
  const tileHeight = LAYOUT.getTileHeight(availableHeight);

  if (isLoading) {
    return (
      <View className="flex-1 bg-hearth items-center justify-center">
        <ActivityIndicator size="large" color="#2D5A27" />
      </View>
    );
  }

  const selectedDayData = selectedDayKey ? processedData[selectedDayKey] : null;
  const selectedDayPlan = selectedDayKey ? (userPlans[selectedDayKey] || { status: 'none', isCooking: false, guestCount: 0, note: '' }) : { status: 'none', isCooking: false, guestCount: 0, note: '' };

  return (
    <View className="flex-1 bg-hearth" style={{ paddingTop: topPadding }}>
      {/* Header */}
      <View className="px-6 mb-2 flex-row items-center justify-between" style={{ height: LAYOUT.HEADER_HEIGHT - 10 }}>
        <View className="flex-1 mr-4">
          <Text 
            className="text-3xl font-black text-forest-dark uppercase"
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {t('tabs.planner')}
          </Text>
          <Text className="text-xs font-bold text-forest-light uppercase opacity-60">{currentMonthLabel}</Text>
        </View>
        <View className="flex-row items-center bg-white shadow-sm p-1 rounded-2xl border border-sage-light/30">
          <TouchableOpacity onPress={() => scrollToWeek(targetWeekIndex.current - 1)} className="p-2">
            <ChevronLeft size={24} color={Colors.forest} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            onPress={() => scrollToWeek(CURRENT_WEEK_INDEX)} 
            className="p-2"
          >
            <CalendarArrowDown 
              size={22} 
              color={Colors.forest} 
              strokeWidth={2.5}
            />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => scrollToWeek(targetWeekIndex.current + 1)} className="p-2">
            <ChevronRight size={24} color={Colors.forest} />
          </TouchableOpacity>
        </View>
      </View>
      
      <FlatList
        ref={flatListRef}
        data={weeks}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <WeekPage 
            item={item} 
            windowWidth={windowWidth} 
            userPlans={userPlans} 
            onToggleStatus={actions.toggleStatus} 
            onShowDetails={openDetails} 
            locale={locale} 
            processedData={processedData}
            tileHeight={tileHeight}
          />
        )}
        horizontal 
        pagingEnabled 
        showsHorizontalScrollIndicator={false}
        initialScrollIndex={CURRENT_WEEK_INDEX}
        getItemLayout={(_, index) => ({
          length: windowWidth,
          offset: windowWidth * index,
          index,
        })}
        onScroll={handleScroll}
        onScrollToIndexFailed={(info) => {
          flatListRef.current?.scrollToOffset({ offset: info.averageItemLength * info.index, animated: false });
        }}
        scrollEventThrottle={16}
        disableIntervalMomentum={true}
        snapToInterval={windowWidth}
        removeClippedSubviews={false}
        initialNumToRender={20}
        windowSize={21}
        maxToRenderPerBatch={20}
        style={Platform.OS === 'web' ? { flex: 1, touchAction: 'pan-x' } : { flex: 1 }}
      />

      <DetailModal
        visible={!!selectedDayKey}
        onClose={() => setSelectedDayKey(null)}
        date={selectedDayKey ? new Date(selectedDayKey) : null}
        dateKey={selectedDayKey || ''}
        eaters={selectedDayData?.eaters || []}
        unavailable={selectedDayData?.unavailable || []}
        totalEatersCount={selectedDayData?.totalCount || 0}
        cooks={selectedDayData?.cooks || []}
        isUserCooking={selectedDayPlan.isCooking}
        guestCount={selectedDayPlan.guestCount}
        note={selectedDayPlan.note}
        status={selectedDayPlan.status}
        onToggleStatus={actions.toggleStatus}
        onToggleCooking={actions.toggleCooking}
        onSetGuestCount={actions.setGuestCount}
        onUpdateNote={actions.updateNote}
        locale={locale}
      />
    </View>
  );
}
