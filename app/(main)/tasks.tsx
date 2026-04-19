import React, { useCallback, useMemo, useState } from 'react';
import { Alert, Platform, ScrollView, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { addDays, format, type Locale } from 'date-fns';
import { enUS, fr } from 'date-fns/locale';
import { ArrowDown, ArrowUp, CircleHelp, ListTodo, Pencil, Plus, Settings2, Users } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomSheetModal } from '../../components/BottomSheetModal';
import { Button } from '../../components/Button';
import { InputModal } from '../../components/InputModal';
import { PagedCarousel } from '../../components/PagedCarousel';
import { Colors } from '../../constants/Colors';
import { LAYOUT } from '../../constants/Layout';
import { CURRENT_TASK_WEEK_INDEX, type TaskWeekItem, type WeeklyChoreAssignment, useTasks } from '../../hooks/useTasks';
import { type HouseTaskChore } from '../../services/tasks';
import { useAuthStore } from '../../store/authStore';
import { isNetworkError } from '../../utils/errors';
import { TasksSkeleton } from '../../components/tasks/TasksSkeleton';

type SnapStyle = {
  width: number;
  height: number;
  scrollSnapAlign?: 'start';
  scrollSnapStop?: 'always';
};

type ChoreModalState =
  | { mode: 'create' }
  | {
      mode: 'edit';
      chore: HouseTaskChore;
    };

