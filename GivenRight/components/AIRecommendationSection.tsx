import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { AIRecommendationCard } from "./AIRecommendationCard";
import {
  generateRecommendations,
  filterRecommendations,
  type GiftRecommendation,
  type RecommendationRequest,
} from "../services/giftRecommendation";
import { useDecisionState } from "../store/useDecisionState";

interface Props {
  patternKey: string;
  direction: string;
}

export function AIRecommendationSection({ patternKey, direction }: Props) {
  const { budget, occasion, relationship } = useDecisionState();
  const [recommendations, setRecommendations] = useState<GiftRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    loadRecommendations();
  }, [patternKey, direction]);

  const loadRecommendations = async () => {
    setLoading(true);
    setError(null);

    try {
      // Map pattern + direction to personality traits
      const traits = mapToTraits(patternKey, direction);
      const budgetRange = mapBudgetRange(budget || "50_100");

      const request: RecommendationRequest = {
        personalityTraits: traits,
        occasion: occasion || "birthday",
        relationship: relationship?.type || "friend",
        budgetMin: budgetRange.min,
        budgetMax: budgetRange.max,
        giftTypePreference: patternKey,
      };

      // No API key = rule-based fallback (still useful)
      const raw = await generateRecommendations(request);
      const filtered = filterRecommendations(raw, budgetRange.max);

      setRecommendations(filtered.slice(0, 5));
    } catch (err) {
      console.warn("AI recommendation failed:", err);
      setError("Could not load AI suggestions");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <Text style={styles.sectionTitle}>✨ AI Suggestions</Text>
        </View>
        <ActivityIndicator size="small" color="#6366F1" style={{ marginTop: 16 }} />
      </View>
    );
  }

  if (error || recommendations.length === 0) {
    return null; // Fail silently — mock products still show above
  }

  const visibleRecs = expanded ? recommendations : recommendations.slice(0, 2);

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>✨ AI Suggestions</Text>
        <Text style={styles.subtitle}>Personalized for this gift direction</Text>
      </View>

      {visibleRecs.map((rec, i) => (
        <AIRecommendationCard key={rec.id} recommendation={rec} index={i} />
      ))}

      {recommendations.length > 2 && !expanded && (
        <TouchableOpacity
          style={styles.showMoreButton}
          onPress={() => setExpanded(true)}
          activeOpacity={0.7}
        >
          <Text style={styles.showMoreText}>
            Show {recommendations.length - 2} more suggestions
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ---- Helpers ----

function mapToTraits(patternKey: string, direction: string): string[] {
  const traitMap: Record<string, string[]> = {
    shared_experience: ["adventurous", "creative"],
    handwritten_personal: ["sentimental", "introverted"],
    curated_comfort: ["practical", "introverted"],
    symbolic_anchor: ["sentimental", "creative"],
    emotional_surprise: ["adventurous", "sentimental"],
    vulnerability_token: ["sentimental", "introverted"],
    statement_object: ["analytical", "practical"],
    experience_upgrade: ["adventurous", "creative"],
    unexpected_category: ["creative", "adventurous"],
  };

  return traitMap[patternKey] || ["practical"];
}

function mapBudgetRange(budget: string): { min: number; max: number } {
  const ranges: Record<string, { min: number; max: number }> = {
    under_50: { min: 10, max: 50 },
    "50_100": { min: 50, max: 100 },
    "100_250": { min: 100, max: 250 },
    "250_plus": { min: 250, max: 500 },
  };
  return ranges[budget] || { min: 50, max: 100 };
}

const styles = StyleSheet.create({
  container: {
    marginTop: 28,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  headerRow: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
  },
  subtitle: {
    fontSize: 13,
    color: "#9CA3AF",
    marginTop: 4,
  },
  showMoreButton: {
    alignItems: "center",
    paddingVertical: 14,
    backgroundColor: "#F3F4F6",
    borderRadius: 10,
    marginTop: 4,
  },
  showMoreText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6366F1",
  },
});