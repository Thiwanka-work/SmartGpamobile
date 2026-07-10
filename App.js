import React from 'react';
import { StatusBar, View, Text, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Ionicons } from '@expo/vector-icons';
import { AppProvider, useApp } from './src/context/AppContext';
import { COLORS, FONT_SIZE } from './src/utils/theme';

// Screens
import ProfileSetupScreen from './src/screens/ProfileSetupScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import CGPACalculatorScreen from './src/screens/CGPACalculatorScreen';
import SemestersScreen from './src/screens/SemestersScreen';
import AnalyticsScreen from './src/screens/AnalyticsScreen';
import PredictionScreen from './src/screens/PredictionScreen';
import GPACalculatorScreen from './src/screens/GPACalculatorScreen';
import SettingsScreen from './src/screens/SettingsScreen';

const Tab = createBottomTabNavigator();

function MainNavigator() {
  const { appState, isDarkMode } = useApp();
  const insets = useSafeAreaInsets();
  const bg = isDarkMode ? COLORS.bgDark2 : '#fff';
  const activeTint = COLORS.primary;
  const inactiveTint = isDarkMode ? COLORS.textMutedDark : COLORS.textMutedLight;
  const border = isDarkMode ? COLORS.borderDark : COLORS.borderLight;

  if (!appState.profileSetup) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: isDarkMode ? COLORS.bgDark : COLORS.bgLight }}>
        <ProfileSetupScreen />
      </SafeAreaView>
    );
  }

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: {
          backgroundColor: bg,
          borderTopColor: border,
          borderTopWidth: 1,
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom + 4,
          paddingTop: 4,
        },
        tabBarActiveTintColor: activeTint,
        tabBarInactiveTintColor: inactiveTint,
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
        headerStyle: { backgroundColor: isDarkMode ? COLORS.bgDark2 : '#fff', borderBottomColor: border, borderBottomWidth: 1 },
        headerTintColor: isDarkMode ? COLORS.textDark : COLORS.textLight,
        headerTitleStyle: { fontWeight: '700', fontSize: FONT_SIZE.lg },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ focused, color }) => <Ionicons name={focused ? 'home' : 'home-outline'} size={24} color={color} />,
          headerTitle: 'SmartGPA',
        }}
      />
      <Tab.Screen
        name="CGPACalculator"
        component={CGPACalculatorScreen}
        options={{
          title: 'CGPA',
          tabBarIcon: ({ focused, color }) => <Ionicons name={focused ? 'add-circle' : 'add-circle-outline'} size={24} color={color} />,
          headerTitle: 'CGPA Calculator',
        }}
      />
      <Tab.Screen
        name="GPACalculator"
        component={GPACalculatorScreen}
        options={{
          title: 'GPA Calc',
          tabBarIcon: ({ focused, color }) => <Ionicons name={focused ? 'calculator' : 'calculator-outline'} size={24} color={color} />,
          headerTitle: 'GPA Calculator',
        }}
      />
      <Tab.Screen
        name="Semesters"
        component={SemestersScreen}
        options={{
          title: 'Semesters',
          tabBarIcon: ({ focused, color }) => <Ionicons name={focused ? 'calendar' : 'calendar-outline'} size={24} color={color} />,
          headerTitle: 'Semester Management',
        }}
      />
      <Tab.Screen
        name="Analytics"
        component={AnalyticsScreen}
        options={{
          title: 'Analytics',
          tabBarIcon: ({ focused, color }) => <Ionicons name={focused ? 'bar-chart' : 'bar-chart-outline'} size={24} color={color} />,
          headerTitle: 'Performance Analytics',
        }}
      />
      <Tab.Screen
        name="Prediction"
        component={PredictionScreen}
        options={{
          title: 'Predict',
          tabBarIcon: ({ focused, color }) => <Ionicons name={focused ? 'compass' : 'compass-outline'} size={24} color={color} />,
          headerTitle: 'GPA Prediction',
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: 'Settings',
          tabBarIcon: ({ focused, color }) => <Ionicons name={focused ? 'settings' : 'settings-outline'} size={24} color={color} />,
          headerTitle: 'Settings',
        }}
      />
    </Tab.Navigator>
  );
}

function LoadingScreen({ isDark }) {
  return (
    <View style={[styles.loading, { backgroundColor: isDark ? COLORS.bgDark : COLORS.bgLight }]}>
      <Ionicons name="school" size={64} color={isDark ? COLORS.textDark : COLORS.textLight} style={{ marginBottom: 16 }} />
      <Text style={[styles.loadingText, { color: isDark ? COLORS.textDark : COLORS.textLight }]}>SmartGPA</Text>
    </View>
  );
}

function RootApp() {
  const { isLoading, isDarkMode } = useApp();
  const barStyle = isDarkMode ? 'light-content' : 'dark-content';
  const bgColor = isDarkMode ? COLORS.bgDark : COLORS.bgLight;

  if (isLoading) {
    return <LoadingScreen isDark={isDarkMode} />;
  }

  return (
    <NavigationContainer>
      <StatusBar barStyle={barStyle} backgroundColor={bgColor} />
      <MainNavigator />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <RootApp />
      </AppProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: { fontSize: 32, fontWeight: '800', letterSpacing: -1 },
});
