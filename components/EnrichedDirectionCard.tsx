/**
 * STEP B4 — Enriched Direction Card
 * 
 * Enhanced version of DirectionCard that displays situation-specific
 * explanations and concrete example categories.
 * 
 * Rendering order:
 * 1) Title (Safe / Emotional / Bold Choice)
 * 2) Why this works
 * 3) Emotional signal
 * 4) What this could look like (example categories)
 * 5) Things to consider
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { EnrichedOption } from '../types/enrichment';
import { ExampleCategoryCard } from './ExampleCategoryCard';

interface EnrichedDirectionCardProps {
  option: EnrichedOption;
  isSelected: boolean;
  isLoading?: boolean;
  isRecommended?: boolean;
  onSelect: () => void;
}

const DIRECTION_CONFIG = {
  SAFE: {
    title: 'Safe Choice',
    color: '#22c55e',
    bgColor: '#f0fdf4',
    icon: 'shield-checkmark-outline' as const,
    description: 'A reliable choice that respects boundaries',
  },
  EMOTIONAL: {
    title: 'Emotional Choice',
    color: '#f59e0b',
    bgColor: '#fffbeb',
    icon: 'heart-outline' as const,
    description: 'A choice that creates meaningful connection',
  },
  BOLD: {
    title: 'Bold Choice',
    color: '#8b5cf6',
    bgColor: '#faf5ff',
    icon: 'flash-outline' as const,
    description: 'A memorable choice that makes an impression',
  },
};

export function EnrichedDirectionCard({ 
  option, 
  isSelected, 
  isLoading = false,
  isRecommended = false,
  onSelect 
}: EnrichedDirectionCardProps) {
  const config = DIRECTION_CONFIG[option.confidence_type];
  
  return (
    <TouchableOpacity
      style={[
        styles.container,
        { backgroundColor: config.bgColor },
        isSelected && styles.selected,
        isSelected && { borderColor: config.color },
      ]}
      onPress={onSelect}
      activeOpacity={0.7}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: config.color }]}>
          <Ionicons name={config.icon} size={24} color="#fff" />
        </View>
        <View style={styles.headerText}>
          <View style={styles.titleRow}>
            <Text style={[styles.title, { color: config.color }]}>
              {config.title}
            </Text>
            {isRecommended && (
              <View style={styles.recommendedBadge}>
                <Text style={styles.recommendedText}>Recommended</Text>
              </View>
            )}
          </View>
          <Text style={styles.subtitle}>{config.description}</Text>
        </View>
        {isSelected && (
          <View style={[styles.checkmark, { backgroundColor: config.color }]}>
            <Ionicons name="checkmark" size={16} color="#fff" />
          </View>
        )}
      </View>
      
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={config.color} />
          <Text style={styles.loadingText}>Personalizing for your situation...</Text>
        </View>
      ) : (
        <>
          {/* Why This Works */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Why this works</Text>
            <Text style={styles.sectionContent}>
              {option.explanation.why_this_works}
            </Text>
          </View>
          
          {/* Emotional Signal */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Emotional signal</Text>
            <Text style={styles.emotionalSignal}>
              "{option.explanation.emotional_signal}"
            </Text>
          </View>
          
          {/* Example Categories */}
          {option.explanation.concrete_example_categories.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>What this could look like</Text>
              <View style={styles.examples}>
                {option.explanation.concrete_example_categories.map((category, index) => (
                  <ExampleCategoryCard key={index} category={category} />
                ))}
              </View>
            </View>
          )}
          
          {/* Things to Consider */}
          {option.explanation.things_to_consider.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Things to consider</Text>
              {option.explanation.things_to_consider.map((item, index) => (
                <View key={index} style={styles.considerItem}>
                  <Ionicons name="alert-circle-outline" size={14} color="#9ca3af" />
                  <Text style={styles.considerText}>{item}</Text>
                </View>
              ))}
            </View>
          )}
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selected: {
    borderWidth: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  recommendedBadge: {
    backgroundColor: '#22c55e',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  recommendedText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
    textTransform: 'uppercase',
  },
  subtitle: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  loadingText: {
    marginLeft: 12,
    fontSize: 14,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  section: {
    marginTop: 12,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  sectionContent: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 22,
  },
  emotionalSignal: {
    fontSize: 15,
    color: '#374151',
    fontStyle: 'italic',
    lineHeight: 22,
  },
  examples: {
    marginTop: 4,
  },
  considerItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  considerText: {
    flex: 1,
    fontSize: 13,
    color: '#6b7280',
    marginLeft: 6,
    lineHeight: 18,
  },
});
