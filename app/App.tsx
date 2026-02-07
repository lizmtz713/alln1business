import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';

import { AuthProvider, useAuth } from './src/contexts/AuthContext';

// Auth Screens
import { LoginScreen } from './src/screens/auth/LoginScreen';
import { SignUpScreen } from './src/screens/auth/SignUpScreen';

// Main Screens
import { HomeScreen } from './src/screens/HomeScreen';
import { DocumentsScreen } from './src/screens/DocumentsScreen';
import { BillsScreen } from './src/screens/BillsScreen';
import { ReceiptsScreen } from './src/screens/ReceiptsScreen';
import { AIScreen } from './src/screens/AIScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { AddReceiptScreen } from './src/screens/AddReceiptScreen';
import { QuickAddScreen } from './src/screens/QuickAddScreen';
import { HealthScoreScreen } from './src/screens/HealthScoreScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function HomeTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: { 
          backgroundColor: '#FFFFFF',
          borderTopWidth: 0,
          elevation: 10,
          shadowOpacity: 0.1,
          height: 85,
          paddingTop: 10,
        },
        tabBarActiveTintColor: '#3B82F6',
        tabBarInactiveTintColor: '#94A3B8',
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home';
          
          if (route.name === 'Home') iconName = focused ? 'grid' : 'grid-outline';
          else if (route.name === 'Documents') iconName = focused ? 'folder' : 'folder-outline';
          else if (route.name === 'Bills') iconName = focused ? 'calendar' : 'calendar-outline';
          else if (route.name === 'Receipts') iconName = focused ? 'receipt' : 'receipt-outline';
          else if (route.name === 'Profile') iconName = focused ? 'person' : 'person-outline';
          
          return <Ionicons name={iconName} size={26} color={color} />;
        },
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{ tabBarLabel: 'Dashboard' }}
      />
      <Tab.Screen 
        name="Documents" 
        component={DocumentsScreen} 
        options={{ tabBarLabel: 'Docs' }}
      />
      <Tab.Screen 
        name="Bills" 
        component={BillsScreen} 
        options={{ tabBarLabel: 'Bills' }}
      />
      <Tab.Screen 
        name="Receipts" 
        component={ReceiptsScreen} 
        options={{ tabBarLabel: 'Receipts' }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen} 
        options={{ tabBarLabel: 'Settings' }}
      />
    </Tab.Navigator>
  );
}

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="SignUp" component={SignUpScreen} />
    </Stack.Navigator>
  );
}

function MainStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeTabs" component={HomeTabs} />
      <Stack.Screen 
        name="AIChat" 
        component={AIScreen}
        options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
      />
      <Stack.Screen 
        name="AddReceipt" 
        component={AddReceiptScreen}
        options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
      />
      <Stack.Screen 
        name="QuickAdd" 
        component={QuickAddScreen}
        options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
      />
      <Stack.Screen 
        name="HealthScore" 
        component={HealthScoreScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen 
        name="TaxReadiness" 
        component={HealthScoreScreen}
        options={{ animation: 'slide_from_right' }}
      />
    </Stack.Navigator>
  );
}

function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingLogo}>Alln1</Text>
        <Text style={styles.loadingTagline}>All your business, in one place</Text>
        <ActivityIndicator size="large" color="#FFFFFF" style={{ marginTop: 24 }} />
      </View>
    );
  }

  return user ? <MainStack /> : <AuthStack />;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NavigationContainer>
          <StatusBar style="auto" />
          <AppNavigator />
        </NavigationContainer>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1E3A8A',
  },
  loadingLogo: {
    fontSize: 56,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 2,
  },
  loadingTagline: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 8,
  },
});
