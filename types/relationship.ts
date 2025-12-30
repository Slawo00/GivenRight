import type { ID } from './common';

export type RelationshipType =
  | 'partner'
  | 'family'
  | 'friend'
  | 'colleague'
  | 'acquaintance';

export interface Relationship {
  id: ID;
  type: RelationshipType;
  name: string;
  description?: string;
}
