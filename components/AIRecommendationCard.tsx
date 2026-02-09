import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
} from "react-native";
import type { GiftRecommendation } from "../services/giftRecommendation/aiService";

interface Props {
  recommendation: GiftRecommendation;
  index: number;
}

export function AIRecommendationCard({ recommendation, index }: Props) {
  const confidenceColor =
    recommendation.confidenceScore >= 85
      ? "#2D6A4F"
      : recommendation.confidenceScore >= 70
      ? "#D4A017"
      : "#DC6B2F";

  const handleShop = (url: string) => {
    Linking.openURL(url).catch(() => {});
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.rankBadge}>
          <Text style={styles.rankText}>#{index + 1}</Text>
        </View>
        <View style={styles.titleContainer}>
          <Text style={styles.title} numberOfLines={2}>
            {recommendation.title}
          </Text>
          <Text style={styles.category}>{recommendation.category}</Text>
        </View>
        <View
          style={[styles.scoreBadge, { backgroundColor: confidenceColor }]}
        >
          <Text style={styles.scoreText}>
            {recommendation.confidenceScore}%
          </Text>
        </View>
      </View>

      <Text style={styles.description} numberOfLines={3}>
        {recommendation.description}
      </Text>

      <View style={styles.priceRow}>
        <Text style={styles.price}>{recommendation.priceRange}</Text>
        {recommendation.aiGenerated && (
          <View style={styles.aiBadge}>
            <Text style={styles.aiBadgeText}>✨ AI Pick</Text>
          </View>
        )}
      </View>

      {recommendation.reasoning ? (
        <View style={styles.reasoningBox}>
          <Text style={styles.reasoningLabel}>Why this gift?</Text>
          <Text style={styles.reasoningText}>{recommendation.reasoning}</Text>
        </View>
      ) : null}

      <View style={styles.shopLinks}>
        {recommendation.purchaseLinks.slice(0, 3).map((link) => (
          <TouchableOpacity
            key={link.store}
            style={styles.shopButton}
            onPress={() => handleShop(link.url)}
            activeOpacity={0.7}
          >
            <Text style={styles.shopButtonText}>{link.store}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  rankText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#6B7280",
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    lineHeight: 22,
  },
  category: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 2,
    textTransform: "capitalize",
  },
  scoreBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    marginLeft: 8,
  },
  scoreText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  description: {
    fontSize: 14,
    color: "#4B5563",
    lineHeight: 21,
    marginBottom: 12,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  price: {
    fontSize: 15,
    fontWeight: "600",
    color: "#2D6A4F",
  },
  aiBadge: {
    marginLeft: 10,
    backgroundColor: "#EEF2FF",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  aiBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#6366F1",
  },
  reasoningBox: {
    backgroundColor: "#F9FAFB",
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: "#2D6A4F",
  },
  reasoningLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#6B7280",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  reasoningText: {
    fontSize: 13,
    color: "#4B5563",
    lineHeight: 19,
  },
  shopLinks: {
    flexDirection: "row",
    gap: 8,
  },
  shopButton: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  shopButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
  },
});