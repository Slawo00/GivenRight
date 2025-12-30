import { View, Text, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DebugPanel } from '@/components/DebugPanel';
import { InputCollectionFlow } from '@/components/InputCollectionFlow';
import { EnrichedDecisionScreen } from '@/components/EnrichedDecisionScreen';
import { ObjectPatternSelectionScreen } from '@/components/ObjectPatternSelectionScreen';
import { PatternExplanationScreen } from '@/components/PatternExplanationScreen';
import { CommercePreviewScreen } from '@/components/CommercePreviewScreen';
import { useDecisionState } from '@/store/useDecisionState';
import { useInputCollectionState } from '@/store/useInputCollectionState';
import { useEnrichmentState } from '@/store/useEnrichmentState';
import type { ObjectPattern } from '@/services/supabase/objectPatternService';
import type { DecisionResult as EngineDecisionResult, ConfidenceType } from '@/services/decisionEngine/types';

export default function HomeScreen() {
  const { step, engineDecisionResult, advanceStep, advanceToCommerce, selectPattern, selectedPattern, resetDecision, setDecisionResultFromEngine, selectDirection } = useDecisionState();
  const { step: inputStep, goToStep, resetCollection } = useInputCollectionState();
  const { clearEnrichment } = useEnrichmentState();

  const handleStartDecision = () => {
    resetCollection();
    clearEnrichment();
    goToStep('relationship_occasion');
  };

  const handleInputComplete = (decisionResult: EngineDecisionResult) => {
    setDecisionResultFromEngine(decisionResult);
    advanceStep('decision_ready');
  };

  const handleDirectionSelected = (direction: ConfidenceType) => {
    selectDirection(direction.toLowerCase() as 'safe' | 'emotional' | 'bold');
    advanceStep('object_class_selection');
  };

  const handleBackFromDecision = () => {
    resetDecision();
    resetCollection();
    clearEnrichment();
  };

  const handlePatternSelected = (pattern: ObjectPattern) => {
    selectPattern(pattern);
  };

  const handlePatternExplanationContinue = () => {
    advanceToCommerce();
  };

  const handleStartOver = () => {
    resetDecision();
    resetCollection();
    clearEnrichment();
  };

  if (inputStep !== 'idle' && inputStep !== 'intent_locked') {
    return (
      <SafeAreaView style={styles.container}>
        <InputCollectionFlow onComplete={handleInputComplete} />
        <DebugPanel />
      </SafeAreaView>
    );
  }

  if (step === 'decision_ready' && engineDecisionResult) {
    return (
      <>
        <EnrichedDecisionScreen 
          decisionResult={engineDecisionResult}
          onDirectionSelected={handleDirectionSelected}
          onBack={handleBackFromDecision}
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

  if (step === 'pattern_explanation' && selectedPattern) {
    return (
      <>
        <PatternExplanationScreen 
          pattern={selectedPattern}
          onContinue={handlePatternExplanationContinue}
        />
        <DebugPanel />
      </>
    );
  }

  if (step === 'commerce_preview') {
    return (
      <>
        <CommercePreviewScreen />
        <DebugPanel />
      </>
    );
  }

  if (step === 'completed' || step === 'completed_with_execution') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>GivenRight</Text>
          <Text style={styles.subtitle}>You're ready to find your gift</Text>
          
          {selectedPattern && (
            <View style={styles.selectedPatternCard}>
              <Text style={styles.patternIcon}>{selectedPattern.icon}</Text>
              <Text style={styles.patternTitle}>{selectedPattern.title}</Text>
              <Text style={styles.patternDescription}>
                You've chosen this direction with confidence.
              </Text>
            </View>
          )}
          
          <Text style={styles.nextStep}>
            {step === 'completed_with_execution' 
              ? 'Journey complete! Gift found.' 
              : 'Ready for next steps.'}
          </Text>
          <Pressable style={styles.resetButton} onPress={handleStartOver}>
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
          onPress={handleStartDecision}
        >
          <Text style={styles.startButtonText}>Start Decision</Text>
        </Pressable>
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
