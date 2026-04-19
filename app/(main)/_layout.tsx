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
  routeName: string;
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
  isProminent = false,
}: BottomTabBarButtonProps & {
  label: string;
  Icon: LucideIcon;
  isSelected: boolean;
  isProminent?: boolean;
}) {
  const tintColor = isSelected ? Colors.primary : Colors.onSurfaceVariant;
  const iconSize = isProminent ? 24 : 20;

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
          minWidth: isProminent ? 90 : 82,
          overflow: 'hidden',
          paddingHorizontal: 16,
          paddingVertical: isProminent ? 10 : 8,
          borderWidth: isProminent && isSelected ? 1 : 0,
          borderColor: Colors.primaryAlpha10,
        }}
        className="items-center justify-center"
      >
        <Icon size={iconSize} color={tintColor} strokeWidth={isProminent && isSelected ? 2.5 : 2} />
        <Text
          style={{
            color: tintColor,
            fontSize: isProminent ? 11 : 10,
            fontWeight: isSelected || isProminent ? '900' : '700',
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
    { name: 'planner', routeName: 'planner', title: t('tabs.planner'), Icon: CalendarDays },
    { name: 'tasks', routeName: 'tasks', title: t('tabs.tasks'), Icon: ListTodo },
    { name: 'index', routeName: '', title: t('tabs.dashboard'), Icon: LayoutDashboard },
    { name: 'shopping', routeName: 'shopping', title: t('tabs.shopping'), Icon: ShoppingCart },
    { name: 'settings', routeName: 'settings', title: t('tabs.settings'), Icon: Settings },
  ];
  const createTabButton =
    (routeName: string, label: string, Icon: LucideIcon, isProminent: boolean) => (props: BottomTabBarButtonProps) => {
      const isSelected = routeName === '' 
        ? pathname === '/' || pathname === '/index'
        : pathname === `/${routeName}` || pathname.startsWith(`/${routeName}/`);

      return <TabBarButton {...props} label={label} Icon={Icon} isSelected={isSelected} isProminent={isProminent} />;
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
          height: 68 + insets.bottom,
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
            tabBarButton: createTabButton(routeName, title, Icon, name === 'index'),
          }}
        />
      ))}
    </Tabs>
  );
}
