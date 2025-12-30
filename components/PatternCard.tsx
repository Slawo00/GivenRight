import { View, Text, Pressable, StyleSheet } from 'react-native';
import type { ObjectPattern } from '@/services/supabase/objectPatternService';

interface PatternCardProps {
  pattern: ObjectPattern;
  onSelect: () => void;
}

export function PatternCard({ pattern, onSelect }: PatternCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>{pattern.icon}</Text>
      </View>
      
      <Text style={styles.title}>{pattern.title}</Text>
      
      <Text style={styles.description}>{pattern.description}</Text>
      
      <View style={styles.intentContainer}>
        <Text style={styles.intentLabel}>What this says:</Text>
        <Text style={styles.intentText}>{pattern.emotionalIntent}</Text>
      </View>
      
      <Pressable
        style={({ pressed }) => [
          styles.button,
          pressed && styles.buttonPressed,
        ]}
        onPress={onSelect}
      >
        <Text style={styles.buttonText}>Explore this type</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  icon: {
    fontSize: 28,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    color: '#6B7280',
    marginBottom: 16,
  },
  intentContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  intentLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#9CA3AF',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  intentText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    fontStyle: 'italic',
  },
  button: {
    backgroundColor: '#2D6A4F',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonPressed: {
    opacity: 0.9,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
