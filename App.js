import React from 'react';
import { StatusBar, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Ionicons } from '@expo/vector-icons';
import { AppProvider, useApp } from './src/context/AppContext';
import { COLORS, FONT_SIZE } from './src/utils/theme';

// Screens
import WelcomeScreen from './src/screens/WelcomeScreen';
import LoginScreen from './src/screens/LoginScreen';
import GuestLoginScreen from './src/screens/GuestLoginScreen';
import GoogleLoginScreen from './src/screens/GoogleLoginScreen';
import ProfileSetupScreen from './src/screens/ProfileSetupScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import CGPACalculatorScreen from './src/screens/CGPACalculatorScreen';
import SemestersScreen from './src/screens/SemestersScreen';
import AnalyticsScreen from './src/screens/AnalyticsScreen';
import PredictionScreen from './src/screens/PredictionScreen';
import GPACalculatorScreen from './src/screens/GPACalculatorScreen';
import SettingsScreen from './src/screens/SettingsScreen';

const Tab = createBottomTabNavigator();
const AuthStack = createNativeStackNavigator();

// ── Error Boundary ────────────────────────────────────────────────
// Catches unhandled JS errors so the entire app doesn't crash.
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorScreen}>
          <Ionicons name="warning" size={56} color={COLORS.warning} style={{ marginBottom: 16 }} />
          <Text style={styles.errorTitle}>Something went wrong</Text>
          <Text style={styles.errorMsg}>
            {this.state.error?.message || 'An unexpected error occurred.'}
          </Text>
          <TouchableOpacity
            style={styles.errorBtn}
            onPress={() => this.setState({ hasError: false, error: null })}
          >
            <Text style={styles.errorBtnText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

// ── Auth Navigator ────────────────────────────────────────────────
function AuthNavigator() {
  const { isDarkMode } = useApp();
  const bg = isDarkMode ? COLORS.bgDark : COLORS.bgLight;
  const text = isDarkMode ? COLORS.textDark : COLORS.textLight;
  
  return (
    <AuthStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: bg },
        headerTintColor: text,
        headerShadowVisible: false,
        headerBackTitleVisible: false,
        headerTitleStyle: { fontWeight: '700' },
      }}
    >
      <AuthStack.Screen 
        name="Welcome" 
        component={WelcomeScreen} 
        options={{ headerShown: false }} 
      />
      <AuthStack.Screen 
        name="LoginSelection" 
        component={LoginScreen} 
        options={{ title: '' }} 
      />
      <AuthStack.Screen 
        name="GuestLogin" 
        component={GuestLoginScreen} 
        options={{ title: '' }} 
      />
      <AuthStack.Screen 
        name="GoogleLogin" 
        component={GoogleLoginScreen} 
        options={{ title: '' }} 
      />
    </AuthStack.Navigator>
  );
}

// ── Main Tab Navigator ────────────────────────────────────────────
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
        <ErrorBoundary>
          <ProfileSetupScreen />
        </ErrorBoundary>
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
          height: 65 + (insets.bottom > 0 ? insets.bottom : 10),
          paddingBottom: insets.bottom > 0 ? insets.bottom : 10,
          paddingTop: 8,
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

// ── Loading Screen ────────────────────────────────────────────────
function LoadingScreen({ isDark }) {
  return (
    <View style={[styles.loading, { backgroundColor: isDark ? COLORS.bgDark : COLORS.bgLight }]}>
      <Ionicons name="school" size={64} color={COLORS.primary} style={{ marginBottom: 16 }} />
      <Text style={[styles.loadingText, { color: isDark ? COLORS.textDark : COLORS.textLight }]}>SmartGPA</Text>
    </View>
  );
}

// ── Root App ──────────────────────────────────────────────────────
function RootApp() {
  const { isLoading, isDarkMode, user, isGuest } = useApp();
  const barStyle = isDarkMode ? 'light-content' : 'dark-content';
  const bgColor = isDarkMode ? COLORS.bgDark : COLORS.bgLight;

  if (isLoading) {
    return <LoadingScreen isDark={isDarkMode} />;
  }

  if (!user && !isGuest) {
    return (
      <>
        <StatusBar barStyle={barStyle} backgroundColor={bgColor} />
        <ErrorBoundary>
          <AuthNavigator />
        </ErrorBoundary>
      </>
    );
  }

  return (
    <>
      <StatusBar barStyle={barStyle} backgroundColor={bgColor} />
      <ErrorBoundary>
        <MainNavigator />
      </ErrorBoundary>
    </>
  );
}

// ── Entry Point ───────────────────────────────────────────────────
export default function App() {
  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <NavigationContainer>
          <AppProvider>
            <RootApp />
          </AppProvider>
        </NavigationContainer>
      </ErrorBoundary>
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

  // Error Boundary
  errorScreen: {
    flex: 1,
    backgroundColor: COLORS.bgDark,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textDark,
    marginBottom: 12,
  },
  errorMsg: {
    fontSize: 13,
    color: COLORS.textMutedDark,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  errorBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 12,
  },
  errorBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
});
