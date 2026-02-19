import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Linking,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const GiftRecommendationsScreen = ({ userInputs, confidenceScore }) => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    generateRecommendations();
  }, [userInputs, confidenceScore]);

  const generateRecommendations = async () => {
    setLoading(true);
    
    try {
      // Here we would call our AI recommendation service
      // For now, using smart local recommendations based on inputs
      const recs = await generateSmartRecommendations(userInputs, confidenceScore);
      setRecommendations(recs);
    } catch (error) {
      console.error('Error generating recommendations:', error);
      Alert.alert('Error', 'Unable to generate recommendations. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const generateSmartRecommendations = async (inputs, score) => {
    // Simulate AI recommendation logic based on user inputs
    const baseRecommendations = [];
    
    // Personality-based recommendations
    if (inputs.personalityType === 'Creative & Artistic') {
      baseRecommendations.push(
        {
          id: 1,
          title: 'Professional Art Supply Set',
          description: 'High-quality watercolor or acrylic paint set with brushes and canvas',
          price: '$45-85',
          category: 'creative',
          confidence: Math.min(95, score + 15),
          reasoning: 'Perfect match for their creative personality',
          image: 'https://via.placeholder.com/200x200?text=Art+Supplies',
          purchaseLinks: [
            { store: 'Amazon', url: 'https://amazon.com/art-supplies' },
            { store: 'Michaels', url: 'https://michaels.com/art-supplies' }
          ]
        },
        {
          id: 2,
          title: 'Local Art Workshop Experience',
          description: 'Pottery, painting, or jewelry-making workshop in your area',
          price: '$60-120',
          category: 'experience',
          confidence: Math.min(90, score + 10),
          reasoning: 'Combines creativity with hands-on learning',
          image: 'https://via.placeholder.com/200x200?text=Art+Workshop',
          purchaseLinks: [
            { store: 'Groupon', url: 'https://groupon.com/local-classes' },
            { store: 'Eventbrite', url: 'https://eventbrite.com/art-workshops' }
          ]
        }
      );
    }

    if (inputs.personalityType === 'Tech Enthusiast') {
      baseRecommendations.push(
        {
          id: 3,
          title: 'Smart Home Gadget',
          description: 'Smart bulbs, wireless charger, or Bluetooth tracker',
          price: '$25-75',
          category: 'technology',
          confidence: Math.min(92, score + 12),
          reasoning: 'Appeals to their tech-savvy nature',
          image: 'https://via.placeholder.com/200x200?text=Smart+Device',
          purchaseLinks: [
            { store: 'Best Buy', url: 'https://bestbuy.com/smart-home' },
            { store: 'Amazon', url: 'https://amazon.com/smart-devices' }
          ]
        }
      );
    }

    // Interest-based recommendations
    if (inputs.interests.includes('Cooking & Food')) {
      baseRecommendations.push(
        {
          id: 4,
          title: 'Gourmet Spice Collection',
          description: 'Curated set of exotic spices with recipe cards',
          price: '$35-65',
          category: 'food',
          confidence: Math.min(88, score + 8),
          reasoning: 'Matches their culinary interests perfectly',
          image: 'https://via.placeholder.com/200x200?text=Spices',
          purchaseLinks: [
            { store: 'Williams Sonoma', url: 'https://williams-sonoma.com/spices' },
            { store: 'Local Spice Shop', url: '#' }
          ]
        }
      );
    }

    if (inputs.interests.includes('Reading & Learning')) {
      baseRecommendations.push(
        {
          id: 5,
          title: 'Personalized Book Collection',
          description: 'Curated books based on their favorite genres with bookmarks',
          price: '$40-80',
          category: 'books',
          confidence: Math.min(85, score + 5),
          reasoning: 'Supports their love of learning and reading',
          image: 'https://via.placeholder.com/200x200?text=Books',
          purchaseLinks: [
            { store: 'Barnes & Noble', url: 'https://barnesandnoble.com' },
            { store: 'Local Bookstore', url: '#' }
          ]
        }
      );
    }

    // Occasion-specific recommendations
    if (inputs.occasion === 'Anniversary') {
      baseRecommendations.push(
        {
          id: 6,
          title: 'Memory Scrapbook Kit',
          description: 'Beautiful album with decoration supplies for your shared memories',
          price: '$30-60',
          category: 'sentimental',
          confidence: Math.min(94, score + 14),
          reasoning: 'Perfect for celebrating your relationship milestone',
          image: 'https://via.placeholder.com/200x200?text=Scrapbook',
          purchaseLinks: [
            { store: 'Etsy', url: 'https://etsy.com/scrapbook-kits' },
            { store: 'Michaels', url: 'https://michaels.com/scrapbooking' }
          ]
        }
      );
    }

    // Budget-appropriate recommendations
    const budgetFiltered = baseRecommendations.filter(rec => {
      const price = extractPrice(rec.price);
      return price >= inputs.budget.min && price <= inputs.budget.max;
    });

    // Add generic high-confidence recommendations if we don't have enough
    while (budgetFiltered.length < 5) {
      budgetFiltered.push({
        id: budgetFiltered.length + 10,
        title: 'Cozy Comfort Package',
        description: 'Soft blanket, artisanal tea, and scented candle set',
        price: `$${inputs.budget.min}-${inputs.budget.max}`,
        category: 'comfort',
        confidence: Math.max(70, score - 10),
        reasoning: 'A universally appreciated comfort gift',
        image: 'https://via.placeholder.com/200x200?text=Comfort+Package',
        purchaseLinks: [
          { store: 'Target', url: 'https://target.com/comfort-gifts' },
          { store: 'Walmart', url: 'https://walmart.com/comfort-items' }
        ]
      });
    }

    return budgetFiltered.slice(0, 6); // Return top 6 recommendations
  };

  const extractPrice = (priceString) => {
    const matches = priceString.match(/\$(\d+)/);
    return matches ? parseInt(matches[1]) : 50; // Default fallback
  };

  const categories = [
    { key: 'all', label: 'All' },
    { key: 'creative', label: 'Creative' },
    { key: 'technology', label: 'Tech' },
    { key: 'experience', label: 'Experiences' },
    { key: 'food', label: 'Food & Drink' },
    { key: 'sentimental', label: 'Personal' },
  ];

  const filteredRecommendations = selectedCategory === 'all' 
    ? recommendations 
    : recommendations.filter(rec => rec.category === selectedCategory);

  const openPurchaseLink = (url, store) => {
    if (url === '#') {
      Alert.alert('Local Store', `Please search for "${store}" in your area.`);
    } else {
      Linking.openURL(url);
    }
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 90) return '#4CAF50';
    if (confidence >= 75) return '#FF9800';
    if (confidence >= 60) return '#FFC107';
    return '#F44336';
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Generating personalized recommendations...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Gift Recommendations</Text>
        <Text style={styles.subtitle}>
          Based on your inputs (Confidence: {Math.round(confidenceScore)}%)
        </Text>
      </View>

      {/* Category Filter */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.categoryContainer}
        contentContainerStyle={styles.categoryContent}
      >
        {categories.map(category => (
          <TouchableOpacity
            key={category.key}
            style={[
              styles.categoryButton,
              selectedCategory === category.key && styles.selectedCategory
            ]}
            onPress={() => setSelectedCategory(category.key)}
          >
            <Text style={[
              styles.categoryText,
              selectedCategory === category.key && styles.selectedCategoryText
            ]}>
              {category.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Recommendations List */}
      <View style={styles.recommendationsContainer}>
        {filteredRecommendations.map((recommendation, index) => (
          <View key={recommendation.id} style={styles.recommendationCard}>
            <View style={styles.cardHeader}>
              <View style={styles.titleContainer}>
                <Text style={styles.recommendationTitle}>{recommendation.title}</Text>
                <View style={[
                  styles.confidenceBadge,
                  { backgroundColor: getConfidenceColor(recommendation.confidence) }
                ]}>
                  <Text style={styles.confidenceText}>
                    {Math.round(recommendation.confidence)}%
                  </Text>
                </View>
              </View>
            </View>
            
            <Text style={styles.recommendationDescription}>
              {recommendation.description}
            </Text>
            
            <Text style={styles.recommendationPrice}>
              Price Range: {recommendation.price}
            </Text>
            
            <Text style={styles.reasoningText}>
              💡 {recommendation.reasoning}
            </Text>
            
            <View style={styles.purchaseSection}>
              <Text style={styles.purchaseLabel}>Where to buy:</Text>
              <View style={styles.purchaseLinks}>
                {recommendation.purchaseLinks.map((link, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={styles.purchaseButton}
                    onPress={() => openPurchaseLink(link.url, link.store)}
                  >
                    <Text style={styles.purchaseButtonText}>{link.store}</Text>
                    <Ionicons name="open-outline" size={16} color="#007AFF" />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.bottomSection}>
        <TouchableOpacity style={styles.refineButton} onPress={generateRecommendations}>
          <Ionicons name="refresh-outline" size={20} color="#007AFF" />
          <Text style={styles.refineButtonText}>Get More Ideas</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.bottomSpacing} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  header: {
    padding: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  categoryContainer: {
    backgroundColor: '#ffffff',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  categoryContent: {
    paddingHorizontal: 20,
  },
  categoryButton: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
  },
  selectedCategory: {
    backgroundColor: '#007AFF',
  },
  categoryText: {
    fontSize: 14,
    color: '#333',
  },
  selectedCategoryText: {
    color: '#ffffff',
    fontWeight: '500',
  },
  recommendationsContainer: {
    padding: 15,
  },
  recommendationCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardHeader: {
    marginBottom: 10,
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  recommendationTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginRight: 10,
  },
  confidenceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  confidenceText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  recommendationDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
    lineHeight: 20,
  },
  recommendationPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 10,
  },
  reasoningText: {
    fontSize: 13,
    color: '#888',
    fontStyle: 'italic',
    marginBottom: 15,
  },
  purchaseSection: {
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 15,
  },
  purchaseLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
    marginBottom: 10,
  },
  purchaseLinks: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  purchaseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f8ff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  purchaseButtonText: {
    color: '#007AFF',
    fontSize: 14,
    marginRight: 5,
  },
  bottomSection: {
    padding: 20,
    alignItems: 'center',
  },
  refineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f8ff',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  refineButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  bottomSpacing: {
    height: 50,
  },
});

export default GiftRecommendationsScreen;