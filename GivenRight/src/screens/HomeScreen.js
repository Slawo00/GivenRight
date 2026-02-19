import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const HomeScreen = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />
      
      <View style={styles.header}>
        <Text style={styles.logo}>🎁</Text>
        <Text style={styles.title}>GivenRight</Text>
        <Text style={styles.subtitle}>Find the perfect gift, every time</Text>
      </View>

      <View style={styles.cardContainer}>
        <TouchableOpacity
          style={styles.mainCard}
          onPress={() => navigation.navigate('NewGift')}
          activeOpacity={0.85}
        >
          <View style={styles.cardIcon}>
            <Ionicons name="gift-outline" size={48} color="#ffffff" />
          </View>
          <Text style={styles.cardTitle}>Find a Gift</Text>
          <Text style={styles.cardDescription}>
            Tell us about the person and we'll suggest the perfect gift with AI-powered confidence scoring
          </Text>
          <View style={styles.cardButton}>
            <Text style={styles.cardButtonText}>Get Started</Text>
            <Ionicons name="arrow-forward" size={20} color="#ffffff" />
          </View>
        </TouchableOpacity>

        <View style={styles.secondaryCards}>
          <TouchableOpacity
            style={styles.smallCard}
            onPress={() => navigation.navigate('History')}
            activeOpacity={0.85}
          >
            <Ionicons name="time-outline" size={28} color="#6c63ff" />
            <Text style={styles.smallCardTitle}>History</Text>
            <Text style={styles.smallCardDesc}>Past gifts</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.smallCard}
            onPress={() => navigation.navigate('Categories')}
            activeOpacity={0.85}
          >
            <Ionicons name="grid-outline" size={28} color="#6c63ff" />
            <Text style={styles.smallCardTitle}>Browse</Text>
            <Text style={styles.smallCardDesc}>Categories</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.smallCard}
            onPress={() => navigation.navigate('Profile')}
            activeOpacity={0.85}
          >
            <Ionicons name="person-outline" size={28} color="#6c63ff" />
            <Text style={styles.smallCardTitle}>Profile</Text>
            <Text style={styles.smallCardDesc}>Settings</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Powered by AI • Built with ❤️
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  header: {
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 30,
  },
  logo: {
    fontSize: 64,
    marginBottom: 10,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#ffffff',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 16,
    color: '#a0a0b0',
    marginTop: 8,
  },
  cardContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  mainCard: {
    backgroundColor: '#6c63ff',
    borderRadius: 20,
    padding: 30,
    marginBottom: 20,
    shadowColor: '#6c63ff',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  cardIcon: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 10,
  },
  cardDescription: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 22,
    marginBottom: 20,
  },
  cardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignSelf: 'flex-start',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
  },
  cardButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  secondaryCards: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  smallCard: {
    flex: 1,
    backgroundColor: '#16213e',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2a2a4a',
  },
  smallCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    marginTop: 10,
  },
  smallCardDesc: {
    fontSize: 12,
    color: '#a0a0b0',
    marginTop: 4,
  },
  footer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 13,
    color: '#555570',
  },
});

export default HomeScreen;