import { View, Text, Pressable, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useInputCollectionState } from '@/store/useInputCollectionState';
import { useState, useEffect } from 'react';
import { loadScreen4Options, clearScreen4OptionsCache, type OptionItem, type Screen4Options } from '@/services/supabase/screen4OptionsService';

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

  const [options, setOptions] = useState<Screen4Options | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchOptions() {
      try {
        clearScreen4OptionsCache();
        const loaded = await loadScreen4Options();
        setOptions(loaded);
      } catch (err) {
        setError('Failed to load options');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchOptions();
  }, []);

  const handleComplete = () => {
    lockIntent();
    onComplete();
  };

  const canContinue = gift_type_preference !== null && time_constraint !== null;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2D5A3D" />
        <Text style={styles.loadingText}>Loading options...</Text>
      </View>
    );
  }

  if (error || !options) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>{error || 'Failed to load options'}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Let's make sure this works</Text>
        <Text style={styles.subtitle}>Just a couple of practical details.</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>What kind of gift?</Text>
        <View style={styles.optionsColumn}>
          {options.giftTypes.map((option) => (
            <Pressable
              key={option.code}
              style={[
                styles.optionButton,
                gift_type_preference === option.code && styles.optionButtonSelected,
              ]}
              onPress={() => setGiftTypePreference(option.code)}
            >
              <Text style={[
                styles.optionText,
                gift_type_preference === option.code && styles.optionTextSelected,
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
          {options.timeConstraints.map((option) => (
            <Pressable
              key={option.code}
              style={[
                styles.optionButton,
                time_constraint === option.code && styles.optionButtonSelected,
              ]}
              onPress={() => setTimeConstraint(option.code)}
            >
              <Text style={[
                styles.optionText,
                time_constraint === option.code && styles.optionTextSelected,
              ]}>
                {option.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <Pressable
        style={[styles.completeButton, !canContinue && styles.completeButtonDisabled]}
        onPress={handleComplete}
        disabled={!canContinue}
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
  errorText: {
    fontSize: 16,
    color: '#CC0000',
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
  completeButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  completeButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
