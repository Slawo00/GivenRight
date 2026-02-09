import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';

const ConfidenceScoreComponent = ({ userInputs, onScoreCalculated }) => {
  const [confidenceScore, setConfidenceScore] = useState(0);
  const [scoreBreakdown, setScoreBreakdown] = useState({});
  const [animatedValue] = useState(new Animated.Value(0));

  useEffect(() => {
    calculateConfidenceScore();
  }, [userInputs]);

  const calculateConfidenceScore = () => {
    let totalScore = 0;
    let breakdown = {};

    // Personality Match Score (max 25 points)
    const personalityScore = calculatePersonalityMatch(userInputs.personality, userInputs.interests);
    totalScore += personalityScore;
    breakdown.personality = personalityScore;

    // Relationship Depth Score (max 20 points)
    const relationshipScore = calculateRelationshipScore(userInputs.relationship);
    totalScore += relationshipScore;
    breakdown.relationship = relationshipScore;

    // Budget Alignment Score (max 15 points)
    const budgetScore = calculateBudgetScore(userInputs.budget, userInputs.occasion);
    totalScore += budgetScore;
    breakdown.budget = budgetScore;

    // Occasion Appropriateness Score (max 20 points)
    const occasionScore = calculateOccasionScore(userInputs.occasion, userInputs.timing);
    totalScore += occasionScore;
    breakdown.occasion = occasionScore;

    // Personal Preference Match Score (max 20 points)
    const preferenceScore = calculatePreferenceScore(userInputs.preferences, userInputs.style);
    totalScore += preferenceScore;
    breakdown.preference = preferenceScore;

    setConfidenceScore(Math.min(100, totalScore));
    setScoreBreakdown(breakdown);
    
    // Animate score display
    Animated.timing(animatedValue, {
      toValue: totalScore,
      duration: 1500,
      useNativeDriver: false,
    }).start();

    // Pass score back to parent
    if (onScoreCalculated) {
      onScoreCalculated(totalScore, breakdown);
    }
  };

  const calculatePersonalityMatch = (personality, interests) => {
    if (!personality || !interests) return 0;
    
    // Enhanced personality scoring logic
    let score = 0;
    
    // Base personality alignment
    if (personality.type === 'extrovert' && interests.includes('social')) score += 8;
    if (personality.type === 'introvert' && interests.includes('solitary')) score += 8;
    
    // Interest depth scoring
    const interestDepth = interests.length;
    if (interestDepth >= 5) score += 7;
    else if (interestDepth >= 3) score += 5;
    else if (interestDepth >= 1) score += 3;
    
    // Creative vs practical scoring
    if (personality.creative && interests.includes('arts')) score += 5;
    if (personality.practical && interests.includes('tools')) score += 5;
    
    return Math.min(25, score);
  };

  const calculateRelationshipScore = (relationship) => {
    if (!relationship) return 0;
    
    const relationshipScores = {
      'partner': 20,
      'family_close': 18,
      'best_friend': 16,
      'good_friend': 14,
      'colleague': 10,
      'acquaintance': 6,
      'unknown': 2
    };
    
    return relationshipScores[relationship.type] || 0;
  };

  const calculateBudgetScore = (budget, occasion) => {
    if (!budget || !occasion) return 0;
    
    let score = 0;
    const budgetRange = budget.max - budget.min;
    
    // Budget clarity bonus
    if (budgetRange <= 20) score += 8; // Very specific budget
    else if (budgetRange <= 50) score += 6; // Good budget range
    else score += 3; // Broad budget range
    
    // Occasion-budget alignment
    const occasionBudgetFit = {
      'birthday': budget.max >= 30 ? 7 : 4,
      'anniversary': budget.max >= 50 ? 7 : 4,
      'wedding': budget.max >= 100 ? 7 : 4,
      'graduation': budget.max >= 40 ? 7 : 4,
      'christmas': budget.max >= 25 ? 7 : 4,
      'just_because': budget.max >= 15 ? 7 : 4
    };
    
    score += occasionBudgetFit[occasion.type] || 0;
    
    return Math.min(15, score);
  };

  const calculateOccasionScore = (occasion, timing) => {
    if (!occasion) return 0;
    
    let score = 0;
    
    // Occasion specificity
    if (occasion.type && occasion.description) score += 10;
    else if (occasion.type) score += 6;
    
    // Timing urgency bonus
    if (timing && timing.urgency) {
      const urgencyScores = {
        'urgent': 5, // Today/tomorrow
        'soon': 7,   // This week
        'planned': 10, // Next month+
        'flexible': 3  // Anytime
      };
      score += urgencyScores[timing.urgency] || 0;
    }
    
    // Special occasion bonuses
    const specialOccasions = ['anniversary', 'wedding', 'graduation', 'new_baby'];
    if (specialOccasions.includes(occasion.type)) score += 5;
    
    return Math.min(20, score);
  };

  const calculatePreferenceScore = (preferences, style) => {
    if (!preferences && !style) return 0;
    
    let score = 0;
    
    // Preference specificity
    if (preferences && preferences.length > 0) {
      score += Math.min(10, preferences.length * 2);
    }
    
    // Style consistency
    if (style) {
      if (style.aesthetic && style.practical !== undefined) score += 5;
      if (style.colors && style.colors.length > 0) score += 3;
      if (style.materials && style.materials.length > 0) score += 2;
    }
    
    return Math.min(20, score);
  };

  const getScoreColor = (score) => {
    if (score >= 80) return '#4CAF50'; // Green
    if (score >= 60) return '#FF9800'; // Orange
    if (score >= 40) return '#FFC107'; // Yellow
    return '#F44336'; // Red
  };

  const getScoreText = (score) => {
    if (score >= 80) return 'Excellent Match';
    if (score >= 60) return 'Good Match';
    if (score >= 40) return 'Fair Match';
    return 'Needs More Info';
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Gift Confidence Score</Text>
      
      <View style={styles.scoreContainer}>
        <Animated.Text style={[
          styles.scoreText,
          { color: getScoreColor(confidenceScore) }
        ]}>
          {Math.round(confidenceScore)}%
        </Animated.Text>
        <Text style={[styles.scoreLabel, { color: getScoreColor(confidenceScore) }]}>
          {getScoreText(confidenceScore)}
        </Text>
      </View>

      <View style={styles.breakdownContainer}>
        <Text style={styles.breakdownTitle}>Score Breakdown:</Text>
        {Object.entries(scoreBreakdown).map(([category, score]) => (
          <View key={category} style={styles.breakdownRow}>
            <Text style={styles.categoryText}>
              {category.charAt(0).toUpperCase() + category.slice(1)}:
            </Text>
            <Text style={styles.scoreValue}>{Math.round(score)} pts</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginVertical: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
    color: '#333',
  },
  scoreContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  scoreText: {
    fontSize: 48,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  scoreLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  breakdownContainer: {
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 15,
  },
  breakdownTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#555',
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  categoryText: {
    fontSize: 14,
    color: '#666',
  },
  scoreValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
});

export default ConfidenceScoreComponent;