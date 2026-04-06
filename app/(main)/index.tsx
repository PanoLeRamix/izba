import React, { useMemo, useState } from 'react';
import { Text, useWindowDimensions, View } from 'react-native';
import { format, addDays, isSameMonth, type Locale } from 'date-fns';
import { enUS, fr } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PagedCarousel } from '../../components/PagedCarousel';
import { DetailModal } from '../../components/planner/DetailModal';
import { PlannerSkeleton } from '../../components/planner/PlannerSkeleton';
import { WeekPage } from '../../components/planner/WeekPage';
import { LAYOUT } from '../../constants/Layout';
import { CURRENT_WEEK_INDEX, type WeekItem, usePlanner } from '../../hooks/usePlanner';

const DEFAULT_DAY_PLAN = {
  status: 'none' as const,
  isCooking: false,
  guestCount: 0,
  note: '',
};

export default function Planner() {
  const { t, i18n } = useTranslation();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const locale: Locale = i18n.language === 'fr' ? fr : enUS;
  const [activeWeekIndex, setActiveWeekIndex] = useState(CURRENT_WEEK_INDEX);
  const [selectedDayKey, setSelectedDayKey] = useState<string | null>(null);
  const { weeks, userPlans, processedData, isLoading, actions } = usePlanner();

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
  const availableHeight =
    windowHeight - topPadding - (LAYOUT.HEADER_HEIGHT - 10) - LAYOUT.TAB_BAR_HEIGHT - bottomBuffer;
  const tileHeight = LAYOUT.getTileHeight(availableHeight);

  if (isLoading) {
    return <PlannerSkeleton />;
  }

  const selectedDayData = selectedDayKey ? processedData[selectedDayKey] : null;
  const selectedDayPlan = selectedDayKey ? userPlans[selectedDayKey] || DEFAULT_DAY_PLAN : DEFAULT_DAY_PLAN;

  return (
    <View className="flex-1 bg-hearth" style={{ paddingTop: topPadding }}>
      <PagedCarousel
        title={t('tabs.planner')}
        subtitle={currentMonthLabel}
        data={weeks}
        activeIndex={activeWeekIndex}
        currentIndex={CURRENT_WEEK_INDEX}
        keyExtractor={(item: WeekItem) => item.id}
        onIndexChange={setActiveWeekIndex}
        renderItem={(item, pageWidth) => (
          <WeekPage
            item={item}
            windowWidth={pageWidth}
            userPlans={userPlans}
            onToggleStatus={actions.toggleStatus}
            onShowDetails={setSelectedDayKey}
            locale={locale}
            processedData={processedData}
            tileHeight={tileHeight}
          />
        )}
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
