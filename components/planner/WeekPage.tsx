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
));
