import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  ActivityIndicator,
} from 'react-native';

import PersonalityInputForm from '../components/PersonalityInputForm';
import ConfidenceScoreComponent from '../components/ConfidenceScoreComponent';
import GiftRecommendationsScreen from '../components/GiftRecommendationsScreen';
import { GiftFlowController } from '../services/giftFlowController';

const { width } = Dimensions.get('window');

const STEPS = {
  INPUT: 0,
  SCORING: 1,
  RECOMMENDATIONS: 2,
};

const NewGiftScreen = ({ navigation }) => {
  const [currentStep, setCurrentStep] = useState(STEPS.INPUT);
  const [formData, setFormData] = useState(null);
  const [confidenceScore, setConfidenceScore] = useState(0);
  const [scoreBreakdown, setScoreBreakdown] = useState({});
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const slideAnim = useRef(new Animated.Value(0)).current;
  const flowController = useRef(new GiftFlowController()).current;

  const animateToStep = (step) => {
    Animated.timing(slideAnim, {
      toValue: -step * width,
      duration: 350,
      useNativeDriver: true,
    }).start();
  };

  const handleFormSubmit = async (data) => {
    setFormData(data);
    setLoading(true);
    setError(null);
    setCurrentStep(STEPS.SCORING);
    animateToStep(STEPS.SCORING);

    try {
      // Process input + calculate score
      await flowController.processInput(data);
      const scoreResult = await flowController.calculateScore(data);
      
      setConfidenceScore(scoreResult.score);
      setScoreBreakdown(scoreResult.breakdown);
      
      // Auto-advance to recommendations after score animation
      setTimeout(async () => {
        try {
          const recResult = await flowController.getRecommendations(data, scoreResult.score);
          setRecommendations(recResult.recommendations);
          setCurrentStep(STEPS.RECOMMENDATIONS);
          animateToStep(STEPS.RECOMMENDATIONS);
        } catch (recError) {
          console.error('Recommendation error:', recError);
          setError('Could not generate recommendations. Please try again.');
        } finally {
          setLoading(false);
        }
      }, 2000);
    } catch (scoreError) {
      console.error('Scoring error:', scoreError);
      setLoading(false);
      setError('Could not calculate score. Please try again.');
    }
  };

  const handleScoreCalculated = (score, breakdown) => {
    setConfidenceScore(score);
    setScoreBreakdown(breakdown);
  };

  const handleReset = () => {
    setCurrentStep(STEPS.INPUT);
    setFormData(null);
    setConfidenceScore(0);
    setScoreBreakdown({});
    setRecommendations([]);
    setError(null);
    animateToStep(STEPS.INPUT);
  };

  const StepIndicator = () => (
    <View style={styles.stepIndicator}>
      {['Tell Us', 'Score', 'Gifts'].map((label, index) => (
        <View key={label} style={styles.stepItem}>
          <View style={[
            styles.stepDot,
            currentStep >= index && styles.stepDotActive,
            currentStep === index && styles.stepDotCurrent,
          ]}>
            <Text style={[
              styles.stepNumber,
              currentStep >= index && styles.stepNumberActive,
            ]}>
              {currentStep > index ? '✓' : index + 1}
            </Text>
          </View>
          <Text style={[
            styles.stepLabel,
            currentStep >= index && styles.stepLabelActive,
          ]}>
            {label}
          </Text>
          {index < 2 && (
            <View style={[
              styles.stepLine,
              currentStep > index && styles.stepLineActive,
            ]} />
          )}
        </View>
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      <StepIndicator />
      
      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <Animated.View
        style={[
          styles.slidingContainer,
          { transform: [{ translateX: slideAnim }] },
        ]}
      >
        {/* Step 1: Input Form */}
        <View style={[styles.stepScreen, { width }]}>
          <PersonalityInputForm
            onFormSubmit={handleFormSubmit}
            initialData={formData}
          />
        </View>

        {/* Step 2: Confidence Score */}
        <View style={[styles.stepScreen, { width }]}>
          <View style={styles.scoreContainer}>
            {loading && currentStep === STEPS.SCORING ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#6c63ff" />
                <Text style={styles.loadingText}>Analyzing your inputs...</Text>
              </View>
            ) : (
              <ConfidenceScoreComponent
                userInputs={formData || {}}
                onScoreCalculated={handleScoreCalculated}
              />
            )}
          </View>
        </View>

        {/* Step 3: Recommendations */}
        <View style={[styles.stepScreen, { width }]}>
          <GiftRecommendationsScreen
            userInputs={formData || {}}
            confidenceScore={confidenceScore}
            recommendations={recommendations}
            onReset={handleReset}
          />
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 30,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepDotActive: {
    backgroundColor: '#6c63ff',
  },
  stepDotCurrent: {
    backgroundColor: '#6c63ff',
    shadowColor: '#6c63ff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 4,
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#999',
  },
  stepNumberActive: {
    color: '#ffffff',
  },
  stepLabel: {
    fontSize: 12,
    color: '#999',
    marginLeft: 6,
    marginRight: 6,
  },
  stepLabelActive: {
    color: '#6c63ff',
    fontWeight: '600',
  },
  stepLine: {
    width: 30,
    height: 2,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 4,
  },
  stepLineActive: {
    backgroundColor: '#6c63ff',
  },
  slidingContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  stepScreen: {
    flex: 1,
  },
  scoreContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#666',
  },
  errorBanner: {
    backgroundColor: '#ff4444',
    padding: 12,
    alignItems: 'center',
  },
  errorText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default NewGiftScreen;