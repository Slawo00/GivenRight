import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GiftAPI } from '../services/supabaseClient';

const categoryIcons = {
  'Creative & Arts': 'color-palette-outline',
  'Technology': 'hardware-chip-outline',
  'Experience': 'rocket-outline',
  'Food & Drink': 'restaurant-outline',
  'Comfort & Wellness': 'leaf-outline',
  'Personal & Sentimental': 'heart-outline',
  'Books & Learning': 'book-outline',
  'Fashion & Style': 'shirt-outline',
  'Home & Garden': 'home-outline',
  'Sports & Fitness': 'fitness-outline',
};

const categoryColors = {
  'Creative & Arts': '#FF6B6B',
  'Technology': '#4ECDC4',
  'Experience': '#FFE66D',
  'Food & Drink': '#FF8C42',
  'Comfort & Wellness': '#95E1D3',
  'Personal & Sentimental': '#F38181',
  'Books & Learning': '#AA96DA',
  'Fashion & Style': '#FCBAD3',
  'Home & Garden': '#A8E6CF',
  'Sports & Fitness': '#6C5CE7',
};

const CategoriesScreen = ({ navigation }) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const data = await GiftAPI.getCategories();
      setCategories(data || []);
    } catch (error) {
      console.error('Failed to load categories:', error);
      // Fallback categories
      setCategories([
        { id: '1', name: 'Creative & Arts', description: 'Art supplies, craft kits, creative workshops', typical_price_range: '$20-150' },
        { id: '2', name: 'Technology', description: 'Gadgets, smart devices, tech accessories', typical_price_range: '$25-200' },
        { id: '3', name: 'Experience', description: 'Classes, workshops, events, activities', typical_price_range: '$30-300' },
        { id: '4', name: 'Food & Drink', description: 'Gourmet items, cooking supplies, beverages', typical_price_range: '$15-100' },
        { id: '5', name: 'Comfort & Wellness', description: 'Relaxation items, self-care, cozy goods', typical_price_range: '$20-120' },
        { id: '6', name: 'Personal & Sentimental', description: 'Custom items, photo gifts, memory keepsakes', typical_price_range: '$25-150' },
        { id: '7', name: 'Books & Learning', description: 'Books, courses, educational materials', typical_price_range: '$15-80' },
        { id: '8', name: 'Fashion & Style', description: 'Clothing, accessories, jewelry', typical_price_range: '$20-250' },
        { id: '9', name: 'Home & Garden', description: 'Home decor, plants, organization items', typical_price_range: '$25-150' },
        { id: '10', name: 'Sports & Fitness', description: 'Exercise equipment, outdoor gear, sports items', typical_price_range: '$30-200' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const renderCategory = ({ item }) => {
    const icon = categoryIcons[item.name] || 'gift-outline';
    const color = categoryColors[item.name] || '#6c63ff';

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('NewGift', { preselectedCategory: item.name })}
        activeOpacity={0.85}
      >
        <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
          <Ionicons name={icon} size={32} color={color} />
        </View>
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>{item.name}</Text>
          <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>
          <Text style={styles.priceRange}>{item.typical_price_range}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#ccc" />
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6c63ff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Gift Categories</Text>
        <Text style={styles.headerDesc}>Browse by category to find inspiration</Text>
      </View>
      <FlatList
        data={categories}
        renderItem={renderCategory}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { padding: 20, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#e0e0e0' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  headerDesc: { fontSize: 15, color: '#999', marginTop: 4 },
  listContainer: { padding: 16 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  cardContent: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#333' },
  cardDesc: { fontSize: 13, color: '#999', marginTop: 3, lineHeight: 18 },
  priceRange: { fontSize: 13, color: '#6c63ff', fontWeight: '500', marginTop: 4 },
});

export default CategoriesScreen;