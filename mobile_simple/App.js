import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';

// Context
import { AuthProvider } from './src/context/AuthContext';

// Screens
import StartupScreen from './src/screens/StartupScreen';
import SetupScreen from './src/screens/SetupScreen';
import LoginScreen from './src/screens/LoginScreen';
import ImportWalletScreen from './src/screens/ImportWalletScreen';
import HomeScreen from './src/screens/HomeScreen';
import SendScreen from './src/screens/SendScreen';
import ReceiveScreen from './src/screens/ReceiveScreen';
import SecurityScreen from './src/screens/SecurityScreen';
import ResetPasswordScreen from './src/screens/ResetPasswordScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import ManageWalletsScreen from './src/screens/ManageWalletsScreen';
import NetworkSwitcherScreen from './src/screens/NetworkSwitcherScreen';
import ChangePasswordScreen from './src/screens/ChangePasswordScreen';

import SwapScreen from './src/screens/SwapScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <NavigationContainer>
          <StatusBar style="light" translucent={true} backgroundColor="transparent" />
          <Stack.Navigator
            initialRouteName="Startup"
            screenOptions={{
              headerShown: false,
              headerStyle: { backgroundColor: '#4a00e0' },
              headerTintColor: '#ffffff',
              headerTitleAlign: 'center',
              headerBackTitleVisible: false,
            }}
          >
            <Stack.Screen name="Startup" component={StartupScreen} />
            <Stack.Screen name="Setup" component={SetupScreen} />
            <Stack.Screen name="ImportWallet" component={ImportWalletScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Login" component={LoginScreen} />

            <Stack.Screen
              name="Home"
              component={HomeScreen}
            // Home hides header to show the custom gradient header
            />

            <Stack.Screen
              name="Send"
              component={SendScreen}
              options={{ headerShown: true, title: 'Envoyer' }}
            />

            <Stack.Screen
              name="Receive"
              component={ReceiveScreen}
              options={{ headerShown: true, title: 'Recevoir' }}
            />

            <Stack.Screen
              name="Swap"
              component={SwapScreen}
              options={{ headerShown: true, title: 'Bridge / Swap' }}
            />

            <Stack.Screen
              name="Security"
              component={SecurityScreen}
              options={{ headerShown: false }}
            />

            <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} options={{ headerShown: false }} />

            <Stack.Screen name="Settings" component={SettingsScreen} options={{ headerShown: false }} />

            <Stack.Screen name="ManageWallets" component={ManageWalletsScreen} options={{ headerShown: false }} />

            <Stack.Screen name="NetworkSwitcher" component={NetworkSwitcherScreen} options={{ headerShown: false }} />

            <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} options={{ headerShown: false }} />
          </Stack.Navigator>
        </NavigationContainer>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
