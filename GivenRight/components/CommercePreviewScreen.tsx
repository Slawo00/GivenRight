import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useDecisionState } from "../store/useDecisionState";
import { useGiftMemoryState } from "../store/useGiftMemoryState";
import { ProductCard } from "./ProductCard";
import { AIRecommendationSection } from "./AIRecommendationSection";
import { resolveProducts } from "../services/productResolver";
import { Product } from "../types/product";

export function CommercePreviewScreen() {
  const {
    selectedPattern,
    selectedDirection,
    budget,
    occasion,
    relationship,
    resetDecision,
    completeWithExecution,
  } = useDecisionState();

  const { recordDecision, relationshipMemoryActive } = useGiftMemoryState();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProducts();
  }, [selectedPattern, selectedDirection, budget]);

  const loadProducts = async () => {
    if (!selectedPattern || !selectedDirection) {
      setError("Missing decision context");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await resolveProducts({
        patternKey: selectedPattern.patternKey,
        direction: selectedDirection,
        budgetRange: budget || "50_100",
        country: "US",
        locale: "en",
      });

      if (result.success) {
        setProducts(result.products);
        // Don't auto-complete — let user browse products first
        
        if (relationshipMemoryActive && relationship && occasion && selectedDirection && selectedPattern) {
          recordDecision({
            userId: "local_user",
            recipientId: `${relationship.type}_default`,
            relationshipType: relationship.type,
            patternId: selectedPattern.patternKey,
            confidenceType: selectedDirection,
            occasionType: occasion,
          }).catch(() => {});
        }
      } else {
        setError(result.error || "Could not load examples");
      }
    } catch {
      setError("We couldn't load examples right now. You can try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleStartNew = () => {
    completeWithExecution();
    resetDecision();
  };

  if (!selectedPattern) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No pattern selected</Text>
        <TouchableOpacity style={styles.secondaryButton} onPress={handleStartNew}>
          <Text style={styles.secondaryButtonText}>Start a new decision</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.patternIcon}>{selectedPattern.icon}</Text>
        <Text style={styles.patternTitle}>{selectedPattern.title}</Text>
        <Text style={styles.subtitle}>
          Concrete examples that match your choice
        </Text>
      </View>

      <View style={styles.disclosure}>
        <Text style={styles.disclosureText}>
          As an Amazon Associate, we earn from qualifying purchases.
          {"\n"}This does not influence which items are shown.
        </Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#009688" />
          <Text style={styles.loadingText}>Finding examples...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>📦</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadProducts}>
            <Text style={styles.retryButtonText}>Try again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.productList}>
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </View>
      )}

      {/* AI-Enhanced Recommendations Section */}
      {selectedPattern && selectedDirection && (
        <AIRecommendationSection
          patternKey={selectedPattern.patternKey}
          direction={selectedDirection}
        />
      )}

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={handleStartNew}
        >
          <Text style={styles.secondaryButtonText}>Start a new decision</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: "center",
    marginBottom: 20,
  },
  patternIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  patternTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1F2937",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: "#6B7280",
    textAlign: "center",
  },
  disclosure: {
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
    padding: 12,
    marginBottom: 24,
    borderLeftWidth: 3,
    borderLeftColor: "#9CA3AF",
  },
  disclosureText: {
    fontSize: 12,
    color: "#6B7280",
    lineHeight: 18,
    textAlign: "center",
  },
  loadingContainer: {
    alignItems: "center",
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: "#6B7280",
  },
  errorContainer: {
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 15,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: "#E5E7EB",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
  productList: {
    marginBottom: 24,
  },
  footer: {
    alignItems: "center",
    marginTop: 20,
  },
  secondaryButton: {
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    backgroundColor: "transparent",
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: "500",
    color: "#6B7280",
  },
});