export default function Tasks() {
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const locale: Locale = i18n.language === 'fr' ? fr : enUS;
  const [isSettingsVisible, setIsSettingsVisible] = useState(false);
  const [modalState, setModalState] = useState<ChoreModalState | null>(null);
  const {
    weeks,
    chores,
    members,
    config,
    isLoading,
    isSaving,
    activeWeekIndex,
    viewedWeekStart,
    actions,
    getAssignmentsForDate,
  } = useTasks();

  const viewedWeekLabel = useMemo(() => {
    const endOfWeek = addDays(viewedWeekStart, 6);
    return `${format(viewedWeekStart, 'd MMM', { locale })} - ${format(endOfWeek, 'd MMM yyyy', { locale })}`;
  }, [locale, viewedWeekStart]);

  const anchorLabel = config?.anchor_week_start ? format(new Date(config.anchor_week_start), 'd MMM yyyy', { locale }) : null;
  const topPadding = LAYOUT.getTopPadding(insets.top);
  const bottomBuffer = LAYOUT.getBottomBuffer(insets.bottom);
  const pageHeight = windowHeight - topPadding - (LAYOUT.HEADER_HEIGHT - 10) - LAYOUT.TAB_BAR_HEIGHT - bottomBuffer;
  const manageButtonInset = Math.max(insets.bottom, LAYOUT.BASE_SCREEN_PADDING) + 88;

  const showDialog = useCallback((title: string, message: string) => {
    if (Platform.OS === 'web') {
      alert(`${title}\n\n${message}`);
      return;
    }

    Alert.alert(title, message);
  }, []);

  const buildErrorMessage = useCallback(
    (error: unknown, fallbackKey: 'common.saveError' | 'tasks.reorderError' | 'tasks.anchorError' | 'tasks.manageError') =>
      isNetworkError(error) ? t('common.networkError') : t(fallbackKey),
    [t],
  );

  const showError = useCallback(
    (error: unknown, fallbackKey: 'common.saveError' | 'tasks.reorderError' | 'tasks.anchorError' | 'tasks.manageError') => {
      showDialog(t('common.error'), buildErrorMessage(error, fallbackKey));
    },
    [buildErrorMessage, showDialog, t],
  );

  const openTaskModal = useCallback((state: ChoreModalState) => {
    setIsSettingsVisible(false);
    setTimeout(() => {
      setModalState(state);
    }, 0);
  }, []);

  const handleMoveChore = useCallback(
    async (choreId: string, direction: -1 | 1) => {
      try {
        await actions.moveChore(choreId, direction);
      } catch (error) {
        showError(error, 'tasks.reorderError');
      }
    },
    [actions, showError],
  );

  const handleMoveMember = useCallback(
    async (userId: string, direction: -1 | 1) => {
      try {
        await actions.moveMember(userId, direction);
      } catch (error) {
        showError(error, 'tasks.reorderError');
      }
    },
    [actions, showError],
  );

  const handleSaveChore = useCallback(
    async (value: string) => {
      try {
        if (modalState?.mode === 'edit') {
          await actions.renameChore(modalState.chore.id, value.trim());
        } else {
          await actions.createChore(value.trim());
        }

        setModalState(null);
      } catch (error) {
        showError(error, 'tasks.manageError');
      }
    },
    [actions, modalState, showError],
  );

  const handleUseViewedWeekAsAnchor = useCallback(async () => {
    const message = t('tasks.anchorWeekConfirmation', { date: viewedWeekLabel });

    if (Platform.OS === 'web') {
      if (!confirm(message)) {
        return;
      }
    } else {
      const isConfirmed = await new Promise<boolean>((resolve) => {
        Alert.alert(t('tasks.anchorWeek'), message, [
          {
            text: t('common.back'),
            style: 'cancel',
            onPress: () => resolve(false),
          },
          {
            text: t('common.confirm'),
            onPress: () => resolve(true),
          },
        ]);
      });

      if (!isConfirmed) {
        return;
      }
    }

    try {
      await actions.syncAnchorToViewedWeek();
    } catch (error) {
      showError(error, 'tasks.anchorError');
    }
  }, [actions, showError, t, viewedWeekLabel]);

  const confirmDeleteChore = useCallback(
    (chore: HouseTaskChore) => {
      const executeDelete = async () => {
        try {
          await actions.deleteChore(chore.id);
          setModalState(null);
        } catch (error) {
          showError(error, 'tasks.manageError');
        }
      };

      if (Platform.OS === 'web') {
        if (confirm(t('tasks.deleteTaskConfirmation', { task: chore.name }))) {
          void executeDelete();
        }
        return;
      }

      Alert.alert(t('tasks.deleteTask'), t('tasks.deleteTaskConfirmation', { task: chore.name }), [
        { text: t('common.back'), style: 'cancel' },
        {
          text: t('tasks.deleteTask'),
          style: 'destructive',
          onPress: () => void executeDelete(),
        },
      ]);
    },
    [actions, showError, t],
  );

  if (isLoading) {
    return <TasksSkeleton />;
  }

  return (
    <View className="flex-1 bg-surface" style={{ paddingTop: topPadding }}>
      <PagedCarousel
        title={t('tabs.tasks')}
        subtitle={viewedWeekLabel}
        data={weeks}
        activeIndex={activeWeekIndex}
        currentIndex={CURRENT_TASK_WEEK_INDEX}
        keyExtractor={(item: TaskWeekItem) => item.id}
        onIndexChange={actions.setWeekIndex}
        renderItem={(item, pageWidth) => (
          <WeekRosterPage
            item={item}
            locale={locale}
            pageWidth={pageWidth}
            pageHeight={pageHeight}
            chores={chores}
            members={members}
            assignments={getAssignmentsForDate(item.startDate)}
            bottomInset={manageButtonInset}
          />
        )}
      />

      <TouchableOpacity
        onPress={() => setIsSettingsVisible(true)}
        className="absolute flex-row items-center bg-primary shadow-sm px-5 py-3.5 rounded-2xl border border-primary-container"
        style={{
          right: 24,
          bottom: Math.max(insets.bottom, LAYOUT.BASE_SCREEN_PADDING) + 12,
          shadowColor: Colors.primaryContainer,
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.22,
          shadowRadius: 14,
          elevation: 8,
        }}
      >
        <Settings2 size={18} color={Colors.onPrimary} />
        <Text className="ml-2 text-sm font-black text-on-primary">{t('tasks.manage')}</Text>
      </TouchableOpacity>

      <TaskSettingsModal
        visible={isSettingsVisible}
        onClose={() => setIsSettingsVisible(false)}
        chores={chores}
        members={members}
        anchorLabel={anchorLabel}
        isSaving={isSaving}
        onAddTask={() => openTaskModal({ mode: 'create' })}
        onEditTask={(chore) => openTaskModal({ mode: 'edit', chore })}
        onMoveTask={handleMoveChore}
        onMoveMember={handleMoveMember}
        onUseViewedWeekAsAnchor={() => void handleUseViewedWeekAsAnchor()}
        onShowInfo={(title, message) => showDialog(title, message)}
      />

      <InputModal
        visible={!!modalState}
        onClose={() => setModalState(null)}
        onSave={(value) => void handleSaveChore(value)}
        onDelete={modalState?.mode === 'edit' ? () => confirmDeleteChore(modalState.chore) : undefined}
        deleteTitle={t('tasks.deleteTask')}
        title={modalState?.mode === 'edit' ? t('tasks.editTask') : t('tasks.addTask')}
        initialValue={modalState?.mode === 'edit' ? modalState.chore.name : ''}
        placeholder={t('tasks.taskPlaceholder')}
        loading={isSaving}
        maxLength={30}
      />
    </View>
  );
}

