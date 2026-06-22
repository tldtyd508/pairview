export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          avatar_url: string | null;
          auth_user_id: string;
          created_at: string;
          display_name: string | null;
          id: string;
          updated_at: string;
        };
        Insert: {
          avatar_url?: string | null;
          auth_user_id: string;
          created_at?: string;
          display_name?: string | null;
          id?: string;
          updated_at?: string;
        };
        Update: {
          avatar_url?: string | null;
          auth_user_id?: string;
          created_at?: string;
          display_name?: string | null;
          id?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      pairs: {
        Row: {
          created_at: string;
          created_by_user_id: string;
          id: string;
          label: string | null;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          created_by_user_id: string;
          id?: string;
          label?: string | null;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          created_by_user_id?: string;
          id?: string;
          label?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      pair_memberships: {
        Row: {
          created_at: string;
          id: string;
          pair_id: string;
          role: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          pair_id: string;
          role?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          pair_id?: string;
          role?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      invitations: {
        Row: {
          accepted_at: string | null;
          code: string;
          created_at: string;
          created_by_user_id: string;
          expires_at: string | null;
          id: string;
          pair_id: string;
          revoked_at: string | null;
          uses_remaining: number;
        };
        Insert: {
          accepted_at?: string | null;
          code: string;
          created_at?: string;
          created_by_user_id: string;
          expires_at?: string | null;
          id?: string;
          pair_id: string;
          revoked_at?: string | null;
          uses_remaining?: number;
        };
        Update: {
          accepted_at?: string | null;
          code?: string;
          created_at?: string;
          created_by_user_id?: string;
          expires_at?: string | null;
          id?: string;
          pair_id?: string;
          revoked_at?: string | null;
          uses_remaining?: number;
        };
        Relationships: [];
      };
      subjects: {
        Row: {
          created_at: string;
          created_by_user_id: string;
          description: string | null;
          id: string;
          kind: string;
          metadata: Json;
          pair_id: string;
          title: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          created_by_user_id: string;
          description?: string | null;
          id?: string;
          kind: string;
          metadata?: Json;
          pair_id: string;
          title: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          created_by_user_id?: string;
          description?: string | null;
          id?: string;
          kind?: string;
          metadata?: Json;
          pair_id?: string;
          title?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      experiences: {
        Row: {
          created_at: string;
          created_by_user_id: string;
          happened_on: string;
          id: string;
          notes: string | null;
          pair_id: string;
          subject_id: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          created_by_user_id: string;
          happened_on: string;
          id?: string;
          notes?: string | null;
          pair_id: string;
          subject_id: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          created_by_user_id?: string;
          happened_on?: string;
          id?: string;
          notes?: string | null;
          pair_id?: string;
          subject_id?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      reviews: {
        Row: {
          body: string | null;
          created_at: string;
          experience_id: string;
          id: string;
          pair_id: string;
          score: number;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          body?: string | null;
          created_at?: string;
          experience_id: string;
          id?: string;
          pair_id: string;
          score: number;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          body?: string | null;
          created_at?: string;
          experience_id?: string;
          id?: string;
          pair_id?: string;
          score?: number;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      markers: {
        Row: {
          color: string;
          created_at: string;
          created_by_user_id: string;
          description: string | null;
          icon: string;
          id: string;
          is_default: boolean;
          name: string;
          pair_id: string;
          updated_at: string;
        };
        Insert: {
          color: string;
          created_at?: string;
          created_by_user_id: string;
          description?: string | null;
          icon: string;
          id?: string;
          is_default?: boolean;
          name: string;
          pair_id: string;
          updated_at?: string;
        };
        Update: {
          color?: string;
          created_at?: string;
          created_by_user_id?: string;
          description?: string | null;
          icon?: string;
          id?: string;
          is_default?: boolean;
          name?: string;
          pair_id?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      experience_markers: {
        Row: {
          applied_at: string;
          applied_by_user_id: string;
          experience_id: string;
          marker_id: string;
          pair_id: string;
        };
        Insert: {
          applied_at?: string;
          applied_by_user_id: string;
          experience_id: string;
          marker_id: string;
          pair_id: string;
        };
        Update: {
          applied_at?: string;
          applied_by_user_id?: string;
          experience_id?: string;
          marker_id?: string;
          pair_id?: string;
        };
        Relationships: [];
      };
      photo_attachments: {
        Row: {
          caption: string | null;
          created_at: string;
          created_by_user_id: string;
          experience_id: string;
          id: string;
          pair_id: string;
          sort_order: number;
          storage_bucket: string;
          storage_path: string;
          updated_at: string;
        };
        Insert: {
          caption?: string | null;
          created_at?: string;
          created_by_user_id: string;
          experience_id: string;
          id?: string;
          pair_id: string;
          sort_order?: number;
          storage_bucket?: string;
          storage_path: string;
          updated_at?: string;
        };
        Update: {
          caption?: string | null;
          created_at?: string;
          created_by_user_id?: string;
          experience_id?: string;
          id?: string;
          pair_id?: string;
          sort_order?: number;
          storage_bucket?: string;
          storage_path?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_pair_member: {
        Args: {
          target_pair_id: string;
        };
        Returns: boolean;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
