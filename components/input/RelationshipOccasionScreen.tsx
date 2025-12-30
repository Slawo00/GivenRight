import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { useInputCollectionState } from '@/store/useInputCollectionState';
import type { RelationshipType, OccasionType } from '@/services/decisionEngine/types';

const RELATIONSHIP_OPTIONS: { value: RelationshipType; label: string }[] = [
  { value: 'partner', label: 'Partner' },
  { value: 'parent', label: 'Close Family' },
  { value: 'friend', label: 'Friend' },
  { value: 'colleague', label: 'Colleague' },
];

const CLOSENESS_OPTIONS: { value: 1 | 2 | 3 | 4 | 5; label: string }[] = [
  { value: 2, label: 'Not very close' },
  { value: 3, label: 'Close' },
  { value: 5, label: 'Very close' },
];

const OCCASION_OPTIONS: { value: OccasionType; label: string }[] = [
  { value: 'birthday', label: 'Birthday' },
  { value: 'anniversary', label: 'Anniversary' },
  { value: 'christmas', label: 'Holiday' },
  { value: 'thank_you', label: 'Thank You' },
  { value: 'other', label: 'Other' },
];

export function RelationshipOccasionScreen() {
  const { 
    relationship_type, 
    closeness_level, 
    occasion_type,
    setRelationshipType,
    setClosenessLevel,
    setOccasionType,
    nextStep,
  } = useInputCollectionState();

  const canContinue = relationship_type && occasion_type;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Who is this gift for?</Text>
        <Text style={styles.subtitle}>Just the essentials to get started.</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Relationship</Text>
        <View style={styles.optionsGrid}>
          {RELATIONSHIP_OPTIONS.map((option) => (
            <Pressable
              key={option.value}
              style={[
                styles.optionButton,
                relationship_type === option.value && styles.optionButtonSelected,
              ]}
              onPress={() => setRelationshipType(option.value)}
            >
              <Text style={[
                styles.optionText,
                relationship_type === option.value && styles.optionTextSelected,
              ]}>
                {option.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>How close are you?</Text>
        <View style={styles.optionsRow}>
          {CLOSENESS_OPTIONS.map((option) => (
            <Pressable
              key={option.value}
              style={[
                styles.closenessButton,
                closeness_level === option.value && styles.optionButtonSelected,
              ]}
              onPress={() => setClosenessLevel(option.value)}
            >
              <Text style={[
                styles.optionText,
                closeness_level === option.value && styles.optionTextSelected,
              ]}>
                {option.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Occasion</Text>
        <View style={styles.optionsGrid}>
          {OCCASION_OPTIONS.map((option) => (
            <Pressable
              key={option.value}
              style={[
                styles.optionButton,
                occasion_type === option.value && styles.optionButtonSelected,
              ]}
              onPress={() => setOccasionType(option.value)}
            >
              <Text style={[
                styles.optionText,
                occasion_type === option.value && styles.optionTextSelected,
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
  optionsRow: {
    flexDirection: 'row',
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
  closenessButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    alignItems: 'center',
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
  continueButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  continueButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
