export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      admin_roles: {
        Row: {
          created_at: string | null
          granted_by: string | null
          member_id: string
          role: string
        }
        Insert: {
          created_at?: string | null
          granted_by?: string | null
          member_id: string
          role: string
        }
        Update: {
          created_at?: string | null
          granted_by?: string | null
          member_id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_roles_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_roles_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: true
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      aligned_history: {
        Row: {
          matched_at: string | null
          member_a: string
          member_b: string
        }
        Insert: {
          matched_at?: string | null
          member_a: string
          member_b: string
        }
        Update: {
          matched_at?: string | null
          member_a?: string
          member_b?: string
        }
        Relationships: []
      }
      aligned_interests: {
        Row: {
          expressed_at: string | null
          from_user_id: string
          id: string
          to_tile_id: string
        }
        Insert: {
          expressed_at?: string | null
          from_user_id: string
          id?: string
          to_tile_id: string
        }
        Update: {
          expressed_at?: string | null
          from_user_id?: string
          id?: string
          to_tile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "aligned_interests_from_user_id_fkey"
            columns: ["from_user_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aligned_interests_to_tile_id_fkey"
            columns: ["to_tile_id"]
            isOneToOne: false
            referencedRelation: "aligned_tiles"
            referencedColumns: ["id"]
          },
        ]
      }
      aligned_matches: {
        Row: {
          a_decided_at: string | null
          a_decision: string | null
          b_decided_at: string | null
          b_decision: string | null
          created_at: string | null
          expires_at: string
          id: number
          match_reasons: Json | null
          match_score: number | null
          member_a: string
          member_b: string
          revealed_at: string | null
          stage: Database["public"]["Enums"]["aligned_stage"]
          week_of: string
        }
        Insert: {
          a_decided_at?: string | null
          a_decision?: string | null
          b_decided_at?: string | null
          b_decision?: string | null
          created_at?: string | null
          expires_at: string
          id?: never
          match_reasons?: Json | null
          match_score?: number | null
          member_a: string
          member_b: string
          revealed_at?: string | null
          stage?: Database["public"]["Enums"]["aligned_stage"]
          week_of: string
        }
        Update: {
          a_decided_at?: string | null
          a_decision?: string | null
          b_decided_at?: string | null
          b_decision?: string | null
          created_at?: string | null
          expires_at?: string
          id?: never
          match_reasons?: Json | null
          match_score?: number | null
          member_a?: string
          member_b?: string
          revealed_at?: string | null
          stage?: Database["public"]["Enums"]["aligned_stage"]
          week_of?: string
        }
        Relationships: [
          {
            foreignKeyName: "aligned_matches_member_a_fkey"
            columns: ["member_a"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aligned_matches_member_b_fkey"
            columns: ["member_b"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      aligned_reports: {
        Row: {
          created_at: string | null
          id: number
          match_id: number | null
          reason: string
          reported: string
          reporter: string
          resolved_at: string | null
          resolved_by: string | null
        }
        Insert: {
          created_at?: string | null
          id?: never
          match_id?: number | null
          reason: string
          reported: string
          reporter: string
          resolved_at?: string | null
          resolved_by?: string | null
        }
        Update: {
          created_at?: string | null
          id?: never
          match_id?: number | null
          reason?: string
          reported?: string
          reporter?: string
          resolved_at?: string | null
          resolved_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "aligned_reports_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "aligned_matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aligned_reports_reported_fkey"
            columns: ["reported"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aligned_reports_reporter_fkey"
            columns: ["reporter"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aligned_reports_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      aligned_skips: {
        Row: {
          id: string
          skipped_at: string | null
          tile_id: string
          user_id: string
        }
        Insert: {
          id?: string
          skipped_at?: string | null
          tile_id: string
          user_id: string
        }
        Update: {
          id?: string
          skipped_at?: string | null
          tile_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "aligned_skips_tile_id_fkey"
            columns: ["tile_id"]
            isOneToOne: false
            referencedRelation: "aligned_tiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aligned_skips_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      aligned_tiles: {
        Row: {
          created_at: string | null
          description: string
          id: string
          image_path: string | null
          image_url: string | null
          is_active: boolean | null
          location: string | null
          tags: string[]
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description: string
          id?: string
          image_path?: string | null
          image_url?: string | null
          is_active?: boolean | null
          location?: string | null
          tags?: string[]
          type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string
          id?: string
          image_path?: string | null
          image_url?: string | null
          is_active?: boolean | null
          location?: string | null
          tags?: string[]
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "aligned_tiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      barcode_revocations: {
        Row: {
          id: number
          member_id: string
          reason: string
          revoked_at: string | null
          revoked_by: string | null
        }
        Insert: {
          id?: never
          member_id: string
          reason: string
          revoked_at?: string | null
          revoked_by?: string | null
        }
        Update: {
          id?: never
          member_id?: string
          reason?: string
          revoked_at?: string | null
          revoked_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "barcode_revocations_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "barcode_revocations_revoked_by_fkey"
            columns: ["revoked_by"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      barcode_seeds: {
        Row: {
          created_at: string | null
          date_bucket: string
          seed: string
        }
        Insert: {
          created_at?: string | null
          date_bucket?: string
          seed?: string
        }
        Update: {
          created_at?: string | null
          date_bucket?: string
          seed?: string
        }
        Relationships: []
      }
      city_presence: {
        Row: {
          city: string
          is_active: boolean | null
          last_active_at: string | null
          member_id: string
        }
        Insert: {
          city: string
          is_active?: boolean | null
          last_active_at?: string | null
          member_id: string
        }
        Update: {
          city?: string
          is_active?: boolean | null
          last_active_at?: string | null
          member_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "city_presence_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: true
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      connections: {
        Row: {
          connected_at: string | null
          id: string
          matched_via: string
          status: string | null
          tile_a_id: string | null
          tile_b_id: string | null
          user_a: string
          user_b: string
        }
        Insert: {
          connected_at?: string | null
          id?: string
          matched_via: string
          status?: string | null
          tile_a_id?: string | null
          tile_b_id?: string | null
          user_a: string
          user_b: string
        }
        Update: {
          connected_at?: string | null
          id?: string
          matched_via?: string
          status?: string | null
          tile_a_id?: string | null
          tile_b_id?: string | null
          user_a?: string
          user_b?: string
        }
        Relationships: [
          {
            foreignKeyName: "connections_tile_a_id_fkey"
            columns: ["tile_a_id"]
            isOneToOne: false
            referencedRelation: "aligned_tiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "connections_tile_b_id_fkey"
            columns: ["tile_b_id"]
            isOneToOne: false
            referencedRelation: "aligned_tiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "connections_user_a_fkey"
            columns: ["user_a"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "connections_user_b_fkey"
            columns: ["user_b"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      corridor_interests: {
        Row: {
          created_at: string | null
          expressed_at: string | null
          id: number
          member_id: string
          message: string | null
          opportunity_id: number
          reviewed_at: string | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          expressed_at?: string | null
          id?: never
          member_id: string
          message?: string | null
          opportunity_id: number
          reviewed_at?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          expressed_at?: string | null
          id?: never
          member_id?: string
          message?: string | null
          opportunity_id?: number
          reviewed_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "corridor_interests_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "corridor_interests_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "corridor_opportunities"
            referencedColumns: ["id"]
          },
        ]
      }
      corridor_opportunities: {
        Row: {
          closing_date: string | null
          created_at: string | null
          description: string | null
          id: number
          is_active: boolean | null
          min_tier: Database["public"]["Enums"]["membership_tier"]
          partner_name: string | null
          posted_by: string | null
          title: string
          type: Database["public"]["Enums"]["opportunity_type"]
          updated_at: string | null
        }
        Insert: {
          closing_date?: string | null
          created_at?: string | null
          description?: string | null
          id?: never
          is_active?: boolean | null
          min_tier?: Database["public"]["Enums"]["membership_tier"]
          partner_name?: string | null
          posted_by?: string | null
          title: string
          type: Database["public"]["Enums"]["opportunity_type"]
          updated_at?: string | null
        }
        Update: {
          closing_date?: string | null
          created_at?: string | null
          description?: string | null
          id?: never
          is_active?: boolean | null
          min_tier?: Database["public"]["Enums"]["membership_tier"]
          partner_name?: string | null
          posted_by?: string | null
          title?: string
          type?: Database["public"]["Enums"]["opportunity_type"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "corridor_opportunities_posted_by_fkey"
            columns: ["posted_by"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      dead_letter_queue: {
        Row: {
          attempts: number | null
          created_at: string | null
          error_message: string | null
          function_name: string
          id: number
          last_attempt_at: string | null
          payload: Json
          resolved_at: string | null
        }
        Insert: {
          attempts?: number | null
          created_at?: string | null
          error_message?: string | null
          function_name: string
          id?: never
          last_attempt_at?: string | null
          payload: Json
          resolved_at?: string | null
        }
        Update: {
          attempts?: number | null
          created_at?: string | null
          error_message?: string | null
          function_name?: string
          id?: never
          last_attempt_at?: string | null
          payload?: Json
          resolved_at?: string | null
        }
        Relationships: []
      }
      event_rsvps: {
        Row: {
          checked_in_at: string | null
          checked_in_by: string | null
          created_at: string | null
          event_id: number
          eventbrite_attendee_id: string | null
          id: number
          member_id: string
          status: Database["public"]["Enums"]["rsvp_status"]
        }
        Insert: {
          checked_in_at?: string | null
          checked_in_by?: string | null
          created_at?: string | null
          event_id: number
          eventbrite_attendee_id?: string | null
          id?: never
          member_id: string
          status?: Database["public"]["Enums"]["rsvp_status"]
        }
        Update: {
          checked_in_at?: string | null
          checked_in_by?: string | null
          created_at?: string | null
          event_id?: number
          eventbrite_attendee_id?: string | null
          id?: never
          member_id?: string
          status?: Database["public"]["Enums"]["rsvp_status"]
        }
        Relationships: [
          {
            foreignKeyName: "event_rsvps_checked_in_by_fkey"
            columns: ["checked_in_by"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_rsvps_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_rsvps_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          capacity: number | null
          cover_image_path: string | null
          created_at: string | null
          description: string | null
          early_access_at: string | null
          ends_at: string | null
          eventbrite_id: string | null
          general_access_at: string | null
          id: number
          min_tier: Database["public"]["Enums"]["membership_tier"]
          starts_at: string
          title: string
          type: Database["public"]["Enums"]["event_type"]
          updated_at: string | null
          venue_address: string | null
          venue_lat: number | null
          venue_lng: number | null
          venue_name: string | null
        }
        Insert: {
          capacity?: number | null
          cover_image_path?: string | null
          created_at?: string | null
          description?: string | null
          early_access_at?: string | null
          ends_at?: string | null
          eventbrite_id?: string | null
          general_access_at?: string | null
          id?: never
          min_tier?: Database["public"]["Enums"]["membership_tier"]
          starts_at: string
          title: string
          type: Database["public"]["Enums"]["event_type"]
          updated_at?: string | null
          venue_address?: string | null
          venue_lat?: number | null
          venue_lng?: number | null
          venue_name?: string | null
        }
        Update: {
          capacity?: number | null
          cover_image_path?: string | null
          created_at?: string | null
          description?: string | null
          early_access_at?: string | null
          ends_at?: string | null
          eventbrite_id?: string | null
          general_access_at?: string | null
          id?: never
          min_tier?: Database["public"]["Enums"]["membership_tier"]
          starts_at?: string
          title?: string
          type?: Database["public"]["Enums"]["event_type"]
          updated_at?: string | null
          venue_address?: string | null
          venue_lat?: number | null
          venue_lng?: number | null
          venue_name?: string | null
        }
        Relationships: []
      }
      invitation_codes: {
        Row: {
          code: string
          code_hash: string | null
          code_prefix: string | null
          created_at: string | null
          created_by: string | null
          expires_at: string
          grants_admin: boolean
          id: number
          tier_grant: Database["public"]["Enums"]["membership_tier"] | null
          used_at: string | null
          used_by: string | null
        }
        Insert: {
          code: string
          code_hash?: string | null
          code_prefix?: string | null
          created_at?: string | null
          created_by?: string | null
          expires_at: string
          grants_admin?: boolean
          id?: never
          tier_grant?: Database["public"]["Enums"]["membership_tier"] | null
          used_at?: string | null
          used_by?: string | null
        }
        Update: {
          code?: string
          code_hash?: string | null
          code_prefix?: string | null
          created_at?: string | null
          created_by?: string | null
          expires_at?: string
          grants_admin?: boolean
          id?: never
          tier_grant?: Database["public"]["Enums"]["membership_tier"] | null
          used_at?: string | null
          used_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invitation_codes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invitation_codes_used_by_fkey"
            columns: ["used_by"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      members: {
        Row: {
          bio: string | null
          city: string | null
          company: string | null
          consent_given_at: string | null
          consent_version: string | null
          created_at: string | null
          current_project: string | null
          deletion_requested_at: string | null
          display_id: string
          email: string
          expo_push_token: string | null
          full_name: string
          id: string
          industry: string | null
          interests: string[] | null
          invited_by: string | null
          notification_preferences: Json | null
          onboarded_at: string | null
          photo_url: string | null
          skills: string[] | null
          status: Database["public"]["Enums"]["member_status"]
          tier: Database["public"]["Enums"]["membership_tier"]
          title: string | null
          updated_at: string | null
        }
        Insert: {
          bio?: string | null
          city?: string | null
          company?: string | null
          consent_given_at?: string | null
          consent_version?: string | null
          created_at?: string | null
          current_project?: string | null
          deletion_requested_at?: string | null
          display_id: string
          email: string
          expo_push_token?: string | null
          full_name: string
          id: string
          industry?: string | null
          interests?: string[] | null
          invited_by?: string | null
          notification_preferences?: Json | null
          onboarded_at?: string | null
          photo_url?: string | null
          skills?: string[] | null
          status?: Database["public"]["Enums"]["member_status"]
          tier?: Database["public"]["Enums"]["membership_tier"]
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          bio?: string | null
          city?: string | null
          company?: string | null
          consent_given_at?: string | null
          consent_version?: string | null
          created_at?: string | null
          current_project?: string | null
          deletion_requested_at?: string | null
          display_id?: string
          email?: string
          expo_push_token?: string | null
          full_name?: string
          id?: string
          industry?: string | null
          interests?: string[] | null
          invited_by?: string | null
          notification_preferences?: Json | null
          onboarded_at?: string | null
          photo_url?: string | null
          skills?: string[] | null
          status?: Database["public"]["Enums"]["member_status"]
          tier?: Database["public"]["Enums"]["membership_tier"]
          title?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "members_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string | null
          data: Json | null
          id: number
          member_id: string
          read_at: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
        }
        Insert: {
          body?: string | null
          created_at?: string | null
          data?: Json | null
          id?: never
          member_id: string
          read_at?: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
        }
        Update: {
          body?: string | null
          created_at?: string | null
          data?: Json | null
          id?: never
          member_id?: string
          read_at?: string | null
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
        }
        Relationships: [
          {
            foreignKeyName: "notifications_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      pulse_editions: {
        Row: {
          created_at: string | null
          full_content: Json
          headline: string
          hero_image_path: string | null
          id: number
          publish_date: string
          stats: Json | null
          status: string
          summary_content: Json | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          full_content: Json
          headline: string
          hero_image_path?: string | null
          id?: never
          publish_date: string
          stats?: Json | null
          status?: string
          summary_content?: Json | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          full_content?: Json
          headline?: string
          hero_image_path?: string | null
          id?: never
          publish_date?: string
          stats?: Json | null
          status?: string
          summary_content?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          created_at: string | null
          endpoint: string
          id: number
          ip_address: string
        }
        Insert: {
          created_at?: string | null
          endpoint: string
          id?: never
          ip_address: string
        }
        Update: {
          created_at?: string | null
          endpoint?: string
          id?: never
          ip_address?: string
        }
        Relationships: []
      }
      tier_changes: {
        Row: {
          changed_by: string
          created_at: string | null
          id: number
          member_id: string
          new_tier: Database["public"]["Enums"]["membership_tier"]
          old_tier: Database["public"]["Enums"]["membership_tier"]
          reason: string
        }
        Insert: {
          changed_by: string
          created_at?: string | null
          id?: never
          member_id: string
          new_tier: Database["public"]["Enums"]["membership_tier"]
          old_tier: Database["public"]["Enums"]["membership_tier"]
          reason: string
        }
        Update: {
          changed_by?: string
          created_at?: string | null
          id?: never
          member_id?: string
          new_tier?: Database["public"]["Enums"]["membership_tier"]
          old_tier?: Database["public"]["Enums"]["membership_tier"]
          reason?: string
        }
        Relationships: [
          {
            foreignKeyName: "tier_changes_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tier_changes_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      aligned_decide: {
        Args: { p_decision?: string; p_match_id: number; p_member_id?: string }
        Returns: Json
      }
      aligned_discovery_tiles: {
        Args: { p_limit?: number; p_type?: string }
        Returns: {
          created_at: string
          description: string
          id: string
          image_path: string
          image_url: string
          location: string
          owner_tier: Database["public"]["Enums"]["membership_tier"]
          tags: string[]
          type: string
        }[]
      }
      aligned_express_interest: { Args: { p_tile_id: string }; Returns: Json }
      change_member_tier: {
        Args: {
          p_changed_by?: string
          p_member_id: string
          p_new_tier: Database["public"]["Enums"]["membership_tier"]
          p_reason: string
        }
        Returns: Json
      }
      check_rate_limit: {
        Args: {
          p_endpoint: string
          p_ip: string
          p_max_requests?: number
          p_window_minutes?: number
        }
        Returns: boolean
      }
      cleanup_rate_limits: { Args: never; Returns: undefined }
      custom_access_token_hook: { Args: { event: Json }; Returns: Json }
      ensure_daily_seed: { Args: never; Returns: string }
      generate_barcode_token: { Args: { p_member_id?: string }; Returns: Json }
      generate_display_id: { Args: never; Returns: string }
      generate_weekly_matches: { Args: never; Returns: number }
      get_aligned_connections: {
        Args: { p_limit?: number }
        Returns: {
          city: string
          company: string
          connected_at: string
          full_name: string
          id: string
          matched_via: string
          other_member_id: string
          photo_url: string
          tier: Database["public"]["Enums"]["membership_tier"]
          title: string
        }[]
      }
      get_member_tier: {
        Args: never
        Returns: Database["public"]["Enums"]["membership_tier"]
      }
      is_active_member: { Args: never; Returns: boolean }
      is_admin: { Args: never; Returns: boolean }
      redeem_invitation_code: {
        Args: {
          p_city?: string
          p_code: string
          p_email: string
          p_full_name: string
          p_industry?: string
          p_user_id: string
        }
        Returns: Json
      }
      rsvp_to_event: {
        Args: { p_event_id: number; p_member_id?: string }
        Returns: Json
      }
      tier_level: {
        Args: { t: Database["public"]["Enums"]["membership_tier"] }
        Returns: number
      }
      validate_invitation_code: { Args: { p_code: string }; Returns: Json }
      verify_barcode: {
        Args: { p_event_id?: number; p_token: string }
        Returns: Json
      }
    }
    Enums: {
      aligned_stage: "new" | "accepted" | "revealed" | "expired" | "declined"
      event_type: "vibes" | "dinner" | "talk" | "gala"
      member_status: "pending" | "active" | "suspended" | "inactive"
      membership_tier: "member" | "silver" | "platinum" | "laureate"
      notification_type:
        | "pulse"
        | "aligned"
        | "event"
        | "tier_change"
        | "system"
      opportunity_type:
        | "co_invest"
        | "board"
        | "speaking"
        | "procurement"
        | "advisory"
      rsvp_status: "confirmed" | "waitlisted" | "cancelled"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  storage: {
    Tables: {
      buckets: {
        Row: {
          allowed_mime_types: string[] | null
          avif_autodetection: boolean | null
          created_at: string | null
          file_size_limit: number | null
          id: string
          name: string
          owner: string | null
          owner_id: string | null
          public: boolean | null
          type: Database["storage"]["Enums"]["buckettype"]
          updated_at: string | null
        }
        Insert: {
          allowed_mime_types?: string[] | null
          avif_autodetection?: boolean | null
          created_at?: string | null
          file_size_limit?: number | null
          id: string
          name: string
          owner?: string | null
          owner_id?: string | null
          public?: boolean | null
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string | null
        }
        Update: {
          allowed_mime_types?: string[] | null
          avif_autodetection?: boolean | null
          created_at?: string | null
          file_size_limit?: number | null
          id?: string
          name?: string
          owner?: string | null
          owner_id?: string | null
          public?: boolean | null
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string | null
        }
        Relationships: []
      }
      buckets_analytics: {
        Row: {
          created_at: string
          deleted_at: string | null
          format: string
          id: string
          name: string
          type: Database["storage"]["Enums"]["buckettype"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          format?: string
          id?: string
          name: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          format?: string
          id?: string
          name?: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Relationships: []
      }
      buckets_vectors: {
        Row: {
          created_at: string
          id: string
          type: Database["storage"]["Enums"]["buckettype"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Relationships: []
      }
      iceberg_namespaces: {
        Row: {
          bucket_name: string
          catalog_id: string
          created_at: string
          id: string
          metadata: Json
          name: string
          updated_at: string
        }
        Insert: {
          bucket_name: string
          catalog_id: string
          created_at?: string
          id?: string
          metadata?: Json
          name: string
          updated_at?: string
        }
        Update: {
          bucket_name?: string
          catalog_id?: string
          created_at?: string
          id?: string
          metadata?: Json
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "iceberg_namespaces_catalog_id_fkey"
            columns: ["catalog_id"]
            isOneToOne: false
            referencedRelation: "buckets_analytics"
            referencedColumns: ["id"]
          },
        ]
      }
      iceberg_tables: {
        Row: {
          bucket_name: string
          catalog_id: string
          created_at: string
          id: string
          location: string
          name: string
          namespace_id: string
          remote_table_id: string | null
          shard_id: string | null
          shard_key: string | null
          updated_at: string
        }
        Insert: {
          bucket_name: string
          catalog_id: string
          created_at?: string
          id?: string
          location: string
          name: string
          namespace_id: string
          remote_table_id?: string | null
          shard_id?: string | null
          shard_key?: string | null
          updated_at?: string
        }
        Update: {
          bucket_name?: string
          catalog_id?: string
          created_at?: string
          id?: string
          location?: string
          name?: string
          namespace_id?: string
          remote_table_id?: string | null
          shard_id?: string | null
          shard_key?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "iceberg_tables_catalog_id_fkey"
            columns: ["catalog_id"]
            isOneToOne: false
            referencedRelation: "buckets_analytics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "iceberg_tables_namespace_id_fkey"
            columns: ["namespace_id"]
            isOneToOne: false
            referencedRelation: "iceberg_namespaces"
            referencedColumns: ["id"]
          },
        ]
      }
      migrations: {
        Row: {
          executed_at: string | null
          hash: string
          id: number
          name: string
        }
        Insert: {
          executed_at?: string | null
          hash: string
          id: number
          name: string
        }
        Update: {
          executed_at?: string | null
          hash?: string
          id?: number
          name?: string
        }
        Relationships: []
      }
      objects: {
        Row: {
          bucket_id: string | null
          created_at: string | null
          id: string
          last_accessed_at: string | null
          metadata: Json | null
          name: string | null
          owner: string | null
          owner_id: string | null
          path_tokens: string[] | null
          updated_at: string | null
          user_metadata: Json | null
          version: string | null
        }
        Insert: {
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          owner_id?: string | null
          path_tokens?: string[] | null
          updated_at?: string | null
          user_metadata?: Json | null
          version?: string | null
        }
        Update: {
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          owner_id?: string | null
          path_tokens?: string[] | null
          updated_at?: string | null
          user_metadata?: Json | null
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "objects_bucketId_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
        ]
      }
      s3_multipart_uploads: {
        Row: {
          bucket_id: string
          created_at: string
          id: string
          in_progress_size: number
          key: string
          owner_id: string | null
          upload_signature: string
          user_metadata: Json | null
          version: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          id: string
          in_progress_size?: number
          key: string
          owner_id?: string | null
          upload_signature: string
          user_metadata?: Json | null
          version: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          id?: string
          in_progress_size?: number
          key?: string
          owner_id?: string | null
          upload_signature?: string
          user_metadata?: Json | null
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "s3_multipart_uploads_bucket_id_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
        ]
      }
      s3_multipart_uploads_parts: {
        Row: {
          bucket_id: string
          created_at: string
          etag: string
          id: string
          key: string
          owner_id: string | null
          part_number: number
          size: number
          upload_id: string
          version: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          etag: string
          id?: string
          key: string
          owner_id?: string | null
          part_number: number
          size?: number
          upload_id: string
          version: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          etag?: string
          id?: string
          key?: string
          owner_id?: string | null
          part_number?: number
          size?: number
          upload_id?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "s3_multipart_uploads_parts_bucket_id_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "s3_multipart_uploads_parts_upload_id_fkey"
            columns: ["upload_id"]
            isOneToOne: false
            referencedRelation: "s3_multipart_uploads"
            referencedColumns: ["id"]
          },
        ]
      }
      vector_indexes: {
        Row: {
          bucket_id: string
          created_at: string
          data_type: string
          dimension: number
          distance_metric: string
          id: string
          metadata_configuration: Json | null
          name: string
          updated_at: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          data_type: string
          dimension: number
          distance_metric: string
          id?: string
          metadata_configuration?: Json | null
          name: string
          updated_at?: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          data_type?: string
          dimension?: number
          distance_metric?: string
          id?: string
          metadata_configuration?: Json | null
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "vector_indexes_bucket_id_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets_vectors"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_insert_object: {
        Args: { bucketid: string; metadata: Json; name: string; owner: string }
        Returns: undefined
      }
      extension: { Args: { name: string }; Returns: string }
      filename: { Args: { name: string }; Returns: string }
      foldername: { Args: { name: string }; Returns: string[] }
      get_common_prefix: {
        Args: { p_delimiter: string; p_key: string; p_prefix: string }
        Returns: string
      }
      get_size_by_bucket: {
        Args: never
        Returns: {
          bucket_id: string
          size: number
        }[]
      }
      list_multipart_uploads_with_delimiter: {
        Args: {
          bucket_id: string
          delimiter_param: string
          max_keys?: number
          next_key_token?: string
          next_upload_token?: string
          prefix_param: string
        }
        Returns: {
          created_at: string
          id: string
          key: string
        }[]
      }
      list_objects_with_delimiter: {
        Args: {
          _bucket_id: string
          delimiter_param: string
          max_keys?: number
          next_token?: string
          prefix_param: string
          sort_order?: string
          start_after?: string
        }
        Returns: {
          created_at: string
          id: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
      operation: { Args: never; Returns: string }
      search: {
        Args: {
          bucketname: string
          levels?: number
          limits?: number
          offsets?: number
          prefix: string
          search?: string
          sortcolumn?: string
          sortorder?: string
        }
        Returns: {
          created_at: string
          id: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
      search_by_timestamp: {
        Args: {
          p_bucket_id: string
          p_level: number
          p_limit: number
          p_prefix: string
          p_sort_column: string
          p_sort_column_after: string
          p_sort_order: string
          p_start_after: string
        }
        Returns: {
          created_at: string
          id: string
          key: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
      search_v2: {
        Args: {
          bucket_name: string
          levels?: number
          limits?: number
          prefix: string
          sort_column?: string
          sort_column_after?: string
          sort_order?: string
          start_after?: string
        }
        Returns: {
          created_at: string
          id: string
          key: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
    }
    Enums: {
      buckettype: "STANDARD" | "ANALYTICS" | "VECTOR"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      aligned_stage: ["new", "accepted", "revealed", "expired", "declined"],
      event_type: ["vibes", "dinner", "talk", "gala"],
      member_status: ["pending", "active", "suspended", "inactive"],
      membership_tier: ["member", "silver", "platinum", "laureate"],
      notification_type: ["pulse", "aligned", "event", "tier_change", "system"],
      opportunity_type: [
        "co_invest",
        "board",
        "speaking",
        "procurement",
        "advisory",
      ],
      rsvp_status: ["confirmed", "waitlisted", "cancelled"],
    },
  },
  storage: {
    Enums: {
      buckettype: ["STANDARD", "ANALYTICS", "VECTOR"],
    },
  },
} as const

