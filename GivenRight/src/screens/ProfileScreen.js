import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ProfileScreen = ({ navigation }) => {
  const [settings, setSettings] = useState({
    darkMode: false,
    notifications: true,
    aiRecommendations: true,
    saveHistory: true,
    currency: 'USD',
  });
  const [stats, setStats] = useState({
    totalSessions: 0,
    totalRecommendations: 0,
    avgConfidence: 0,
    favoriteCategory: 'N/A',
  });

  useEffect(() => {
    loadSettings();
    loadStats();
  }, []);

  const loadSettings = async () => {
    try {
      const stored = await AsyncStorage.getItem('givenright_settings');
      if (stored) setSettings(JSON.parse(stored));
    } catch (e) {
      console.error('Failed to load settings:', e);
    }
  };

  const loadStats = async () => {
    try {
      const stored = await AsyncStorage.getItem('givenright_stats');
      if (stored) setStats(JSON.parse(stored));
    } catch (e) {
      console.error('Failed to load stats:', e);
    }
  };

  const updateSetting = async (key, value) => {
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    await AsyncStorage.setItem('givenright_settings', JSON.stringify(updated));
  };

  const clearHistory = () => {
    Alert.alert(
      'Clear History',
      'This will delete all your gift session history. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.removeItem('givenright_stats');
            setStats({ totalSessions: 0, totalRecommendations: 0, avgConfidence: 0, favoriteCategory: 'N/A' });
            Alert.alert('Done', 'History cleared.');
          },
        },
      ]
    );
  };

  const SettingRow = ({ icon, title, subtitle, value, onValueChange, type = 'switch' }) => (
    <View style={styles.settingRow}>
      <View style={styles.settingIcon}>
        <Ionicons name={icon} size={22} color="#6c63ff" />
      </View>
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{title}</Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
      {type === 'switch' && (
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{ false: '#e0e0e0', true: '#c4c0ff' }}
          thumbColor={value ? '#6c63ff' : '#f4f3f4'}
        />
      )}
      {type === 'arrow' && (
        <Ionicons name="chevron-forward" size={20} color="#ccc" />
      )}
    </View>
  );

  const StatCard = ({ icon, label, value }) => (
    <View style={styles.statCard}>
      <Ionicons name={icon} size={24} color="#6c63ff" />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={40} color="#ffffff" />
        </View>
        <Text style={styles.headerTitle}>Gift Finder</Text>
        <Text style={styles.headerSubtitle}>Making gift-giving effortless</Text>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <StatCard icon="gift-outline" label="Sessions" value={stats.totalSessions} />
        <StatCard icon="bulb-outline" label="Suggestions" value={stats.totalRecommendations} />
        <StatCard icon="analytics-outline" label="Avg Score" value={`${stats.avgConfidence}%`} />
      </View>

      {/* Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Preferences</Text>
        <SettingRow
          icon="moon-outline"
          title="Dark Mode"
          subtitle="Use dark theme"
          value={settings.darkMode}
          onValueChange={(v) => updateSetting('darkMode', v)}
        />
        <SettingRow
          icon="notifications-outline"
          title="Notifications"
          subtitle="Gift occasion reminders"
          value={settings.notifications}
          onValueChange={(v) => updateSetting('notifications', v)}
        />
        <SettingRow
          icon="sparkles-outline"
          title="AI Recommendations"
          subtitle="Use OpenAI for smarter suggestions"
          value={settings.aiRecommendations}
          onValueChange={(v) => updateSetting('aiRecommendations', v)}
        />
        <SettingRow
          icon="save-outline"
          title="Save History"
          subtitle="Remember past gift sessions"
          value={settings.saveHistory}
          onValueChange={(v) => updateSetting('saveHistory', v)}
        />
      </View>

      {/* Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Data</Text>
        <TouchableOpacity onPress={clearHistory}>
          <SettingRow
            icon="trash-outline"
            title="Clear History"
            subtitle="Delete all past sessions"
            type="arrow"
          />
        </TouchableOpacity>
      </View>

      {/* About */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <SettingRow icon="information-circle-outline" title="Version" subtitle="1.0.0" type="arrow" />
        <SettingRow icon="document-text-outline" title="Privacy Policy" type="arrow" />
        <SettingRow icon="mail-outline" title="Contact Support" type="arrow" />
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>GivenRight v1.0.0</Text>
        <Text style={styles.footerText}>Built with ❤️ and AI</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: { alignItems: 'center', paddingVertical: 30, backgroundColor: '#1a1a2e' },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#6c63ff', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#ffffff' },
  headerSubtitle: { fontSize: 14, color: '#a0a0b0', marginTop: 4 },
  statsContainer: { flexDirection: 'row', justifyContent: 'space-around', padding: 20, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  statCard: { alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: 'bold', color: '#333', marginTop: 6 },
  statLabel: { fontSize: 12, color: '#999', marginTop: 2 },
  section: { marginTop: 20, backgroundColor: '#ffffff', borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#f0f0f0' },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: '#999', textTransform: 'uppercase', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  settingRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f8f8f8' },
  settingIcon: { width: 36, height: 36, borderRadius: 8, backgroundColor: '#f0eeff', justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  settingContent: { flex: 1 },
  settingTitle: { fontSize: 16, color: '#333', fontWeight: '500' },
  settingSubtitle: { fontSize: 13, color: '#999', marginTop: 2 },
  footer: { alignItems: 'center', paddingVertical: 30 },
  footerText: { fontSize: 13, color: '#ccc', marginTop: 2 },
});

export default ProfileScreen;