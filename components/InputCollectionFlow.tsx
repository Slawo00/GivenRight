import { View, StyleSheet } from 'react-native';
import { useInputCollectionState } from '@/store/useInputCollectionState';
import { 
  RelationshipOccasionScreen,
  LifeStageScreen,
  ThePersonScreen, 
  BoundariesBudgetScreen, 
  PracticalConstraintsScreen 
} from './input';
import { runDecisionEngine } from '@/services/decisionEngine';

interface InputCollectionFlowProps {
  onComplete: (decisionResult: ReturnType<typeof runDecisionEngine>['result']) => void;
}

export function InputCollectionFlow({ onComplete }: InputCollectionFlowProps) {
  const { step, getDecisionContext } = useInputCollectionState();

  const handlePracticalComplete = () => {
    const context = getDecisionContext();
    if (!context) {
      console.error('DecisionContext is incomplete');
      return;
    }

    const { result } = runDecisionEngine(context);
    onComplete(result);
  };

  const renderScreen = () => {
    switch (step) {
      case 'relationship_occasion':
        return <RelationshipOccasionScreen />;
      case 'life_stage':
        return <LifeStageScreen />;
      case 'the_person':
        return <ThePersonScreen />;
      case 'boundaries_budget':
        return <BoundariesBudgetScreen />;
      case 'practical_constraints':
        return <PracticalConstraintsScreen onComplete={handlePracticalComplete} />;
      case 'intent_locked':
        return null;
      default:
        return <RelationshipOccasionScreen />;
    }
  };

  return (
    <View style={styles.container}>
      {renderScreen()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
