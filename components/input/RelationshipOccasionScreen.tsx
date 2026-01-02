import { View, Text, Pressable, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useEffect, useState } from 'react';
import { useInputCollectionState } from '@/store/useInputCollectionState';
import { loadScreen1Options, type Screen1Options, type OptionItem } from '@/services/supabase';

export function RelationshipOccasionScreen() {
  const { 
    relationship_type, 
    closeness_level, 
    occasion_type,
    occasion_importance,
    setRelationshipType,
    setClosenessLevel,
    setOccasionType,
    setOccasionImportance,
    nextStep,
  } = useInputCollectionState();

  const [options, setOptions] = useState<Screen1Options | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchOptions() {
      try {
        setIsLoading(true);
        setError(null);
        const data = await loadScreen1Options();
        setOptions(data);
        console.log('[RelationshipOccasionScreen] UI RENDERING:', {
          relationships: data.relationships.length,
          closeness: data.closeness.length,
          occasions: data.occasions.length,
          importance: data.importance.length,
        });
      } catch (err) {
        setError('Failed to load options');
        console.error('Error loading Screen 1 options:', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchOptions();
  }, []);

  const canContinue = relationship_type && closeness_level && occasion_type && occasion_importance;

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2D5A3D" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (error || !options) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error || 'Something went wrong'}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Who is this gift for?</Text>
        <Text style={styles.subtitle}>Just the essentials to get started.</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Relationship</Text>
        <View style={styles.optionsGrid}>
          {options.relationships.map((option) => (
            <Pressable
              key={option.code}
              style={[
                styles.optionButton,
                relationship_type === option.code && styles.optionButtonSelected,
              ]}
              onPress={() => setRelationshipType(option.code)}
            >
              <Text style={[
                styles.optionText,
                relationship_type === option.code && styles.optionTextSelected,
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
          {options.closeness.map((option) => (
            <Pressable
              key={option.code}
              style={[
                styles.closenessButton,
                closeness_level === option.code && styles.optionButtonSelected,
              ]}
              onPress={() => setClosenessLevel(option.code)}
            >
              <Text style={[
                styles.optionText,
                closeness_level === option.code && styles.optionTextSelected,
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
          {options.occasions.map((option) => (
            <Pressable
              key={option.code}
              style={[
                styles.optionButton,
                occasion_type === option.code && styles.optionButtonSelected,
              ]}
              onPress={() => setOccasionType(option.code)}
            >
              <Text style={[
                styles.optionText,
                occasion_type === option.code && styles.optionTextSelected,
              ]}>
                {option.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>How important is this occasion?</Text>
        <View style={styles.optionsRow}>
          {options.importance.map((option) => (
            <Pressable
              key={option.code}
              style={[
                styles.importanceButton,
                occasion_importance === option.code && styles.optionButtonSelected,
              ]}
              onPress={() => setOccasionImportance(option.code)}
            >
              <Text style={[
                styles.optionTextSmall,
                occasion_importance === option.code && styles.optionTextSelected,
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    color: '#DC3545',
    textAlign: 'center',
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
  closenessButton: {
    flex: 1,
    minWidth: 80,
    paddingVertical: 14,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    alignItems: 'center',
  },
  importanceButton: {
    flex: 1,
    minWidth: 70,
    paddingVertical: 12,
    paddingHorizontal: 8,
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
  optionTextSmall: {
    fontSize: 13,
    color: '#333333',
    fontWeight: '500',
    textAlign: 'center',
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
