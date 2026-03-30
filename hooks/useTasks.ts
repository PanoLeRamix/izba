import { useState, useMemo, useCallback } from 'react';
import { 
  startOfISOWeek, 
  addWeeks, 
  differenceInCalendarWeeks, 
  format 
} from 'date-fns';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { taskService, Task } from '../services/task';
import { userService, User } from '../services/user';
import { useAuthStore } from '../store/authStore';

const EPOCH = new Date('2024-01-01'); // A Monday

export interface UserAssignment {
  user: User;
  tasks: Task[];
}

export interface WeekAssignment {
  weekStart: Date;
  weekLabel: string;
  isCurrent: boolean;
  userAssignments: UserAssignment[];
}

export const useTasks = () => {
  const { houseId } = useAuthStore();
  const queryClient = useQueryClient();

  const { data: tasks = [], isLoading: isLoadingTasks, error: taskError } = useQuery({
    queryKey: ['house-tasks', houseId],
    queryFn: () => taskService.getHouseTasks(houseId!),
    enabled: !!houseId,
  });

  const { data: users = [], isLoading: isLoadingUsers, error: userError } = useQuery({
    queryKey: ['house-users', houseId],
    queryFn: () => userService.getHouseUsers(houseId!),
    enabled: !!houseId,
  });

  const createMutation = useMutation({
    mutationFn: (name: string) => taskService.createTask(houseId!, name, tasks.length, tasks.length),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['house-tasks', houseId] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, name, rotation_offset }: { id: string, name: string, rotation_offset?: number }) => 
      taskService.updateTask(id, name, rotation_offset),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['house-tasks', houseId] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => taskService.deleteTask(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['house-tasks', houseId] }),
  });

  const weeks = useMemo(() => {
    if (users.length === 0) return [];

    const now = new Date();
    const currentWeekStart = startOfISOWeek(now);
    
    const weekOffsets = [-1, 0, 1, 2, 3];
    
    return weekOffsets.map(offset => {
      const weekStart = addWeeks(currentWeekStart, offset);
      const weeksSinceEpoch = differenceInCalendarWeeks(weekStart, EPOCH, { weekStartsOn: 1 });
      
      const userTasksMap: Record<string, Task[]> = {};
      users.forEach(u => userTasksMap[u.id] = []);

      tasks.forEach((task) => {
        // userIndex = (WeeksSinceEpoch + task.rotation_offset) % UserCount
        const userIndex = (weeksSinceEpoch + task.rotation_offset) % users.length;
        const normalizedUserIndex = (userIndex + users.length) % users.length;
        const assignedUser = users[normalizedUserIndex];
        if (assignedUser) {
          userTasksMap[assignedUser.id].push(task);
        }
      });

      return {
        weekStart,
        weekLabel: format(weekStart, 'yyyy-MM-dd'),
        isCurrent: offset === 0,
        userAssignments: users.map(user => ({
          user,
          tasks: userTasksMap[user.id] || []
        }))
      };
    });
  }, [tasks, users]);

  const actions = {
    tasks,
    users, // Added here
    refresh: () => {
      queryClient.invalidateQueries({ queryKey: ['house-tasks', houseId] });
      queryClient.invalidateQueries({ queryKey: ['house-users', houseId] });
    },
    createTask: createMutation.mutateAsync,
    updateTask: (id: string, name: string) => updateMutation.mutateAsync({ id, name }),
    deleteTask: deleteMutation.mutateAsync,
    setTaskPerson: async (taskId: string, userId: string) => {
      const task = tasks.find(t => t.id === taskId);
      if (!task || users.length === 0) return;
      
      const userIndex = users.findIndex(u => u.id === userId);
      if (userIndex === -1) return;

      const now = new Date();
      const currentWeekStart = startOfISOWeek(now);
      const weeksSinceEpoch = differenceInCalendarWeeks(currentWeekStart, EPOCH, { weekStartsOn: 1 });

      // rotation_offset = (userIndex - weeksSinceEpoch) % users.length
      let newOffset = (userIndex - weeksSinceEpoch) % users.length;
      if (newOffset < 0) newOffset += users.length;

      await updateMutation.mutateAsync({ id: taskId, name: task.name, rotation_offset: newOffset });
    }
  };

  return {
    weeks,
    tasks,
    users,
    isLoading: isLoadingTasks || isLoadingUsers,
    error: taskError || userError,
    actions
  };
};
