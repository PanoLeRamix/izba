import { useCallback, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { addWeeks, differenceInCalendarWeeks, format, startOfWeek } from 'date-fns';
import { useAuthStore } from '../store/authStore';
import {
  tasksService,
  type HouseTaskChore,
  type HouseTaskMemberOrderItem,
  type TaskRotationConfig,
} from '../services/tasks';

export interface WeeklyChoreAssignment {
  chore: HouseTaskChore;
  assignee: HouseTaskMemberOrderItem;
  nextAssignee: HouseTaskMemberOrderItem | null;
}

export interface TaskWeekItem {
  id: string;
  weekOffset: number;
  startDate: Date;
}

const TASK_WEEK_COUNT = 21;
export const CURRENT_TASK_WEEK_INDEX = 10;

function getAssignmentsForWeek(
  chores: HouseTaskChore[],
  members: HouseTaskMemberOrderItem[],
  anchorWeekStartValue: string | undefined,
  viewedWeekStart: Date,
) {
  if (!members.length) {
    return [] as WeeklyChoreAssignment[];
  }

  const anchorWeekStart = anchorWeekStartValue ? startOfWeek(new Date(anchorWeekStartValue), { weekStartsOn: 1 }) : viewedWeekStart;
  const rotationOffset = differenceInCalendarWeeks(viewedWeekStart, anchorWeekStart, { weekStartsOn: 1 });

  return chores.map((chore, index) => {
    const assigneeIndex = (((index + rotationOffset) % members.length) + members.length) % members.length;
    const assignee = members[assigneeIndex];
    const nextAssignee = members[(assigneeIndex + 1) % members.length] ?? null;

    return { chore, assignee, nextAssignee };
  });
}

const getTaskQueries = (houseId: string | null) => ({
  config: ['task-rotation-config', houseId] as const,
  chores: ['task-chores', houseId] as const,
  members: ['task-member-order', houseId] as const,
});

export function useTasks() {
  const { houseId, userToken } = useAuthStore();
  const queryClient = useQueryClient();
  const [activeWeekIndex, setActiveWeekIndex] = useState(CURRENT_TASK_WEEK_INDEX);
  const targetWeekIndex = useRef(CURRENT_TASK_WEEK_INDEX);
  const queries = getTaskQueries(houseId);

  const weeks = useMemo<TaskWeekItem[]>(() => {
    const startOfCurrentWeek = startOfWeek(new Date(), { weekStartsOn: 1 });

    return Array.from({ length: TASK_WEEK_COUNT }, (_, index) => {
      const weekOffset = index - CURRENT_TASK_WEEK_INDEX;
      return {
        id: `task-week-${weekOffset}`,
        weekOffset,
        startDate: addWeeks(startOfCurrentWeek, weekOffset),
      };
    });
  }, []);

  const { data: config, isLoading: isLoadingConfig } = useQuery({
    queryKey: queries.config,
    queryFn: () => tasksService.getRotationConfig(userToken!),
    enabled: !!houseId && !!userToken,
  });

  const { data: chores = [], isLoading: isLoadingChores } = useQuery({
    queryKey: queries.chores,
    queryFn: () => tasksService.getChores(userToken!),
    enabled: !!houseId && !!userToken,
  });

  const { data: members = [], isLoading: isLoadingMembers } = useQuery({
    queryKey: queries.members,
    queryFn: () => tasksService.getMemberOrder(userToken!),
    enabled: !!houseId && !!userToken,
  });

  const viewedWeekStart = useMemo(() => weeks[activeWeekIndex]?.startDate ?? weeks[CURRENT_TASK_WEEK_INDEX].startDate, [activeWeekIndex, weeks]);
  const weekOffset = useMemo(() => weeks[activeWeekIndex]?.weekOffset ?? 0, [activeWeekIndex, weeks]);

  const weekLabel = useMemo(() => format(viewedWeekStart, 'd MMM yyyy'), [viewedWeekStart]);

  const assignments = useMemo<WeeklyChoreAssignment[]>(
    () => getAssignmentsForWeek(chores, members, config?.anchor_week_start, viewedWeekStart),
    [chores, config?.anchor_week_start, members, viewedWeekStart],
  );

  const getAssignmentsForDate = useCallback(
    (weekStart: Date) => getAssignmentsForWeek(chores, members, config?.anchor_week_start, weekStart),
    [chores, config?.anchor_week_start, members],
  );

  const invalidateAll = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queries.config }),
      queryClient.invalidateQueries({ queryKey: queries.chores }),
      queryClient.invalidateQueries({ queryKey: queries.members }),
    ]);
  }, [queryClient, queries.chores, queries.config, queries.members]);

  const createChoreMutation = useMutation({
    mutationFn: ({ name }: { name: string }) => tasksService.createChore(userToken!, name),
    onSuccess: async (data) => {
      if (data) {
        queryClient.setQueryData<HouseTaskChore[]>(queries.chores, (current = []) =>
          [...current, data].sort((left, right) => left.sort_order - right.sort_order),
        );
      }
      await invalidateAll();
    },
  });

  const renameChoreMutation = useMutation({
    mutationFn: ({ choreId, name }: { choreId: string; name: string }) => tasksService.renameChore(userToken!, choreId, name),
    onSuccess: async (data) => {
      if (data) {
        queryClient.setQueryData<HouseTaskChore[]>(queries.chores, (current = []) =>
          current.map((chore) => (chore.id === data.id ? data : chore)),
        );
      }
      await invalidateAll();
    },
  });

  const deleteChoreMutation = useMutation({
    mutationFn: ({ choreId }: { choreId: string }) => tasksService.deleteChore(userToken!, choreId),
    onSuccess: async (_data, variables) => {
      queryClient.setQueryData<HouseTaskChore[]>(queries.chores, (current = []) => current.filter((chore) => chore.id !== variables.choreId));
      await invalidateAll();
    },
  });

  const reorderChoresMutation = useMutation({
    mutationFn: (choreIds: string[]) => tasksService.reorderChores(userToken!, choreIds),
    onSuccess: async (data) => {
      queryClient.setQueryData(queries.chores, data);
      await invalidateAll();
    },
    onError: async () => {
      await invalidateAll();
    },
  });

  const reorderMembersMutation = useMutation({
    mutationFn: (userIds: string[]) => tasksService.reorderMembers(userToken!, userIds),
    onSuccess: async (data) => {
      queryClient.setQueryData(queries.members, data);
      await invalidateAll();
    },
    onError: async () => {
      await invalidateAll();
    },
  });

  const setAnchorWeekMutation = useMutation({
    mutationFn: (anchorWeekStart: string) => tasksService.setAnchorWeek(userToken!, anchorWeekStart),
    onSuccess: (data) => {
      queryClient.setQueryData<TaskRotationConfig | null>(queries.config, data);
    },
  });

  const moveChore = useCallback(
    async (choreId: string, direction: -1 | 1) => {
      const index = chores.findIndex((chore) => chore.id === choreId);
      const nextIndex = index + direction;

      if (index < 0 || nextIndex < 0 || nextIndex >= chores.length) {
        return;
      }

      const nextChores = [...chores];
      const [item] = nextChores.splice(index, 1);
      nextChores.splice(nextIndex, 0, item);

      queryClient.setQueryData(
        queries.chores,
        nextChores.map((chore, orderIndex) => ({ ...chore, sort_order: orderIndex })),
      );
      await reorderChoresMutation.mutateAsync(nextChores.map((chore) => chore.id));
    },
    [chores, queryClient, queries.chores, reorderChoresMutation],
  );

  const moveMember = useCallback(
    async (userId: string, direction: -1 | 1) => {
      const index = members.findIndex((member) => member.user_id === userId);
      const nextIndex = index + direction;

      if (index < 0 || nextIndex < 0 || nextIndex >= members.length) {
        return;
      }

      const nextMembers = [...members];
      const [item] = nextMembers.splice(index, 1);
      nextMembers.splice(nextIndex, 0, item);

      queryClient.setQueryData(
        queries.members,
        nextMembers.map((member, orderIndex) => ({ ...member, sort_order: orderIndex })),
      );
      await reorderMembersMutation.mutateAsync(nextMembers.map((member) => member.user_id));
    },
    [members, queryClient, queries.members, reorderMembersMutation],
  );

  const setCurrentWeek = useCallback(() => {
    targetWeekIndex.current = CURRENT_TASK_WEEK_INDEX;
    setActiveWeekIndex(CURRENT_TASK_WEEK_INDEX);
  }, []);

  const setWeekIndex = useCallback(
    (index: number) => {
      if (index >= 0 && index < weeks.length) {
        targetWeekIndex.current = index;
        setActiveWeekIndex(index);
      }
    },
    [weeks.length],
  );

  const jumpWeek = useCallback(
    (direction: -1 | 1) => {
      const nextIndex = targetWeekIndex.current + direction;
      if (nextIndex >= 0 && nextIndex < weeks.length) {
        targetWeekIndex.current = nextIndex;
        setActiveWeekIndex(nextIndex);
      }
    },
    [weeks.length],
  );

  return {
    weeks,
    chores,
    members,
    config,
    assignments,
    viewedWeekStart,
    weekOffset,
    weekLabel,
    activeWeekIndex,
    targetWeekIndex,
    getAssignmentsForDate,
    isLoading: isLoadingConfig || isLoadingChores || isLoadingMembers,
    isSaving:
      createChoreMutation.isPending ||
      renameChoreMutation.isPending ||
      deleteChoreMutation.isPending ||
      reorderChoresMutation.isPending ||
      reorderMembersMutation.isPending ||
      setAnchorWeekMutation.isPending,
    actions: {
      createChore: (name: string) => createChoreMutation.mutateAsync({ name }),
      renameChore: (choreId: string, name: string) => renameChoreMutation.mutateAsync({ choreId, name }),
      deleteChore: (choreId: string) => deleteChoreMutation.mutateAsync({ choreId }),
      moveChore,
      moveMember,
      syncAnchorToViewedWeek: () => setAnchorWeekMutation.mutateAsync(format(viewedWeekStart, 'yyyy-MM-dd')),
      jumpWeek,
      setCurrentWeek,
      setWeekIndex,
    },
  };
}
