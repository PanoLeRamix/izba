import React from 'react';
import { View, Text } from 'react-native';
import { Tabs } from 'expo-router';
import { LayoutDashboard, CalendarDays, ListTodo, Settings } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';

export default function MainLayout() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.onSurfaceVariant,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: `${Colors.outlineVariant}26`, // 15% opacity
          paddingBottom: insets.bottom,
          paddingTop: 12,
          height: 70 + insets.bottom,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarShowLabel: false, // We're using custom labels inside the icon slot for the unified pill look
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ color, size, focused }) => (
            <View className={`items-center justify-center px-5 py-2 rounded-2xl ${focused ? 'bg-secondary-container' : ''}`}>
              <LayoutDashboard size={size - 2} color={color} />
              <Text 
                style={{ 
                  color, 
                  fontSize: 10, 
                  fontWeight: '700', 
                  marginTop: 4 
                }}
              >
                {t('tabs.dashboard')}
              </Text>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="planner"
        options={{
          tabBarIcon: ({ color, size, focused }) => (
            <View className={`items-center justify-center px-5 py-2 rounded-2xl ${focused ? 'bg-secondary-container' : ''}`}>
              <CalendarDays size={size - 2} color={color} />
              <Text 
                style={{ 
                  color, 
                  fontSize: 10, 
                  fontWeight: '700', 
                  marginTop: 4 
                }}
              >
                {t('tabs.planner')}
              </Text>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="tasks"
        options={{
          tabBarIcon: ({ color, size, focused }) => (
            <View className={`items-center justify-center px-5 py-2 rounded-2xl ${focused ? 'bg-secondary-container' : ''}`}>
              <ListTodo size={size - 2} color={color} />
              <Text 
                style={{ 
                  color, 
                  fontSize: 10, 
                  fontWeight: '700', 
                  marginTop: 4 
                }}
              >
                {t('tabs.tasks')}
              </Text>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          tabBarIcon: ({ color, size, focused }) => (
            <View className={`items-center justify-center px-5 py-2 rounded-2xl ${focused ? 'bg-secondary-container' : ''}`}>
              <Settings size={size - 2} color={color} />
              <Text 
                style={{ 
                  color, 
                  fontSize: 10, 
                  fontWeight: '700', 
                  marginTop: 4 
                }}
              >
                {t('tabs.settings')}
              </Text>
            </View>
          ),
        }}
      />
    </Tabs>
  );
}
