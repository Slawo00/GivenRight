import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { ObjectPattern } from '../services/supabase/objectPatternService';

interface PatternExplanationScreenProps {
  pattern: ObjectPattern;
  onContinue: () => void;
}

export function PatternExplanationScreen({ pattern, onContinue }: PatternExplanationScreenProps) {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.icon}>{pattern.icon}</Text>
          <Text style={styles.title}>{pattern.title}</Text>
          <Text style={styles.subtitle}>Why this kind of gift works</Text>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Why This Works</Text>
          <Text style={styles.sectionBody}>{pattern.description}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Why This Fits Your Relationship</Text>
          <Text style={styles.sectionBody}>{pattern.relationshipFit}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What This Signals Emotionally</Text>
          <Text style={styles.sectionBody}>{pattern.emotionalIntent}</Text>
        </View>

        {pattern.thingsToConsider && pattern.thingsToConsider.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Things to Consider</Text>
            <View style={styles.bulletList}>
              {pattern.thingsToConsider.map((item, index) => (
                <View key={index} style={styles.bulletItem}>
                  <Text style={styles.bullet}>•</Text>
                  <Text style={styles.bulletText}>{item}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={styles.confidenceSection}>
          <Text style={styles.confidenceText}>
            If this feels aligned with how you want to show care, you're on the right path.
          </Text>
        </View>

        <Pressable 
          style={({ pressed }) => [
            styles.ctaButton,
            pressed && styles.ctaButtonPressed
          ]}
          onPress={onContinue}
        >
          <Text style={styles.ctaButtonText}>Show concrete examples</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 48,
  },
  header: {
    alignItems: 'center',
    paddingTop: 32,
    paddingBottom: 40,
  },
  icon: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2D6A4F',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  sectionBody: {
    fontSize: 17,
    color: '#374151',
    lineHeight: 26,
  },
  bulletList: {
    gap: 12,
  },
  bulletItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  bullet: {
    fontSize: 17,
    color: '#6B7280',
    marginRight: 12,
    lineHeight: 26,
  },
  bulletText: {
    flex: 1,
    fontSize: 16,
    color: '#4B5563',
    lineHeight: 24,
  },
  confidenceSection: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 20,
    marginTop: 8,
    marginBottom: 32,
  },
  confidenceText: {
    fontSize: 16,
    color: '#4B5563',
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 24,
  },
  ctaButton: {
    backgroundColor: '#2D6A4F',
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
  },
  ctaButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  ctaButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});
