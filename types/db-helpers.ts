import type { Database } from './database';

export type MembershipTier = Database['public']['Enums']['membership_tier'];
export type AlignedStage = Database['public']['Enums']['aligned_stage'];
export type EventType = Database['public']['Enums']['event_type'];

export type CorridorOpportunity = Database['public']['Tables']['corridor_opportunities']['Row'];
export type CorridorInterest = Database['public']['Tables']['corridor_interests']['Row'];
export type AlignedTile = Database['public']['Tables']['aligned_tiles']['Row'];
export type Connection = Database['public']['Tables']['connections']['Row'];
