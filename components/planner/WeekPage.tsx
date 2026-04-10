import React, { memo } from 'react';
import { View, type ViewStyle } from 'react-native';
import { isToday, type Locale } from 'date-fns';
import { DayTile } from './DayTile';
import { type PlannerStatus } from '../../services/planner';
import { type User } from '../../services/user';

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
  eaters: Array<User & { guestCount: number; note?: string }>;
  unavailable: User[];
  uncertain: Array<User & { note?: string }>;
  totalCount: number;
  cooks: User[];
}

interface WeekPageProps {
  item: WeekItem;
  windowWidth: number;
  onToggleStatus: (dateKey: string) => void;
  onShowDetails: (dateKey: string) => void;
  locale: Locale;
  tileHeight: number;
  processedData: Record<string, ProcessedDay>;
  userPlans: Record<string, { status: PlannerStatus; isCooking: boolean; guestCount: number }>;
}

type SnapStyle = ViewStyle & {
  scrollSnapAlign?: 'start';
  scrollSnapStop?: 'always';
};

export const WeekPage = memo(({ item, windowWidth, onToggleStatus, onShowDetails, locale, processedData, userPlans, tileHeight }: WeekPageProps) => {
  const containerStyle: SnapStyle = {
    width: windowWidth,
    scrollSnapAlign: 'start',
    scrollSnapStop: 'always',
  };

  return (
    <View style={containerStyle} className="px-6">
      {item.days.map((day) => {
        const dayPlan = userPlans[day.dateKey] || { status: 'none', isCooking: false, guestCount: 0 };
        const dayData = processedData[day.dateKey] || { eaters: [], unavailable: [], uncertain: [], totalCount: 0, cooks: [] };

        return (
          <DayTile
            key={day.dateKey}
            date={day.date}
            dateKey={day.dateKey}
            status={dayPlan.status}
            isUserCooking={dayPlan.isCooking}
            userGuestCount={dayPlan.guestCount}
            onToggleStatus={onToggleStatus}
            onShowDetails={onShowDetails}
            locale={locale}
            isToday={isToday(day.date)}
            tileHeight={tileHeight}
            eaters={dayData.eaters}
            eatersCount={dayData.totalCount}
            cookName={dayData.cooks.map((user) => user.name).join(', ')}
          />
        );
      })}
    </View>
  );
});
