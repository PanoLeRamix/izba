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
  onLongPress: (dateKey: string) => void;
  locale: any;
  tileHeight: number;
  processedData: Record<string, ProcessedDay>;
  userPlans: Record<string, { status: PlannerStatus; isCooking: boolean }>;
}

export const WeekPage = React.memo(({ 
  item, 
  windowWidth, 
  onToggleStatus, 
  onLongPress, 
  locale, 
  tileHeight, 
  processedData,
  userPlans
}: WeekPageProps) => (
  <View style={{ width: windowWidth }} className="px-6">
    {item.days.map((day) => {
      const dayPlan = userPlans[day.dateKey] || { status: 'none', isCooking: false };
      const { eaters, totalCount, cooks } = processedData[day.dateKey] || { eaters: [], totalCount: 0, cooks: [] };

      return (
        <DayTile 
          key={day.dateKey} 
          {...day} 
          status={dayPlan.status} 
          isUserCooking={dayPlan.isCooking}
          onPress={onToggleStatus} 
          onLongPress={onLongPress}
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
