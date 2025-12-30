import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { useInputCollectionState } from '@/store/useInputCollectionState';
import type { PersonalValue, BudgetRange } from '@/services/decisionEngine/types';

const VALUES_OPTIONS: { value: PersonalValue; label: string }[] = [
  { value: 'sustainability', label: 'Sustainability' },
  { value: 'quality', label: 'Craftsmanship' },
  { value: 'uniqueness', label: 'Experiences over things' },
  { value: 'functionality', label: 'Minimalism' },
];

const NO_GO_OPTIONS = [
  'alcohol',
  'clothing',
  'personal items',
  'generic gifts',
];

const BUDGET_OPTIONS: { value: BudgetRange; label: string }[] = [
  { value: 'under_50', label: 'Under $50' },
  { value: '50_100', label: '$50 – $100' },
  { value: '100_250', label: '$100 – $250' },
  { value: '250_plus', label: 'Flexible' },
];

export function BoundariesBudgetScreen() {
  const { 
    values,
    no_gos,
    budget_range,
    toggleValue,
    toggleNoGo,
    setBudgetRange,
    nextStep,
  } = useInputCollectionState();

  const canContinue = budget_range !== null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Anything to keep in mind?</Text>
        <Text style={styles.subtitle}>You can skip anything you're unsure about.</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Values (optional)</Text>
        <View style={styles.optionsGrid}>
          {VALUES_OPTIONS.map((option) => (
            <Pressable
              key={option.value}
              style={[
                styles.optionButton,
                values.includes(option.value) && styles.optionButtonSelected,
              ]}
              onPress={() => toggleValue(option.value)}
            >
              <Text style={[
                styles.optionText,
                values.includes(option.value) && styles.optionTextSelected,
              ]}>
                {option.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>No-Gos (optional)</Text>
        <View style={styles.optionsGrid}>
          {NO_GO_OPTIONS.map((option) => (
            <Pressable
              key={option}
              style={[
                styles.optionButton,
                no_gos.includes(option) && styles.noGoSelected,
              ]}
              onPress={() => toggleNoGo(option)}
            >
              <Text style={[
                styles.optionText,
                no_gos.includes(option) && styles.noGoTextSelected,
              ]}>
                {option}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Budget</Text>
        <View style={styles.budgetGrid}>
          {BUDGET_OPTIONS.map((option) => (
            <Pressable
              key={option.value}
              style={[
                styles.budgetButton,
                budget_range === option.value && styles.optionButtonSelected,
              ]}
              onPress={() => setBudgetRange(option.value)}
            >
              <Text style={[
                styles.optionText,
                budget_range === option.value && styles.optionTextSelected,
              ]}>
                {option.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <Pressable
        style={[styles.continueButton, !canContinue && styles.continueButtonDisabled]}
        onPress={() => canContinue && nextStep()}
        disabled={!canContinue}
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
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  budgetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
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
  budgetButton: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    minWidth: '45%',
    alignItems: 'center',
  },
  optionButtonSelected: {
    backgroundColor: '#2D5A3D',
    borderColor: '#2D5A3D',
  },
  noGoSelected: {
    backgroundColor: '#DC3545',
    borderColor: '#DC3545',
  },
  optionText: {
    fontSize: 15,
    color: '#333333',
    fontWeight: '500',
  },
  optionTextSelected: {
    color: '#FFFFFF',
  },
  noGoTextSelected: {
    color: '#FFFFFF',
  },
  continueButton: {
    backgroundColor: '#2D5A3D',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  continueButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  continueButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
