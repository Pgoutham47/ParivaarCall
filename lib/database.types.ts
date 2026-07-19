export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          phone: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          phone?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          phone?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      parents: {
        Row: {
          id: string;
          caregiver_id: string;
          name: string;
          relationship: string;
          phone: string;
          age: number | null;
          language: string;
          city: string | null;
          emergency_contact_name: string | null;
          emergency_contact_phone: string | null;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          caregiver_id: string;
          name: string;
          relationship: string;
          phone: string;
          age?: number | null;
          language: string;
          city?: string | null;
          emergency_contact_name?: string | null;
          emergency_contact_phone?: string | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          caregiver_id?: string;
          name?: string;
          relationship?: string;
          phone?: string;
          age?: number | null;
          language?: string;
          city?: string | null;
          emergency_contact_name?: string | null;
          emergency_contact_phone?: string | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "parents_caregiver_id_fkey";
            columns: ["caregiver_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      medicine_schedules: {
        Row: {
          id: string;
          caregiver_id: string;
          parent_id: string;
          medicine_name: string;
          dosage_instruction: string | null;
          scheduled_time: string;
          food_timing: string | null;
          frequency: string;
          is_important: boolean;
          start_date: string | null;
          end_date: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          caregiver_id: string;
          parent_id: string;
          medicine_name: string;
          dosage_instruction?: string | null;
          scheduled_time: string;
          food_timing?: string | null;
          frequency?: string;
          is_important?: boolean;
          start_date?: string | null;
          end_date?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          caregiver_id?: string;
          parent_id?: string;
          medicine_name?: string;
          dosage_instruction?: string | null;
          scheduled_time?: string;
          food_timing?: string | null;
          frequency?: string;
          is_important?: boolean;
          start_date?: string | null;
          end_date?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "medicine_schedules_caregiver_id_fkey";
            columns: ["caregiver_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "medicine_schedules_parent_id_fkey";
            columns: ["parent_id"];
            isOneToOne: false;
            referencedRelation: "parents";
            referencedColumns: ["id"];
          }
        ];
      };
      voice_settings: {
        Row: {
          id: string;
          caregiver_id: string;
          preferred_language: string;
          voice_gender: string;
          voice_tone: string;
          speech_speed: string;
          respect_mode: string;
          retry_delay_minutes: number;
          max_retries: number;
          whatsapp_enabled: boolean;
          sms_enabled: boolean;
          email_enabled: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          caregiver_id: string;
          preferred_language?: string;
          voice_gender?: string;
          voice_tone?: string;
          speech_speed?: string;
          respect_mode?: string;
          retry_delay_minutes?: number;
          max_retries?: number;
          whatsapp_enabled?: boolean;
          sms_enabled?: boolean;
          email_enabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          caregiver_id?: string;
          preferred_language?: string;
          voice_gender?: string;
          voice_tone?: string;
          speech_speed?: string;
          respect_mode?: string;
          retry_delay_minutes?: number;
          max_retries?: number;
          whatsapp_enabled?: boolean;
          sms_enabled?: boolean;
          email_enabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "voice_settings_caregiver_id_fkey";
            columns: ["caregiver_id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      call_logs: {
        Row: {
          id: string;
          caregiver_id: string;
          parent_id: string;
          medicine_schedule_id: string | null;
          scheduled_for: string | null;
          call_started_at: string | null;
          call_ended_at: string | null;
          call_status: string | null;
          response_type: string | null;
          retry_count: number;
          retry_parent_call_log_id: string | null;
          script_text: string | null;
          script_language: string | null;
          audio_url: string | null;
          audio_status: string;
          audio_provider: string | null;
          audio_generated_at: string | null;
          call_provider: string | null;
          provider_call_id: string | null;
          transcript: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          caregiver_id: string;
          parent_id: string;
          medicine_schedule_id?: string | null;
          scheduled_for?: string | null;
          call_started_at?: string | null;
          call_ended_at?: string | null;
          call_status?: string | null;
          response_type?: string | null;
          retry_count?: number;
          retry_parent_call_log_id?: string | null;
          script_text?: string | null;
          script_language?: string | null;
          audio_url?: string | null;
          audio_status?: string;
          audio_provider?: string | null;
          audio_generated_at?: string | null;
          call_provider?: string | null;
          provider_call_id?: string | null;
          transcript?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          caregiver_id?: string;
          parent_id?: string;
          medicine_schedule_id?: string | null;
          scheduled_for?: string | null;
          call_started_at?: string | null;
          call_ended_at?: string | null;
          call_status?: string | null;
          response_type?: string | null;
          retry_count?: number;
          retry_parent_call_log_id?: string | null;
          script_text?: string | null;
          script_language?: string | null;
          audio_url?: string | null;
          audio_status?: string;
          audio_provider?: string | null;
          audio_generated_at?: string | null;
          call_provider?: string | null;
          provider_call_id?: string | null;
          transcript?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "call_logs_caregiver_id_fkey";
            columns: ["caregiver_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "call_logs_parent_id_fkey";
            columns: ["parent_id"];
            isOneToOne: false;
            referencedRelation: "parents";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "call_logs_medicine_schedule_id_fkey";
            columns: ["medicine_schedule_id"];
            isOneToOne: false;
            referencedRelation: "medicine_schedules";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "call_logs_retry_parent_call_log_id_fkey";
            columns: ["retry_parent_call_log_id"];
            isOneToOne: false;
            referencedRelation: "call_logs";
            referencedColumns: ["id"];
          }
        ];
      };
      alerts: {
        Row: {
          id: string;
          caregiver_id: string;
          parent_id: string;
          medicine_schedule_id: string | null;
          alert_type: string;
          severity: string;
          title: string;
          message: string | null;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          caregiver_id: string;
          parent_id: string;
          medicine_schedule_id?: string | null;
          alert_type: string;
          severity?: string;
          title: string;
          message?: string | null;
          is_read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          caregiver_id?: string;
          parent_id?: string;
          medicine_schedule_id?: string | null;
          alert_type?: string;
          severity?: string;
          title?: string;
          message?: string | null;
          is_read?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "alerts_caregiver_id_fkey";
            columns: ["caregiver_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "alerts_parent_id_fkey";
            columns: ["parent_id"];
            isOneToOne: false;
            referencedRelation: "parents";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "alerts_medicine_schedule_id_fkey";
            columns: ["medicine_schedule_id"];
            isOneToOne: false;
            referencedRelation: "medicine_schedules";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
