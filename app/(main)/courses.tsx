import React, { useCallback, useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Check, Plus } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { InputModal } from '../../components/InputModal';
import { Colors } from '../../constants/Colors';
import { LAYOUT } from '../../constants/Layout';
import { useShoppingList } from '../../hooks/useShoppingList';
import { type HouseShoppingItem } from '../../services/shopping';
import { isNetworkError } from '../../utils/errors';

function ShoppingItemRow({
  item,
  onPress,
}: {
  item: HouseShoppingItem;
  onPress: (item: HouseShoppingItem) => void;
}) {
  const isChecked = !!item.checked_at;

  return (
    <Pressable
      onPress={() => onPress(item)}
      className="flex-row items-center rounded-[28px] px-5 py-4"
      style={{
        backgroundColor: isChecked ? Colors.surfaceContainer : Colors.surfaceContainerLow,
        borderColor: isChecked ? Colors.outlineVariant : Colors.secondaryContainer,
        borderWidth: 1,
      }}
    >
      <View
        className="mr-4 h-7 w-7 items-center justify-center rounded-full"
        style={{
          backgroundColor: isChecked ? Colors.primary : 'transparent',
          borderColor: isChecked ? Colors.primary : Colors.outline,
          borderWidth: 1.5,
        }}
      >
        {isChecked ? (
          <Check size={16} color={Colors.onPrimary} />
        ) : (
          <View
            className="h-3 w-3 rounded-full"
            style={{
              backgroundColor: 'transparent',
            }}
          />
        )}
      </View>
      <Text
        className="flex-1 text-base"
        style={{
          color: isChecked ? Colors.onSurfaceVariant : Colors.onSurface,
          textDecorationLine: isChecked ? 'line-through' : 'none',
        }}
      >
        {item.name}
      </Text>
    </Pressable>
  );
}

export default function CoursesScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [isAddVisible, setIsAddVisible] = useState(false);
  const { activeItems, checkedItems, isLoading, isSaving, actions } = useShoppingList();

  const topPadding = LAYOUT.getTopPadding(insets.top);
  const bottomPadding = Math.max(insets.bottom, LAYOUT.BASE_SCREEN_PADDING) + 84;

  const showDialog = useCallback((title: string, message: string) => {
    if (Platform.OS === 'web') {
      alert(`${title}\n\n${message}`);
      return;
    }

    Alert.alert(title, message);
  }, []);

  const handleToggleItem = useCallback(
    async (item: HouseShoppingItem) => {
      try {
        await actions.setItemChecked(item.id, !item.checked_at);
      } catch (error) {
        showDialog(t('common.error'), isNetworkError(error) ? t('common.networkError') : t('shopping.updateError'));
      }
    },
    [actions, showDialog, t],
  );

  const handleCreateItem = useCallback(
    async (value: string) => {
      try {
        await actions.createItem(value);
        setIsAddVisible(false);
      } catch (error) {
        showDialog(t('common.error'), isNetworkError(error) ? t('common.networkError') : t('shopping.createError'));
      }
    },
    [actions, showDialog, t],
  );

  return (
    <View className="flex-1 bg-surface" style={{ paddingTop: topPadding }}>
      <View className="px-6 mb-2 justify-center" style={{ height: LAYOUT.HEADER_HEIGHT - 10 }}>
        <Text className="text-3xl font-black text-primary uppercase">{t('tabs.courses')}</Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: LAYOUT.BASE_SCREEN_PADDING,
          paddingBottom: bottomPadding,
          paddingTop: 12,
          gap: 16,
        }}
        showsVerticalScrollIndicator={false}
      >
        {isLoading && !activeItems.length && !checkedItems.length ? (
          <View
            className="rounded-[32px] px-6 py-8"
            style={{ backgroundColor: Colors.surfaceContainerLow, borderColor: Colors.outlineVariant, borderWidth: 1 }}
          >
            <Text className="text-base text-on-surface-variant">{t('common.loading')}</Text>
          </View>
        ) : null}

        {!isLoading && !activeItems.length && !checkedItems.length ? (
          <View
            className="rounded-[32px] px-6 py-8"
            style={{ backgroundColor: Colors.surfaceContainerLow, borderColor: Colors.outlineVariant, borderWidth: 1 }}
          >
            <Text className="text-lg font-bold text-primary">{t('shopping.emptyTitle')}</Text>
            <Text className="mt-2 text-base leading-6 text-on-surface-variant">{t('shopping.emptyMessage')}</Text>
          </View>
        ) : null}

        {activeItems.map((item) => (
          <ShoppingItemRow key={item.id} item={item} onPress={handleToggleItem} />
        ))}

        {checkedItems.length ? (
          <View
            className="my-2 h-px"
            style={{ backgroundColor: Colors.outlineVariant }}
          />
        ) : null}

        {checkedItems.map((item) => (
          <ShoppingItemRow key={item.id} item={item} onPress={handleToggleItem} />
        ))}

        <View className="flex-row items-start pt-4">
          <View
            className="mr-3 h-5 w-5 items-center justify-center rounded-full"
            style={{ backgroundColor: Colors.surfaceContainerHigh }}
          >
            <Text className="text-[11px] font-black text-on-surface-variant">i</Text>
          </View>
          <Text className="flex-1 text-sm leading-6 text-on-surface-variant">{t('shopping.deleteInfo')}</Text>
        </View>
      </ScrollView>

      <TouchableOpacity
        onPress={() => setIsAddVisible(true)}
        className="absolute flex-row items-center rounded-2xl px-5 py-3.5"
        style={{
          right: LAYOUT.BASE_SCREEN_PADDING,
          bottom: Math.max(insets.bottom, LAYOUT.BASE_SCREEN_PADDING) + 12,
          backgroundColor: Colors.primary,
          borderColor: Colors.primaryContainer,
          borderWidth: 1,
          shadowColor: Colors.primaryContainer,
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.22,
          shadowRadius: 14,
          elevation: 8,
        }}
      >
        <Plus size={18} color={Colors.onPrimary} />
        <Text className="ml-2 text-sm font-black text-on-primary">{t('shopping.addAction')}</Text>
      </TouchableOpacity>

      <InputModal
        visible={isAddVisible}
        onClose={() => setIsAddVisible(false)}
        onSave={(value) => void handleCreateItem(value)}
        title={t('shopping.addTitle')}
        saveTitle={t('shopping.addAction')}
        placeholder={t('shopping.placeholder')}
        maxLength={80}
        loading={isSaving}
      />
    </View>
  );
}
