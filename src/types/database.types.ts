export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      app_settings: {
        Row: {
          created_at: string;
          default_unavailable_message: string;
          id: number;
          lead_retention_months: number;
          max_active_companies: number;
          max_company_representatives: number;
          public_base_url: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          default_unavailable_message?: string;
          id?: number;
          lead_retention_months?: number;
          max_active_companies?: number;
          max_company_representatives?: number;
          public_base_url: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          default_unavailable_message?: string;
          id?: number;
          lead_retention_months?: number;
          max_active_companies?: number;
          max_company_representatives?: number;
          public_base_url?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      audit_logs: {
        Row: {
          action: string;
          actor_id: string | null;
          actor_role: string | null;
          company_id: string | null;
          created_at: string;
          details: Json;
          entity_id: string | null;
          entity_type: string;
          id: string;
          ip_hash: string | null;
          request_id: string | null;
        };
        Insert: {
          action: string;
          actor_id?: string | null;
          actor_role?: string | null;
          company_id?: string | null;
          created_at?: string;
          details?: Json;
          entity_id?: string | null;
          entity_type: string;
          id?: string;
          ip_hash?: string | null;
          request_id?: string | null;
        };
        Update: {
          action?: string;
          actor_id?: string | null;
          actor_role?: string | null;
          company_id?: string | null;
          created_at?: string;
          details?: Json;
          entity_id?: string | null;
          entity_type?: string;
          id?: string;
          ip_hash?: string | null;
          request_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "audit_logs_actor_id_fkey";
            columns: ["actor_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "audit_logs_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      campaign_content: {
        Row: {
          active: boolean;
          call_to_action: string;
          campaign_id: string;
          content_version: number;
          created_at: string;
          created_by: string | null;
          description: string | null;
          headline: string;
          locale: string;
          offer_text: string | null;
          privacy_notice_text: string | null;
          reward_text: string | null;
          subheadline: string | null;
          terms_text: string | null;
          updated_at: string;
        };
        Insert: {
          active?: boolean;
          call_to_action?: string;
          campaign_id: string;
          content_version?: number;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          headline: string;
          locale: string;
          offer_text?: string | null;
          privacy_notice_text?: string | null;
          reward_text?: string | null;
          subheadline?: string | null;
          terms_text?: string | null;
          updated_at?: string;
        };
        Update: {
          active?: boolean;
          call_to_action?: string;
          campaign_id?: string;
          content_version?: number;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          headline?: string;
          locale?: string;
          offer_text?: string | null;
          privacy_notice_text?: string | null;
          reward_text?: string | null;
          subheadline?: string | null;
          terms_text?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "campaign_content_campaign_id_fkey";
            columns: ["campaign_id"];
            isOneToOne: false;
            referencedRelation: "campaigns";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "campaign_content_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      campaign_videos: {
        Row: {
          active: boolean;
          campaign_id: string;
          caption: string | null;
          created_at: string;
          created_by: string | null;
          duration_seconds: number;
          id: string;
          metadata: Json;
          poster_path: string | null;
          provider: Database["public"]["Enums"]["video_provider"];
          updated_at: string;
          validated_at: string | null;
          validated_by: string | null;
          video_path: string | null;
          video_url: string | null;
        };
        Insert: {
          active?: boolean;
          campaign_id: string;
          caption?: string | null;
          created_at?: string;
          created_by?: string | null;
          duration_seconds: number;
          id?: string;
          metadata?: Json;
          poster_path?: string | null;
          provider: Database["public"]["Enums"]["video_provider"];
          updated_at?: string;
          validated_at?: string | null;
          validated_by?: string | null;
          video_path?: string | null;
          video_url?: string | null;
        };
        Update: {
          active?: boolean;
          campaign_id?: string;
          caption?: string | null;
          created_at?: string;
          created_by?: string | null;
          duration_seconds?: number;
          id?: string;
          metadata?: Json;
          poster_path?: string | null;
          provider?: Database["public"]["Enums"]["video_provider"];
          updated_at?: string;
          validated_at?: string | null;
          validated_by?: string | null;
          video_path?: string | null;
          video_url?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "campaign_videos_campaign_id_fkey";
            columns: ["campaign_id"];
            isOneToOne: false;
            referencedRelation: "campaigns";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "campaign_videos_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "campaign_videos_validated_by_fkey";
            columns: ["validated_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      campaign_zones: {
        Row: {
          campaign_id: string;
          zone_name: string;
        };
        Insert: {
          campaign_id: string;
          zone_name: string;
        };
        Update: {
          campaign_id?: string;
          zone_name?: string;
        };
        Relationships: [
          {
            foreignKeyName: "campaign_zones_campaign_id_fkey";
            columns: ["campaign_id"];
            isOneToOne: false;
            referencedRelation: "campaigns";
            referencedColumns: ["id"];
          },
        ];
      };
      campaigns: {
        Row: {
          brochure_path: string | null;
          budget_etb: number | null;
          campaign_type: Database["public"]["Enums"]["campaign_type"];
          company_id: string;
          created_at: string;
          created_by: string | null;
          default_locale: string;
          end_date: string;
          id: string;
          internal_notes: string | null;
          landing_page_config: Json;
          name: string;
          reward_description: string | null;
          reward_type: string | null;
          reward_unit_cost_etb: number;
          start_date: string;
          status: Database["public"]["Enums"]["campaign_status"];
          target_leads: number | null;
          updated_at: string;
          vehicle_count: number;
        };
        Insert: {
          brochure_path?: string | null;
          budget_etb?: number | null;
          campaign_type?: Database["public"]["Enums"]["campaign_type"];
          company_id: string;
          created_at?: string;
          created_by?: string | null;
          default_locale?: string;
          end_date: string;
          id?: string;
          internal_notes?: string | null;
          landing_page_config?: Json;
          name: string;
          reward_description?: string | null;
          reward_type?: string | null;
          reward_unit_cost_etb?: number;
          start_date: string;
          status?: Database["public"]["Enums"]["campaign_status"];
          target_leads?: number | null;
          updated_at?: string;
          vehicle_count?: number;
        };
        Update: {
          brochure_path?: string | null;
          budget_etb?: number | null;
          campaign_type?: Database["public"]["Enums"]["campaign_type"];
          company_id?: string;
          created_at?: string;
          created_by?: string | null;
          default_locale?: string;
          end_date?: string;
          id?: string;
          internal_notes?: string | null;
          landing_page_config?: Json;
          name?: string;
          reward_description?: string | null;
          reward_type?: string | null;
          reward_unit_cost_etb?: number;
          start_date?: string;
          status?: Database["public"]["Enums"]["campaign_status"];
          target_leads?: number | null;
          updated_at?: string;
          vehicle_count?: number;
        };
        Relationships: [
          {
            foreignKeyName: "campaigns_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "campaigns_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      companies: {
        Row: {
          address_or_map_url: string | null;
          brand_color: string | null;
          created_at: string;
          created_by: string | null;
          deactivated_at: string | null;
          description: string | null;
          id: string;
          identifier: string;
          logo_path: string;
          name: string;
          public_contact_email: string | null;
          public_contact_name: string | null;
          public_contact_phone: string | null;
          public_contact_title: string | null;
          sector: string | null;
          services_summary: string | null;
          social_links: Json;
          status: Database["public"]["Enums"]["company_status"];
          telegram_url: string | null;
          unavailable_message: string | null;
          updated_at: string;
          video_url: string | null;
          website_url: string | null;
          whatsapp_url: string | null;
        };
        Insert: {
          address_or_map_url?: string | null;
          brand_color?: string | null;
          created_at?: string;
          created_by?: string | null;
          deactivated_at?: string | null;
          description?: string | null;
          id?: string;
          identifier: string;
          logo_path: string;
          name: string;
          public_contact_email?: string | null;
          public_contact_name?: string | null;
          public_contact_phone?: string | null;
          public_contact_title?: string | null;
          sector?: string | null;
          services_summary?: string | null;
          social_links?: Json;
          status?: Database["public"]["Enums"]["company_status"];
          telegram_url?: string | null;
          unavailable_message?: string | null;
          updated_at?: string;
          video_url?: string | null;
          website_url?: string | null;
          whatsapp_url?: string | null;
        };
        Update: {
          address_or_map_url?: string | null;
          brand_color?: string | null;
          created_at?: string;
          created_by?: string | null;
          deactivated_at?: string | null;
          description?: string | null;
          id?: string;
          identifier?: string;
          logo_path?: string;
          name?: string;
          public_contact_email?: string | null;
          public_contact_name?: string | null;
          public_contact_phone?: string | null;
          public_contact_title?: string | null;
          sector?: string | null;
          services_summary?: string | null;
          social_links?: Json;
          status?: Database["public"]["Enums"]["company_status"];
          telegram_url?: string | null;
          unavailable_message?: string | null;
          updated_at?: string;
          video_url?: string | null;
          website_url?: string | null;
          whatsapp_url?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "companies_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      company_memberships: {
        Row: {
          active: boolean;
          can_edit_profile: boolean;
          can_export_leads: boolean;
          can_manage_notifications: boolean;
          can_manage_team: boolean;
          can_update_lead_status: boolean;
          can_view_leads: boolean;
          company_id: string;
          created_at: string;
          created_by: string | null;
          realtime_enabled: boolean;
          role: Database["public"]["Enums"]["membership_role"];
          updated_at: string;
          user_id: string;
        };
        Insert: {
          active?: boolean;
          can_edit_profile?: boolean;
          can_export_leads?: boolean;
          can_manage_notifications?: boolean;
          can_manage_team?: boolean;
          can_update_lead_status?: boolean;
          can_view_leads?: boolean;
          company_id: string;
          created_at?: string;
          created_by?: string | null;
          realtime_enabled?: boolean;
          role?: Database["public"]["Enums"]["membership_role"];
          updated_at?: string;
          user_id: string;
        };
        Update: {
          active?: boolean;
          can_edit_profile?: boolean;
          can_export_leads?: boolean;
          can_manage_notifications?: boolean;
          can_manage_team?: boolean;
          can_update_lead_status?: boolean;
          can_view_leads?: boolean;
          company_id?: string;
          created_at?: string;
          created_by?: string | null;
          realtime_enabled?: boolean;
          role?: Database["public"]["Enums"]["membership_role"];
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "company_memberships_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "company_memberships_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "company_memberships_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      company_receiver_settings: {
        Row: {
          company_id: string;
          created_at: string;
          enabled: boolean;
          receiver_name: string;
          updated_at: string;
          updated_by: string;
        };
        Insert: {
          company_id: string;
          created_at?: string;
          enabled?: boolean;
          receiver_name: string;
          updated_at?: string;
          updated_by: string;
        };
        Update: {
          company_id?: string;
          created_at?: string;
          enabled?: boolean;
          receiver_name?: string;
          updated_at?: string;
          updated_by?: string;
        };
        Relationships: [
          {
            foreignKeyName: "company_receiver_settings_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: true;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "company_receiver_settings_updated_by_fkey";
            columns: ["updated_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      company_services: {
        Row: {
          active: boolean;
          company_id: string;
          created_at: string;
          description: string | null;
          display_order: number;
          id: string;
          name: string;
          updated_at: string;
        };
        Insert: {
          active?: boolean;
          company_id: string;
          created_at?: string;
          description?: string | null;
          display_order?: number;
          id?: string;
          name: string;
          updated_at?: string;
        };
        Update: {
          active?: boolean;
          company_id?: string;
          created_at?: string;
          description?: string | null;
          display_order?: number;
          id?: string;
          name?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "company_services_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      data_deletion_requests: {
        Row: {
          company_id: string;
          created_at: string;
          handled_at: string | null;
          handled_by: string | null;
          id: string;
          lead_id: string | null;
          notes: string | null;
          requester_contact: string;
          requester_name: string | null;
          status: Database["public"]["Enums"]["deletion_request_status"];
          updated_at: string;
          verification_hash: string | null;
        };
        Insert: {
          company_id: string;
          created_at?: string;
          handled_at?: string | null;
          handled_by?: string | null;
          id?: string;
          lead_id?: string | null;
          notes?: string | null;
          requester_contact: string;
          requester_name?: string | null;
          status?: Database["public"]["Enums"]["deletion_request_status"];
          updated_at?: string;
          verification_hash?: string | null;
        };
        Update: {
          company_id?: string;
          created_at?: string;
          handled_at?: string | null;
          handled_by?: string | null;
          id?: string;
          lead_id?: string | null;
          notes?: string | null;
          requester_contact?: string;
          requester_name?: string | null;
          status?: Database["public"]["Enums"]["deletion_request_status"];
          updated_at?: string;
          verification_hash?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "data_deletion_requests_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "data_deletion_requests_handled_by_fkey";
            columns: ["handled_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "data_deletion_requests_lead_id_fkey";
            columns: ["lead_id"];
            isOneToOne: false;
            referencedRelation: "leads";
            referencedColumns: ["id"];
          },
        ];
      };
      driver_bonuses: {
        Row: {
          approved_at: string | null;
          approved_by: string | null;
          base_fee_etb: number;
          calculation_snapshot: Json;
          campaign_id: string;
          compliance_deduction_etb: number;
          compliance_score_at_close: number | null;
          created_at: string;
          driver_id: string;
          id: string;
          lead_bonus_etb: number;
          notes: string | null;
          paid_at: string | null;
          status: Database["public"]["Enums"]["bonus_status"];
          top_driver_prize_etb: number;
          updated_at: string;
          verified_leads_count: number;
        };
        Insert: {
          approved_at?: string | null;
          approved_by?: string | null;
          base_fee_etb?: number;
          calculation_snapshot?: Json;
          campaign_id: string;
          compliance_deduction_etb?: number;
          compliance_score_at_close?: number | null;
          created_at?: string;
          driver_id: string;
          id?: string;
          lead_bonus_etb?: number;
          notes?: string | null;
          paid_at?: string | null;
          status?: Database["public"]["Enums"]["bonus_status"];
          top_driver_prize_etb?: number;
          updated_at?: string;
          verified_leads_count?: number;
        };
        Update: {
          approved_at?: string | null;
          approved_by?: string | null;
          base_fee_etb?: number;
          calculation_snapshot?: Json;
          campaign_id?: string;
          compliance_deduction_etb?: number;
          compliance_score_at_close?: number | null;
          created_at?: string;
          driver_id?: string;
          id?: string;
          lead_bonus_etb?: number;
          notes?: string | null;
          paid_at?: string | null;
          status?: Database["public"]["Enums"]["bonus_status"];
          top_driver_prize_etb?: number;
          updated_at?: string;
          verified_leads_count?: number;
        };
        Relationships: [
          {
            foreignKeyName: "driver_bonuses_approved_by_fkey";
            columns: ["approved_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "driver_bonuses_campaign_id_fkey";
            columns: ["campaign_id"];
            isOneToOne: false;
            referencedRelation: "campaigns";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "driver_bonuses_driver_id_fkey";
            columns: ["driver_id"];
            isOneToOne: false;
            referencedRelation: "drivers";
            referencedColumns: ["id"];
          },
        ];
      };
      driver_campaign_assignments: {
        Row: {
          assigned_at: string;
          assigned_by: string | null;
          campaign_id: string;
          created_at: string;
          driver_id: string;
          ended_at: string | null;
          id: string;
          status: Database["public"]["Enums"]["assignment_status"];
          updated_at: string;
        };
        Insert: {
          assigned_at?: string;
          assigned_by?: string | null;
          campaign_id: string;
          created_at?: string;
          driver_id: string;
          ended_at?: string | null;
          id?: string;
          status?: Database["public"]["Enums"]["assignment_status"];
          updated_at?: string;
        };
        Update: {
          assigned_at?: string;
          assigned_by?: string | null;
          campaign_id?: string;
          created_at?: string;
          driver_id?: string;
          ended_at?: string | null;
          id?: string;
          status?: Database["public"]["Enums"]["assignment_status"];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "driver_campaign_assignments_assigned_by_fkey";
            columns: ["assigned_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "driver_campaign_assignments_campaign_id_fkey";
            columns: ["campaign_id"];
            isOneToOne: false;
            referencedRelation: "campaigns";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "driver_campaign_assignments_driver_id_fkey";
            columns: ["driver_id"];
            isOneToOne: false;
            referencedRelation: "drivers";
            referencedColumns: ["id"];
          },
        ];
      };
      driver_compliance_records: {
        Row: {
          campaign_id: string;
          checkin_photo_path: string | null;
          checkin_time: string | null;
          compliance_flag: boolean;
          created_at: string;
          driver_id: string;
          flag_reason: string | null;
          id: string;
          inventory_reported: number | null;
          record_date: string;
          recorded_by: string | null;
          updated_at: string;
        };
        Insert: {
          campaign_id: string;
          checkin_photo_path?: string | null;
          checkin_time?: string | null;
          compliance_flag?: boolean;
          created_at?: string;
          driver_id: string;
          flag_reason?: string | null;
          id?: string;
          inventory_reported?: number | null;
          record_date: string;
          recorded_by?: string | null;
          updated_at?: string;
        };
        Update: {
          campaign_id?: string;
          checkin_photo_path?: string | null;
          checkin_time?: string | null;
          compliance_flag?: boolean;
          created_at?: string;
          driver_id?: string;
          flag_reason?: string | null;
          id?: string;
          inventory_reported?: number | null;
          record_date?: string;
          recorded_by?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "driver_compliance_records_campaign_id_fkey";
            columns: ["campaign_id"];
            isOneToOne: false;
            referencedRelation: "campaigns";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "driver_compliance_records_driver_id_fkey";
            columns: ["driver_id"];
            isOneToOne: false;
            referencedRelation: "drivers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "driver_compliance_records_recorded_by_fkey";
            columns: ["recorded_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      drivers: {
        Row: {
          compliance_score: number;
          created_at: string;
          full_name: string;
          id: string;
          notes: string | null;
          phone_e164: string;
          phone_hash: string;
          primary_zone: string;
          registered_at: string;
          status: Database["public"]["Enums"]["driver_status"];
          telegram_handle: string | null;
          telegram_user_id: number | null;
          updated_at: string;
          vehicle_plate: string | null;
          vehicle_type: string;
        };
        Insert: {
          compliance_score?: number;
          created_at?: string;
          full_name: string;
          id?: string;
          notes?: string | null;
          phone_e164: string;
          phone_hash: string;
          primary_zone: string;
          registered_at?: string;
          status?: Database["public"]["Enums"]["driver_status"];
          telegram_handle?: string | null;
          telegram_user_id?: number | null;
          updated_at?: string;
          vehicle_plate?: string | null;
          vehicle_type?: string;
        };
        Update: {
          compliance_score?: number;
          created_at?: string;
          full_name?: string;
          id?: string;
          notes?: string | null;
          phone_e164?: string;
          phone_hash?: string;
          primary_zone?: string;
          registered_at?: string;
          status?: Database["public"]["Enums"]["driver_status"];
          telegram_handle?: string | null;
          telegram_user_id?: number | null;
          updated_at?: string;
          vehicle_plate?: string | null;
          vehicle_type?: string;
        };
        Relationships: [];
      };
      fraud_flags: {
        Row: {
          created_at: string;
          driver_id: string | null;
          evidence: Json;
          flag_reason: string;
          flag_type: Database["public"]["Enums"]["fraud_flag_type"];
          id: string;
          lead_id: string;
          resolved: boolean;
          resolved_at: string | null;
          resolved_by: string | null;
        };
        Insert: {
          created_at?: string;
          driver_id?: string | null;
          evidence?: Json;
          flag_reason: string;
          flag_type: Database["public"]["Enums"]["fraud_flag_type"];
          id?: string;
          lead_id: string;
          resolved?: boolean;
          resolved_at?: string | null;
          resolved_by?: string | null;
        };
        Update: {
          created_at?: string;
          driver_id?: string | null;
          evidence?: Json;
          flag_reason?: string;
          flag_type?: Database["public"]["Enums"]["fraud_flag_type"];
          id?: string;
          lead_id?: string;
          resolved?: boolean;
          resolved_at?: string | null;
          resolved_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "fraud_flags_driver_id_fkey";
            columns: ["driver_id"];
            isOneToOne: false;
            referencedRelation: "drivers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fraud_flags_lead_id_fkey";
            columns: ["lead_id"];
            isOneToOne: false;
            referencedRelation: "leads";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fraud_flags_resolved_by_fkey";
            columns: ["resolved_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      inventory_movements: {
        Row: {
          campaign_id: string;
          created_at: string;
          driver_id: string;
          id: string;
          movement_type: Database["public"]["Enums"]["inventory_movement_type"];
          notes: string | null;
          occurred_at: string;
          quantity: number;
          recorded_by: string | null;
        };
        Insert: {
          campaign_id: string;
          created_at?: string;
          driver_id: string;
          id?: string;
          movement_type: Database["public"]["Enums"]["inventory_movement_type"];
          notes?: string | null;
          occurred_at?: string;
          quantity: number;
          recorded_by?: string | null;
        };
        Update: {
          campaign_id?: string;
          created_at?: string;
          driver_id?: string;
          id?: string;
          movement_type?: Database["public"]["Enums"]["inventory_movement_type"];
          notes?: string | null;
          occurred_at?: string;
          quantity?: number;
          recorded_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "inventory_movements_campaign_id_fkey";
            columns: ["campaign_id"];
            isOneToOne: false;
            referencedRelation: "campaigns";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "inventory_movements_driver_id_fkey";
            columns: ["driver_id"];
            isOneToOne: false;
            referencedRelation: "drivers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "inventory_movements_recorded_by_fkey";
            columns: ["recorded_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      invoice_payments: {
        Row: {
          amount_etb: number;
          created_at: string;
          id: string;
          invoice_id: string;
          paid_at: string;
          payment_reference: string | null;
          recorded_by: string | null;
        };
        Insert: {
          amount_etb: number;
          created_at?: string;
          id?: string;
          invoice_id: string;
          paid_at: string;
          payment_reference?: string | null;
          recorded_by?: string | null;
        };
        Update: {
          amount_etb?: number;
          created_at?: string;
          id?: string;
          invoice_id?: string;
          paid_at?: string;
          payment_reference?: string | null;
          recorded_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "invoice_payments_invoice_id_fkey";
            columns: ["invoice_id"];
            isOneToOne: false;
            referencedRelation: "invoices";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "invoice_payments_recorded_by_fkey";
            columns: ["recorded_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      invoices: {
        Row: {
          amount_etb: number;
          campaign_id: string;
          company_id: string;
          created_at: string;
          created_by: string | null;
          due_date: string | null;
          id: string;
          invoice_number: string;
          issued_at: string | null;
          status: Database["public"]["Enums"]["invoice_status"];
          updated_at: string;
        };
        Insert: {
          amount_etb: number;
          campaign_id: string;
          company_id: string;
          created_at?: string;
          created_by?: string | null;
          due_date?: string | null;
          id?: string;
          invoice_number: string;
          issued_at?: string | null;
          status?: Database["public"]["Enums"]["invoice_status"];
          updated_at?: string;
        };
        Update: {
          amount_etb?: number;
          campaign_id?: string;
          company_id?: string;
          created_at?: string;
          created_by?: string | null;
          due_date?: string | null;
          id?: string;
          invoice_number?: string;
          issued_at?: string | null;
          status?: Database["public"]["Enums"]["invoice_status"];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "invoices_campaign_id_fkey";
            columns: ["campaign_id"];
            isOneToOne: false;
            referencedRelation: "campaigns";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "invoices_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "invoices_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      landing_page_visits: {
        Row: {
          campaign_id: string | null;
          company_id: string;
          created_at: string;
          device_category: string | null;
          driver_id: string | null;
          id: string;
          ip_hash: string | null;
          qr_code_id: string;
          referrer_domain: string | null;
          session_hash: string | null;
          user_agent_summary: string | null;
        };
        Insert: {
          campaign_id?: string | null;
          company_id: string;
          created_at?: string;
          device_category?: string | null;
          driver_id?: string | null;
          id?: string;
          ip_hash?: string | null;
          qr_code_id: string;
          referrer_domain?: string | null;
          session_hash?: string | null;
          user_agent_summary?: string | null;
        };
        Update: {
          campaign_id?: string | null;
          company_id?: string;
          created_at?: string;
          device_category?: string | null;
          driver_id?: string | null;
          id?: string;
          ip_hash?: string | null;
          qr_code_id?: string;
          referrer_domain?: string | null;
          session_hash?: string | null;
          user_agent_summary?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "landing_page_visits_campaign_id_fkey";
            columns: ["campaign_id"];
            isOneToOne: false;
            referencedRelation: "campaigns";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "landing_page_visits_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "landing_page_visits_driver_id_fkey";
            columns: ["driver_id"];
            isOneToOne: false;
            referencedRelation: "drivers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "landing_page_visits_qr_code_id_fkey";
            columns: ["qr_code_id"];
            isOneToOne: false;
            referencedRelation: "qr_codes";
            referencedColumns: ["id"];
          },
        ];
      };
      lead_activities: {
        Row: {
          activity_type: Database["public"]["Enums"]["lead_activity_type"];
          assigned_to: string | null;
          company_id: string;
          completed_at: string | null;
          created_at: string;
          external_reference: string | null;
          id: string;
          lead_id: string;
          notes: string | null;
          outcome_code: string | null;
          performed_by: string | null;
          scheduled_at: string | null;
          started_at: string | null;
          status: Database["public"]["Enums"]["lead_activity_status"];
          updated_at: string;
        };
        Insert: {
          activity_type: Database["public"]["Enums"]["lead_activity_type"];
          assigned_to?: string | null;
          company_id: string;
          completed_at?: string | null;
          created_at?: string;
          external_reference?: string | null;
          id?: string;
          lead_id: string;
          notes?: string | null;
          outcome_code?: string | null;
          performed_by?: string | null;
          scheduled_at?: string | null;
          started_at?: string | null;
          status?: Database["public"]["Enums"]["lead_activity_status"];
          updated_at?: string;
        };
        Update: {
          activity_type?: Database["public"]["Enums"]["lead_activity_type"];
          assigned_to?: string | null;
          company_id?: string;
          completed_at?: string | null;
          created_at?: string;
          external_reference?: string | null;
          id?: string;
          lead_id?: string;
          notes?: string | null;
          outcome_code?: string | null;
          performed_by?: string | null;
          scheduled_at?: string | null;
          started_at?: string | null;
          status?: Database["public"]["Enums"]["lead_activity_status"];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "lead_activities_assigned_to_fkey";
            columns: ["assigned_to"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lead_activities_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lead_activities_lead_id_fkey";
            columns: ["lead_id"];
            isOneToOne: false;
            referencedRelation: "leads";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lead_activities_performed_by_fkey";
            columns: ["performed_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      lead_feedback: {
        Row: {
          actioned_at: string | null;
          actioned_by: string | null;
          archived_at: string | null;
          campaign_id: string | null;
          comment: string | null;
          company_id: string;
          content_locale: string | null;
          content_version: number | null;
          created_at: string;
          driver_id: string | null;
          id: string;
          idempotency_key: string;
          lead_id: string;
          notification_status: Database["public"]["Enums"]["notification_summary_status"];
          qr_code_id: string;
          rating: number;
          status: Database["public"]["Enums"]["feedback_status"];
          updated_at: string;
          viewed_at: string | null;
          viewed_by: string | null;
        };
        Insert: {
          actioned_at?: string | null;
          actioned_by?: string | null;
          archived_at?: string | null;
          campaign_id?: string | null;
          comment?: string | null;
          company_id: string;
          content_locale?: string | null;
          content_version?: number | null;
          created_at?: string;
          driver_id?: string | null;
          id?: string;
          idempotency_key: string;
          lead_id: string;
          notification_status?: Database["public"]["Enums"]["notification_summary_status"];
          qr_code_id: string;
          rating: number;
          status?: Database["public"]["Enums"]["feedback_status"];
          updated_at?: string;
          viewed_at?: string | null;
          viewed_by?: string | null;
        };
        Update: {
          actioned_at?: string | null;
          actioned_by?: string | null;
          archived_at?: string | null;
          campaign_id?: string | null;
          comment?: string | null;
          company_id?: string;
          content_locale?: string | null;
          content_version?: number | null;
          created_at?: string;
          driver_id?: string | null;
          id?: string;
          idempotency_key?: string;
          lead_id?: string;
          notification_status?: Database["public"]["Enums"]["notification_summary_status"];
          qr_code_id?: string;
          rating?: number;
          status?: Database["public"]["Enums"]["feedback_status"];
          updated_at?: string;
          viewed_at?: string | null;
          viewed_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "lead_feedback_actioned_by_fkey";
            columns: ["actioned_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lead_feedback_campaign_id_fkey";
            columns: ["campaign_id"];
            isOneToOne: false;
            referencedRelation: "campaigns";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lead_feedback_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lead_feedback_driver_id_fkey";
            columns: ["driver_id"];
            isOneToOne: false;
            referencedRelation: "drivers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lead_feedback_lead_id_fkey";
            columns: ["lead_id"];
            isOneToOne: true;
            referencedRelation: "leads";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lead_feedback_qr_code_id_fkey";
            columns: ["qr_code_id"];
            isOneToOne: false;
            referencedRelation: "qr_codes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lead_feedback_viewed_by_fkey";
            columns: ["viewed_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      lead_quality_decisions: {
        Row: {
          billable: boolean | null;
          campaign_id: string | null;
          company_id: string;
          created_at: string;
          decided_at: string;
          decided_by: string | null;
          decision_source: Database["public"]["Enums"]["lead_quality_source"];
          id: string;
          is_current: boolean;
          lead_id: string;
          quality_status: Database["public"]["Enums"]["lead_quality_status"];
          reason_code: string;
          reason_detail: string | null;
          risk_score: number | null;
          rule_version: string | null;
          superseded_at: string | null;
          supersedes_id: string | null;
        };
        Insert: {
          billable?: boolean | null;
          campaign_id?: string | null;
          company_id: string;
          created_at?: string;
          decided_at?: string;
          decided_by?: string | null;
          decision_source: Database["public"]["Enums"]["lead_quality_source"];
          id?: string;
          is_current?: boolean;
          lead_id: string;
          quality_status: Database["public"]["Enums"]["lead_quality_status"];
          reason_code: string;
          reason_detail?: string | null;
          risk_score?: number | null;
          rule_version?: string | null;
          superseded_at?: string | null;
          supersedes_id?: string | null;
        };
        Update: {
          billable?: boolean | null;
          campaign_id?: string | null;
          company_id?: string;
          created_at?: string;
          decided_at?: string;
          decided_by?: string | null;
          decision_source?: Database["public"]["Enums"]["lead_quality_source"];
          id?: string;
          is_current?: boolean;
          lead_id?: string;
          quality_status?: Database["public"]["Enums"]["lead_quality_status"];
          reason_code?: string;
          reason_detail?: string | null;
          risk_score?: number | null;
          rule_version?: string | null;
          superseded_at?: string | null;
          supersedes_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "lead_quality_decisions_campaign_id_fkey";
            columns: ["campaign_id"];
            isOneToOne: false;
            referencedRelation: "campaigns";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lead_quality_decisions_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lead_quality_decisions_decided_by_fkey";
            columns: ["decided_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lead_quality_decisions_lead_id_fkey";
            columns: ["lead_id"];
            isOneToOne: false;
            referencedRelation: "leads";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lead_quality_decisions_supersedes_id_fkey";
            columns: ["supersedes_id"];
            isOneToOne: false;
            referencedRelation: "lead_quality_decisions";
            referencedColumns: ["id"];
          },
        ];
      };
      lead_status_history: {
        Row: {
          changed_by: string | null;
          created_at: string;
          id: string;
          lead_id: string;
          new_status: Database["public"]["Enums"]["lead_status"];
          note: string | null;
          old_status: Database["public"]["Enums"]["lead_status"] | null;
        };
        Insert: {
          changed_by?: string | null;
          created_at?: string;
          id?: string;
          lead_id: string;
          new_status: Database["public"]["Enums"]["lead_status"];
          note?: string | null;
          old_status?: Database["public"]["Enums"]["lead_status"] | null;
        };
        Update: {
          changed_by?: string | null;
          created_at?: string;
          id?: string;
          lead_id?: string;
          new_status?: Database["public"]["Enums"]["lead_status"];
          note?: string | null;
          old_status?: Database["public"]["Enums"]["lead_status"] | null;
        };
        Relationships: [
          {
            foreignKeyName: "lead_status_history_changed_by_fkey";
            columns: ["changed_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lead_status_history_lead_id_fkey";
            columns: ["lead_id"];
            isOneToOne: false;
            referencedRelation: "leads";
            referencedColumns: ["id"];
          },
        ];
      };
      leads: {
        Row: {
          archived_at: string | null;
          campaign_id: string | null;
          campaign_video_id: string | null;
          company_id: string;
          consent_at: string;
          consent_given: boolean;
          converted_at: string | null;
          created_at: string;
          deleted_at: string | null;
          device_fingerprint_hash: string | null;
          driver_id: string | null;
          email: string | null;
          followed_up_at: string | null;
          full_name: string;
          id: string;
          idempotency_key: string;
          interested_service_text: string | null;
          ip_hash: string;
          message: string | null;
          notification_status: Database["public"]["Enums"]["notification_summary_status"];
          organization: string | null;
          phone_e164: string;
          phone_hash: string;
          preferred_contact_method:
            Database["public"]["Enums"]["preferred_contact_method"] | null;
          privacy_notice_version: string;
          qr_code_id: string;
          service_id: string | null;
          status: Database["public"]["Enums"]["lead_status"];
          updated_at: string;
          verification_status: Database["public"]["Enums"]["lead_verification_status"];
          viewed_at: string | null;
        };
        Insert: {
          archived_at?: string | null;
          campaign_id?: string | null;
          campaign_video_id?: string | null;
          company_id: string;
          consent_at: string;
          consent_given: boolean;
          converted_at?: string | null;
          created_at?: string;
          deleted_at?: string | null;
          device_fingerprint_hash?: string | null;
          driver_id?: string | null;
          email?: string | null;
          followed_up_at?: string | null;
          full_name: string;
          id?: string;
          idempotency_key: string;
          interested_service_text?: string | null;
          ip_hash: string;
          message?: string | null;
          notification_status?: Database["public"]["Enums"]["notification_summary_status"];
          organization?: string | null;
          phone_e164: string;
          phone_hash: string;
          preferred_contact_method?:
            Database["public"]["Enums"]["preferred_contact_method"] | null;
          privacy_notice_version: string;
          qr_code_id: string;
          service_id?: string | null;
          status?: Database["public"]["Enums"]["lead_status"];
          updated_at?: string;
          verification_status?: Database["public"]["Enums"]["lead_verification_status"];
          viewed_at?: string | null;
        };
        Update: {
          archived_at?: string | null;
          campaign_id?: string | null;
          campaign_video_id?: string | null;
          company_id?: string;
          consent_at?: string;
          consent_given?: boolean;
          converted_at?: string | null;
          created_at?: string;
          deleted_at?: string | null;
          device_fingerprint_hash?: string | null;
          driver_id?: string | null;
          email?: string | null;
          followed_up_at?: string | null;
          full_name?: string;
          id?: string;
          idempotency_key?: string;
          interested_service_text?: string | null;
          ip_hash?: string;
          message?: string | null;
          notification_status?: Database["public"]["Enums"]["notification_summary_status"];
          organization?: string | null;
          phone_e164?: string;
          phone_hash?: string;
          preferred_contact_method?:
            Database["public"]["Enums"]["preferred_contact_method"] | null;
          privacy_notice_version?: string;
          qr_code_id?: string;
          service_id?: string | null;
          status?: Database["public"]["Enums"]["lead_status"];
          updated_at?: string;
          verification_status?: Database["public"]["Enums"]["lead_verification_status"];
          viewed_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "leads_campaign_id_fkey";
            columns: ["campaign_id"];
            isOneToOne: false;
            referencedRelation: "campaigns";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "leads_campaign_video_id_fkey";
            columns: ["campaign_video_id"];
            isOneToOne: false;
            referencedRelation: "campaign_videos";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "leads_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "leads_driver_id_fkey";
            columns: ["driver_id"];
            isOneToOne: false;
            referencedRelation: "drivers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "leads_qr_code_id_fkey";
            columns: ["qr_code_id"];
            isOneToOne: false;
            referencedRelation: "qr_codes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "leads_service_id_fkey";
            columns: ["service_id"];
            isOneToOne: false;
            referencedRelation: "company_services";
            referencedColumns: ["id"];
          },
        ];
      };
      login_security_events: {
        Row: {
          created_at: string;
          device_hash: string | null;
          email_hash: string;
          failure_reason: string | null;
          id: string;
          ip_hash: string;
          success: boolean;
          user_id: string | null;
        };
        Insert: {
          created_at?: string;
          device_hash?: string | null;
          email_hash: string;
          failure_reason?: string | null;
          id?: string;
          ip_hash: string;
          success: boolean;
          user_id?: string | null;
        };
        Update: {
          created_at?: string;
          device_hash?: string | null;
          email_hash?: string;
          failure_reason?: string | null;
          id?: string;
          ip_hash?: string;
          success?: boolean;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "login_security_events_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      notification_attempts: {
        Row: {
          attempt_number: number;
          attempted_at: string;
          completed_at: string | null;
          duration_ms: number | null;
          error_message: string | null;
          id: string;
          job_id: string;
          provider_code: string | null;
          provider_response: Json | null;
          status: Database["public"]["Enums"]["notification_attempt_status"];
        };
        Insert: {
          attempt_number: number;
          attempted_at?: string;
          completed_at?: string | null;
          duration_ms?: number | null;
          error_message?: string | null;
          id?: string;
          job_id: string;
          provider_code?: string | null;
          provider_response?: Json | null;
          status: Database["public"]["Enums"]["notification_attempt_status"];
        };
        Update: {
          attempt_number?: number;
          attempted_at?: string;
          completed_at?: string | null;
          duration_ms?: number | null;
          error_message?: string | null;
          id?: string;
          job_id?: string;
          provider_code?: string | null;
          provider_response?: Json | null;
          status?: Database["public"]["Enums"]["notification_attempt_status"];
        };
        Relationships: [
          {
            foreignKeyName: "notification_attempts_job_id_fkey";
            columns: ["job_id"];
            isOneToOne: false;
            referencedRelation: "notification_jobs";
            referencedColumns: ["id"];
          },
        ];
      };
      notification_destinations: {
        Row: {
          active: boolean;
          channel: Database["public"]["Enums"]["notification_channel"];
          company_id: string;
          created_at: string;
          created_by: string;
          destination_hash: string;
          destination_value: string;
          digest_time_utc: string | null;
          event_type: Database["public"]["Enums"]["notification_event_type"];
          frequency: Database["public"]["Enums"]["notification_frequency"];
          id: string;
          is_primary: boolean;
          label: string | null;
          updated_at: string;
        };
        Insert: {
          active?: boolean;
          channel: Database["public"]["Enums"]["notification_channel"];
          company_id: string;
          created_at?: string;
          created_by: string;
          destination_hash: string;
          destination_value: string;
          digest_time_utc?: string | null;
          event_type?: Database["public"]["Enums"]["notification_event_type"];
          frequency?: Database["public"]["Enums"]["notification_frequency"];
          id?: string;
          is_primary?: boolean;
          label?: string | null;
          updated_at?: string;
        };
        Update: {
          active?: boolean;
          channel?: Database["public"]["Enums"]["notification_channel"];
          company_id?: string;
          created_at?: string;
          created_by?: string;
          destination_hash?: string;
          destination_value?: string;
          digest_time_utc?: string | null;
          event_type?: Database["public"]["Enums"]["notification_event_type"];
          frequency?: Database["public"]["Enums"]["notification_frequency"];
          id?: string;
          is_primary?: boolean;
          label?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notification_destinations_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "company_receiver_settings";
            referencedColumns: ["company_id"];
          },
          {
            foreignKeyName: "notification_destinations_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      notification_digest_batches: {
        Row: {
          company_id: string;
          created_at: string;
          destination_id: string;
          digest_for_date: string;
          event_type: Database["public"]["Enums"]["notification_event_type"];
          id: string;
          job_count: number;
          last_error: string | null;
          locked_at: string | null;
          locked_by: string | null;
          scheduled_for: string;
          sent_at: string | null;
          status: Database["public"]["Enums"]["notification_digest_status"];
          updated_at: string;
        };
        Insert: {
          company_id: string;
          created_at?: string;
          destination_id: string;
          digest_for_date: string;
          event_type: Database["public"]["Enums"]["notification_event_type"];
          id?: string;
          job_count?: number;
          last_error?: string | null;
          locked_at?: string | null;
          locked_by?: string | null;
          scheduled_for: string;
          sent_at?: string | null;
          status?: Database["public"]["Enums"]["notification_digest_status"];
          updated_at?: string;
        };
        Update: {
          company_id?: string;
          created_at?: string;
          destination_id?: string;
          digest_for_date?: string;
          event_type?: Database["public"]["Enums"]["notification_event_type"];
          id?: string;
          job_count?: number;
          last_error?: string | null;
          locked_at?: string | null;
          locked_by?: string | null;
          scheduled_for?: string;
          sent_at?: string | null;
          status?: Database["public"]["Enums"]["notification_digest_status"];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notification_digest_batches_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "notification_digest_batches_destination_id_fkey";
            columns: ["destination_id"];
            isOneToOne: false;
            referencedRelation: "notification_destinations";
            referencedColumns: ["id"];
          },
        ];
      };
      notification_jobs: {
        Row: {
          attempt_count: number;
          channel: Database["public"]["Enums"]["notification_channel"];
          created_at: string;
          delivery_frequency: Database["public"]["Enums"]["notification_frequency"];
          destination_id: string;
          digest_batch_id: string | null;
          event_type: Database["public"]["Enums"]["notification_event_type"];
          feedback_id: string | null;
          id: string;
          last_error: string | null;
          lead_id: string;
          locked_at: string | null;
          locked_by: string | null;
          next_attempt_at: string;
          provider_message_id: string | null;
          sent_at: string | null;
          status: Database["public"]["Enums"]["notification_job_status"];
          updated_at: string;
        };
        Insert: {
          attempt_count?: number;
          channel: Database["public"]["Enums"]["notification_channel"];
          created_at?: string;
          delivery_frequency?: Database["public"]["Enums"]["notification_frequency"];
          destination_id: string;
          digest_batch_id?: string | null;
          event_type: Database["public"]["Enums"]["notification_event_type"];
          feedback_id?: string | null;
          id?: string;
          last_error?: string | null;
          lead_id: string;
          locked_at?: string | null;
          locked_by?: string | null;
          next_attempt_at?: string;
          provider_message_id?: string | null;
          sent_at?: string | null;
          status?: Database["public"]["Enums"]["notification_job_status"];
          updated_at?: string;
        };
        Update: {
          attempt_count?: number;
          channel?: Database["public"]["Enums"]["notification_channel"];
          created_at?: string;
          delivery_frequency?: Database["public"]["Enums"]["notification_frequency"];
          destination_id?: string;
          digest_batch_id?: string | null;
          event_type?: Database["public"]["Enums"]["notification_event_type"];
          feedback_id?: string | null;
          id?: string;
          last_error?: string | null;
          lead_id?: string;
          locked_at?: string | null;
          locked_by?: string | null;
          next_attempt_at?: string;
          provider_message_id?: string | null;
          sent_at?: string | null;
          status?: Database["public"]["Enums"]["notification_job_status"];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notification_jobs_destination_id_fkey";
            columns: ["destination_id"];
            isOneToOne: false;
            referencedRelation: "notification_destinations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "notification_jobs_digest_batch_id_fkey";
            columns: ["digest_batch_id"];
            isOneToOne: false;
            referencedRelation: "notification_digest_batches";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "notification_jobs_feedback_id_fkey";
            columns: ["feedback_id"];
            isOneToOne: false;
            referencedRelation: "lead_feedback";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "notification_jobs_lead_id_fkey";
            columns: ["lead_id"];
            isOneToOne: false;
            referencedRelation: "leads";
            referencedColumns: ["id"];
          },
        ];
      };
      otp_delivery_attempts: {
        Row: {
          accepted_at: string | null;
          attempt_number: number;
          attempted_at: string;
          created_at: string;
          delivered_at: string | null;
          destination_hash: string;
          error_code: string | null;
          error_message: string | null;
          failed_at: string | null;
          id: string;
          otp_verification_id: string;
          provider: string;
          provider_message_id: string | null;
          provider_response: Json | null;
          provider_status_code: string | null;
          status: Database["public"]["Enums"]["otp_delivery_status"];
          updated_at: string;
        };
        Insert: {
          accepted_at?: string | null;
          attempt_number: number;
          attempted_at?: string;
          created_at?: string;
          delivered_at?: string | null;
          destination_hash: string;
          error_code?: string | null;
          error_message?: string | null;
          failed_at?: string | null;
          id?: string;
          otp_verification_id: string;
          provider?: string;
          provider_message_id?: string | null;
          provider_response?: Json | null;
          provider_status_code?: string | null;
          status?: Database["public"]["Enums"]["otp_delivery_status"];
          updated_at?: string;
        };
        Update: {
          accepted_at?: string | null;
          attempt_number?: number;
          attempted_at?: string;
          created_at?: string;
          delivered_at?: string | null;
          destination_hash?: string;
          error_code?: string | null;
          error_message?: string | null;
          failed_at?: string | null;
          id?: string;
          otp_verification_id?: string;
          provider?: string;
          provider_message_id?: string | null;
          provider_response?: Json | null;
          provider_status_code?: string | null;
          status?: Database["public"]["Enums"]["otp_delivery_status"];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "otp_delivery_attempts_otp_verification_id_fkey";
            columns: ["otp_verification_id"];
            isOneToOne: false;
            referencedRelation: "otp_verifications";
            referencedColumns: ["id"];
          },
        ];
      };
      otp_verifications: {
        Row: {
          attempts: number;
          code_hash: string;
          created_at: string;
          expires_at: string;
          id: string;
          last_attempt_at: string | null;
          lead_id: string;
          phone_hash: string;
          status: Database["public"]["Enums"]["otp_status"];
          updated_at: string;
          verified_at: string | null;
        };
        Insert: {
          attempts?: number;
          code_hash: string;
          created_at?: string;
          expires_at: string;
          id?: string;
          last_attempt_at?: string | null;
          lead_id: string;
          phone_hash: string;
          status?: Database["public"]["Enums"]["otp_status"];
          updated_at?: string;
          verified_at?: string | null;
        };
        Update: {
          attempts?: number;
          code_hash?: string;
          created_at?: string;
          expires_at?: string;
          id?: string;
          last_attempt_at?: string | null;
          lead_id?: string;
          phone_hash?: string;
          status?: Database["public"]["Enums"]["otp_status"];
          updated_at?: string;
          verified_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "otp_verifications_lead_id_fkey";
            columns: ["lead_id"];
            isOneToOne: false;
            referencedRelation: "leads";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          created_at: string;
          email: string;
          full_name: string | null;
          id: string;
          last_login_at: string | null;
          locked_until: string | null;
          platform_role: Database["public"]["Enums"]["platform_role"] | null;
          status: Database["public"]["Enums"]["account_status"];
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          email: string;
          full_name?: string | null;
          id: string;
          last_login_at?: string | null;
          locked_until?: string | null;
          platform_role?: Database["public"]["Enums"]["platform_role"] | null;
          status?: Database["public"]["Enums"]["account_status"];
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          email?: string;
          full_name?: string | null;
          id?: string;
          last_login_at?: string | null;
          locked_until?: string | null;
          platform_role?: Database["public"]["Enums"]["platform_role"] | null;
          status?: Database["public"]["Enums"]["account_status"];
          updated_at?: string;
        };
        Relationships: [];
      };
      qr_codes: {
        Row: {
          company_id: string;
          created_at: string;
          driver_id: string | null;
          error_correction: string;
          id: string;
          image_path: string | null;
          public_path: string;
          qr_type: Database["public"]["Enums"]["qr_code_type"];
          retired_at: string | null;
          status: Database["public"]["Enums"]["qr_code_status"];
          token: string;
          updated_at: string;
        };
        Insert: {
          company_id: string;
          created_at?: string;
          driver_id?: string | null;
          error_correction?: string;
          id?: string;
          image_path?: string | null;
          public_path: string;
          qr_type: Database["public"]["Enums"]["qr_code_type"];
          retired_at?: string | null;
          status?: Database["public"]["Enums"]["qr_code_status"];
          token?: string;
          updated_at?: string;
        };
        Update: {
          company_id?: string;
          created_at?: string;
          driver_id?: string | null;
          error_correction?: string;
          id?: string;
          image_path?: string | null;
          public_path?: string;
          qr_type?: Database["public"]["Enums"]["qr_code_type"];
          retired_at?: string | null;
          status?: Database["public"]["Enums"]["qr_code_status"];
          token?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "qr_codes_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "qr_codes_driver_id_fkey";
            columns: ["driver_id"];
            isOneToOne: false;
            referencedRelation: "drivers";
            referencedColumns: ["id"];
          },
        ];
      };
      reward_issuances: {
        Row: {
          campaign_id: string;
          cancellation_reason: string | null;
          cancelled_at: string | null;
          company_id: string;
          created_at: string;
          driver_id: string | null;
          expires_at: string | null;
          external_reference: string | null;
          id: string;
          issued_at: string | null;
          issued_by: string | null;
          lead_id: string;
          redeemed_at: string | null;
          redeemed_by: string | null;
          redemption_token_hash: string | null;
          reward_description: string | null;
          reward_type: string;
          status: Database["public"]["Enums"]["reward_issuance_status"];
          updated_at: string;
        };
        Insert: {
          campaign_id: string;
          cancellation_reason?: string | null;
          cancelled_at?: string | null;
          company_id: string;
          created_at?: string;
          driver_id?: string | null;
          expires_at?: string | null;
          external_reference?: string | null;
          id?: string;
          issued_at?: string | null;
          issued_by?: string | null;
          lead_id: string;
          redeemed_at?: string | null;
          redeemed_by?: string | null;
          redemption_token_hash?: string | null;
          reward_description?: string | null;
          reward_type: string;
          status?: Database["public"]["Enums"]["reward_issuance_status"];
          updated_at?: string;
        };
        Update: {
          campaign_id?: string;
          cancellation_reason?: string | null;
          cancelled_at?: string | null;
          company_id?: string;
          created_at?: string;
          driver_id?: string | null;
          expires_at?: string | null;
          external_reference?: string | null;
          id?: string;
          issued_at?: string | null;
          issued_by?: string | null;
          lead_id?: string;
          redeemed_at?: string | null;
          redeemed_by?: string | null;
          redemption_token_hash?: string | null;
          reward_description?: string | null;
          reward_type?: string;
          status?: Database["public"]["Enums"]["reward_issuance_status"];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "reward_issuances_campaign_id_fkey";
            columns: ["campaign_id"];
            isOneToOne: false;
            referencedRelation: "campaigns";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reward_issuances_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reward_issuances_driver_id_fkey";
            columns: ["driver_id"];
            isOneToOne: false;
            referencedRelation: "drivers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reward_issuances_issued_by_fkey";
            columns: ["issued_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reward_issuances_lead_id_fkey";
            columns: ["lead_id"];
            isOneToOne: true;
            referencedRelation: "leads";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reward_issuances_redeemed_by_fkey";
            columns: ["redeemed_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      user_session_controls: {
        Row: {
          created_at: string;
          device_hash: string;
          last_activity_at: string;
          revoked_at: string | null;
          session_id: string;
          started_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          device_hash: string;
          last_activity_at?: string;
          revoked_at?: string | null;
          session_id: string;
          started_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          device_hash?: string;
          last_activity_at?: string;
          revoked_at?: string | null;
          session_id?: string;
          started_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_session_controls_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      campaign_feedback_summary: {
        Row: {
          average_rating: number | null;
          campaign_id: string | null;
          comment_count: number | null;
          company_id: string | null;
          feedback_count: number | null;
          five_star_count: number | null;
          four_star_count: number | null;
          last_feedback_at: string | null;
          one_star_count: number | null;
          three_star_count: number | null;
          two_star_count: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "lead_feedback_campaign_id_fkey";
            columns: ["campaign_id"];
            isOneToOne: false;
            referencedRelation: "campaigns";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lead_feedback_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      campaign_video_feedback_summary: {
        Row: {
          average_rating: number | null;
          campaign_id: string | null;
          campaign_video_id: string | null;
          comment_count: number | null;
          company_id: string | null;
          feedback_count: number | null;
          five_star_count: number | null;
          four_star_count: number | null;
          last_feedback_at: string | null;
          one_star_count: number | null;
          three_star_count: number | null;
          two_star_count: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "leads_campaign_id_fkey";
            columns: ["campaign_id"];
            isOneToOne: false;
            referencedRelation: "campaigns";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "leads_campaign_video_id_fkey";
            columns: ["campaign_video_id"];
            isOneToOne: false;
            referencedRelation: "campaign_videos";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "leads_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Functions: {
      calculate_driver_bonuses_server: {
        Args: {
          p_base_fee_etb?: number;
          p_bonus_per_verified_lead_etb?: number;
          p_campaign_id: string;
          p_compliance_deduction_etb?: number;
          p_compliance_threshold?: number;
          p_top_driver_prize_etb?: number;
        };
        Returns: {
          driver_bonus_id: string;
          driver_id: string;
          total_bonus_etb: number;
          verified_leads_count: number;
        }[];
      };
      create_otp_challenge_server: {
        Args: {
          p_code_plaintext: string;
          p_lead_id: string;
          p_ttl_seconds?: number;
        };
        Returns: string;
      };
      get_public_landing_page: {
        Args: { p_locale?: string; p_public_path: string };
        Returns: Json;
      };
      record_otp_delivery_attempt_server: {
        Args: {
          p_attempt_number: number;
          p_destination_hash: string;
          p_error_code?: string;
          p_error_message?: string;
          p_otp_verification_id: string;
          p_provider: string;
          p_provider_message_id?: string;
          p_status: Database["public"]["Enums"]["otp_delivery_status"];
        };
        Returns: string;
      };
      resolve_driver_campaign: {
        Args: { p_qr_token: string };
        Returns: {
          brand_color: string;
          campaign_id: string;
          campaign_name: string;
          company_id: string;
          company_name: string;
          driver_id: string;
          driver_name: string;
          landing_config: Json;
          logo_url: string;
          reward_desc: string;
        }[];
      };
      submit_lead_feedback_server: {
        Args: {
          p_comment?: string;
          p_content_locale?: string;
          p_content_version?: number;
          p_idempotency_key: string;
          p_lead_id: string;
          p_rating: number;
        };
        Returns: string;
      };
      submit_lead_server: {
        Args: {
          p_captcha_verified?: boolean;
          p_consent_given?: boolean;
          p_device_fingerprint_hash?: string;
          p_email?: string;
          p_full_name: string;
          p_idempotency_key: string;
          p_interested_service_text?: string;
          p_ip_hash?: string;
          p_message?: string;
          p_organization?: string;
          p_phone_e164: string;
          p_phone_hash: string;
          p_preferred_contact_method?: Database["public"]["Enums"]["preferred_contact_method"];
          p_privacy_notice_version?: string;
          p_public_path: string;
          p_service_id?: string;
        };
        Returns: string;
      };
      verify_otp_server: {
        Args: { p_code_plaintext: string; p_lead_id: string };
        Returns: boolean;
      };
    };
    Enums: {
      account_status: "active" | "locked" | "disabled";
      assignment_status: "active" | "completed" | "removed";
      bonus_status: "pending" | "approved" | "paid" | "cancelled";
      campaign_status:
        "draft" | "scheduled" | "active" | "paused" | "completed" | "cancelled";
      campaign_type:
        | "lead_generation"
        | "product_launch"
        | "appointment_booking"
        | "brand_awareness";
      company_status: "draft" | "active" | "inactive" | "archived";
      deletion_request_status:
        "received" | "verified" | "approved" | "completed" | "rejected";
      driver_status:
        "registered" | "shortlisted" | "active" | "suspended" | "removed";
      feedback_status: "new" | "viewed" | "actioned" | "archived";
      fraud_flag_type:
        | "duplicate_phone"
        | "duplicate_device"
        | "ip_velocity"
        | "velocity_anomaly"
        | "inventory_mismatch"
        | "manual_review";
      inventory_movement_type:
        "issued" | "returned" | "distributed" | "lost" | "adjustment";
      invoice_status:
        "draft" | "sent" | "partially_paid" | "paid" | "overdue" | "void";
      lead_activity_status:
        "planned" | "in_progress" | "completed" | "cancelled";
      lead_activity_type:
        | "call"
        | "sms"
        | "email"
        | "whatsapp"
        | "telegram"
        | "appointment"
        | "note";
      lead_quality_source: "rule_engine" | "manual_review" | "system";
      lead_quality_status:
        | "pending"
        | "qualified"
        | "duplicate"
        | "fraud_suspected"
        | "fraud_confirmed"
        | "invalid_phone"
        | "invalid_other"
        | "rejected";
      lead_status:
        | "new"
        | "viewed"
        | "contacted"
        | "appointment_set"
        | "followed_up"
        | "converted"
        | "rejected"
        | "duplicate"
        | "invalid"
        | "archived";
      lead_verification_status:
        | "submitted"
        | "otp_sent"
        | "otp_verified"
        | "otp_failed"
        | "call_verified"
        | "rejected";
      membership_role: "company_rep";
      notification_attempt_status: "sent" | "failed";
      notification_channel: "email" | "telegram";
      notification_digest_status:
        "pending" | "processing" | "sent" | "failed" | "cancelled";
      notification_event_type: "lead_verified" | "feedback_received";
      notification_frequency: "instant" | "daily_digest";
      notification_job_status:
        | "pending"
        | "processing"
        | "retry"
        | "sent"
        | "dead_letter"
        | "cancelled";
      notification_summary_status:
        | "waiting_verification"
        | "not_configured"
        | "pending"
        | "sent"
        | "partially_sent"
        | "failed";
      otp_delivery_status: "pending" | "accepted" | "delivered" | "failed";
      otp_status:
        "created" | "send_pending" | "sent" | "verified" | "expired" | "failed";
      platform_role: "super_admin" | "admin";
      preferred_contact_method: "phone" | "email" | "whatsapp";
      qr_code_status: "active" | "inactive" | "retired";
      qr_code_type: "company" | "driver";
      reward_issuance_status:
        "pending" | "issued" | "redeemed" | "expired" | "cancelled";
      video_provider: "youtube" | "vimeo" | "cloudinary" | "supabase_storage";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      account_status: ["active", "locked", "disabled"],
      assignment_status: ["active", "completed", "removed"],
      bonus_status: ["pending", "approved", "paid", "cancelled"],
      campaign_status: [
        "draft",
        "scheduled",
        "active",
        "paused",
        "completed",
        "cancelled",
      ],
      campaign_type: [
        "lead_generation",
        "product_launch",
        "appointment_booking",
        "brand_awareness",
      ],
      company_status: ["draft", "active", "inactive", "archived"],
      deletion_request_status: [
        "received",
        "verified",
        "approved",
        "completed",
        "rejected",
      ],
      driver_status: [
        "registered",
        "shortlisted",
        "active",
        "suspended",
        "removed",
      ],
      feedback_status: ["new", "viewed", "actioned", "archived"],
      fraud_flag_type: [
        "duplicate_phone",
        "duplicate_device",
        "ip_velocity",
        "velocity_anomaly",
        "inventory_mismatch",
        "manual_review",
      ],
      inventory_movement_type: [
        "issued",
        "returned",
        "distributed",
        "lost",
        "adjustment",
      ],
      invoice_status: [
        "draft",
        "sent",
        "partially_paid",
        "paid",
        "overdue",
        "void",
      ],
      lead_activity_status: [
        "planned",
        "in_progress",
        "completed",
        "cancelled",
      ],
      lead_activity_type: [
        "call",
        "sms",
        "email",
        "whatsapp",
        "telegram",
        "appointment",
        "note",
      ],
      lead_quality_source: ["rule_engine", "manual_review", "system"],
      lead_quality_status: [
        "pending",
        "qualified",
        "duplicate",
        "fraud_suspected",
        "fraud_confirmed",
        "invalid_phone",
        "invalid_other",
        "rejected",
      ],
      lead_status: [
        "new",
        "viewed",
        "contacted",
        "appointment_set",
        "followed_up",
        "converted",
        "rejected",
        "duplicate",
        "invalid",
        "archived",
      ],
      lead_verification_status: [
        "submitted",
        "otp_sent",
        "otp_verified",
        "otp_failed",
        "call_verified",
        "rejected",
      ],
      membership_role: ["company_rep"],
      notification_attempt_status: ["sent", "failed"],
      notification_channel: ["email", "telegram"],
      notification_digest_status: [
        "pending",
        "processing",
        "sent",
        "failed",
        "cancelled",
      ],
      notification_event_type: ["lead_verified", "feedback_received"],
      notification_frequency: ["instant", "daily_digest"],
      notification_job_status: [
        "pending",
        "processing",
        "retry",
        "sent",
        "dead_letter",
        "cancelled",
      ],
      notification_summary_status: [
        "waiting_verification",
        "not_configured",
        "pending",
        "sent",
        "partially_sent",
        "failed",
      ],
      otp_delivery_status: ["pending", "accepted", "delivered", "failed"],
      otp_status: [
        "created",
        "send_pending",
        "sent",
        "verified",
        "expired",
        "failed",
      ],
      platform_role: ["super_admin", "admin"],
      preferred_contact_method: ["phone", "email", "whatsapp"],
      qr_code_status: ["active", "inactive", "retired"],
      qr_code_type: ["company", "driver"],
      reward_issuance_status: [
        "pending",
        "issued",
        "redeemed",
        "expired",
        "cancelled",
      ],
      video_provider: ["youtube", "vimeo", "cloudinary", "supabase_storage"],
    },
  },
} as const;
