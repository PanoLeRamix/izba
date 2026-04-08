import React, { useCallback, useMemo, useState } from 'react';
import { Alert, Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';
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

type ChoreModalState =
  | { mode: 'create' }
  | {
      mode: 'edit';
      chore: HouseTaskChore;
    };

export default function Tasks() {
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
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
    try {
      await actions.syncAnchorToViewedWeek();
    } catch (error) {
      showError(error, 'tasks.anchorError');
    }
  }, [actions, showError]);

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

  return (
    <View className="flex-1 bg-hearth" style={{ paddingTop: LAYOUT.getTopPadding(insets.top) }}>
      <PagedCarousel
        title={t('tabs.tasks')}
        subtitle={viewedWeekLabel}
        data={weeks}
        activeIndex={activeWeekIndex}
        currentIndex={CURRENT_TASK_WEEK_INDEX}
        keyExtractor={(item: TaskWeekItem) => item.id}
        onIndexChange={actions.setWeekIndex}
        headerAction={
          <TouchableOpacity
            onPress={() => setIsSettingsVisible(true)}
            className="flex-row items-center bg-white shadow-sm px-4 py-3 rounded-2xl border border-sage-light/30"
          >
              <Settings2 size={18} color={Colors.forest} />
              <Text className="ml-2 text-sm font-bold text-forest">{t('tasks.manage')}</Text>
          </TouchableOpacity>
        }
        renderItem={(item, pageWidth) => (
          <WeekRosterPage
            item={item}
            locale={locale}
            pageWidth={pageWidth}
            isLoading={isLoading}
            chores={chores}
            members={members}
            assignments={getAssignmentsForDate(item.startDate)}
          />
        )}
      />

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
  isLoading,
  chores,
  members,
  assignments,
}: {
  item: TaskWeekItem;
  locale: Locale;
  pageWidth: number;
  isLoading: boolean;
  chores: HouseTaskChore[];
  members: Array<{ user_id: string; name: string }>;
  assignments: WeeklyChoreAssignment[];
}) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
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

  return isLoading ? (
    <TasksSkeleton />
  ) : (
    <ScrollView
      style={{ width: pageWidth }}
      contentContainerStyle={{
        paddingHorizontal: 24,
        paddingTop: 8,
        paddingBottom: Math.max(insets.bottom, LAYOUT.BASE_SCREEN_PADDING),
      }}
      showsVerticalScrollIndicator={false}
    >
      {!isLoading && members.length === 0 ? (
        <EmptyState icon={<Users size={28} color={Colors.forest} />} title={t('tasks.noMembersTitle')} message={t('tasks.noMembersMessage')} />
      ) : null}

      {!isLoading && members.length > 0 && chores.length === 0 ? (
        <EmptyState icon={<ListTodo size={28} color={Colors.forest} />} title={t('tasks.noTasksTitle')} message={t('tasks.noTasksMessage')} />
      ) : null}

      {!isLoading && groupedAssignments.length > 0
        ? groupedAssignments.map((group) => (
            <View
              key={group.userId}
              className={`rounded-2xl border px-4 py-3 mb-3 shadow-sm ${group.userId === userId ? 'bg-hearth border-forest-dark' : 'bg-white border-sage/30'}`}
              style={group.userId === userId ? { borderWidth: 3, shadowColor: Colors.forestDark, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 6 } : undefined}
            >
              <Text className={`text-lg font-black ${group.userId === userId ? 'text-forest' : 'text-forest-dark'}`}>{group.name}</Text>

              <View className="mt-2 flex-row flex-wrap gap-2">
                {group.tasks.map((task) => (
                  <View key={`${group.userId}-${task}`} className="px-3 py-1.5 rounded-full bg-hearth border border-sage/20">
                    <Text className="text-xs font-bold text-forest-dark">{task}</Text>
                  </View>
                ))}
              </View>
            </View>
          ))
        : null}
    </ScrollView>
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
          <Text className="text-3xl font-black text-forest-dark uppercase">{t('tasks.settingsTitle')}</Text>
          <Text className="text-sm font-medium text-forest-dark/60 mt-2">{t('tasks.settingsInfo')}</Text>
        </View>
      }
    >
      <View className="bg-white rounded-[32px] p-6 mb-4 border border-sage-light/30 shadow-sm" style={{ borderRadius: LAYOUT.MODAL_INNER_RADIUS }}>
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-row items-center">
            <Text className="text-2xl mr-3">🧹</Text>
            <Text className="text-lg font-black text-forest-dark uppercase tracking-tight">{t('tasks.manageTasks')}</Text>
          </View>

          <TouchableOpacity onPress={onAddTask} className="bg-forest px-4 py-2 rounded-2xl flex-row items-center">
            <Plus size={16} color={Colors.hearth} />
            <Text className="ml-2 text-sm font-bold text-hearth">{t('tasks.addTask')}</Text>
          </TouchableOpacity>
        </View>

        {chores.length === 0 ? (
          <Text className="text-sm font-medium text-forest-dark/60">{t('tasks.noTasksManageHint')}</Text>
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

      <View className="bg-white rounded-[32px] p-6 mb-4 border border-sage-light/30 shadow-sm" style={{ borderRadius: LAYOUT.MODAL_INNER_RADIUS }}>
        <View className="flex-row items-center mb-4">
          <Text className="text-2xl mr-3">👥</Text>
          <Text className="text-lg font-black text-forest-dark uppercase tracking-tight">{t('tasks.rotationOrder')}</Text>
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

      <View className="bg-white rounded-[32px] p-6 border border-sage-light/30 shadow-sm" style={{ borderRadius: LAYOUT.MODAL_INNER_RADIUS }}>
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-row items-center">
            <Text className="text-2xl mr-3">🗓️</Text>
            <Text className="text-lg font-black text-forest-dark uppercase tracking-tight">{t('tasks.anchorWeek')}</Text>
          </View>

          <TouchableOpacity onPress={() => onShowInfo(t('tasks.anchorWeekInfoTitle'), t('tasks.anchorWeekInfoMessage'))} className="p-2 rounded-xl bg-forest/5">
            <CircleHelp size={18} color={Colors.forest} />
          </TouchableOpacity>
        </View>

        <Text className="text-sm font-medium text-forest-dark/60 mb-4">
          {anchorLabel ? t('tasks.anchorWeekValue', { date: anchorLabel }) : t('tasks.anchorWeekUnset')}
        </Text>

        <Button title={t('tasks.useViewedWeekAsAnchor')} onPress={onUseViewedWeekAsAnchor} loading={isSaving} />
      </View>
    </BottomSheetModal>
  );
}

