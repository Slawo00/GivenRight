import { View, Text, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DebugPanel } from '@/components/DebugPanel';
import { DecisionExplanationScreen } from '@/components/DecisionExplanationScreen';
import { ObjectPatternSelectionScreen } from '@/components/ObjectPatternSelectionScreen';
import { useDecisionState } from '@/store/useDecisionState';
import type { ObjectPattern } from '@/services/supabase/objectPatternService';

export default function HomeScreen() {
  const { step, advanceStep, runTestScenario, selectPattern, selectedPattern, resetDecision } = useDecisionState();

  const handleStartDemo = () => {
    runTestScenario({
      relationship: {
        type: 'partner',
        closeness: 5,
        emotionalStyle: ['emotional'],
        surpriseTolerance: 'high',
      },
      occasion: 'birthday',
      budget: '100_250',
    });
  };

  const handleDirectionSelected = () => {
    advanceStep('object_class_selection');
  };

  const handlePatternSelected = (pattern: ObjectPattern) => {
    selectPattern(pattern);
  };

  if (step === 'decision_ready') {
    return (
      <>
        <DecisionExplanationScreen 
          onDirectionSelected={handleDirectionSelected}
        />
        <DebugPanel />
      </>
    );
  }

  if (step === 'direction_selected' || step === 'object_class_selection') {
    return (
      <>
        <ObjectPatternSelectionScreen 
          onPatternSelected={handlePatternSelected}
        />
        <DebugPanel />
      </>
    );
  }

  if (step === 'completed') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>GivenRight</Text>
          <Text style={styles.subtitle}>Pattern selected!</Text>
          
          {selectedPattern && (
            <View style={styles.selectedPatternCard}>
              <Text style={styles.patternIcon}>{selectedPattern.icon}</Text>
              <Text style={styles.patternTitle}>{selectedPattern.title}</Text>
              <Text style={styles.patternDescription}>{selectedPattern.description}</Text>
            </View>
          )}
          
          <Text style={styles.nextStep}>Next: Commerce Layer (STEP 0.7)</Text>
          <Pressable style={styles.resetButton} onPress={resetDecision}>
            <Text style={styles.resetButtonText}>Start Over</Text>
          </Pressable>
        </View>
        <DebugPanel />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>GivenRight</Text>
        <Text style={styles.subtitle}>Find the perfect gift</Text>
        <Text style={styles.description}>
          We help you choose meaningful gifts based on your relationship and the occasion.
        </Text>
        
        <Pressable 
          style={({ pressed }) => [
            styles.startButton,
            pressed && styles.startButtonPressed
          ]}
          onPress={handleStartDemo}
        >
          <Text style={styles.startButtonText}>Start Decision</Text>
        </Pressable>
        
        <Text style={styles.demoNote}>
          Demo: Partner Birthday Gift
        </Text>
      </View>
      <DebugPanel />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#6B7280',
    marginBottom: 24,
  },
  description: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
    maxWidth: 300,
  },
  startButton: {
    backgroundColor: '#2D6A4F',
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 12,
    shadowColor: '#2D6A4F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  startButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  demoNote: {
    marginTop: 16,
    fontSize: 13,
    color: '#9CA3AF',
  },
  nextStep: {
    fontSize: 14,
    color: '#2D6A4F',
    marginTop: 16,
    fontWeight: '500',
  },
  resetButton: {
    marginTop: 24,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
  resetButtonText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '500',
  },
  selectedPatternCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    marginVertical: 24,
    alignItems: 'center',
    maxWidth: 320,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  patternIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  patternTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  patternDescription: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
});
