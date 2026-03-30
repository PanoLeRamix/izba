import React, { useState, useRef, useCallback } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator, 
  useWindowDimensions,
  Platform 
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Settings } from 'lucide-react-native';
import { format, addDays } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';

import { useTasks, WeekAssignment, UserAssignment } from '../../hooks/useTasks';
import { Colors } from '../../constants/Colors';
import { LAYOUT } from '../../constants/Layout';
import { Button } from '../../components/Button';
import { TaskConfigModal } from '../../components/tasks/TaskConfigModal';
import { useAuthStore } from '../../store/authStore';

export default function TasksScreen() {
  const { t, i18n } = useTranslation();
  const { userId } = useAuthStore();
  const insets = useSafeAreaInsets();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const locale = i18n.language === 'fr' ? fr : enUS;
  
  const { weeks, isLoading, error, actions } = useTasks();
  const [configVisible, setConfigVisible] = useState(false);
  
  const flatListRef = useRef<FlatList>(null);
  const [activeWeekIndex, setActiveWeekIndex] = useState(1);

  const topPadding = LAYOUT.getTopPadding(insets.top);
  const bottomBuffer = LAYOUT.getBottomBuffer(insets.bottom);
  const headerHeight = LAYOUT.HEADER_HEIGHT - 10;
  
  // Precise calculation for the snapping height
  const availableHeight = windowHeight - topPadding - headerHeight - LAYOUT.TAB_BAR_HEIGHT - bottomBuffer;

  const handleScroll = useCallback((e: any) => {
    const offset = e.nativeEvent.contentOffset.y;
    const index = Math.round(offset / availableHeight);
    if (index >= 0 && index < weeks.length && index !== activeWeekIndex) {
      setActiveWeekIndex(index);
    }
  }, [availableHeight, weeks.length, activeWeekIndex]);

  if (isLoading) {
    return (
      <View className="flex-1 bg-hearth justify-center items-center">
        <ActivityIndicator color={Colors.forest} size="large" />
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 bg-hearth justify-center items-center p-6">
        <Text className="text-forest-dark font-bold text-center mb-4">{t('common.error')}</Text>
        <Text className="text-forest-light text-center mb-6">{(error as Error).message}</Text>
        <Button title={t('common.retry')} onPress={() => actions.refresh?.()} />
      </View>
    );
  }

  const renderUserAssignment = (item: UserAssignment) => {
    const isMe = item.user.id === userId;
    
    return (
      <View 
        key={item.user.id}
        className={`mb-4 flex-row items-center bg-white p-5 rounded-[32px] shadow-sm border ${isMe ? 'border-chef/30' : 'border-sage/10'}`}
      >
        <View className={`w-12 h-12 rounded-full items-center justify-center mr-4 ${isMe ? 'bg-chef/10' : 'bg-forest/10'}`}>
          <Text className={`text-lg font-bold ${isMe ? 'text-chef' : 'text-forest'}`}>
            {item.user.name.charAt(0).toUpperCase()}
          </Text>
        </View>
        
        <View className="flex-1">
          <View className="flex-row items-center mb-1">
            <Text className="text-lg font-black text-forest-dark mr-2">
              {item.user.name}
            </Text>
            {isMe && (
              <View className="bg-chef px-2 py-0.5 rounded-full">
                <Text className="text-[10px] font-black text-white uppercase tracking-tighter">{t('common.me')}</Text>
              </View>
            )}
          </View>
          
          <View className="flex-row flex-wrap">
            {item.tasks.length === 0 ? (
              <Text className="text-sm text-forest-light/40 italic font-medium">
                —
              </Text>
            ) : (
              item.tasks.map((task) => (
                <View key={task.id} className="bg-sage/10 px-3 py-1 rounded-full mr-2 mb-1 border border-sage/20">
                  <Text className="text-xs font-bold text-forest-dark/70">
                    {task.name}
                  </Text>
                </View>
              ))
            )}
          </View>
        </View>
      </View>
    );
  };

  const renderWeekPage = ({ item, index }: { item: WeekAssignment, index: number }) => {
    const isPast = index === 0;
    const isCurrent = item.isCurrent;
    const endDate = addDays(item.weekStart, 6);
    const weekRange = `${format(item.weekStart, 'd MMM', { locale })} - ${format(endDate, 'd MMM', { locale })}`;

    let title = t('tasks.nextWeeks');
    if (isPast) title = t('tasks.lastWeek');
    if (isCurrent) title = t('tasks.thisWeek');

    return (
      <View style={{ height: availableHeight, width: windowWidth }} className="px-6">
        <View className="flex-row items-center justify-between mb-6">
          <View>
            <Text className={`text-xl font-black uppercase ${isCurrent ? 'text-chef' : 'text-forest-dark'}`}>
              {title}
            </Text>
            <Text className="text-xs font-bold text-forest-light/60 uppercase tracking-widest">
              {weekRange}
            </Text>
          </View>
          {isCurrent && (
            <View className="bg-chef/10 px-4 py-1.5 rounded-full border border-chef/20">
              <Text className="text-[10px] font-black text-chef uppercase tracking-tighter">Current</Text>
            </View>
          )}
        </View>

        <FlatList
          data={item.userAssignments}
          keyExtractor={u => u.user.id}
          renderItem={({ item: ua }) => renderUserAssignment(ua)}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
          ListEmptyComponent={
            <View className="bg-white/50 p-8 rounded-[32px] border border-sage/10 items-center justify-center">
              <Text className="text-forest-dark/40 font-bold italic text-center">{t('tasks.noTasks')}</Text>
            </View>
          }
        />
      </View>
    );
  };

  return (
    <View className="flex-1 bg-hearth" style={{ paddingTop: topPadding }}>
      {/* Header */}
      <View className="px-6 mb-4 flex-row items-center justify-between" style={{ height: headerHeight }}>
        <View className="flex-1 mr-4">
          <Text 
            className="text-3xl font-black text-forest-dark uppercase"
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {t('tasks.title')}
          </Text>
        </View>
        
        <TouchableOpacity 
          onPress={() => setConfigVisible(true)}
          className="bg-white shadow-sm p-3 rounded-2xl border border-sage-light/30"
        >
          <Settings size={22} color={Colors.forest} strokeWidth={2.5} />
        </TouchableOpacity>
      </View>

      <View className="flex-1">
        <FlatList
          ref={flatListRef}
          data={weeks}
          keyExtractor={item => item.weekLabel}
          renderItem={renderWeekPage}
          pagingEnabled
          vertical
          showsVerticalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          snapToInterval={availableHeight}
          snapToAlignment="start"
          decelerationRate="fast"
          initialScrollIndex={1}
          getItemLayout={(_, index) => ({
            length: availableHeight,
            offset: availableHeight * index,
            index,
          })}
        />
        
        {/* Vertical Indicators */}
        <View className="absolute right-4 top-0 bottom-0 justify-center space-y-4">
          {weeks.map((_, i) => (
            <View 
              key={i} 
              className={`w-1.5 rounded-full ${activeWeekIndex === i ? 'h-6 bg-chef' : 'h-1.5 bg-forest/20'}`} 
            />
          ))}
        </View>
      </View>

      <TaskConfigModal
        visible={configVisible}
        onClose={() => setConfigVisible(false)}
        actions={actions}
      />
    </View>
  );
}
