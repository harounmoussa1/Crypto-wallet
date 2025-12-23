import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';

// Screens
import StartupScreen from './screens/StartupScreen';
import SetupScreen from './screens/SetupScreen';
import LoginScreen from './screens/LoginScreen';
import HomeScreen from './screens/HomeScreen';
import SendScreen from './screens/SendScreen';
import ReceiveScreen from './screens/ReceiveScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
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
        </Stack.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}
