import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Platform } from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';
import { initializeApiUrl } from './src/config/api';

export default function App() {
  useEffect(() => {
    // Initialize API URL on app start
    initializeApiUrl().catch(console.error);
  }, []);

  return (
    <>
      <AppNavigator />
      <StatusBar 
        style="dark" 
        backgroundColor="#F8FAFC"
        translucent={Platform.OS === 'android'}
      />
    </>
  );
}
