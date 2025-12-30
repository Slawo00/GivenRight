import { supabase, isSupabaseConfigured } from "../../config/supabase";
import {
  GiftMemoryEntry,
  HistoricalSuccess,
  NonRepetitionRule,
  MemoryWriteInput,
  PatternSuppression,
  PatternPriority,
  buildRelationshipKey,
  RelationshipKey,
  SuccessSignal,
} from "../../types/memory";
import { DecisionDirection } from "../../types/decision";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY_MEMORY = "@givenright_gift_memory";
const STORAGE_KEY_SUCCESS = "@givenright_historical_success";

const DEFAULT_COOLDOWN_DAYS = 90;
const NEGATIVE_WEIGHT_THRESHOLD = 0.3;

let localMemory: GiftMemoryEntry[] = [];
let localSuccess: HistoricalSuccess[] = [];
let localRules: NonRepetitionRule[] = [];

async function loadLocalMemory(): Promise<void> {
  try {
    const memoryData = await AsyncStorage.getItem(STORAGE_KEY_MEMORY);
    const successData = await AsyncStorage.getItem(STORAGE_KEY_SUCCESS);
    
    if (memoryData) {
      localMemory = JSON.parse(memoryData);
    }
    if (successData) {
      localSuccess = JSON.parse(successData);
    }
  } catch (error) {
    console.warn("Failed to load local memory:", error);
  }
}

async function saveLocalMemory(): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY_MEMORY, JSON.stringify(localMemory));
    await AsyncStorage.setItem(STORAGE_KEY_SUCCESS, JSON.stringify(localSuccess));
  } catch (error) {
    console.warn("Failed to save local memory:", error);
  }
}

function getDefaultRules(): NonRepetitionRule[] {
  return [
    { id: "1", patternId: "curated_classic", cooldownDays: 120 },
    { id: "2", patternId: "thoughtful_consumable", cooldownDays: 60 },
    { id: "3", patternId: "practical_upgrade", cooldownDays: 90 },
    { id: "4", patternId: "shared_experience", cooldownDays: 180 },
    { id: "5", patternId: "symbolic_object", cooldownDays: 365 },
    { id: "6", patternId: "personal_artifact", cooldownDays: 180 },
    { id: "7", patternId: "bespoke_creation", cooldownDays: 365 },
    { id: "8", patternId: "statement_piece", cooldownDays: 180 },
    { id: "9", patternId: "transformative_experience", cooldownDays: 365 },
  ];
}

export async function initializeMemoryService(): Promise<void> {
  localRules = getDefaultRules();
  await loadLocalMemory();
  
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from("non_repetition_rules")
        .select("*");
      
      if (!error && data && data.length > 0) {
        localRules = data.map((row: any) => ({
          id: row.id,
          patternId: row.pattern_id,
          cooldownDays: row.cooldown_days,
          appliesToConfidenceType: row.applies_to_confidence_type,
        }));
      }
    } catch (error) {
      console.warn("Using fallback cooldown rules");
    }
  }
}

export async function writeGiftMemory(input: MemoryWriteInput): Promise<GiftMemoryEntry | null> {
  const relationshipKey = buildRelationshipKey({
    userId: input.userId,
    recipientId: input.recipientId,
    relationshipType: input.relationshipType,
  });

  const entry: GiftMemoryEntry = {
    id: `local_${Date.now()}`,
    userId: input.userId,
    recipientId: input.recipientId,
    relationshipType: input.relationshipType,
    patternId: input.patternId,
    confidenceType: input.confidenceType,
    occasionType: input.occasionType,
    successSignal: "pending",
    createdAt: new Date(),
  };

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from("gift_memory")
        .insert({
          user_id: input.userId,
          recipient_id: input.recipientId,
          relationship_type: input.relationshipType,
          pattern_id: input.patternId,
          confidence_type: input.confidenceType,
          occasion_type: input.occasionType,
          success_signal: "pending",
        })
        .select()
        .single();

      if (!error && data) {
        entry.id = data.id;
      }

      await updateHistoricalSuccess(relationshipKey, input.patternId, input.confidenceType);
    } catch (error) {
      console.warn("Failed to write to Supabase, using local storage");
    }
  }

  localMemory.push(entry);
  await updateLocalHistoricalSuccess(relationshipKey, input.patternId, input.confidenceType);
  await saveLocalMemory();

  return entry;
}

async function updateHistoricalSuccess(
  relationshipKey: string,
  patternId: string,
  confidenceType: DecisionDirection
): Promise<void> {
  if (!isSupabaseConfigured) return;

  try {
    const { data: existing } = await supabase
      .from("historical_success")
      .select("*")
      .eq("relationship_key", relationshipKey)
      .eq("pattern_id", patternId)
      .single();

    if (existing) {
      await supabase
        .from("historical_success")
        .update({ last_used_at: new Date().toISOString() })
        .eq("id", existing.id);
    } else {
      await supabase
        .from("historical_success")
        .insert({
          relationship_key: relationshipKey,
          pattern_id: patternId,
          confidence_type: confidenceType,
          success_weight: 0.5,
          last_used_at: new Date().toISOString(),
        });
    }
  } catch (error) {
    console.warn("Failed to update historical success");
  }
}

