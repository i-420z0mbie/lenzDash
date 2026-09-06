// PushNotificationProvider.js - Simplified version
// Use this if you want a context-based approach, otherwise use the hook in App.js

import React, { createContext, useContext, useState } from 'react';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { registerPushToken, unregisterPushToken } from '../src/api';
import { ACCESS_TOKEN } from '../src/constant';

const EXPO_PROJECT_ID = '0a3484ee-e195-45e4-b2f7-afa13e473f0c';
const EXPO_PUSH_TOKEN_KEY = 'EXPO_PUSH_TOKEN';

const PushNotificationContext = createContext({
  expoPushToken: null,
  registerPushTokenWithBackend: async () => ({ success: false }),
  unregisterPushTokenFromBackend: async () => ({ success: false }),
  getExpoPushToken: async () => null,
});

export const usePushNotifications = () => useContext(PushNotificationContext);

export const PushNotificationProvider = ({ children }) => {
  const [expoPushToken, setExpoPushToken] = useState(null);

  // Request permission for notifications
  const requestPermissions = async () => {
    if (!Device.isDevice) {
      console.log('Push notifications require a physical device.');
      return { granted: false, error: 'Not a physical device' };
    }

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('User denied push permissions.');
        await AsyncStorage.removeItem(EXPO_PUSH_TOKEN_KEY);
        return { granted: false, error: 'Permission denied' };
      }

      // Create Android channel if needed
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Default',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#667eea',
        });
      }

      return { granted: true };
    } catch (error) {
      console.error('Error requesting push permission:', error);
      return { granted: false, error: error.message };
    }
  };

  // Get Expo push token
  const getExpoPushToken = async () => {
    try {
      const permissionResult = await requestPermissions();
      if (!permissionResult.granted) {
        throw new Error(permissionResult.error || 'Permission not granted');
      }

      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: EXPO_PROJECT_ID,
      });

      if (!tokenData?.data) {
        throw new Error('Failed to get push token');
      }

      const token = tokenData.data;
      console.log('Got Expo push token:', token);
      setExpoPushToken(token);
      
      // Store token locally
      await AsyncStorage.setItem(EXPO_PUSH_TOKEN_KEY, token);
      
      return { success: true, token };
    } catch (error) {
      console.error('Error getting push token:', error);
      return { success: false, error: error.message };
    }
  };

  // Register push token with backend - Simple version
  const registerPushTokenWithBackend = async () => {
    try {
      // Get token from storage or request new one
      let token = await AsyncStorage.getItem(EXPO_PUSH_TOKEN_KEY);
      
      if (!token) {
        const tokenResult = await getExpoPushToken();
        if (!tokenResult.success) {
          return tokenResult;
        }
        token = tokenResult.token;
      }

      // Check if user is authenticated
      const accessToken = await AsyncStorage.getItem(ACCESS_TOKEN);
      if (!accessToken) {
        console.log('User not authenticated, skipping push registration');
        return { success: false, error: 'Not authenticated' };
      }

      console.log('Registering push token with backend:', token);
      const result = await registerPushToken(token);
      
      return { success: true, data: result };
    } catch (error) {
      console.error('Error registering push token:', error);
      return { 
        success: false, 
        error: error.message,
        status: error.response?.status 
      };
    }
  };

  // Unregister push token
  const unregisterPushTokenFromBackend = async () => {
    try {
      const token = await AsyncStorage.getItem(EXPO_PUSH_TOKEN_KEY);
      if (!token) {
        console.log('No push token to unregister');
        return { success: true };
      }

      console.log('Unregistering push token:', token);
      const result = await unregisterPushToken(token);
      
      // Clear local storage
      await AsyncStorage.removeItem(EXPO_PUSH_TOKEN_KEY);
      setExpoPushToken(null);
      
      return { success: true, data: result };
    } catch (error) {
      console.error('Error unregistering push token:', error);
      return { success: false, error: error.message };
    }
  };

  return (
    <PushNotificationContext.Provider
      value={{
        expoPushToken,
        registerPushTokenWithBackend,
        unregisterPushTokenFromBackend,
        getExpoPushToken,
      }}
    >
      {children}
    </PushNotificationContext.Provider>
  );
};