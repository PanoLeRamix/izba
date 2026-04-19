import React from 'react';
import { Pressable, Text, View } from 'react-native';
import type { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import { Tabs, usePathname } from 'expo-router';
import { CalendarDays, LayoutDashboard, ListTodo, Settings, ShoppingCart, type LucideIcon } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';

type TabDefinition = {
  name: 'index' | 'planner' | 'tasks' | 'shopping' | 'settings';
  title: string;
  Icon: LucideIcon;
};

function TabBarButton({
  accessibilityState,
  accessibilityLabel,
  testID,
  onPress,
  onLongPress,
  style,
  label,
  Icon,
  isSelected,
}: BottomTabBarButtonProps & {
  label: string;
  Icon: LucideIcon;
  isSelected: boolean;
}) {
  const tintColor = isSelected ? Colors.primary : Colors.onSurfaceVariant;

  return (
    <Pressable
      accessibilityState={accessibilityState}
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      onPress={onPress}
      onLongPress={onLongPress}
      style={style}
      className="flex-1 items-center justify-center"
    >
      <View
        style={{
          backgroundColor: isSelected ? Colors.secondaryContainer : 'transparent',
          borderRadius: 999,
          minWidth: 64,
          overflow: 'hidden',
          paddingHorizontal: 8,
          paddingVertical: 8,
        }}
        className="items-center justify-center"
      >
        <Icon size={20} color={tintColor} />
        <Text
          style={{
            color: tintColor,
            fontSize: 10,
            fontWeight: '700',
            marginTop: 4,
          }}
          numberOfLines={1}
        >
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

export default function MainLayout() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const tabs: TabDefinition[] = [
    { name: 'index', title: t('tabs.dashboard'), Icon: LayoutDashboard },
    { name: 'planner', title: t('tabs.planner'), Icon: CalendarDays },
    { name: 'tasks', title: t('tabs.tasks'), Icon: ListTodo },
    { name: 'shopping', title: t('tabs.shopping'), Icon: ShoppingCart },
    { name: 'settings', title: t('tabs.settings'), Icon: Settings },
  ];
  const createTabButton =
    (name: string, label: string, Icon: LucideIcon) => (props: BottomTabBarButtonProps) => {
      const routePath = name === 'index' ? '/' : `/${name}`;
      const isSelected = pathname === routePath || pathname.startsWith(`${routePath}/`);

      return <TabBarButton {...props} label={label} Icon={Icon} isSelected={isSelected} />;
    };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: `${Colors.outlineVariant}26`, // 15% opacity
          paddingBottom: Math.max(insets.bottom, 12),
          paddingTop: 12,
          height: 72 + Math.max(insets.bottom, 12),
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarItemStyle: {
          paddingVertical: 4,
        },
      }}
    >
      {tabs.map(({ name, title, Icon }) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{
            title,
            tabBarButton: createTabButton(name, title, Icon),
          }}
        />
      ))}
    </Tabs>
  );
}
