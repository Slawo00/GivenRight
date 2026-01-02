import { View, Text, Pressable, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useEffect, useState } from 'react';
import { useInputCollectionState } from '@/store/useInputCollectionState';
import { loadScreen1bOptions, type Screen1bOptions, type OptionItem } from '@/services/supabase/screen1bOptionsService';

export function LifeStageScreen() {
  const { 
    life_stage_code,
    setLifeStageCode,
    nextStep,
  } = useInputCollectionState();

  const [options, setOptions] = useState<Screen1bOptions | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchOptions() {
      try {
        setIsLoading(true);
        setError(null);
        const data = await loadScreen1bOptions();
        setOptions(data);
      } catch (err) {
        setError('Failed to load options');
        console.error('Error loading Screen 1b options:', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchOptions();
  }, []);

  const canContinue = life_stage_code !== null;

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
        <Text style={styles.title}>How old are they?</Text>
        <Text style={styles.subtitle}>Just to make sure the gift is appropriate.</Text>
      </View>

      <View style={styles.section}>
        <View style={styles.optionsColumn}>
          {options.lifeStages.map((option) => (
            <Pressable
              key={option.code}
              style={[
                styles.optionButton,
                life_stage_code === option.code && styles.optionButtonSelected,
              ]}
              onPress={() => setLifeStageCode(option.code)}
            >
              <Text style={[
                styles.optionText,
                life_stage_code === option.code && styles.optionTextSelected,
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
  optionsColumn: {
    flexDirection: 'column',
    gap: 12,
  },
  optionButton: {
    paddingVertical: 18,
    paddingHorizontal: 24,
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
    fontSize: 17,
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
