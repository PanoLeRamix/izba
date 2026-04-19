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
  isProminent?: boolean;
};

const TAB_BAR_HEIGHT = 64;
const PROMINENT_SIZE = 80;
const STANDARD_ICON_SIZE = 20;
const PROMINENT_ICON_SIZE = 32;

// Standard button content: Icon(20) + Margin(4) + Text(10) = 34px
// With vertical padding of 8px (top+bottom = 16px), the total View is 50px.
const STANDARD_VIEW_HEIGHT = 50;
const STANDARD_ICON_OFFSET = 8 + (STANDARD_ICON_SIZE / 2); // 18px from top of its View

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
  isProminent,
}: BottomTabBarButtonProps & {
  label: string;
  Icon: LucideIcon;
  isSelected: boolean;
  isProminent?: boolean;
}) {
  const tintColor = isProminent 
    ? (isSelected ? Colors.onPrimary : Colors.primary)
    : (isSelected ? Colors.primary : Colors.onSurfaceVariant);

  const backgroundColor = isProminent
    ? (isSelected ? Colors.primary : Colors.surfaceContainerHigh)
    : (isSelected ? Colors.secondaryContainer : 'transparent');

  // Dynamic Alignment Calculation:
  // 1. Find where the standard icon center sits relative to the Tab Bar top
  const standardIconCenterY = ((TAB_BAR_HEIGHT - STANDARD_VIEW_HEIGHT) / 2) + STANDARD_ICON_OFFSET;
  
  // 2. Align prominent button center (PROMINENT_SIZE / 2) with that center point
  const prominentTopOffset = standardIconCenterY - (PROMINENT_SIZE / 2);

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
          backgroundColor,
          borderRadius: 999,
          width: isProminent ? PROMINENT_SIZE : undefined,
          height: isProminent ? PROMINENT_SIZE : undefined,
          minWidth: isProminent ? undefined : 64,
          position: isProminent ? 'absolute' : 'relative',
          top: isProminent ? prominentTopOffset : undefined,
          paddingHorizontal: 8,
          paddingVertical: isProminent ? 0 : 8,
          borderWidth: isProminent ? 6 : 0,
          borderColor: Colors.surface,
          shadowColor: isProminent ? Colors.primary : 'transparent',
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: isProminent ? (isSelected ? 0.3 : 0.1) : 0,
          shadowRadius: 10,
          elevation: isProminent ? (isSelected ? 8 : 2) : 0,
          zIndex: isProminent ? 10 : 1,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Icon size={isProminent ? PROMINENT_ICON_SIZE : STANDARD_ICON_SIZE} color={tintColor} />
        {!isProminent && (
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
        )}
      </View>
    </Pressable>
  );
}

export default function MainLayout() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const tabs: TabDefinition[] = [
    { name: 'tasks', title: t('tabs.tasks'), Icon: ListTodo },
    { name: 'planner', title: t('tabs.planner'), Icon: CalendarDays },
    { name: 'index', title: t('tabs.dashboard'), Icon: LayoutDashboard, isProminent: true },
    { name: 'shopping', title: t('tabs.shopping'), Icon: ShoppingCart },
    { name: 'settings', title: t('tabs.settings'), Icon: Settings },
  ];
  const createTabButton =
    (name: string, label: string, Icon: LucideIcon, isProminent?: boolean) => (props: BottomTabBarButtonProps) => {
      const routePath = name === 'index' ? '/' : `/${name}`;
      const isSelected = pathname === routePath || pathname.startsWith(`${routePath}/`);

      return <TabBarButton {...props} label={label} Icon={Icon} isSelected={isSelected} isProminent={isProminent} />;
    };

  const bottomPadding = insets.bottom;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: `${Colors.outlineVariant}26`, // 15% opacity
          paddingBottom: bottomPadding,
          paddingTop: 0,
          height: TAB_BAR_HEIGHT + bottomPadding,
          elevation: 0,
          shadowOpacity: 0,
          overflow: 'visible',
        },
        tabBarItemStyle: {
          height: TAB_BAR_HEIGHT,
          overflow: 'visible',
        },
      }}
    >
      {tabs.map(({ name, title, Icon, isProminent }) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{
            title,
            tabBarButton: createTabButton(name, title, Icon, isProminent),
          }}
        />
      ))}
    </Tabs>
  );
}