async function updateLocalHistoricalSuccess(
  relationshipKey: string,
  patternId: string,
  confidenceType: DecisionDirection
): Promise<void> {
  const existingIndex = localSuccess.findIndex(
    (s) => s.relationshipKey === relationshipKey && s.patternId === patternId
  );

  if (existingIndex >= 0) {
    localSuccess[existingIndex].lastUsedAt = new Date();
  } else {
    localSuccess.push({
      id: `local_${Date.now()}`,
      relationshipKey,
      patternId,
      confidenceType,
      successWeight: 0.5,
      lastUsedAt: new Date(),
    });
  }
}

export async function getSuppressedPatterns(
  relationshipKey: RelationshipKey
): Promise<PatternSuppression[]> {
  const key = buildRelationshipKey(relationshipKey);
  const suppressions: PatternSuppression[] = [];
  const now = new Date();

  for (const rule of localRules) {
    const recentUsage = localMemory.find((m) => {
      if (m.patternId !== rule.patternId) return false;
      if (buildRelationshipKey({
        userId: m.userId,
        recipientId: m.recipientId,
        relationshipType: m.relationshipType,
      }) !== key) return false;

      const usageDate = new Date(m.createdAt);
      const daysSince = Math.floor((now.getTime() - usageDate.getTime()) / (1000 * 60 * 60 * 24));
      return daysSince < rule.cooldownDays;
    });

    if (recentUsage) {
      const usageDate = new Date(recentUsage.createdAt);
      const expiresAt = new Date(usageDate.getTime() + rule.cooldownDays * 24 * 60 * 60 * 1000);
      
      suppressions.push({
        patternId: rule.patternId,
        reason: "cooldown",
        expiresAt,
      });
    }
  }

  const negativePatterns = localSuccess.filter(
    (s) => s.relationshipKey === key && s.successWeight < NEGATIVE_WEIGHT_THRESHOLD
  );

  for (const neg of negativePatterns) {
    if (!suppressions.find((s) => s.patternId === neg.patternId)) {
      suppressions.push({
        patternId: neg.patternId,
        reason: "negative_history",
      });
    }
  }

  return suppressions;
}

export async function getPatternPriorities(
  relationshipKey: RelationshipKey
): Promise<PatternPriority[]> {
  const key = buildRelationshipKey(relationshipKey);
  const priorities: PatternPriority[] = [];

  const successfulPatterns = localSuccess.filter(
    (s) => s.relationshipKey === key && s.successWeight > 0.6
  );

  for (const success of successfulPatterns) {
    priorities.push({
      patternId: success.patternId,
      boost: (success.successWeight - 0.5) * 20,
      reason: "historical_success",
    });
  }

  const usedConfidenceTypes = localMemory
    .filter((m) => buildRelationshipKey({
      userId: m.userId,
      recipientId: m.recipientId,
      relationshipType: m.relationshipType,
    }) === key)
    .map((m) => m.confidenceType);

  const typeCounts: Record<DecisionDirection, number> = {
    safe: 0,
    emotional: 0,
    bold: 0,
  };

  for (const type of usedConfidenceTypes) {
    typeCounts[type]++;
  }

  const total = usedConfidenceTypes.length || 1;
  const avgCount = total / 3;

  const underusedTypes = (Object.keys(typeCounts) as DecisionDirection[]).filter(
    (type) => typeCounts[type] < avgCount * 0.5
  );

  return priorities;
}

export async function getMemoryForRelationship(
  relationshipKey: RelationshipKey
): Promise<GiftMemoryEntry[]> {
  const key = buildRelationshipKey(relationshipKey);
  
  return localMemory.filter((m) => 
    buildRelationshipKey({
      userId: m.userId,
      recipientId: m.recipientId,
      relationshipType: m.relationshipType,
    }) === key
  );
}

export async function updateSuccessSignal(
  memoryId: string,
  signal: SuccessSignal
): Promise<void> {
  const entry = localMemory.find((m) => m.id === memoryId);
  if (!entry) return;

  entry.successSignal = signal;

  const relationshipKey = buildRelationshipKey({
    userId: entry.userId,
    recipientId: entry.recipientId,
    relationshipType: entry.relationshipType,
  });

  const successEntry = localSuccess.find(
    (s) => s.relationshipKey === relationshipKey && s.patternId === entry.patternId
  );

  if (successEntry) {
    const delta = signal === "positive" ? 0.1 : signal === "negative" ? -0.2 : 0;
    successEntry.successWeight = Math.max(0, Math.min(1, successEntry.successWeight + delta));
  }

  await saveLocalMemory();

  if (isSupabaseConfigured) {
    try {
      await supabase
        .from("gift_memory")
        .update({ success_signal: signal })
        .eq("id", memoryId);
    } catch (error) {
      console.warn("Failed to update success signal in Supabase");
    }
  }
}

export function isMemoryServiceReady(): boolean {
  return localRules.length > 0;
}
