import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { useInputCollectionState } from '@/store/useInputCollectionState';
import type { GiftTypePreference, TimeConstraint } from '@/services/decisionEngine/types';

const GIFT_TYPE_OPTIONS: { value: GiftTypePreference; label: string }[] = [
  { value: 'physical', label: 'Something tangible' },
  { value: 'experience', label: 'An experience' },
  { value: 'no_preference', label: 'Open to both' },
];

const TIME_OPTIONS: { value: TimeConstraint; label: string }[] = [
  { value: 'flexible', label: 'Plenty of time' },
  { value: 'normal', label: '1–2 weeks' },
  { value: 'urgent', label: 'Very soon' },
];

interface PracticalConstraintsScreenProps {
  onComplete: () => void;
}

export function PracticalConstraintsScreen({ onComplete }: PracticalConstraintsScreenProps) {
  const { 
    gift_type_preference,
    time_constraint,
    setGiftTypePreference,
    setTimeConstraint,
    lockIntent,
  } = useInputCollectionState();

  const handleComplete = () => {
    lockIntent();
    onComplete();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Let's make sure this works</Text>
        <Text style={styles.subtitle}>Just a couple of practical details.</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>What kind of gift?</Text>
        <View style={styles.optionsColumn}>
          {GIFT_TYPE_OPTIONS.map((option) => (
            <Pressable
              key={option.value}
              style={[
                styles.optionButton,
                gift_type_preference === option.value && styles.optionButtonSelected,
              ]}
              onPress={() => setGiftTypePreference(option.value)}
            >
              <Text style={[
                styles.optionText,
                gift_type_preference === option.value && styles.optionTextSelected,
              ]}>
                {option.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>How soon do you need it?</Text>
        <View style={styles.optionsColumn}>
          {TIME_OPTIONS.map((option) => (
            <Pressable
              key={option.value}
              style={[
                styles.optionButton,
                time_constraint === option.value && styles.optionButtonSelected,
              ]}
              onPress={() => setTimeConstraint(option.value)}
            >
              <Text style={[
                styles.optionText,
                time_constraint === option.value && styles.optionTextSelected,
              ]}>
                {option.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <Pressable
        style={styles.completeButton}
        onPress={handleComplete}
      >
        <Text style={styles.completeButtonText}>Find the right gift</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  content: {
    padding: 24,
    paddingBottom: 48,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
  },
  section: {
    marginBottom: 28,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#888888',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  optionsColumn: {
    gap: 10,
  },
  optionButton: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  optionButtonSelected: {
    backgroundColor: '#2D5A3D',
    borderColor: '#2D5A3D',
  },
  optionText: {
    fontSize: 15,
    color: '#333333',
    fontWeight: '500',
  },
  optionTextSelected: {
    color: '#FFFFFF',
  },
  completeButton: {
    backgroundColor: '#1A5A3D',
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
  },
  completeButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
