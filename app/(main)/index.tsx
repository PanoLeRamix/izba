import React, { useState, useMemo, useCallback, useRef } from 'react';
import { View, Text, FlatList, TouchableOpacity, useWindowDimensions, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { format, addDays, isSameMonth } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePlanner } from '../../hooks/usePlanner';
import { WeekPage } from '../../components/planner/WeekPage';
import { DetailModal } from '../../components/planner/DetailModal';
import { LAYOUT } from '../../constants/Layout';

const INITIAL_WEEK_INDEX = 5;

export default function Planner() {
  const { t, i18n } = useTranslation();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const locale = i18n.language === 'fr' ? fr : enUS;
  const flatListRef = useRef<FlatList>(null);
  
  const [currentIndex, setCurrentIndex] = useState(INITIAL_WEEK_INDEX);
  const [selectedDayKey, setSelectedDayKey] = useState<string | null>(null);

  const { weeks, userPlans, processedData, isLoading, actions } = usePlanner();

  const openDetails = useCallback((dateKey: string) => {
    setSelectedDayKey(dateKey);
  }, []);

  const topPadding = LAYOUT.getTopPadding(insets.top);
  const bottomBuffer = LAYOUT.getBottomBuffer(insets.bottom);
  const availableHeight = windowHeight - topPadding - LAYOUT.HEADER_HEIGHT - LAYOUT.TAB_BAR_HEIGHT - bottomBuffer;
  const tileHeight = LAYOUT.getTileHeight(availableHeight);

  const currentWeekLabel = useMemo(() => {
    const s = weeks[currentIndex].startDate;
    const e = addDays(s, 6);
    return isSameMonth(s, e) ? format(s, 'MMMM yyyy', { locale }) : `${format(s, 'MMM.', { locale })} / ${format(e, 'MMM.', { locale })} ${format(e, 'yyyy', { locale })}`;
  }, [currentIndex, locale, weeks]);

  const scrollToWeek = useCallback((index: number) => {
    flatListRef.current?.scrollToIndex({ index, animated: true });
  }, []);

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
      <View className="px-6 mb-4 flex-row items-center justify-between" style={{ height: LAYOUT.HEADER_HEIGHT - 10 }}>
        <View className="flex-1 mr-4">
          <Text className="text-3xl font-black text-forest-dark uppercase">{t('tabs.planner')}</Text>
          <Text className="text-xs font-bold text-forest-light uppercase opacity-60">{currentWeekLabel}</Text>
        </View>
        <View className="flex-row items-center bg-white shadow-sm p-1 rounded-2xl border border-sage-light/30">
          <TouchableOpacity onPress={() => scrollToWeek(currentIndex - 1)} className="p-2">
            <ChevronLeft size={24} color="#2D5A27" />
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => scrollToWeek(INITIAL_WEEK_INDEX)} 
            className={`px-4 py-2 rounded-xl border ${currentIndex === INITIAL_WEEK_INDEX ? 'bg-forest border-forest' : 'bg-hearth border-sage-light/20'}`}
          >
            <Text className={`text-xs font-black uppercase ${currentIndex === INITIAL_WEEK_INDEX ? 'text-white' : 'text-forest'}`}>
              {t('common.today')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => scrollToWeek(currentIndex + 1)} className="p-2">
            <ChevronRight size={24} color="#2D5A27" />
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
            onLongPress={openDetails} 
            locale={locale} 
            tileHeight={tileHeight} 
            processedData={processedData}
          />
        )}
        horizontal pagingEnabled showsHorizontalScrollIndicator={false}
        initialScrollIndex={INITIAL_WEEK_INDEX}
        onMomentumScrollEnd={e => setCurrentIndex(Math.round(e.nativeEvent.contentOffset.x / windowWidth))}
        getItemLayout={(_, index) => ({ length: windowWidth, offset: windowWidth * index, index })}
        removeClippedSubviews={true}
        initialNumToRender={3}
        windowSize={5}
        maxToRenderPerBatch={2}
      />

      <DetailModal
        visible={!!selectedDayKey}
        onClose={() => setSelectedDayKey(null)}
        date={selectedDayKey ? new Date(selectedDayKey) : null}
        dateKey={selectedDayKey || ''}
        eaters={selectedDayData?.eaters || []}
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
