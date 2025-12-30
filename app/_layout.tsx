import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { useConfigState } from '@/store/useConfigState';
import { useGiftMemoryState } from '@/store/useGiftMemoryState';
import 'react-native-reanimated';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { loadConfig } = useConfigState();
  const { initialize: initializeMemory } = useGiftMemoryState();

  useEffect(() => {
    Promise.all([
      loadConfig(),
      initializeMemory(),
    ]).finally(() => {
      SplashScreen.hideAsync();
    });
  }, []);

  return (
    <>
      <StatusBar style="auto" />
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      />
    </>
  );
}
