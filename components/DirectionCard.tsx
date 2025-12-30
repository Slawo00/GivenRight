import { View, Text, StyleSheet, Pressable } from 'react-native';
import type { DecisionDirection, DecisionExplanation } from '../types/decision';

interface DirectionCardProps {
  direction: DecisionDirection;
  explanation: DecisionExplanation;
  onSelect: (direction: DecisionDirection) => void;
}

const directionLabels: Record<DecisionDirection, string> = {
  safe: 'Safe Choice',
  emotional: 'Emotional Choice',
  bold: 'Bold Choice',
};

const directionColors: Record<DecisionDirection, { bg: string; accent: string }> = {
  safe: { bg: '#F0F7F4', accent: '#2D6A4F' },
  emotional: { bg: '#FDF2F8', accent: '#9D174D' },
  bold: { bg: '#FEF3C7', accent: '#B45309' },
};

export function DirectionCard({ direction, explanation, onSelect }: DirectionCardProps) {
  const colors = directionColors[direction];
  const label = directionLabels[direction];

  return (
    <View style={[styles.card, { backgroundColor: colors.bg }]}>
      <Text style={[styles.header, { color: colors.accent }]}>{label}</Text>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Why this works</Text>
        <Text style={styles.sectionText}>{explanation.whyThisWorks}</Text>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Emotional signal</Text>
        <Text style={styles.sectionText}>{explanation.emotionalSignal}</Text>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Things to consider</Text>
        <Text style={styles.sectionText}>{explanation.risks}</Text>
      </View>
      
      <Pressable 
        style={({ pressed }) => [
          styles.button, 
          { backgroundColor: colors.accent },
          pressed && styles.buttonPressed
        ]}
        onPress={() => onSelect(direction)}
      >
        <Text style={styles.buttonText}>This feels right</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 20,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  sectionText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#374151',
  },
  button: {
    marginTop: 8,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
