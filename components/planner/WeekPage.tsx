import React from 'react';
import { View } from 'react-native';
import { isToday } from 'date-fns';
import { DayTile } from './DayTile';
import { PlannerStatus } from '../../services/planner';
import { User } from '../../services/user';

interface DayInfo {
  date: Date;
  dateKey: string;
}

interface WeekItem {
  id: string;
  startDate: Date;
  days: DayInfo[];
}

interface ProcessedDay {
  eaters: (User & { guestCount: number; note?: string })[];
  totalCount: number;
  cooks: User[];
}

interface WeekPageProps {
  item: WeekItem;
  windowWidth: number;
  onToggleStatus: (dateKey: string) => void;
  onShowDetails: (dateKey: string) => void;
  locale: any;
  tileHeight: number;
  processedData: Record<string, ProcessedDay>;
  userPlans: Record<string, { status: PlannerStatus; isCooking: boolean; guestCount: number }>;
}

export const WeekPage = React.memo(({ 
  item, 
  windowWidth, 
  onToggleStatus, 
  onShowDetails, 
  locale, 
  processedData,
  userPlans,
  tileHeight
}: WeekPageProps) => (
  <View 
    style={{ 
      width: windowWidth,
      // @ts-ignore
      scrollSnapAlign: 'start',
      // @ts-ignore
      scrollSnapStop: 'always',
    }} 
    className="px-6"
  >
    {item.days.map((day) => {
      const dayPlan = userPlans[day.dateKey] || { status: 'none', isCooking: false, guestCount: 0 };
      const { eaters, totalCount, cooks } = processedData[day.dateKey] || { eaters: [], totalCount: 0, cooks: [] };

      return (
        <DayTile 
          key={day.dateKey} 
          {...day} 
          status={dayPlan.status} 
          isUserCooking={dayPlan.isCooking}
          userGuestCount={dayPlan.guestCount}
          onToggleStatus={onToggleStatus} 
          onShowDetails={onShowDetails}
          locale={locale} 
          isToday={isToday(day.date)} 
          tileHeight={tileHeight}
          eaters={eaters}
          eatersCount={totalCount}
          cookName={cooks.map((u) => u.name).join(', ')}
        />
      );
    })}
  </View>
), (prevProps, nextProps) => {
  if (prevProps.windowWidth !== nextProps.windowWidth) return false;
  if (prevProps.tileHeight !== nextProps.tileHeight) return false;
  if (prevProps.item.id !== nextProps.item.id) return false;
  if (prevProps.locale !== nextProps.locale) return false;

  // Check if any day in this week has changed in either userPlans or processedData
  // Since we optimized usePlanner to preserve references, we can use simple equality checks
  return prevProps.item.days.every(day => {
    const prevPlan = prevProps.userPlans[day.dateKey];
    const nextPlan = nextProps.userPlans[day.dateKey];
    const prevData = prevProps.processedData[day.dateKey];
    const nextData = nextProps.processedData[day.dateKey];
    
    return prevPlan === nextPlan && prevData === nextData;
  });
});
