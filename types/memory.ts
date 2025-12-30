import { DecisionDirection, OccasionType } from "./decision";
import { RelationshipType } from "./relationship";
import { ID } from "./common";

export type SuccessSignal = "pending" | "positive" | "neutral" | "negative";

export interface GiftMemoryEntry {
  id: ID;
  userId: string;
  recipientId: string;
  relationshipType: RelationshipType;
  patternId: string;
  confidenceType: DecisionDirection;
  occasionType: OccasionType;
  successSignal: SuccessSignal;
  createdAt: Date;
}

export interface HistoricalSuccess {
  id: ID;
  relationshipKey: string;
  patternId: string;
  confidenceType: DecisionDirection;
  successWeight: number;
  lastUsedAt: Date;
}

export interface NonRepetitionRule {
  id: ID;
  patternId: string;
  cooldownDays: number;
  appliesToConfidenceType?: DecisionDirection;
}

export interface RelationshipKey {
  userId: string;
  recipientId: string;
  relationshipType: RelationshipType;
}

export function buildRelationshipKey(key: RelationshipKey): string {
  return `${key.userId}:${key.recipientId}:${key.relationshipType}`;
}

export interface PatternSuppression {
  patternId: string;
  reason: "cooldown" | "negative_history";
  expiresAt?: Date;
}

export interface MemoryWriteInput {
  userId: string;
  recipientId: string;
  relationshipType: RelationshipType;
  patternId: string;
  confidenceType: DecisionDirection;
  occasionType: OccasionType;
}

export interface PatternPriority {
  patternId: string;
  boost: number;
  reason: "historical_success" | "variation_needed";
}