function WeekRosterPage({
  item,
  locale,
  pageWidth,
  pageHeight,
  chores,
  members,
  assignments,
  bottomInset,
}: {
  item: TaskWeekItem;
  locale: Locale;
  pageWidth: number;
  pageHeight: number;
  chores: HouseTaskChore[];
  members: Array<{ user_id: string; name: string }>;
  assignments: WeeklyChoreAssignment[];
  bottomInset: number;
}) {
  const { t } = useTranslation();
  const { userId } = useAuthStore();

  const groupedAssignments = useMemo(() => {
    const map = new Map<string, { name: string; tasks: string[] }>();

    for (const assignment of assignments) {
      const existing = map.get(assignment.assignee.user_id);

      if (existing) {
        existing.tasks.push(assignment.chore.name);
        continue;
      }

      map.set(assignment.assignee.user_id, {
        name: assignment.assignee.name,
        tasks: [assignment.chore.name],
      });
    }

    return members
      .filter((member) => map.has(member.user_id))
      .map((member) => ({
        userId: member.user_id,
        name: map.get(member.user_id)?.name ?? member.name,
        tasks: map.get(member.user_id)?.tasks ?? [],
      }));
  }, [assignments, members]);

  const containerStyle: SnapStyle = {
    width: pageWidth,
    height: pageHeight,
    scrollSnapAlign: 'start',
    scrollSnapStop: 'always',
  };

  return (
    <View style={containerStyle} className="px-6 pt-2">
      {members.length === 0 ? (
        <EmptyState icon={<Users size={28} color={Colors.primary} />} title={t('tasks.noMembersTitle')} message={t('tasks.noMembersMessage')} />
      ) : null}

      {members.length > 0 && chores.length === 0 ? (
        <EmptyState icon={<ListTodo size={28} color={Colors.primary} />} title={t('tasks.noTasksTitle')} message={t('tasks.noTasksMessage')} />
      ) : null}

      {groupedAssignments.length > 0 ? (
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: bottomInset }}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled
        >
          {groupedAssignments.map((group) => (
            <View
              key={group.userId}
              className={`rounded-3xl border px-6 py-4 mb-4 shadow-sm ${group.userId === userId ? 'bg-surface-container-low border-primary/40' : 'bg-surface-container-low border-outline-variant/10'}`}
              style={
                group.userId === userId
                  ? {
                      borderWidth: 2,
                    }
                  : undefined
              }
            >
              <Text className="text-xl font-black text-primary">{group.name}</Text>

              <View className="mt-3 flex-row flex-wrap gap-2">
                {group.tasks.map((task) => (
                  <View key={`${group.userId}-${task}`} className="px-3 py-1.5 rounded-full bg-surface-container border border-outline-variant/10">
                    <Text className="text-[11px] font-bold text-on-surface-variant">{task}</Text>
                  </View>
                ))}
              </View>
            </View>
          ))}
        </ScrollView>
      ) : null}
    </View>
  );
}

