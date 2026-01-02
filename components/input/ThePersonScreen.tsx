import { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useInputCollectionState } from '@/store/useInputCollectionState';
import { loadScreen2Options, Screen2Options } from '@/services/supabase/screen2OptionsService';

export function ThePersonScreen() {
  const { 
    personality_traits,
    surprise_tolerance,
    togglePersonalityTrait,
    setSurpriseTolerance,
    nextStep,
  } = useInputCollectionState();

  const [options, setOptions] = useState<Screen2Options | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchOptions() {
      try {
        setIsLoading(true);
        setError(null);
        const data = await loadScreen2Options();
        setOptions(data);
      } catch (err) {
        setError('Failed to load options');
        console.error('Error loading Screen 2 options:', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchOptions();
  }, []);

  const canContinue = surprise_tolerance !== null;

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
        <Pressable style={styles.retryButton} onPress={() => setIsLoading(true)}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </Pressable>
      </View>
    );
  }

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
          {options.personalityTraits.map((option) => (
            <Pressable
              key={option.code}
              style={[
                styles.optionButton,
                personality_traits.includes(option.code) && styles.optionButtonSelected,
              ]}
              onPress={() => togglePersonalityTrait(option.code)}
            >
              <Text style={[
                styles.optionText,
                personality_traits.includes(option.code) && styles.optionTextSelected,
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
          {options.surpriseTolerance.map((option) => (
            <Pressable
              key={option.code}
              style={[
                styles.surpriseButton,
                surprise_tolerance === option.code && styles.optionButtonSelected,
              ]}
              onPress={() => setSurpriseTolerance(option.code)}
            >
              <Text style={[
                styles.optionText,
                surprise_tolerance === option.code && styles.optionTextSelected,
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
    padding: 24,
  },
  loadingText: {
    marginTop: 16,
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
    color: '#CC4444',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#2D5A3D',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
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
  continueButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  continueButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
