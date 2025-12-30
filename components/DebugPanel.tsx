import { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Platform } from "react-native";
import { useAppState } from "@/store/useAppState";
import { useDecisionState } from "@/store/useDecisionState";
import { useConfigState } from "@/store/useConfigState";

export function DebugPanel() {
  const [expanded, setExpanded] = useState(false);
  const { debugMode, toggleDebugMode } = useAppState();
  const decisionState = useDecisionState();
  const configState = useConfigState();

  useEffect(() => {
    configState.loadConfig();
  }, []);

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

  const getStatusBadge = () => {
    switch (configState.connectionStatus) {
      case "connected":
        return { text: "Supabase Live", color: "#00ff88" };
      case "connecting":
        return { text: "Connecting...", color: "#ffaa00" };
      case "fallback":
        return { text: "Fallback Mode", color: "#ff6b6b" };
      default:
        return { text: "Disconnected", color: "#888888" };
    }
  };

  const statusBadge = getStatusBadge();

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.header}
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.7}
      >
        <View style={styles.headerLeft}>
          <Text style={styles.headerText}>
            {expanded ? "▼" : "▶"} Debug [{decisionState.step}]
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: statusBadge.color + "22" }]}>
            <Text style={[styles.statusText, { color: statusBadge.color }]}>
              {statusBadge.text}
            </Text>
          </View>
        </View>
        <TouchableOpacity style={styles.closeButton} onPress={toggleDebugMode}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
      </TouchableOpacity>

      {expanded && (
        <ScrollView style={styles.content}>
          <Text style={styles.sectionTitle}>Config Status</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Connection:</Text>
            <Text style={[styles.value, { color: statusBadge.color }]}>{statusBadge.text}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Locale:</Text>
            <Text style={styles.value}>{configState.locale}</Text>
          </View>
          {configState.lastError && (
            <View style={styles.row}>
              <Text style={styles.label}>Error:</Text>
              <Text style={[styles.value, { color: "#ff6b6b" }]}>{configState.lastError}</Text>
            </View>
          )}
          {configState.parameters && (
            <View style={styles.row}>
              <Text style={styles.label}>Base Scores:</Text>
              <Text style={styles.value}>
                S:{configState.parameters.base.safe} E:{configState.parameters.base.emotional} B:{configState.parameters.base.bold}
              </Text>
            </View>
          )}

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
            style={styles.reloadButton}
            onPress={() => configState.loadConfig()}
          >
            <Text style={styles.testButtonText}>Reload Config</Text>
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
    maxHeight: 500,
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
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerText: {
    color: "#00ff88",
    fontWeight: "bold",
    fontSize: 14,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 9,
    fontWeight: "bold",
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
    maxHeight: 420,
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
  reloadButton: {
    backgroundColor: "#2a4a3a",
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
