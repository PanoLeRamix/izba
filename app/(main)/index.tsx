import React, { useMemo } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { format } from 'date-fns';
import { ChefHat } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { LAYOUT } from '../../constants/Layout';
import { usePlanner } from '../../hooks/usePlanner';
import { useTasks } from '../../hooks/useTasks';
import { useAuthStore } from '../../store/authStore';
import { MemberChip } from '../../components/MemberChip';
import { DashboardSkeleton } from '../../components/DashboardSkeleton';

export default function Dashboard() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { userId, userName, houseName } = useAuthStore();

  const { processedData, isLoading: isLoadingPlanner } = usePlanner();
  const { assignments, isLoading: isLoadingTasks } = useTasks();

  const todayKey = useMemo(() => format(new Date(), 'yyyy-MM-dd'), []);
  const todayData = processedData[todayKey];
  const cooksLabel = useMemo(() => {
    if (!todayData?.cooks?.length) return t('planner.noOneCooking');
    return todayData.cooks.map((cook) => cook.name).join(', ');
  }, [t, todayData?.cooks]);

  const myTasks = useMemo(() => {
    if (!userId) return [];
    return assignments.filter((a) => a.assignee.user_id === userId);
  }, [assignments, userId]);

  const isLoading = isLoadingPlanner || isLoadingTasks;

  const topPadding = LAYOUT.getTopPadding(insets.top);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <View className="flex-1 bg-surface" style={{ paddingTop: topPadding }}>
      {/* Fixed Header */}
      <View className="px-6 mb-2 justify-center" style={{ height: LAYOUT.HEADER_HEIGHT - 10 }}>
        <Text className="text-3xl font-black text-primary uppercase">
          {t('tabs.dashboard')}
        </Text>
        <Text className="text-xs font-bold text-primary-container uppercase opacity-60">
          {userName} — {houseName}
        </Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingBottom: Math.max(insets.bottom, LAYOUT.BASE_SCREEN_PADDING) + LAYOUT.TAB_BAR_HEIGHT,
          paddingHorizontal: 24,
          paddingTop: 12,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Tonight's Kitchen Tile (Whole Clickable) */}
        <TouchableOpacity 
          activeOpacity={0.9}
          onPress={() => router.push('/planner')}
          className="bg-surface-container-low rounded-[2rem] p-8 mb-6 relative overflow-hidden"
          style={{ minHeight: 200 }}
        >
          <View className="flex-row justify-between items-end mb-6">
            <Text className="text-3xl font-bold text-primary">
              {t('dashboard.kitchen')}
            </Text>
          </View>

          <View className="flex-row gap-8">
            {/* Chef Information */}
            <View className="flex-1">
              <View className="bg-surface p-4 rounded-2xl flex-row items-center border border-outline-variant/10 shadow-sm">
                <View className="w-10 h-10 rounded-full bg-primary items-center justify-center mr-3">
                  <ChefHat size={20} color={Colors.onPrimary} strokeWidth={2.5} />
                </View>
                <View className="flex-1">
                  <Text className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-[1.5px] mb-0.5">
                    {t('dashboard.chef')}
                  </Text>
                  <Text className="font-bold text-primary text-lg">
                    {cooksLabel}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          <View className="mt-6 space-y-4">
            {/* Attendees Section */}
            <View>
              <Text className="text-[10px] font-bold text-secondary uppercase tracking-[1.5px] mb-2">
                {t('dashboard.eatingIn')}
              </Text>
              <View className="flex-row flex-wrap gap-x-3 gap-y-1">
                {todayData?.eaters.length === 0 ? (
                   <Text className="text-xs text-on-surface-variant/60 italic">{t('planner.noOneEating')}</Text>
                ) : (
                  todayData?.eaters.map((eater) => (
                    <MemberChip 
                      key={`dash-eater-${eater.id}`} 
                      name={eater.name} 
                      isMe={eater.id === userId} 
                      guestCount={eater.guestCount} 
                      note={eater.note} 
                      variant="eating" 
                    />
                  ))
                )}
              </View>
            </View>

            {/* Undecided Members */}
            {todayData?.uncertain && todayData.uncertain.length > 0 && (
              <View>
                <Text className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-[1.5px] mb-2">
                  {t('dashboard.undecided')}
                </Text>
                <View className="flex-row flex-wrap gap-x-3 gap-y-1">
                  {todayData.uncertain.map((person) => (
                    <MemberChip 
                      key={`dash-uncertain-${person.id}`} 
                      name={person.name} 
                      isMe={person.id === userId} 
                      note={person.note} 
                      variant="uncertain" 
                    />
                  ))}
                </View>
              </View>
            )}

            {/* Not Present Section */}
            {todayData?.unavailable && todayData.unavailable.length > 0 && (
              <View>
                <Text className="text-[10px] font-bold text-error uppercase tracking-[1.5px] mb-2">
                  {t('dashboard.notThere')}
                </Text>
                <View className="flex-row flex-wrap gap-x-3 gap-y-1">
                  {todayData.unavailable.map((person) => (
                    <MemberChip 
                      key={`dash-absent-${person.id}`} 
                      name={person.name} 
                      isMe={person.id === userId} 
                      variant="unavailable" 
                    />
                  ))}
                </View>
              </View>
            )}
          </View>
        </TouchableOpacity>

        {/* My Tasks Tile (Whole Clickable) */}
        <TouchableOpacity 
          activeOpacity={0.9}
          onPress={() => router.push('/tasks')}
          className="bg-primary rounded-[2rem] p-8 relative overflow-hidden"
        >
          <View className="flex-row justify-between items-start mb-8">
            <Text className="text-2xl font-bold text-primary-fixed">
              {t('dashboard.myTasks')}
            </Text>
          </View>

          <View className="space-y-5">
            {myTasks.length === 0 ? (
              <Text className="text-primary-fixed/60 font-medium italic">
                {t('tasks.noTasksTitle')}
              </Text>
            ) : (
              myTasks.map((assignment) => (
                <View key={assignment.chore.id} className="flex-row items-center gap-4">
                  <View className="w-2.5 h-2.5 rounded-full bg-secondary-fixed" />
                  <Text className="font-medium text-lg text-primary-fixed leading-tight">
                    {assignment.chore.name}
                  </Text>
                </View>
              ))
            )}
          </View>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
