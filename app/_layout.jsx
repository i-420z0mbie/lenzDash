// App.js
import React, { useEffect, useRef, useState } from 'react';
import { Platform, AppState } from 'react-native';
import * as Font from 'expo-font';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import api, { sendPushTokenToBackend } from '../src/api';
import { ACCESS_TOKEN } from '../src/constant';

import Login from '../screens/Login';
import Home from '../screens/Home';
import Payment from '../screens/Payment';
import ProfileInfo from '../screens/ProfileInfo';
import Receipt from '../screens/Receipt';
import SchoolInfo from '../screens/SchoolInfo';
import PDFViewer from '../screens/PDFViewer';
import SubscriptionScreen from '../screens/SubscriptionScreen'

const Stack = createStackNavigator();

const EXPO_PROJECT_ID = '0a3484ee-e195-45e4-b2f7-afa13e473f0c';
const EXPO_PUSH_TOKEN_KEY = 'EXPO_PUSH_TOKEN';

/* -------------------------
  Notification behavior
--------------------------*/
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function App() {
  const [isReady, setIsReady] = useState(false);
  const appState = useRef(AppState.currentState);

  /* -------------------------
    PUSH TOKEN REGISTRATION
    (CALLED AFTER LOGIN)
  --------------------------*/
  const registerPushToken = async () => {
  try {
    console.log('🟡 Registering push token...');

    if (!Device.isDevice) {
      console.log('❌ Must be a physical device');
      return;
    }

    // Permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('❌ Notification permission denied');
      return;
    }

    // Get Expo token
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: EXPO_PROJECT_ID,
    });

    const pushToken = tokenData.data;
    console.log('✅ Push token:', pushToken);

    await AsyncStorage.setItem(EXPO_PUSH_TOKEN_KEY, pushToken);

    // Ensure user is authenticated
    const accessToken = await AsyncStorage.getItem(ACCESS_TOKEN);
    if (!accessToken) {
      console.log('⚠️ No auth token — skipping backend registration');
      return;
    }

    // Send to backend
    await sendPushTokenToBackend(pushToken);
    console.log('🎉 Push token sent to backend');
  } catch (error) {
    console.error(
      '❌ Push token registration failed:',
      error.response?.data || error.message
    );
  }
};

  /* -------------------------
    APP INIT
  --------------------------*/
  useEffect(() => {
    const init = async () => {
      try {
        await Font.loadAsync({
          'LeckerliOne-Regular': require('../assets/fonts/LeckerliOne-Regular.ttf'),
          'Poppins-Regular': require('../assets/fonts/Poppins-Regular.ttf'),
          'Poppins-ExtraBold': require('../assets/fonts/Poppins-ExtraBold.ttf'),
        });

        if (Platform.OS === 'android') {
          await Notifications.setNotificationChannelAsync('default', {
            name: 'Default',
            importance: Notifications.AndroidImportance.HIGH,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#667eea',
          });
        }

        setIsReady(true);
        console.log('✅ App initialized');
      } catch (err) {
        console.error('❌ Init error:', err);
        setIsReady(true);
      }
    };

    init();
  }, []);

  /* -------------------------
    FOREGROUND SAFETY CHECK
  --------------------------*/
  useEffect(() => {
    const onAppStateChange = async (nextState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextState === 'active'
      ) {
        const accessToken = await AsyncStorage.getItem(ACCESS_TOKEN);
        const storedToken = await AsyncStorage.getItem(EXPO_PUSH_TOKEN_KEY);

        if (accessToken && !storedToken) {
          console.log('🟡 Foreground: registering missing push token');
          await registerPushToken();
        }
      }

      appState.current = nextState;
    };

    const sub = AppState.addEventListener('change', onAppStateChange);
    return () => sub.remove();
  }, []);

  if (!isReady) return null;

  return (

      <Stack.Navigator initialRouteName="Login">

        {/* LOGIN — HEADER REMOVED */}
        <Stack.Screen
          name="Login"
          options={{ headerShown: false }}
        >
          {(props) => (
            <Login
              {...props}
              registerPushToken={registerPushToken}
            />
          )}
        </Stack.Screen>

        <Stack.Screen name="Home" component={Home} options={{ headerShown: false }} />
        <Stack.Screen name="Profile" component={ProfileInfo} options={{ headerShown: false }} />
        <Stack.Screen name="Payment" component={Payment} options={{ headerShown: false }} />
        <Stack.Screen name="Receipts" component={Receipt} options={{ headerShown: false }} />
        <Stack.Screen name="PDFViewer" component={PDFViewer} options={{ headerShown: false }} />
        <Stack.Screen name="SchoolInfo" component={SchoolInfo} options={{ headerShown: false }} />
        <Stack.Screen name="Subscription" component={SubscriptionScreen} options={{ headerShown: false }} />

      </Stack.Navigator>

  );
}
