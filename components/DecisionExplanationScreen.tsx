import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DirectionCard } from './DirectionCard';
import { useDecisionState } from '../store/useDecisionState';
import type { DecisionDirection } from '../types/decision';

interface DecisionExplanationScreenProps {
  onDirectionSelected?: () => void;
}

export function DecisionExplanationScreen({ onDirectionSelected }: DecisionExplanationScreenProps) {
  const { decisionResult, selectDirection } = useDecisionState();
  
  if (!decisionResult) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No decision available yet.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const explanations = decisionResult.explanationByDirection;
  const directions: DecisionDirection[] = ['safe', 'emotional', 'bold'];

  const handleSelect = (direction: DecisionDirection) => {
    selectDirection(direction);
    onDirectionSelected?.();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>How we thought this through for you</Text>
          <Text style={styles.subtitle}>
            Based on your relationship, occasion, and preferences.
          </Text>
        </View>
        
        <View style={styles.cardsContainer}>
          {directions.map((direction) => (
            <DirectionCard
              key={direction}
              direction={direction}
              explanation={explanations[direction]}
              onSelect={handleSelect}
            />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  header: {
    paddingTop: 24,
    paddingBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
    lineHeight: 34,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 24,
  },
  cardsContainer: {
    gap: 0,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
  },
});
