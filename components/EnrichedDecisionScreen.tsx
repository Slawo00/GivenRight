/**
 * STEP B4 — Enriched Decision Screen
 * 
 * Displays all enriched options (SAFE / EMOTIONAL / BOLD) with
 * situation-specific explanations and example categories.
 * 
 * User can select one option to proceed to pattern selection.
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useEnrichmentState } from '../store/useEnrichmentState';
import { useInputCollectionState } from '../store/useInputCollectionState';
import { EnrichedDirectionCard } from './EnrichedDirectionCard';
import { loadAllowedDecisionOptions } from '../services/supabase/decisionOptionsService';
import type { ConfidenceType, DecisionResult } from '../services/decisionEngine/types';

interface EnrichedDecisionScreenProps {
  decisionResult: DecisionResult;
  onDirectionSelected: (direction: ConfidenceType) => void;
  onBack: () => void;
}

export function EnrichedDecisionScreen({ 
  decisionResult,
  onDirectionSelected,
  onBack,
}: EnrichedDecisionScreenProps) {
  const [selectedDirection, setSelectedDirection] = useState<ConfidenceType | null>(null);
  const [allowedOptions, setAllowedOptions] = useState<string[]>([]);
  const [isLoadingAllowed, setIsLoadingAllowed] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  
  const { isEnriching, enrichedResult, startEnrichment } = useEnrichmentState();
  const { getDecisionContext, life_stage_code } = useInputCollectionState();
  
  useEffect(() => {
    if (!life_stage_code) {
      setLoadError('Life stage not set');
      setIsLoadingAllowed(false);
      return;
    }

    setIsLoadingAllowed(true);
    setLoadError(null);
    setSelectedDirection(null);
    
    loadAllowedDecisionOptions(life_stage_code)
      .then((options) => {
        setAllowedOptions(options);
        setIsLoadingAllowed(false);
      })
      .catch((error) => {
        console.error('Failed to load allowed options:', error);
        setAllowedOptions([]);
        setLoadError('Failed to load options');
        setIsLoadingAllowed(false);
      });
  }, [life_stage_code]);
  
  useEffect(() => {
    const context = getDecisionContext();
    if (context && decisionResult) {
      startEnrichment(context, decisionResult);
    }
  }, []);
  
  const handleConfirm = () => {
    if (selectedDirection && allowedOptions.includes(selectedDirection)) {
      onDirectionSelected(selectedDirection);
    }
  };
  
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Your Options</Text>
          <Text style={styles.subtitle}>
            Each option is shaped by your specific situation
          </Text>
        </View>
      </View>
      
      {/* Options */}
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {isLoadingAllowed ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#6366f1" />
            <Text style={styles.loadingText}>Loading options...</Text>
          </View>
        ) : loadError || allowedOptions.length === 0 ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={48} color="#ef4444" />
            <Text style={styles.errorText}>
              {loadError || 'No options available for this selection'}
            </Text>
            <Text style={styles.errorSubtext}>
              This is a data configuration issue
            </Text>
          </View>
        ) : isEnriching ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#6366f1" />
            <Text style={styles.loadingText}>
              Personalizing options for your situation...
            </Text>
            <Text style={styles.loadingSubtext}>
              This takes just a moment
            </Text>
          </View>
        ) : enrichedResult ? (
          enrichedResult.options
            .filter((option) => allowedOptions.includes(option.confidence_type))
            .map((option, index) => (
              <EnrichedDirectionCard
                key={option.confidence_type}
                option={option}
                isSelected={selectedDirection === option.confidence_type}
                isRecommended={index === 0}
                onSelect={() => setSelectedDirection(option.confidence_type)}
              />
            ))
        ) : (
          decisionResult.options
            .filter((option) => allowedOptions.includes(option.confidence_type))
            .map((option) => (
              <TouchableOpacity
                key={option.confidence_type}
                style={[
                  styles.fallbackCard,
                  selectedDirection === option.confidence_type && styles.fallbackSelected,
                ]}
                onPress={() => setSelectedDirection(option.confidence_type)}
              >
                <Text style={styles.fallbackTitle}>{option.confidence_type} Choice</Text>
                <Text style={styles.fallbackText}>{option.explanation.why_this_works}</Text>
              </TouchableOpacity>
            ))
        )}
      </ScrollView>
      
      {/* Confirm Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.confirmButton,
            !selectedDirection && styles.confirmButtonDisabled,
          ]}
          onPress={handleConfirm}
          disabled={!selectedDirection}
        >
          <Text style={styles.confirmButtonText}>
            Continue with {selectedDirection || '...'} Choice
          </Text>
          <Ionicons name="arrow-forward" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginTop: 20,
    textAlign: 'center',
  },
  loadingSubtext: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 8,
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  errorText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ef4444',
    marginTop: 16,
    textAlign: 'center',
  },
  errorSubtext: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 8,
    textAlign: 'center',
  },
  fallbackCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  fallbackSelected: {
    borderColor: '#6366f1',
    backgroundColor: '#eef2ff',
  },
  fallbackTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  fallbackText: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  footer: {
    padding: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366f1',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  confirmButtonDisabled: {
    backgroundColor: '#d1d5db',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
