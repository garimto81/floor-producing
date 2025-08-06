import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTheme } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// 화면 import
import DashboardScreen from '../screens/DashboardScreen';
import ChecklistScreen from '../screens/ChecklistScreen';
import CommunicationScreen from '../screens/CommunicationScreen';
import TeamScreen from '../screens/TeamScreen';
import MoreScreen from '../screens/MoreScreen';

const Tab = createBottomTabNavigator();

export default function MainNavigator() {
  const theme = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.surfaceVariant,
        },
        headerStyle: {
          backgroundColor: theme.colors.primary,
        },
        headerTintColor: '#FFFFFF',
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          title: '대시보드',
          tabBarIcon: ({ color, size }) => (
            <Icon name="view-dashboard" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Checklist"
        component={ChecklistScreen}
        options={{
          title: '체크리스트',
          tabBarIcon: ({ color, size }) => (
            <Icon name="checkbox-marked-outline" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Communication"
        component={CommunicationScreen}
        options={{
          title: '소통',
          tabBarIcon: ({ color, size }) => (
            <Icon name="message-text" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Team"
        component={TeamScreen}
        options={{
          title: '팀',
          tabBarIcon: ({ color, size }) => (
            <Icon name="account-group" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="More"
        component={MoreScreen}
        options={{
          title: '더보기',
          tabBarIcon: ({ color, size }) => (
            <Icon name="dots-horizontal" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}