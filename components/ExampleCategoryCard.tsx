/**
 * STEP B4 — Example Category Card
 * 
 * Displays a single concrete example category with icon, title, and description.
 * Used within DirectionCard to show "What this could look like".
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ConcreteExampleCategory } from '../types/enrichment';

interface ExampleCategoryCardProps {
  category: ConcreteExampleCategory;
}

const ICON_MAP: Record<string, keyof typeof Ionicons.glyphMap> = {
  handcrafted: 'hand-left-outline',
  symbolic_object: 'heart-outline',
  experience: 'ticket-outline',
  practical: 'construct-outline',
  luxury: 'diamond-outline',
  personal: 'person-outline',
  adventure: 'compass-outline',
  creative: 'color-palette-outline',
  sentimental: 'book-outline',
  traditional: 'gift-outline',
  unique: 'star-outline',
  quality: 'ribbon-outline',
  sustainable: 'leaf-outline',
  local: 'location-outline',
  innovative: 'bulb-outline',
  default: 'cube-outline',
};

function getIcon(iconKey: string): keyof typeof Ionicons.glyphMap {
  return ICON_MAP[iconKey] || ICON_MAP.default;
}

export function ExampleCategoryCard({ category }: ExampleCategoryCardProps) {
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Ionicons 
          name={getIcon(category.icon_key)} 
          size={20} 
          color="#6366f1" 
        />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.title}>{category.title}</Text>
        <Text style={styles.description}>{category.description}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#6366f1',
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#eef2ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  description: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 18,
  },
});
