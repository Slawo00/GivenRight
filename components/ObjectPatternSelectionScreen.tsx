import { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PatternCard } from './PatternCard';
import { useDecisionState } from '@/store/useDecisionState';
import { useGiftMemoryState } from '@/store/useGiftMemoryState';
import { getObjectPatterns, getDefaultPatterns, type ObjectPattern } from '@/services/supabase/objectPatternService';
import type { DecisionDirection } from '@/types/decision';

const directionTitles: Record<DecisionDirection, string> = {
  safe: 'Safe Patterns',
  emotional: 'Emotional Patterns',
  bold: 'Bold Patterns',
};

const directionSubtitles: Record<DecisionDirection, string> = {
  safe: 'Reliable choices that always land well',
  emotional: 'Gifts that create deeper connections',
  bold: 'Statement pieces that make an impact',
};

interface ObjectPatternSelectionScreenProps {
  onPatternSelected: (pattern: ObjectPattern) => void;
}

export function ObjectPatternSelectionScreen({ onPatternSelected }: ObjectPatternSelectionScreenProps) {
  const { selectedDirection, relationship } = useDecisionState();
  const { isPatternSuppressed, getPatternBoost, setCurrentRelationship, relationshipMemoryActive } = useGiftMemoryState();
  const [patterns, setPatterns] = useState<ObjectPattern[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (relationship && relationshipMemoryActive) {
      setCurrentRelationship({
        userId: "local_user",
        recipientId: `${relationship.type}_default`,
        relationshipType: relationship.type,
      });
    }
  }, [relationship, relationshipMemoryActive]);

  useEffect(() => {
    async function loadPatterns() {
      if (!selectedDirection) {
        const defaults = getDefaultPatterns();
        setPatterns(defaults.safe);
        setLoading(false);
        return;
      }

      try {
        const loadedPatterns = await getObjectPatterns(selectedDirection);
        setPatterns(loadedPatterns);
      } catch {
        const defaults = getDefaultPatterns();
        setPatterns(defaults[selectedDirection]);
      } finally {
        setLoading(false);
      }
    }

    loadPatterns();
  }, [selectedDirection]);

  const direction = selectedDirection || 'safe';

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2D6A4F" />
          <Text style={styles.loadingText}>Loading patterns...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.stepLabel}>Choose your gift type</Text>
          <Text style={styles.title}>{directionTitles[direction]}</Text>
          <Text style={styles.subtitle}>{directionSubtitles[direction]}</Text>
        </View>

        <View style={styles.patternsContainer}>
          {patterns
            .map((pattern) => ({
              pattern,
              suppressed: isPatternSuppressed(pattern.patternKey),
              boost: getPatternBoost(pattern.patternKey),
            }))
            .sort((a, b) => {
              if (a.suppressed && !b.suppressed) return 1;
              if (!a.suppressed && b.suppressed) return -1;
              return b.boost - a.boost;
            })
            .map(({ pattern, suppressed }) => (
              <PatternCard
                key={pattern.patternKey}
                pattern={pattern}
                onSelect={() => onPatternSelected(pattern)}
                dimmed={suppressed}
              />
            ))}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Each pattern leads to curated gift suggestions
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
  },
  stepLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 24,
  },
  patternsContainer: {
    marginBottom: 24,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  footerText: {
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
  },
});
