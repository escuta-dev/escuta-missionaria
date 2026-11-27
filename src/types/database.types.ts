export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "17.1"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      consents: {
        Row: {
          consent_type: Database["public"]["Enums"]["consent_type"]
          created_at: string
          event_no: number
          granted: boolean
          granted_at: string | null
          id: string
          missionary_id: string
          policy_version: string
          revoked_at: string | null
        }
        Insert: {
          consent_type: Database["public"]["Enums"]["consent_type"]
          created_at?: string
          event_no?: never
          granted: boolean
          granted_at?: string | null
          id?: string
          missionary_id: string
          policy_version: string
          revoked_at?: string | null
        }
        Update: {
          consent_type?: Database["public"]["Enums"]["consent_type"]
          created_at?: string
          event_no?: never
          granted?: boolean
          granted_at?: string | null
          id?: string
          missionary_id?: string
          policy_version?: string
          revoked_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "consents_missionary_id_fkey"
            columns: ["missionary_id"]
            isOneToOne: false
            referencedRelation: "missionaries"
            referencedColumns: ["id"]
          },
        ]
      }
      missionaries: {
        Row: {
          biography: string | null
          city: string | null
          country: string | null
          created_at: string
          financial_support_range: string | null
          has_children: boolean | null
          has_vehicle: boolean | null
          id: string
          lives_in_mission_base: boolean | null
          marital_status: string | null
          ministry_description: string | null
          mission_area: string | null
          missionary_start_date: string | null
          profile_id: string
          state: string | null
          updated_at: string
        }
        Insert: {
          biography?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          financial_support_range?: string | null
          has_children?: boolean | null
          has_vehicle?: boolean | null
          id?: string
          lives_in_mission_base?: boolean | null
          marital_status?: string | null
          ministry_description?: string | null
          mission_area?: string | null
          missionary_start_date?: string | null
          profile_id: string
          state?: string | null
          updated_at?: string
        }
        Update: {
          biography?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          financial_support_range?: string | null
          has_children?: boolean | null
          has_vehicle?: boolean | null
          id?: string
          lives_in_mission_base?: boolean | null
          marital_status?: string | null
          ministry_description?: string | null
          mission_area?: string | null
          missionary_start_date?: string | null
          profile_id?: string
          state?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "missionaries_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      missionary_organizations: {
        Row: {
          created_at: string
          end_date: string | null
          id: string
          missionary_id: string
          organization_id: string
          relationship_type: string
          start_date: string | null
        }
        Insert: {
          created_at?: string
          end_date?: string | null
          id?: string
          missionary_id: string
          organization_id: string
          relationship_type: string
          start_date?: string | null
        }
        Update: {
          created_at?: string
          end_date?: string | null
          id?: string
          missionary_id?: string
          organization_id?: string
          relationship_type?: string
          start_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "missionary_organizations_missionary_id_fkey"
            columns: ["missionary_id"]
            isOneToOne: false
            referencedRelation: "missionaries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "missionary_organizations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      missionary_updates: {
        Row: {
          activities: string | null
          challenges: string | null
          community_relationship: string | null
          people_reached: number | null
          testimony: string | null
          support_situation: string | null
          urgent_needs: string | null
          support_needed: string | null
          created_at: string
          id: string
          missionary_id: string
          next_steps: string | null
          prayer_requests: string | null
          reporting_period_id: string
          results: string | null
          review_note: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["update_status"]
          submitted_at: string | null
          updated_at: string
        }
        Insert: {
          activities?: string | null
          challenges?: string | null
          community_relationship?: string | null
          people_reached?: number | null
          testimony?: string | null
          support_situation?: string | null
          urgent_needs?: string | null
          support_needed?: string | null
          created_at?: string
          id?: string
          missionary_id: string
          next_steps?: string | null
          prayer_requests?: string | null
          reporting_period_id: string
          results?: string | null
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["update_status"]
          submitted_at?: string | null
          updated_at?: string
        }
        Update: {
          activities?: string | null
          challenges?: string | null
          community_relationship?: string | null
          people_reached?: number | null
          testimony?: string | null
          support_situation?: string | null
          urgent_needs?: string | null
          support_needed?: string | null
          created_at?: string
          id?: string
          missionary_id?: string
          next_steps?: string | null
          prayer_requests?: string | null
          reporting_period_id?: string
          results?: string | null
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["update_status"]
          submitted_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "missionary_updates_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "update_period_owner_fk"
            columns: ["reporting_period_id", "missionary_id"]
            isOneToOne: false
            referencedRelation: "reporting_periods"
            referencedColumns: ["id", "missionary_id"]
          },
        ]
      }
      notifications: {
        Row: {
          channel: string
          created_at: string
          error_detail: string | null
          id: string
          notification_type: string
          profile_id: string
          scheduled_for: string | null
          sent_at: string | null
          status: Database["public"]["Enums"]["notification_status"]
        }
        Insert: {
          channel?: string
          created_at?: string
          error_detail?: string | null
          id?: string
          notification_type: string
          profile_id: string
          scheduled_for?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["notification_status"]
        }
        Update: {
          channel?: string
          created_at?: string
          error_detail?: string | null
          id?: string
          notification_type?: string
          profile_id?: string
          scheduled_for?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["notification_status"]
        }
        Relationships: [
          {
            foreignKeyName: "notifications_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          city: string | null
          contact_email: string | null
          country: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          organization_type: Database["public"]["Enums"]["organization_type"]
          state: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          city?: string | null
          contact_email?: string | null
          country?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          organization_type?: Database["public"]["Enums"]["organization_type"]
          state?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          city?: string | null
          contact_email?: string | null
          country?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          organization_type?: Database["public"]["Enums"]["organization_type"]
          state?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      private_requests: {
        Row: {
          created_at: string
          description: string
          id: string
          missionary_id: string
          request_type: string
          status: Database["public"]["Enums"]["request_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          missionary_id: string
          request_type: string
          status?: Database["public"]["Enums"]["request_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          missionary_id?: string
          request_type?: string
          status?: Database["public"]["Enums"]["request_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "private_requests_missionary_id_fkey"
            columns: ["missionary_id"]
            isOneToOne: false
            referencedRelation: "missionaries"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          account_status: Database["public"]["Enums"]["account_status"]
          created_at: string
          full_name: string
          id: string
          phone: string | null
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
        }
        Insert: {
          account_status?: Database["public"]["Enums"]["account_status"]
          created_at?: string
          full_name: string
          id: string
          phone?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Update: {
          account_status?: Database["public"]["Enums"]["account_status"]
          created_at?: string
          full_name?: string
          id?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Relationships: []
      }
      public_profiles: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          contact_method: string | null
          id: string
          missionary_id: string
          public_biography: string | null
          public_location: string | null
          public_ministry_description: string | null
          public_name: string
          publication_status: string
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          contact_method?: string | null
          id?: string
          missionary_id: string
          public_biography?: string | null
          public_location?: string | null
          public_ministry_description?: string | null
          public_name: string
          publication_status?: string
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          contact_method?: string | null
          id?: string
          missionary_id?: string
          public_biography?: string | null
          public_location?: string | null
          public_ministry_description?: string | null
          public_name?: string
          publication_status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "public_profiles_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "public_profiles_missionary_id_fkey"
            columns: ["missionary_id"]
            isOneToOne: true
            referencedRelation: "missionaries"
            referencedColumns: ["id"]
          },
        ]
      }
      registration_attempts: {
        Row: {
          created_at: string
          email_hash: string
          id: string
          ip_hash: string | null
        }
        Insert: {
          created_at?: string
          email_hash: string
          id?: string
          ip_hash?: string | null
        }
        Update: {
          created_at?: string
          email_hash?: string
          id?: string
          ip_hash?: string | null
        }
        Relationships: []
      }
      registration_requests: {
        Row: {
          created_at: string
          decision_note: string | null
          email: string
          full_name: string
          id: string
          ministry_summary: string
          phone: string | null
          privacy_accepted_at: string
          privacy_notice_version: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["registration_status"]
          years_in_ministry: number | null
        }
        Insert: {
          created_at?: string
          decision_note?: string | null
          email: string
          full_name: string
          id?: string
          ministry_summary: string
          phone?: string | null
          privacy_accepted_at?: string
          privacy_notice_version?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["registration_status"]
          years_in_ministry?: number | null
        }
        Update: {
          created_at?: string
          decision_note?: string | null
          email?: string
          full_name?: string
          id?: string
          ministry_summary?: string
          phone?: string | null
          privacy_accepted_at?: string
          privacy_notice_version?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["registration_status"]
          years_in_ministry?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "registration_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reporting_periods: {
        Row: {
          created_at: string
          due_date: string | null
          id: string
          justification: string | null
          missionary_id: string
          period_end: string
          period_start: string
          status: Database["public"]["Enums"]["reporting_period_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          due_date?: string | null
          id?: string
          justification?: string | null
          missionary_id: string
          period_end: string
          period_start: string
          status?: Database["public"]["Enums"]["reporting_period_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          due_date?: string | null
          id?: string
          justification?: string | null
          missionary_id?: string
          period_end?: string
          period_start?: string
          status?: Database["public"]["Enums"]["reporting_period_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reporting_periods_missionary_id_fkey"
            columns: ["missionary_id"]
            isOneToOne: false
            referencedRelation: "missionaries"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      ensure_reporting_periods: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
    }
    Enums: {
      account_status: "pending" | "active" | "suspended"
      app_role: "admin" | "missionary"
      consent_type: "public_profile" | "photos" | "updates" | "contact_sharing"
      notification_status: "pending" | "sent" | "failed" | "cancelled"
      organization_type:
        | "church"
        | "mission_base"
        | "mission_agency"
        | "ministry"
        | "other"
      registration_status: "pending" | "approved" | "rejected"
      reporting_period_status: "upcoming" | "open" | "closed"
      request_status: "open" | "in_progress" | "closed"
      update_status:
        | "draft"
        | "submitted"
        | "under_review"
        | "approved"
        | "revision_requested"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      account_status: ["pending", "active", "suspended"],
      app_role: ["admin", "missionary"],
      consent_type: ["public_profile", "photos", "updates", "contact_sharing"],
      notification_status: ["pending", "sent", "failed", "cancelled"],
      organization_type: [
        "church",
        "mission_base",
        "mission_agency",
        "ministry",
        "other",
      ],
      registration_status: ["pending", "approved", "rejected"],
      reporting_period_status: ["upcoming", "open", "closed"],
      request_status: ["open", "in_progress", "closed"],
      update_status: [
        "draft",
        "submitted",
        "under_review",
        "approved",
        "revision_requested",
      ],
    },
  },
} as const
