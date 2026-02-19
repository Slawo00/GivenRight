import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert
} from 'react-native';

const PersonalityInputForm = ({ onFormSubmit, initialData = {} }) => {
  const [formData, setFormData] = useState({
    // Recipient basics
    age: initialData.age || '',
    gender: initialData.gender || '',
    relationship: initialData.relationship || '',
    
    // Personality traits
    personalityType: initialData.personalityType || '',
    interests: initialData.interests || [],
    hobbies: initialData.hobbies || [],
    lifestyle: initialData.lifestyle || '',
    
    // Gift context
    occasion: initialData.occasion || '',
    budget: {
      min: initialData.budget?.min || 0,
      max: initialData.budget?.max || 100
    },
    timing: initialData.timing || 'flexible',
    
    // Preferences
    giftType: initialData.giftType || [],
    avoidList: initialData.avoidList || [],
    specialNotes: initialData.specialNotes || ''
  });

  const personalityTypes = [
    'Creative & Artistic',
    'Practical & Logical',
    'Social & Outgoing', 
    'Quiet & Thoughtful',
    'Active & Adventurous',
    'Homebody & Cozy',
    'Tech Enthusiast',
    'Nature Lover'
  ];

  const interestCategories = [
    'Arts & Crafts', 'Technology', 'Sports & Fitness', 'Reading & Learning',
    'Cooking & Food', 'Travel & Adventure', 'Music & Entertainment',
    'Fashion & Style', 'Home & Garden', 'Health & Wellness'
  ];

  const occasionTypes = [
    'Birthday', 'Anniversary', 'Christmas', 'Valentine\'s Day',
    'Graduation', 'Wedding', 'New Baby', 'Housewarming',
    'Thank You', 'Just Because'
  ];

  const giftTypes = [
    'Experience', 'Handmade/DIY', 'Luxury Item', 'Practical/Useful',
    'Sentimental/Personal', 'Subscription/Service', 'Collectible',
    'Technology', 'Book/Learning', 'Fashion/Accessories'
  ];

  const updateFormData = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const toggleArrayItem = (arrayField, item) => {
    setFormData(prev => ({
      ...prev,
      [arrayField]: prev[arrayField].includes(item)
        ? prev[arrayField].filter(i => i !== item)
        : [...prev[arrayField], item]
    }));
  };

  const validateForm = () => {
    if (!formData.relationship) {
      Alert.alert('Missing Info', 'Please specify your relationship to the recipient');
      return false;
    }
    if (!formData.occasion) {
      Alert.alert('Missing Info', 'Please select the occasion');
      return false;
    }
    if (formData.budget.max <= 0) {
      Alert.alert('Invalid Budget', 'Please set a valid budget range');
      return false;
    }
    return true;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onFormSubmit(formData);
    }
  };

  const MultiSelectButtons = ({ title, items, selectedItems, onToggle }) => (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.buttonGrid}>
        {items.map(item => (
          <TouchableOpacity
            key={item}
            style={[
              styles.selectButton,
              selectedItems.includes(item) && styles.selectedButton
            ]}
            onPress={() => onToggle(item)}
          >
            <Text style={[
              styles.buttonText,
              selectedItems.includes(item) && styles.selectedButtonText
            ]}>
              {item}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const SingleSelectButtons = ({ title, items, selectedItem, onSelect }) => (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.buttonGrid}>
        {items.map(item => (
          <TouchableOpacity
            key={item}
            style={[
              styles.selectButton,
              selectedItem === item && styles.selectedButton
            ]}
            onPress={() => onSelect(item)}
          >
            <Text style={[
              styles.buttonText,
              selectedItem === item && styles.selectedButtonText
            ]}>
              {item}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Tell us about the recipient</Text>
        <Text style={styles.subtitle}>The more we know, the better our suggestions!</Text>
      </View>

      {/* Basic Info */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Basic Information</Text>
        
        <View style={styles.inputRow}>
          <View style={styles.halfInput}>
            <Text style={styles.inputLabel}>Age (approximate)</Text>
            <TextInput
              style={styles.textInput}
              value={formData.age}
              onChangeText={(text) => updateFormData('age', text)}
              placeholder="e.g., 25, 30s, teen"
              keyboardType="numeric"
            />
          </View>
          
          <View style={styles.halfInput}>
            <Text style={styles.inputLabel}>Gender</Text>
            <TextInput
              style={styles.textInput}
              value={formData.gender}
              onChangeText={(text) => updateFormData('gender', text)}
              placeholder="Male/Female/Other"
            />
          </View>
        </View>

        <Text style={styles.inputLabel}>Your relationship to them</Text>
        <TextInput
          style={styles.textInput}
          value={formData.relationship}
          onChangeText={(text) => updateFormData('relationship', text)}
          placeholder="e.g., Best friend, Sister, Colleague, Boss"
        />
      </View>

      {/* Personality Type */}
      <SingleSelectButtons
        title="What best describes their personality?"
        items={personalityTypes}
        selectedItem={formData.personalityType}
        onSelect={(item) => updateFormData('personalityType', item)}
      />

      {/* Interests */}
      <MultiSelectButtons
        title="What are they interested in? (Select all that apply)"
        items={interestCategories}
        selectedItems={formData.interests}
        onToggle={(item) => toggleArrayItem('interests', item)}
      />

      {/* Occasion */}
      <SingleSelectButtons
        title="What's the occasion?"
        items={occasionTypes}
        selectedItem={formData.occasion}
        onSelect={(item) => updateFormData('occasion', item)}
      />

      {/* Budget */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Budget Range ($)</Text>
        <View style={styles.inputRow}>
          <View style={styles.halfInput}>
            <Text style={styles.inputLabel}>Minimum</Text>
            <TextInput
              style={styles.textInput}
              value={formData.budget.min.toString()}
              onChangeText={(text) => updateFormData('budget', {
                ...formData.budget,
                min: parseInt(text) || 0
              })}
              placeholder="0"
              keyboardType="numeric"
            />
          </View>
          
          <View style={styles.halfInput}>
            <Text style={styles.inputLabel}>Maximum</Text>
            <TextInput
              style={styles.textInput}
              value={formData.budget.max.toString()}
              onChangeText={(text) => updateFormData('budget', {
                ...formData.budget,
                max: parseInt(text) || 100
              })}
              placeholder="100"
              keyboardType="numeric"
            />
          </View>
        </View>
      </View>

      {/* Gift Type Preferences */}
      <MultiSelectButtons
        title="What type of gifts do they usually appreciate?"
        items={giftTypes}
        selectedItems={formData.giftType}
        onToggle={(item) => toggleArrayItem('giftType', item)}
      />

      {/* Additional Notes */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Special Notes</Text>
        <Text style={styles.inputLabel}>
          Any specific likes, dislikes, or additional context?
        </Text>
        <TextInput
          style={[styles.textInput, styles.multilineInput]}
          value={formData.specialNotes}
          onChangeText={(text) => updateFormData('specialNotes', text)}
          placeholder="e.g., Vegetarian, loves vintage items, recently moved, allergic to cats..."
          multiline={true}
          numberOfLines={4}
        />
      </View>

      {/* Submit Button */}
      <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
        <Text style={styles.submitButtonText}>Generate Gift Suggestions</Text>
      </TouchableOpacity>

      <View style={styles.bottomSpacing} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 20,
    backgroundColor: '#ffffff',
    marginBottom: 10,
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
  sectionContainer: {
    backgroundColor: '#ffffff',
    marginBottom: 10,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  buttonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  selectButton: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  selectedButton: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  buttonText: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
  },
  selectedButtonText: {
    color: '#ffffff',
    fontWeight: '500',
  },
  inputRow: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 15,
  },
  halfInput: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#555',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#ffffff',
  },
  multilineInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    margin: 20,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  bottomSpacing: {
    height: 50,
  },
});

export default PersonalityInputForm;