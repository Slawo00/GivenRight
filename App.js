import React, { useState } from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  View,
  Alert,
} from 'react-native';

import PersonalityInputForm from './src/components/PersonalityInputForm';
import ConfidenceScoreComponent from './src/components/ConfidenceScoreComponent';
import GiftRecommendationsScreen from './src/components/GiftRecommendationsScreen';

const App = () => {
  const [currentScreen, setCurrentScreen] = useState('form'); // 'form', 'analysis', 'recommendations'
  const [userInputs, setUserInputs] = useState(null);
  const [confidenceScore, setConfidenceScore] = useState(0);
  const [scoreBreakdown, setScoreBreakdown] = useState({});

  const handleFormSubmit = (formData) => {
    console.log('Form submitted with data:', formData);
    setUserInputs(formData);
    setCurrentScreen('analysis');
  };

  const handleScoreCalculated = (score, breakdown) => {
    console.log('Confidence score calculated:', score, breakdown);
    setConfidenceScore(score);
    setScoreBreakdown(breakdown);
    
    // Auto-advance to recommendations after 2 seconds
    setTimeout(() => {
      setCurrentScreen('recommendations');
    }, 2000);
  };

  const resetApp = () => {
    setCurrentScreen('form');
    setUserInputs(null);
    setConfidenceScore(0);
    setScoreBreakdown({});
  };

  const renderCurrentScreen = () => {
    switch (currentScreen) {
      case 'form':
        return (
          <PersonalityInputForm 
            onFormSubmit={handleFormSubmit}
            initialData={userInputs}
          />
        );
      
      case 'analysis':
        return (
          <View style={styles.analysisContainer}>
            <ConfidenceScoreComponent
              userInputs={userInputs}
              onScoreCalculated={handleScoreCalculated}
            />
          </View>
        );
      
      case 'recommendations':
        return (
          <GiftRecommendationsScreen
            userInputs={userInputs}
            confidenceScore={confidenceScore}
            scoreBreakdown={scoreBreakdown}
            onReset={resetApp}
          />
        );
      
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar 
        barStyle="dark-content" 
        backgroundColor="#ffffff"
      />
      {renderCurrentScreen()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  analysisContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
});

export default App;