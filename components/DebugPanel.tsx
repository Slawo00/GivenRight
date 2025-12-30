import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Platform } from 'react-native';
import { useAppState } from '@/store/useAppState';

export function DebugPanel() {
  const [expanded, setExpanded] = useState(false);
  const { debugMode, appReady, toggleDebugMode } = useAppState();

  if (!debugMode) {
    return null;
  }

  const state = {
    appReady,
    debugMode,
    platform: Platform.OS,
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.header} 
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.7}
      >
        <Text style={styles.headerText}>
          {expanded ? '▼' : '▶'} Debug Panel
        </Text>
        <TouchableOpacity 
          style={styles.closeButton}
          onPress={toggleDebugMode}
        >
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
      </TouchableOpacity>
      
      {expanded && (
        <ScrollView style={styles.content}>
          <Text style={styles.json}>
            {JSON.stringify(state, null, 2)}
          </Text>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 20,
    left: 10,
    right: 10,
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    overflow: 'hidden',
    maxHeight: 300,
    ...Platform.select({
      web: {
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
      },
    }),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#2a2a2a',
  },
  headerText: {
    color: '#00ff88',
    fontWeight: 'bold',
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  closeButton: {
    padding: 4,
  },
  closeText: {
    color: '#ff6b6b',
    fontSize: 16,
    fontWeight: 'bold',
  },
  content: {
    padding: 12,
    maxHeight: 200,
  },
  json: {
    color: '#ffffff',
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
});
