import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { AdminRouterScreen } from '../screens/AdminRouterScreen';
import { AttendanceReportScreen } from '../screens/AttendanceReportScreen';
import { DashboardScreen } from '../screens/DashboardScreen';
import { EmployeeProfileScreen } from '../screens/EmployeeProfileScreen';
import { LoginScreen } from '../screens/LoginScreen';
import type { RootStackParamList } from '../types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          contentStyle: { backgroundColor: '#F0F2FF' },
        }}
      >
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Dashboard" component={DashboardScreen} />
        <Stack.Screen name="AdminRouterScreen" component={AdminRouterScreen} />
        <Stack.Screen name="AttendanceReportScreen" component={AttendanceReportScreen} />
        <Stack.Screen name="EmployeeProfileScreen" component={EmployeeProfileScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
