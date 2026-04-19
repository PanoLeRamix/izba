import React from 'react';
import { Pressable, Text, View } from 'react-native';
import type { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import { Tabs, usePathname } from 'expo-router';
import { CalendarDays, LayoutDashboard, ListTodo, Settings, ShoppingCart, type LucideIcon } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';

type TabDefinition = {
  name: 'index' | 'planner' | 'tasks' | 'courses' | 'settings';
  routeName: string;
  title: string;
  Icon: LucideIcon;
};

function TabBarButton({
  label,
  Icon,
  isSelected,
  ref: _ref,
  ...props
}: BottomTabBarButtonProps & {
  label: string;
  Icon: LucideIcon;
  isSelected: boolean;
}) {
  const tintColor = isSelected ? Colors.primary : Colors.onSurfaceVariant;

  return (
    <Pressable
      {...props}
      className="flex-1 items-center justify-center"
    >
      <View
        style={{
          backgroundColor: isSelected ? Colors.secondaryContainer : 'transparent',
          borderRadius: 999,
          minWidth: 82,
          overflow: 'hidden',
          paddingHorizontal: 16,
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
    { name: 'index', routeName: '', title: t('tabs.dashboard'), Icon: LayoutDashboard },
    { name: 'planner', routeName: 'planner', title: t('tabs.planner'), Icon: CalendarDays },
    { name: 'tasks', routeName: 'tasks', title: t('tabs.tasks'), Icon: ListTodo },
    { name: 'courses', routeName: 'courses', title: t('tabs.courses'), Icon: ShoppingCart },
    { name: 'settings', routeName: 'settings', title: t('tabs.settings'), Icon: Settings },
  ];
  const createTabButton =
    (routeName: string, label: string, Icon: LucideIcon) => (props: BottomTabBarButtonProps) => {
      const isSelected = pathname === `/${routeName}` || pathname.startsWith(`/${routeName}/`);

      return <TabBarButton {...props} label={label} Icon={Icon} isSelected={isSelected} />;
    };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: `${Colors.outlineVariant}26`, // 15% opacity
          paddingBottom: insets.bottom,
          paddingTop: 8,
          height: 64 + insets.bottom,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarItemStyle: {
          paddingVertical: 6,
        },
      }}
    >
      {tabs.map(({ name, routeName, title, Icon }) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{
            title,
            tabBarButton: createTabButton(routeName, title, Icon),
          }}
        />
      ))}
    </Tabs>
  );
}
