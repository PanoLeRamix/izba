import { useCallback, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore';
import { shoppingService, type HouseShoppingItem } from '../services/shopping';

function sortItems(items: HouseShoppingItem[]) {
  return [...items].sort((left, right) => {
    if (!left.checked_at && right.checked_at) return -1;
    if (left.checked_at && !right.checked_at) return 1;

    if (!left.checked_at && !right.checked_at) {
      if (left.created_at !== right.created_at) {
        return left.created_at.localeCompare(right.created_at);
      }
    }

    if (left.checked_at && right.checked_at) {
      if (left.checked_at !== right.checked_at) {
        return right.checked_at.localeCompare(left.checked_at);
      }
    }

    const nameComparison = left.name.localeCompare(right.name, undefined, { sensitivity: 'base' });
    if (nameComparison !== 0) {
      return nameComparison;
    }

    return left.id.localeCompare(right.id);
  });
}

const getShoppingQuery = (houseId: string | null) => ['shopping-items', houseId] as const;

export function useShoppingList() {
  const { houseId, userToken } = useAuthStore();
  const queryClient = useQueryClient();
  const queryKey = getShoppingQuery(houseId);

  const { data: items = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey,
    queryFn: () => shoppingService.listItems(userToken!),
    enabled: !!houseId && !!userToken,
  });

  const createItemMutation = useMutation({
    mutationFn: ({ name }: { name: string }) => shoppingService.createItem(userToken!, name),
    onSuccess: async (data) => {
      if (data) {
        queryClient.setQueryData<HouseShoppingItem[]>(queryKey, (current = []) => sortItems([...current, data]));
      }
      await queryClient.invalidateQueries({ queryKey });
    },
  });

  const setCheckedMutation = useMutation({
    mutationFn: ({ itemId, checked }: { itemId: string; checked: boolean }) =>
      shoppingService.setItemChecked(userToken!, itemId, checked),
    onMutate: async ({ itemId, checked }) => {
      await queryClient.cancelQueries({ queryKey });
      const previousItems = queryClient.getQueryData<HouseShoppingItem[]>(queryKey) ?? [];
      const optimisticCheckedAt = checked ? new Date().toISOString() : null;

      queryClient.setQueryData<HouseShoppingItem[]>(
        queryKey,
        sortItems(
          previousItems.map((item) =>
            item.id === itemId ? { ...item, checked_at: optimisticCheckedAt, updated_at: new Date().toISOString() } : item,
          ),
        ),
      );

      return { previousItems };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousItems) {
        queryClient.setQueryData(queryKey, context.previousItems);
      }
    },
    onSuccess: (data) => {
      if (data) {
        queryClient.setQueryData<HouseShoppingItem[]>(
          queryKey,
          (current = []) => sortItems(current.map((item) => (item.id === data.id ? data : item))),
        );
      }
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey });
    },
  });

  const activeItems = useMemo(() => items.filter((item) => !item.checked_at), [items]);
  const checkedItems = useMemo(() => items.filter((item) => !!item.checked_at), [items]);

  const createItem = useCallback(
    async (name: string) => {
      await createItemMutation.mutateAsync({ name: name.trim() });
    },
    [createItemMutation],
  );

  const setItemChecked = useCallback(
    async (itemId: string, checked: boolean) => {
      await setCheckedMutation.mutateAsync({ itemId, checked });
    },
    [setCheckedMutation],
  );

  return {
    items,
    activeItems,
    checkedItems,
    isLoading,
    isRefetching,
    isSaving: createItemMutation.isPending || setCheckedMutation.isPending,
    refetch,
    actions: {
      createItem,
      setItemChecked,
    },
  };
}