function EmptyState({ icon, title, message }: { icon: React.ReactNode; title: string; message: string }) {
  return (
    <View className="bg-white rounded-3xl border border-sage/30 p-6 shadow-sm">
      <View className="bg-forest/10 h-14 w-14 rounded-2xl items-center justify-center mb-4">{icon}</View>
      <Text className="text-2xl font-black text-forest-dark mb-2">{title}</Text>
      <Text className="text-base font-medium text-forest-dark/70">{message}</Text>
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
    <View className="flex-row items-center justify-between py-3 border-t border-sage/20 first:border-t-0">
      <Text className="text-lg font-semibold text-forest-dark flex-1 pr-3">{label}</Text>

      <View className="flex-row items-center">
        {onEdit ? <IconButton icon={<Pencil size={16} color={Colors.forest} />} onPress={onEdit} /> : null}
        <IconButton icon={<ArrowUp size={16} color={Colors.forest} />} onPress={onMoveUp} disabled={!onMoveUp} />
        <IconButton icon={<ArrowDown size={16} color={Colors.forest} />} onPress={onMoveDown} disabled={!onMoveDown} />
      </View>
    </View>
  );
}

function IconButton({ icon, onPress, disabled = false }: { icon: React.ReactNode; onPress?: () => void; disabled?: boolean }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || !onPress}
      className={`ml-2 p-3 rounded-2xl border border-sage/20 ${disabled || !onPress ? 'bg-sage/10 opacity-40' : 'bg-hearth'}`}
    >
      {icon}
    </TouchableOpacity>
  );
}
