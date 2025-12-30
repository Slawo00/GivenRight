import { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Platform } from "react-native";
import { useAppState } from "@/store/useAppState";
import { useDecisionState } from "@/store/useDecisionState";

export function DebugPanel() {
  const [expanded, setExpanded] = useState(false);
  const { debugMode, toggleDebugMode } = useAppState();
  const decisionState = useDecisionState();

  if (!debugMode) {
    return null;
  }

  const scores = decisionState.decisionResult?.scores ?? [];
  const explanations = decisionState.decisionResult?.explanationByDirection;

  const getRecommendedDirection = () => {
    const recommended = scores.find((s) => s.recommended);
    return recommended?.direction ?? null;
  };

  const recommendedDir = getRecommendedDirection();

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.header}
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.7}
      >
        <Text style={styles.headerText}>
          {expanded ? "▼" : "▶"} Debug [{decisionState.step}]
        </Text>
        <TouchableOpacity style={styles.closeButton} onPress={toggleDebugMode}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
      </TouchableOpacity>

      {expanded && (
        <ScrollView style={styles.content}>
          <Text style={styles.sectionTitle}>Input State</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Relationship:</Text>
            <Text style={styles.value}>
              {decisionState.relationship?.type ?? "—"} (closeness: {decisionState.relationship?.closeness ?? "—"})
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Surprise:</Text>
            <Text style={styles.value}>{decisionState.relationship?.surpriseTolerance ?? "—"}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Occasion:</Text>
            <Text style={styles.value}>{decisionState.occasion ?? "—"}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Budget:</Text>
            <Text style={styles.value}>{decisionState.budget ?? "—"}</Text>
          </View>

          <Text style={styles.sectionTitle}>Decision Scores</Text>
          {scores.length === 0 ? (
            <Text style={styles.value}>No simulation run yet</Text>
          ) : (
            scores.map((s) => (
              <View
                key={s.direction}
                style={[
                  styles.scoreRow,
                  s.recommended && styles.recommendedRow,
                ]}
              >
                <Text style={[styles.direction, s.recommended && styles.recommendedText]}>
                  {s.direction.toUpperCase()}
                  {s.recommended ? " ★" : ""}
                </Text>
                <Text style={styles.scoreValue}>
                  Score: {s.score} | Risk: {s.risk}
                </Text>
              </View>
            ))
          )}

          {recommendedDir && explanations && (
            <>
              <Text style={styles.sectionTitle}>Recommended: {recommendedDir.toUpperCase()}</Text>
              <View style={styles.explanationBox}>
                <Text style={styles.explanationLabel}>Why this works:</Text>
                <Text style={styles.explanationText}>{explanations[recommendedDir].whyThisWorks}</Text>
                <Text style={styles.explanationLabel}>Risks:</Text>
                <Text style={styles.explanationText}>{explanations[recommendedDir].risks}</Text>
                <Text style={styles.explanationLabel}>Emotional Signal:</Text>
                <Text style={styles.explanationText}>{explanations[recommendedDir].emotionalSignal}</Text>
              </View>
            </>
          )}

          <Text style={styles.sectionTitle}>Selected Direction</Text>
          <Text style={styles.value}>{decisionState.selectedDirection ?? "—"}</Text>

          <TouchableOpacity
            style={styles.testButton}
            onPress={() => {
              decisionState.runTestScenario({
                relationship: {
                  type: "partner",
                  closeness: 5,
                  emotionalStyle: ["emotional"],
                  surpriseTolerance: "high",
                },
                occasion: "birthday",
                budget: "100_250",
              });
            }}
          >
            <Text style={styles.testButtonText}>Test: Partner Birthday</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.testButton}
            onPress={() => {
              decisionState.runTestScenario({
                relationship: {
                  type: "colleague",
                  closeness: 2,
                  emotionalStyle: ["practical"],
                  surpriseTolerance: "low",
                },
                occasion: "christmas",
                budget: "under_50",
              });
            }}
          >
            <Text style={styles.testButtonText}>Test: Colleague Christmas</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.testButton, styles.resetButton]}
            onPress={() => decisionState.resetDecision()}
          >
            <Text style={styles.testButtonText}>Reset</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 20,
    left: 10,
    right: 10,
    backgroundColor: "#1a1a1a",
    borderRadius: 8,
    overflow: "hidden",
    maxHeight: 450,
    ...Platform.select({
      web: {
        boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
      },
      default: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
      },
    }),
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#2a2a2a",
  },
  headerText: {
    color: "#00ff88",
    fontWeight: "bold",
    fontSize: 14,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  closeButton: {
    padding: 4,
  },
  closeText: {
    color: "#ff6b6b",
    fontSize: 16,
    fontWeight: "bold",
  },
  content: {
    padding: 12,
    maxHeight: 380,
  },
  sectionTitle: {
    color: "#00ff88",
    fontSize: 12,
    fontWeight: "bold",
    marginTop: 12,
    marginBottom: 6,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  row: {
    flexDirection: "row",
    marginBottom: 4,
  },
  label: {
    color: "#888888",
    fontSize: 11,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    width: 90,
  },
  value: {
    color: "#ffffff",
    fontSize: 11,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    flex: 1,
  },
  scoreRow: {
    backgroundColor: "#2a2a2a",
    padding: 8,
    borderRadius: 4,
    marginBottom: 4,
  },
  recommendedRow: {
    backgroundColor: "#1a4a2a",
    borderWidth: 1,
    borderColor: "#00ff88",
  },
  direction: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "bold",
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  recommendedText: {
    color: "#00ff88",
  },
  scoreValue: {
    color: "#aaaaaa",
    fontSize: 10,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    marginTop: 2,
  },
  explanationBox: {
    backgroundColor: "#2a2a2a",
    padding: 8,
    borderRadius: 4,
  },
  explanationLabel: {
    color: "#00ff88",
    fontSize: 10,
    fontWeight: "bold",
    marginTop: 4,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  explanationText: {
    color: "#cccccc",
    fontSize: 10,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    marginBottom: 4,
  },
  testButton: {
    backgroundColor: "#3a3a3a",
    padding: 10,
    borderRadius: 4,
    marginTop: 8,
    alignItems: "center",
  },
  resetButton: {
    backgroundColor: "#4a2a2a",
  },
  testButtonText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "bold",
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
});
