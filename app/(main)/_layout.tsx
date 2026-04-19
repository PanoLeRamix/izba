import React from 'react';
import { Pressable, Text, View } from 'react-native';
import type { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import { Tabs, usePathname } from 'expo-router';
import { CalendarDays, LayoutDashboard, ListTodo, Settings, ShoppingCart, type LucideIcon } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';

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
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.dashboard'),
          tabBarButton: createTabButton('', t('tabs.dashboard'), LayoutDashboard),
        }}
      />
      <Tabs.Screen
        name="planner"
        options={{
          title: t('tabs.planner'),
          tabBarButton: createTabButton('planner', t('tabs.planner'), CalendarDays),
        }}
      />
      <Tabs.Screen
        name="tasks"
        options={{
          title: t('tabs.tasks'),
          tabBarButton: createTabButton('tasks', t('tabs.tasks'), ListTodo),
        }}
      />
      <Tabs.Screen
        name="courses"
        options={{
          title: t('shopping.title'),
          tabBarButton: createTabButton('courses', t('tabs.courses'), ShoppingCart),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t('tabs.settings'),
          tabBarButton: createTabButton('settings', t('tabs.settings'), Settings),
        }}
      />
    </Tabs>
  );
}
