import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GiftAPI } from '../services/supabaseClient';

const HistoryScreen = ({ navigation }) => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const data = await GiftAPI.getSessionHistory(50);
      setSessions(data || []);
    } catch (error) {
      console.error('Failed to load history:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadHistory();
  };

  const getScoreColor = (score) => {
    if (score >= 80) return '#4CAF50';
    if (score >= 60) return '#FF9800';
    if (score >= 40) return '#FFC107';
    return '#F44336';
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('de-DE', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  const renderSessionCard = ({ item }) => {
    const recCount = item.gift_recommendations?.length || 0;
    const score = item.confidence_score || 0;

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('SessionDetail', { session: item })}
        activeOpacity={0.85}
      >
        <View style={styles.cardHeader}>
          <View style={styles.occasionBadge}>
            <Text style={styles.occasionText}>{item.occasion || 'Gift'}</Text>
          </View>
          <View style={[styles.scoreBadge, { backgroundColor: getScoreColor(score) }]}>
            <Text style={styles.scoreText}>{score}%</Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <Text style={styles.budgetText}>
            Budget: ${item.budget_min} — ${item.budget_max}
          </Text>
          <Text style={styles.dateText}>{formatDate(item.created_at)}</Text>
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.recCount}>
            <Ionicons name="gift-outline" size={16} color="#6c63ff" />
            <Text style={styles.recCountText}>{recCount} recommendations</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </View>
      </TouchableOpacity>
    );
  };

  const EmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="gift-outline" size={64} color="#ccc" />
      <Text style={styles.emptyTitle}>No gift sessions yet</Text>
      <Text style={styles.emptyDesc}>
        Start your first gift search to build your history
      </Text>
      <TouchableOpacity
        style={styles.emptyButton}
        onPress={() => navigation.navigate('NewGift')}
      >
        <Text style={styles.emptyButtonText}>Find a Gift</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6c63ff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={sessions}
        renderItem={renderSessionCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={sessions.length === 0 ? styles.emptyContainer : styles.listContainer}
        ListEmptyComponent={EmptyState}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#6c63ff']} />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContainer: { padding: 16 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  occasionBadge: { backgroundColor: '#f0eeff', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  occasionText: { fontSize: 14, fontWeight: '600', color: '#6c63ff' },
  scoreBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  scoreText: { fontSize: 13, fontWeight: 'bold', color: '#fff' },
  cardBody: { marginBottom: 12 },
  budgetText: { fontSize: 15, color: '#333', fontWeight: '500' },
  dateText: { fontSize: 13, color: '#999', marginTop: 4 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#f0f0f0', paddingTop: 12 },
  recCount: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  recCountText: { fontSize: 13, color: '#6c63ff' },
  emptyState: { alignItems: 'center' },
  emptyTitle: { fontSize: 20, fontWeight: '600', color: '#333', marginTop: 20 },
  emptyDesc: { fontSize: 15, color: '#999', marginTop: 8, textAlign: 'center' },
  emptyButton: { backgroundColor: '#6c63ff', paddingHorizontal: 28, paddingVertical: 14, borderRadius: 25, marginTop: 24 },
  emptyButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});

export default HistoryScreen;