import 'react-native-gesture-handler';
import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator } from 'react-native';

// Screens
import OnboardingScreen from './src/screens/OnboardingScreen';
import MainScreen from './src/screens/MainScreen';

// Services
import DatabaseService from './src/services/DatabaseService';

const Stack = createStackNavigator();

/**
 * SilenceNow - Main App Component
 * 
 * Privacy-First Lärm-Dokumentation für Mietminderungen
 * BGH-konform • DSGVO-konform • §201-StGB-konform
 */

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isOnboarded, setIsOnboarded] = useState(false);

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = async () => {
    try {
      // Initialisiere Datenbank
      await DatabaseService.init();
      
      // Prüfe ob User bereits onboarded ist
      // const onboarded = await AsyncStorage.getItem('onboarded');
      // setIsOnboarded(onboarded === 'true');
      
      setIsLoading(false);
    } catch (error) {
      console.error('App init error:', error);
      setIsLoading(false);
    }
  };

  const handleOnboardingComplete = async (data) => {
    // await AsyncStorage.setItem('onboarded', 'true');
    setIsOnboarded(true);
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar style="auto" />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isOnboarded ? (
          <Stack.Screen name="Onboarding">
            {(props) => (
              <OnboardingScreen 
                {...props} 
                onComplete={handleOnboardingComplete}
              />
            )}
          </Stack.Screen>
        ) : (
          <Stack.Screen name="Main" component={MainScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
