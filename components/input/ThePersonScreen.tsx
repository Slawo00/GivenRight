import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { useInputCollectionState } from '@/store/useInputCollectionState';
import type { PersonalityTrait, SurpriseTolerance } from '@/services/decisionEngine/types';

const PERSONALITY_OPTIONS: { value: PersonalityTrait; label: string }[] = [
  { value: 'practical', label: 'Practical' },
  { value: 'sentimental', label: 'Sentimental' },
  { value: 'creative', label: 'Creative' },
  { value: 'minimalist', label: 'Minimalist' },
  { value: 'adventurous', label: 'Expressive' },
];

const SURPRISE_OPTIONS: { value: SurpriseTolerance; label: string }[] = [
  { value: 'low', label: 'Prefers safe choices' },
  { value: 'medium', label: 'Enjoys a thoughtful surprise' },
  { value: 'high', label: 'Loves bold surprises' },
];

export function ThePersonScreen() {
  const { 
    personality_traits,
    surprise_tolerance,
    togglePersonalityTrait,
    setSurpriseTolerance,
    nextStep,
  } = useInputCollectionState();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Tell us a bit about them</Text>
        <Text style={styles.subtitle}>There's no right or wrong here.</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>What are they like?</Text>
        <Text style={styles.hint}>Select all that apply</Text>
        <View style={styles.optionsGrid}>
          {PERSONALITY_OPTIONS.map((option) => (
            <Pressable
              key={option.value}
              style={[
                styles.optionButton,
                personality_traits.includes(option.value) && styles.optionButtonSelected,
              ]}
              onPress={() => togglePersonalityTrait(option.value)}
            >
              <Text style={[
                styles.optionText,
                personality_traits.includes(option.value) && styles.optionTextSelected,
              ]}>
                {option.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Surprise tolerance</Text>
        <View style={styles.optionsColumn}>
          {SURPRISE_OPTIONS.map((option) => (
            <Pressable
              key={option.value}
              style={[
                styles.surpriseButton,
                surprise_tolerance === option.value && styles.optionButtonSelected,
              ]}
              onPress={() => setSurpriseTolerance(option.value)}
            >
              <Text style={[
                styles.optionText,
                surprise_tolerance === option.value && styles.optionTextSelected,
              ]}>
                {option.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <Pressable
        style={styles.continueButton}
        onPress={() => nextStep()}
      >
        <Text style={styles.continueButtonText}>Continue</Text>
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
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  hint: {
    fontSize: 13,
    color: '#999999',
    marginBottom: 12,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  optionsColumn: {
    gap: 10,
  },
  optionButton: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  surpriseButton: {
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
  continueButton: {
    backgroundColor: '#2D5A3D',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  continueButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
