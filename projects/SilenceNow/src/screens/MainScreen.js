import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  RefreshControl
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import AudioMonitorService from '../services/AudioMonitorService';
import DatabaseService from '../services/DatabaseService';
import PDFReportService from '../services/PDFReportService';
import AudioClassificationService from '../services/AudioClassificationService';

/**
 * MainScreen - Hauptbildschirm der SilenceNow App
 * 
 * Features:
 * - Live Dezibel-Anzeige
 * - Monitoring Start/Stop
 * - Statistiken der letzten 14 Tage
 * - Klassifikations-Übersicht
 * - Schnellzugriff zu Reports
 */

export default function MainScreen({ navigation }) {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [currentDb, setCurrentDb] = useState(0);
  const [stats, setStats] = useState(null);
  const [classifications, setClassifications] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [recentEvents, setRecentEvents] = useState([]);

  // Initialisierung
  useEffect(() => {
    initializeApp();
    return () => {
      // Cleanup beim Verlassen
      if (isMonitoring) {
        AudioMonitorService.stopMonitoring();
      }
    };
  }, []);

  // Aktualisiere bei Fokus
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const initializeApp = async () => {
    try {
      await AudioMonitorService.init();
      await DatabaseService.init();
      await loadData();
      setIsLoading(false);
    } catch (error) {
      console.error('Init error:', error);
      Alert.alert('Fehler', 'App konnte nicht initialisiert werden');
    }
  };

  const loadData = async () => {
    try {
      // Lade Statistiken
      const statsData = await DatabaseService.getStats(14);
      setStats(statsData);

      // Lade Klassifikationen
      const classData = await DatabaseService.getClassificationBreakdown(14);
      setClassifications(classData);

      // Lade letzte Events
      const events = await DatabaseService.getAllEvents(5);
      setRecentEvents(events);
    } catch (error) {
      console.error('Load data error:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const toggleMonitoring = async () => {
    try {
      if (isMonitoring) {
        await AudioMonitorService.stopMonitoring();
        setIsMonitoring(false);
        setCurrentDb(0);
        
        // Sync mit Supabase
        await DatabaseService.syncWithSupabase();
        
        // Lade aktualisierte Daten
        await loadData();
      } else {
        await AudioMonitorService.startMonitoring((event) => {
          // Callback bei neuem Event
          console.log('New event detected:', event.classification);
          loadData();
        });
        
        setIsMonitoring(true);
        
        // Starte Live-Update der Dezibel-Anzeige
        startDbUpdateLoop();
      }
    } catch (error) {
      console.error('Toggle monitoring error:', error);
      Alert.alert('Fehler', 'Monitoring konnte nicht gestartet werden');
    }
  };

  const startDbUpdateLoop = () => {
    const interval = setInterval(() => {
      if (!AudioMonitorService.isActive()) {
        clearInterval(interval);
        return;
      }
      
      const db = AudioMonitorService.getCurrentDecibel();
      setCurrentDb(db);
    }, 1000);
  };

  const generateReport = async () => {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);

      Alert.alert(
        'Report erstellen',
        'Welchen Report möchten Sie erstellen?',
        [
          {
            text: 'Basis (19,99€)',
            onPress: async () => {
              const report = await PDFReportService.generateBasicReport(
                startDate,
                endDate,
                { name: 'Max Mustermann', address: 'Musterstraße 1' }
              );
              await PDFReportService.sharePDF(report.uri, report.filename);
            }
          },
          {
            text: 'Premium (49,99€)',
            onPress: () => navigation.navigate('PremiumCheckout'),
            style: 'cancel'
          },
          {
            text: 'Abbrechen',
            style: 'cancel'
          }
        ]
      );
    } catch (error) {
      Alert.alert('Fehler', 'Report konnte nicht erstellt werden');
    }
  };

  const getDecibelColor = (db) => {
    if (db < 40) return '#34C759';
    if (db < 55) return '#FF9500';
    return '#FF3B30';
  };

  const getDecibelLabel = (db) => {
    if (db < 40) return 'Leise';
    if (db < 55) return 'Normal';
    if (db < 70) return 'Laut';
    return 'Sehr laut';
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>SilenceNow wird geladen...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.logo}>🔇 SilenceNow</Text>
        <Text style={styles.tagline}>Rechtssichere Lärm-Dokumentation</Text>
      </View>

      {/* Live Dezibel-Anzeige */}
      <View style={styles.dbCard}>
        <Text style={styles.dbLabel}>Aktuelle Lautstärke</Text>
        <View style={styles.dbDisplay}>
          <Text style={[
            styles.dbValue,
            { color: getDecibelColor(currentDb) }
          ]}>
            {isMonitoring ? currentDb : '--'}
          </Text>
          <Text style={styles.dbUnit}>dB</Text>
        </View>
        <Text style={[
          styles.dbStatus,
          { color: getDecibelColor(currentDb) }
        ]}>
          {isMonitoring ? getDecibelLabel(currentDb) : 'Monitoring pausiert'}
        </Text>
        
        {isMonitoring && AudioMonitorService.getCurrentEvent() && (
          <View style={styles.activeEventBadge}>
            <Text style={styles.activeEventText}>🔴 Lärm-Event wird aufgezeichnet</Text>
          </View>
        )}
      </View>

      {/* Monitoring Button */}
      <TouchableOpacity
        style={[
          styles.monitoringButton,
          isMonitoring ? styles.monitoringButtonActive : null
        ]}
        onPress={toggleMonitoring}
      >
        <Text style={styles.monitoringButtonText}>
          {isMonitoring ? '⏹ Monitoring stoppen' : '▶️ Monitoring starten'}
        </Text>
      </TouchableOpacity>

      {/* Statistiken */}
      <View style={styles.statsSection}>
        <Text style={styles.sectionTitle}>Letzte 14 Tage</Text>
        <View style={styles.statsGrid}>
          <StatCard
            value={stats?.totalEvents || 0}
            label="Störungen"
            icon="📊"
          />
          <StatCard
            value={stats?.nightEvents || 0}
            label="Nachts (22-06h)"
            icon="🌙"
            highlight={stats?.nightEvents > 5}
          />
          <StatCard
            value={`${Math.round(stats?.avgDecibel || 0)}dB`}
            label="Ø Lautstärke"
            icon="📈"
          />
          <StatCard
            value={`${Math.round(stats?.maxDecibel || 0)}dB`}
            label="Max. Lautstärke"
            icon="🔊"
          />
        </View>
      </View>

      {/* Klassifikationen */}
      {Object.keys(classifications).length > 0 && (
        <View style={styles.classificationSection}>
          <Text style={styles.sectionTitle}>Störungsarten</Text>
          <View style={styles.classificationList}>
            {Object.entries(classifications)
              .sort(([,a], [,b]) => b - a)
              .map(([type, count]) => (
                <ClassificationBadge
                  key={type}
                  type={translateClassification(type)}
                  count={count}
                />
              ))}
          </View>
        </View>
      )}

      {/* Letzte Events */}
      {recentEvents.length > 0 && (
        <View style={styles.eventsSection}>
          <Text style={styles.sectionTitle}>Letzte Störungen</Text>
          {recentEvents.map(event => (
            <EventCard key={event.id} event={event} />
          ))}
        </View>
      )}

      {/* Report Button */}
      <TouchableOpacity
        style={styles.reportButton}
        onPress={generateReport}
      >
        <Text style={styles.reportButtonText}>📄 PDF-Protokoll erstellen</Text>
        <Text style={styles.reportButtonSubtext}>
          BGH-konform mit Musterbriefen
        </Text>
      </TouchableOpacity>

      {/* Upgrade CTA */}
      <View style={styles.upgradeCard}>
        <Text style={styles.upgradeTitle}>🚀 Premium-Features freischalten</Text>
        <Text style={styles.upgradeFeatures}>
          • Durchsetzungspaket mit Anwalt-Musterbriefen{'\n'}
          • 6 Monate Monitoring-Verlauf{'\n'}
          • Vermieter-Tracker & Fristenmanagement
        </Text>
        <TouchableOpacity style={styles.upgradeButton}>
          <Text style={styles.upgradeButtonText}>Mehr erfahren →</Text>
        </TouchableOpacity>
      </View>

      {/* Info Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          🔒 Privacy-First: Keine Audio-Aufnahmen, nur Messwerte
        </Text>
        <Text style={styles.footerText}>
          BGH-konform • DSGVO-konform • §201-StGB-konform
        </Text>
      </View>
    </ScrollView>
  );
}

// Hilfskomponenten
function StatCard({ value, label, icon, highlight }) {
  return (
    <View style={[styles.statCard, highlight && styles.statCardHighlight]}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function ClassificationBadge({ type, count }) {
  return (
    <View style={styles.classificationBadge}>
      <Text style={styles.classificationType}>{type}</Text>
      <Text style={styles.classificationCount}>{count}x</Text>
    </View>
  );
}

function EventCard({ event }) {
  return (
    <View style={styles.eventCard}>
      <View style={styles.eventHeader}>
        <Text style={styles.eventDate}>
          {new Date(event.startedAt).toLocaleString('de-DE')}
        </Text>
        <Text style={[
          styles.eventClassification,
          { backgroundColor: getClassificationColor(event.classification) }
        ]}>
          {translateClassification(event.classification)}
        </Text>
      </View>
      <View style={styles.eventDetails}>
        <Text style={styles.eventDetail}>
          ⏱ {Math.round(event.duration / 60)} Min • 
        </Text>
        <Text style={styles.eventDetail}>
          📊 Ø{event.avgDecibel}dB (max {event.maxDecibel}dB)
        </Text>
      </View>
      {event.isChildrenNoise && (
        <Text style={styles.childrenBadge}>👶 Kinderlärm erkannt</Text>
      )}
    </View>
  );
}

function translateClassification(classification) {
  const translations = {
    music: 'Musik',
    drilling: 'Bohren',
    dog: 'Hund',
    children: 'Kinder',
    voices: 'Gespräche',
    traffic: 'Verkehr',
    footsteps: 'Schritte',
    unknown: 'Unbekannt'
  };
  return translations[classification] || classification;
}

function getClassificationColor(classification) {
  const colors = {
    music: '#FF6B6B',
    drilling: '#FF9F43',
    dog: '#FECA57',
    children: '#48DBFB',
    voices: '#FF9FF3',
    traffic: '#54A0FF',
    footsteps: '#5F27CD',
    unknown: '#8395A7'
  };
  return colors[classification] || '#8395A7';
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    marginTop: 16,
    color: '#666'
  },
  header: {
    backgroundColor: '#fff',
    padding: 24,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e8e8e8'
  },
  logo: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8
  },
  tagline: {
    fontSize: 14,
    color: '#666'
  },
  dbCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3
  },
  dbLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16
  },
  dbDisplay: {
    flexDirection: 'row',
    alignItems: 'flex-end'
  },
  dbValue: {
    fontSize: 72,
    fontWeight: 'bold'
  },
  dbUnit: {
    fontSize: 24,
    color: '#666',
    marginBottom: 16,
    marginLeft: 8
  },
  dbStatus: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 8
  },
  activeEventBadge: {
    marginTop: 16,
    backgroundColor: '#FFEBEE',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20
  },
  activeEventText: {
    color: '#C62828',
    fontWeight: '600'
  },
  monitoringButton: {
    backgroundColor: '#007AFF',
    marginHorizontal: 16,
    padding: 18,
    borderRadius: 12,
    alignItems: 'center'
  },
  monitoringButtonActive: {
    backgroundColor: '#FF3B30'
  },
  monitoringButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  },
  statsSection: {
    marginTop: 24,
    paddingHorizontal: 16
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12
  },
  statCard: {
    width: '47%',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center'
  },
  statCardHighlight: {
    backgroundColor: '#FFEBEE',
    borderWidth: 1,
    borderColor: '#FF3B30'
  },
  statIcon: {
    fontSize: 24,
    marginBottom: 8
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a'
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'center'
  },
  classificationSection: {
    marginTop: 24,
    paddingHorizontal: 16
  },
  classificationList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  classificationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8
  },
  classificationType: {
    fontSize: 14
  },
  classificationCount: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600'
  },
  eventsSection: {
    marginTop: 24,
    paddingHorizontal: 16
  },
  eventCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  eventDate: {
    fontSize: 12,
    color: '#666'
  },
  eventClassification: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 12,
    color: '#fff',
    fontWeight: '500'
  },
  eventDetails: {
    flexDirection: 'row',
    gap: 8
  },
  eventDetail: {
    fontSize: 13,
    color: '#666'
  },
  childrenBadge: {
    marginTop: 8,
    fontSize: 12,
    color: '#007AFF'
  },
  reportButton: {
    backgroundColor: '#34C759',
    marginHorizontal: 16,
    marginTop: 24,
    padding: 18,
    borderRadius: 12,
    alignItems: 'center'
  },
  reportButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  },
  reportButtonSubtext: {
    color: '#fff',
    fontSize: 12,
    marginTop: 4,
    opacity: 0.9
  },
  upgradeCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 20,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#FFD700'
  },
  upgradeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12
  },
  upgradeFeatures: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
    marginBottom: 16
  },
  upgradeButton: {
    backgroundColor: '#FFD700',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center'
  },
  upgradeButtonText: {
    fontWeight: '600',
    color: '#1a1a1a'
  },
  footer: {
    padding: 24,
    alignItems: 'center'
  },
  footerText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center'
  }
});