function TaskSettingsModal({
  visible,
  onClose,
  chores,
  members,
  anchorLabel,
  isSaving,
  onAddTask,
  onEditTask,
  onMoveTask,
  onMoveMember,
  onUseViewedWeekAsAnchor,
  onShowInfo,
}: {
  visible: boolean;
  onClose: () => void;
  chores: HouseTaskChore[];
  members: Array<{ user_id: string; name: string }>;
  anchorLabel: string | null;
  isSaving: boolean;
  onAddTask: () => void;
  onEditTask: (chore: HouseTaskChore) => void;
  onMoveTask: (choreId: string, direction: -1 | 1) => Promise<void>;
  onMoveMember: (userId: string, direction: -1 | 1) => Promise<void>;
  onUseViewedWeekAsAnchor: () => void;
  onShowInfo: (title: string, message: string) => void;
}) {
  const { t } = useTranslation();

  return (
    <BottomSheetModal
      visible={visible}
      onClose={onClose}
      header={
        <View className="mb-6">
          <Text className="text-3xl font-black text-primary uppercase">{t('tasks.settingsTitle')}</Text>
          <Text className="text-sm font-medium text-on-surface-variant mt-2">{t('tasks.settingsInfo')}</Text>
        </View>
      }
    >
      <View className="bg-surface-container-lowest rounded-[32px] p-6 mb-4 border border-outline-variant/10 shadow-sm" style={{ borderRadius: LAYOUT.MODAL_INNER_RADIUS }}>
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-row items-center">
            <Text className="text-2xl mr-3">🧹</Text>
            <Text className="text-lg font-black text-primary uppercase tracking-tight">{t('tasks.manageTasks')}</Text>
          </View>

          <TouchableOpacity onPress={onAddTask} className="bg-primary p-2.5 rounded-2xl items-center justify-center">
            <Plus size={20} color={Colors.onPrimary} strokeWidth={3} />
          </TouchableOpacity>
        </View>

        {chores.length === 0 ? (
          <Text className="text-sm font-medium text-on-surface-variant">{t('tasks.noTasksManageHint')}</Text>
        ) : (
          chores.map((chore, index) => (
            <ManageRow
              key={chore.id}
              label={chore.name}
              onMoveUp={index > 0 ? () => void onMoveTask(chore.id, -1) : undefined}
              onMoveDown={index < chores.length - 1 ? () => void onMoveTask(chore.id, 1) : undefined}
              onEdit={() => onEditTask(chore)}
            />
          ))
        )}
      </View>

      <View className="bg-surface-container-lowest rounded-[32px] p-6 mb-4 border border-outline-variant/10 shadow-sm" style={{ borderRadius: LAYOUT.MODAL_INNER_RADIUS }}>
        <View className="flex-row items-center mb-4">
          <Text className="text-2xl mr-3">👥</Text>
          <Text className="text-lg font-black text-primary uppercase tracking-tight">{t('tasks.rotationOrder')}</Text>
        </View>

        {members.map((member, index) => (
          <ManageRow
            key={member.user_id}
            label={member.name}
            onMoveUp={index > 0 ? () => void onMoveMember(member.user_id, -1) : undefined}
            onMoveDown={index < members.length - 1 ? () => void onMoveMember(member.user_id, 1) : undefined}
          />
        ))}
      </View>

      <View className="bg-surface-container-lowest rounded-[32px] p-6 border border-outline-variant/10 shadow-sm" style={{ borderRadius: LAYOUT.MODAL_INNER_RADIUS }}>
        <View className="flex-row items-center mb-4">
          <Text className="text-2xl mr-3">🗓️</Text>
          <Text className="text-lg font-black text-primary uppercase tracking-tight">{t('tasks.anchorWeek')}</Text>
        </View>

        <View className="bg-primary/5 p-4 rounded-2xl mb-4 border border-primary/10">
          <Text className="text-sm font-bold text-primary mb-1">{t('tasks.anchorWeekInfoTitle')}</Text>
          <Text className="text-xs leading-5 text-on-surface-variant">
            {t('tasks.anchorWeekInfoMessage')}
          </Text>
        </View>

        <Text className="text-sm font-medium text-on-surface-variant mb-4 px-1">
          {anchorLabel ? t('tasks.anchorWeekValue', { date: anchorLabel }) : t('tasks.anchorWeekUnset')}
        </Text>

        <Button title={t('tasks.useViewedWeekAsAnchor')} onPress={onUseViewedWeekAsAnchor} loading={isSaving} />
      </View>
    </BottomSheetModal>
  );
}

function EmptyState({ icon, title, message }: { icon: React.ReactNode; title: string; message: string }) {
  return (
    <View className="bg-surface-container-lowest rounded-3xl border border-outline-variant/10 p-6 shadow-sm">
      <View className="bg-primary/5 h-14 w-14 rounded-2xl items-center justify-center mb-4">{icon}</View>
      <Text className="text-2xl font-black text-primary mb-2">{title}</Text>
      <Text className="text-base font-medium text-on-surface-variant">{message}</Text>
    </View>
  );
}

function ManageRow({
  label,
  onMoveUp,
  onMoveDown,
  onEdit,
}: {
  label: string;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onEdit?: () => void;
}) {
  return (
    <View className="flex-row items-center justify-between py-3 border-t border-outline-variant/10 first:border-t-0">
      <Text className="text-lg font-semibold text-on-surface flex-1 pr-3">{label}</Text>

      <View className="flex-row items-center">
        {onEdit ? <IconButton icon={<Pencil size={16} color={Colors.primary} />} onPress={onEdit} /> : null}
        <IconButton icon={<ArrowUp size={16} color={Colors.primary} />} onPress={onMoveUp} disabled={!onMoveUp} />
        <IconButton icon={<ArrowDown size={16} color={Colors.primary} />} onPress={onMoveDown} disabled={!onMoveDown} />
      </View>
    </View>
  );
}

function IconButton({ icon, onPress, disabled = false }: { icon: React.ReactNode; onPress?: () => void; disabled?: boolean }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || !onPress}
      className={`ml-2 p-3 rounded-2xl border border-outline-variant/10 ${disabled || !onPress ? 'bg-surface-dim opacity-40' : 'bg-surface-container-lowest'}`}
    >
      {icon}
    </TouchableOpacity>
  );
}
