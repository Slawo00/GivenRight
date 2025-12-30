export type RelationshipType =
  | "partner"
  | "parent"
  | "child"
  | "friend"
  | "colleague"
  | "other";

export type SurpriseTolerance = "low" | "medium" | "high";

export interface RelationshipProfile {
  type: RelationshipType;
  closeness: number;
  emotionalStyle: string[];
  surpriseTolerance: SurpriseTolerance;
}
