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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      academic_years: {
        Row: {
          created_at: string
          end_date: string
          id: string
          is_active: boolean
          is_archived: boolean
          name: string
          school_id: string
          start_date: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          end_date: string
          id?: string
          is_active?: boolean
          is_archived?: boolean
          name: string
          school_id: string
          start_date: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          end_date?: string
          id?: string
          is_active?: boolean
          is_archived?: boolean
          name?: string
          school_id?: string
          start_date?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "academic_years_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      assessments: {
        Row: {
          academic_year_id: string | null
          assessment_date: string
          assessment_type: Database["public"]["Enums"]["assessment_type"]
          class_id: string
          coefficient: number
          created_at: string
          created_by: string | null
          id: string
          max_score: number
          name: string
          notes: string | null
          school_id: string
          subject_id: string
          teacher_id: string | null
          updated_at: string
        }
        Insert: {
          academic_year_id?: string | null
          assessment_date?: string
          assessment_type?: Database["public"]["Enums"]["assessment_type"]
          class_id: string
          coefficient?: number
          created_at?: string
          created_by?: string | null
          id?: string
          max_score?: number
          name: string
          notes?: string | null
          school_id: string
          subject_id: string
          teacher_id?: string | null
          updated_at?: string
        }
        Update: {
          academic_year_id?: string | null
          assessment_date?: string
          assessment_type?: Database["public"]["Enums"]["assessment_type"]
          class_id?: string
          coefficient?: number
          created_at?: string
          created_by?: string | null
          id?: string
          max_score?: number
          name?: string
          notes?: string | null
          school_id?: string
          subject_id?: string
          teacher_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessments_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessments_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessments_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessments_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessments_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance_sessions: {
        Row: {
          class_id: string
          created_at: string
          created_by: string | null
          end_time: string | null
          id: string
          notes: string | null
          school_id: string
          session_date: string
          start_time: string | null
          subject_id: string | null
          teacher_id: string | null
        }
        Insert: {
          class_id: string
          created_at?: string
          created_by?: string | null
          end_time?: string | null
          id?: string
          notes?: string | null
          school_id: string
          session_date: string
          start_time?: string | null
          subject_id?: string | null
          teacher_id?: string | null
        }
        Update: {
          class_id?: string
          created_at?: string
          created_by?: string | null
          end_time?: string | null
          id?: string
          notes?: string | null
          school_id?: string
          session_date?: string
          start_time?: string | null
          subject_id?: string | null
          teacher_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attendance_sessions_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_sessions_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_sessions_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_sessions_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      attendances: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          session_id: string
          status: Database["public"]["Enums"]["attendance_status"]
          student_id: string
          updated_at: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          session_id: string
          status?: Database["public"]["Enums"]["attendance_status"]
          student_id: string
          updated_at?: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          session_id?: string
          status?: Database["public"]["Enums"]["attendance_status"]
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendances_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "attendance_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendances_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      class_group_members: {
        Row: {
          class_id: string
          created_at: string
          group_id: string
          id: string
        }
        Insert: {
          class_id: string
          created_at?: string
          group_id: string
          id?: string
        }
        Update: {
          class_id?: string
          created_at?: string
          group_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "class_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      class_groups: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          school_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          school_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          school_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      class_subjects: {
        Row: {
          class_id: string
          coefficient: number
          created_at: string
          id: string
          subject_id: string
          teacher_id: string | null
          updated_at: string
          weekly_hours: number | null
        }
        Insert: {
          class_id: string
          coefficient?: number
          created_at?: string
          id?: string
          subject_id: string
          teacher_id?: string | null
          updated_at?: string
          weekly_hours?: number | null
        }
        Update: {
          class_id?: string
          coefficient?: number
          created_at?: string
          id?: string
          subject_id?: string
          teacher_id?: string | null
          updated_at?: string
          weekly_hours?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "class_subjects_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_subjects_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_subjects_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          academic_year_id: string
          capacity: number
          created_at: string
          id: string
          level_id: string | null
          main_teacher_id: string | null
          name: string
          room: string | null
          school_id: string
          section: string | null
          updated_at: string
        }
        Insert: {
          academic_year_id: string
          capacity?: number
          created_at?: string
          id?: string
          level_id?: string | null
          main_teacher_id?: string | null
          name: string
          room?: string | null
          school_id: string
          section?: string | null
          updated_at?: string
        }
        Update: {
          academic_year_id?: string
          capacity?: number
          created_at?: string
          id?: string
          level_id?: string | null
          main_teacher_id?: string | null
          name?: string
          room?: string | null
          school_id?: string
          section?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "classes_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classes_level_id_fkey"
            columns: ["level_id"]
            isOneToOne: false
            referencedRelation: "levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classes_main_teacher_id_fkey"
            columns: ["main_teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classes_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_members: {
        Row: {
          conversation_id: string
          id: string
          joined_at: string
          last_read_at: string | null
          user_id: string
        }
        Insert: {
          conversation_id: string
          id?: string
          joined_at?: string
          last_read_at?: string | null
          user_id: string
        }
        Update: {
          conversation_id?: string
          id?: string
          joined_at?: string
          last_read_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_members_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          is_group: boolean
          school_id: string
          title: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_group?: boolean
          school_id: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_group?: boolean
          school_id?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      enrollments: {
        Row: {
          academic_year_id: string
          class_id: string
          created_at: string
          ended_at: string | null
          enrolled_at: string
          id: string
          status: Database["public"]["Enums"]["enrollment_status"]
          student_id: string
        }
        Insert: {
          academic_year_id: string
          class_id: string
          created_at?: string
          ended_at?: string | null
          enrolled_at?: string
          id?: string
          status?: Database["public"]["Enums"]["enrollment_status"]
          student_id: string
        }
        Update: {
          academic_year_id?: string
          class_id?: string
          created_at?: string
          ended_at?: string | null
          enrolled_at?: string
          id?: string
          status?: Database["public"]["Enums"]["enrollment_status"]
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      fee_items: {
        Row: {
          academic_year_id: string | null
          amount: number
          class_id: string | null
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          is_mandatory: boolean
          level_id: string | null
          name: string
          periodicity: Database["public"]["Enums"]["fee_periodicity"]
          school_id: string
          updated_at: string
        }
        Insert: {
          academic_year_id?: string | null
          amount?: number
          class_id?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          is_mandatory?: boolean
          level_id?: string | null
          name: string
          periodicity?: Database["public"]["Enums"]["fee_periodicity"]
          school_id: string
          updated_at?: string
        }
        Update: {
          academic_year_id?: string | null
          amount?: number
          class_id?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          is_mandatory?: boolean
          level_id?: string | null
          name?: string
          periodicity?: Database["public"]["Enums"]["fee_periodicity"]
          school_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fee_items_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fee_items_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fee_items_level_id_fkey"
            columns: ["level_id"]
            isOneToOne: false
            referencedRelation: "levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fee_items_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      fee_payments: {
        Row: {
          amount: number
          created_at: string
          created_by: string | null
          fee_item_id: string | null
          id: string
          method: Database["public"]["Enums"]["payment_method"]
          notes: string | null
          paid_at: string
          receipt_number: string | null
          school_id: string
          student_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          created_by?: string | null
          fee_item_id?: string | null
          id?: string
          method?: Database["public"]["Enums"]["payment_method"]
          notes?: string | null
          paid_at?: string
          receipt_number?: string | null
          school_id: string
          student_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string | null
          fee_item_id?: string | null
          id?: string
          method?: Database["public"]["Enums"]["payment_method"]
          notes?: string | null
          paid_at?: string
          receipt_number?: string | null
          school_id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fee_payments_fee_item_id_fkey"
            columns: ["fee_item_id"]
            isOneToOne: false
            referencedRelation: "fee_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fee_payments_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fee_payments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      grades: {
        Row: {
          assessment_id: string
          comment: string | null
          created_at: string
          id: string
          is_absent: boolean
          score: number | null
          student_id: string
          updated_at: string
        }
        Insert: {
          assessment_id: string
          comment?: string | null
          created_at?: string
          id?: string
          is_absent?: boolean
          score?: number | null
          student_id: string
          updated_at?: string
        }
        Update: {
          assessment_id?: string
          comment?: string | null
          created_at?: string
          id?: string
          is_absent?: boolean
          score?: number | null
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "grades_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grades_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      levels: {
        Row: {
          created_at: string
          cycle: string | null
          id: string
          name: string
          order_index: number
          school_id: string
          short_code: string
        }
        Insert: {
          created_at?: string
          cycle?: string | null
          id?: string
          name: string
          order_index?: number
          school_id: string
          short_code: string
        }
        Update: {
          created_at?: string
          cycle?: string | null
          id?: string
          name?: string
          order_index?: number
          school_id?: string
          short_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "levels_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          attachment_name: string | null
          attachment_url: string | null
          body: string | null
          conversation_id: string
          created_at: string
          id: string
          sender_id: string
        }
        Insert: {
          attachment_name?: string | null
          attachment_url?: string | null
          body?: string | null
          conversation_id: string
          created_at?: string
          id?: string
          sender_id: string
        }
        Update: {
          attachment_name?: string | null
          attachment_url?: string | null
          body?: string | null
          conversation_id?: string
          created_at?: string
          id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          link: string | null
          read_at: string | null
          school_id: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read_at?: string | null
          school_id?: string | null
          title: string
          type?: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read_at?: string | null
          school_id?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          school_id: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          school_id?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          school_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      schools: {
        Row: {
          accent_color: string
          address: string | null
          calendar_system: Database["public"]["Enums"]["calendar_system"]
          country: string
          created_at: string
          currency: string
          default_language: string
          email: string | null
          founded_year: number | null
          grading_system: Database["public"]["Enums"]["grading_system"]
          id: string
          logo_url: string | null
          matricule_format: string
          matricule_sequence: number
          motto: string | null
          name: string
          phone: string | null
          primary_color: string
          school_type: Database["public"]["Enums"]["school_type"]
          updated_at: string
          website: string | null
        }
        Insert: {
          accent_color?: string
          address?: string | null
          calendar_system?: Database["public"]["Enums"]["calendar_system"]
          country?: string
          created_at?: string
          currency?: string
          default_language?: string
          email?: string | null
          founded_year?: number | null
          grading_system?: Database["public"]["Enums"]["grading_system"]
          id?: string
          logo_url?: string | null
          matricule_format?: string
          matricule_sequence?: number
          motto?: string | null
          name: string
          phone?: string | null
          primary_color?: string
          school_type?: Database["public"]["Enums"]["school_type"]
          updated_at?: string
          website?: string | null
        }
        Update: {
          accent_color?: string
          address?: string | null
          calendar_system?: Database["public"]["Enums"]["calendar_system"]
          country?: string
          created_at?: string
          currency?: string
          default_language?: string
          email?: string | null
          founded_year?: number | null
          grading_system?: Database["public"]["Enums"]["grading_system"]
          id?: string
          logo_url?: string | null
          matricule_format?: string
          matricule_sequence?: number
          motto?: string | null
          name?: string
          phone?: string | null
          primary_color?: string
          school_type?: Database["public"]["Enums"]["school_type"]
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      staff_invitations: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          invited_by: string
          role: Database["public"]["Enums"]["app_role"]
          school_id: string
          status: string
          temp_password: string | null
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          full_name: string
          id?: string
          invited_by: string
          role: Database["public"]["Enums"]["app_role"]
          school_id: string
          status?: string
          temp_password?: string | null
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          invited_by?: string
          role?: Database["public"]["Enums"]["app_role"]
          school_id?: string
          status?: string
          temp_password?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      student_documents: {
        Row: {
          created_at: string
          description: string | null
          document_type: Database["public"]["Enums"]["document_type"]
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          mime_type: string | null
          student_id: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          document_type: Database["public"]["Enums"]["document_type"]
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          student_id: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          document_type?: Database["public"]["Enums"]["document_type"]
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          student_id?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_documents_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_guardians: {
        Row: {
          address: string | null
          created_at: string
          email: string | null
          full_name: string
          guardian_type: Database["public"]["Enums"]["guardian_type"]
          guardian_user_id: string | null
          id: string
          is_pickup_authorized: boolean
          is_primary: boolean
          notes: string | null
          occupation: string | null
          phone: string | null
          student_id: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          email?: string | null
          full_name: string
          guardian_type: Database["public"]["Enums"]["guardian_type"]
          guardian_user_id?: string | null
          id?: string
          is_pickup_authorized?: boolean
          is_primary?: boolean
          notes?: string | null
          occupation?: string | null
          phone?: string | null
          student_id: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          guardian_type?: Database["public"]["Enums"]["guardian_type"]
          guardian_user_id?: string | null
          id?: string
          is_pickup_authorized?: boolean
          is_primary?: boolean
          notes?: string | null
          occupation?: string | null
          phone?: string | null
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_guardians_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_transfers: {
        Row: {
          approved_by: string | null
          certificate_number: string | null
          created_at: string
          created_by: string | null
          destination_school: string | null
          effective_date: string
          id: string
          origin_school: string | null
          reason: string
          student_id: string
          transfer_type: Database["public"]["Enums"]["transfer_type"]
        }
        Insert: {
          approved_by?: string | null
          certificate_number?: string | null
          created_at?: string
          created_by?: string | null
          destination_school?: string | null
          effective_date: string
          id?: string
          origin_school?: string | null
          reason: string
          student_id: string
          transfer_type: Database["public"]["Enums"]["transfer_type"]
        }
        Update: {
          approved_by?: string | null
          certificate_number?: string | null
          created_at?: string
          created_by?: string | null
          destination_school?: string | null
          effective_date?: string
          id?: string
          origin_school?: string | null
          reason?: string
          student_id?: string
          transfer_type?: Database["public"]["Enums"]["transfer_type"]
        }
        Relationships: [
          {
            foreignKeyName: "student_transfers_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          address: string | null
          allergies: string | null
          blood_type: Database["public"]["Enums"]["blood_type"] | null
          chronic_conditions: string | null
          city: string | null
          country: string | null
          created_at: string
          created_by: string | null
          date_of_birth: string
          disability: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          enrollment_date: string
          first_name: string
          gender: Database["public"]["Enums"]["gender"]
          id: string
          last_name: string
          matricule: string
          middle_name: string | null
          mother_tongue: string | null
          nationality: string | null
          notes: string | null
          photo_url: string | null
          place_of_birth: string | null
          preferred_name: string | null
          previous_class: string | null
          previous_results: string | null
          previous_school: string | null
          region: string | null
          religion: string | null
          school_id: string
          status: Database["public"]["Enums"]["student_status"]
          treating_doctor_name: string | null
          treating_doctor_phone: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          address?: string | null
          allergies?: string | null
          blood_type?: Database["public"]["Enums"]["blood_type"] | null
          chronic_conditions?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          date_of_birth: string
          disability?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          enrollment_date?: string
          first_name: string
          gender: Database["public"]["Enums"]["gender"]
          id?: string
          last_name: string
          matricule: string
          middle_name?: string | null
          mother_tongue?: string | null
          nationality?: string | null
          notes?: string | null
          photo_url?: string | null
          place_of_birth?: string | null
          preferred_name?: string | null
          previous_class?: string | null
          previous_results?: string | null
          previous_school?: string | null
          region?: string | null
          religion?: string | null
          school_id: string
          status?: Database["public"]["Enums"]["student_status"]
          treating_doctor_name?: string | null
          treating_doctor_phone?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          address?: string | null
          allergies?: string | null
          blood_type?: Database["public"]["Enums"]["blood_type"] | null
          chronic_conditions?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          date_of_birth?: string
          disability?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          enrollment_date?: string
          first_name?: string
          gender?: Database["public"]["Enums"]["gender"]
          id?: string
          last_name?: string
          matricule?: string
          middle_name?: string | null
          mother_tongue?: string | null
          nationality?: string | null
          notes?: string | null
          photo_url?: string | null
          place_of_birth?: string | null
          preferred_name?: string | null
          previous_class?: string | null
          previous_results?: string | null
          previous_school?: string | null
          region?: string | null
          religion?: string | null
          school_id?: string
          status?: Database["public"]["Enums"]["student_status"]
          treating_doctor_name?: string | null
          treating_doctor_phone?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "students_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      subjects: {
        Row: {
          color: string | null
          created_at: string
          default_coefficient: number
          id: string
          name: string
          school_id: string
          short_code: string | null
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          default_coefficient?: number
          id?: string
          name: string
          school_id: string
          short_code?: string | null
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          default_coefficient?: number
          id?: string
          name?: string
          school_id?: string
          short_code?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subjects_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      timetable_slots: {
        Row: {
          class_id: string
          created_at: string
          day: Database["public"]["Enums"]["weekday"]
          end_time: string
          id: string
          room: string | null
          school_id: string
          start_time: string
          subject_id: string | null
          teacher_id: string | null
          updated_at: string
        }
        Insert: {
          class_id: string
          created_at?: string
          day: Database["public"]["Enums"]["weekday"]
          end_time: string
          id?: string
          room?: string | null
          school_id: string
          start_time: string
          subject_id?: string | null
          teacher_id?: string | null
          updated_at?: string
        }
        Update: {
          class_id?: string
          created_at?: string
          day?: Database["public"]["Enums"]["weekday"]
          end_time?: string
          id?: string
          room?: string | null
          school_id?: string
          start_time?: string
          subject_id?: string | null
          teacher_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "timetable_slots_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timetable_slots_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timetable_slots_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timetable_slots_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_preferences: {
        Row: {
          created_at: string
          custom_accent_color: string | null
          custom_primary_color: string | null
          language: string
          theme_mode: Database["public"]["Enums"]["theme_mode"]
          updated_at: string
          use_school_palette: boolean
          user_id: string
        }
        Insert: {
          created_at?: string
          custom_accent_color?: string | null
          custom_primary_color?: string | null
          language?: string
          theme_mode?: Database["public"]["Enums"]["theme_mode"]
          updated_at?: string
          use_school_palette?: boolean
          user_id: string
        }
        Update: {
          created_at?: string
          custom_accent_color?: string | null
          custom_primary_color?: string | null
          language?: string
          theme_mode?: Database["public"]["Enums"]["theme_mode"]
          updated_at?: string
          use_school_palette?: boolean
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          school_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          school_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          school_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      classes_share_group: {
        Args: { _class_a: string; _class_b: string }
        Returns: boolean
      }
      generate_matricule: {
        Args: { _level_code?: string; _school_id: string }
        Returns: string
      }
      get_user_school: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_conversation_member: {
        Args: { _conversation_id: string; _user_id: string }
        Returns: boolean
      }
      is_guardian_of_school: {
        Args: { _school_id: string; _user_id: string }
        Returns: boolean
      }
      is_guardian_of_student: {
        Args: { _student_id: string; _user_id: string }
        Returns: boolean
      }
      list_school_staff: {
        Args: { _school_id: string }
        Returns: {
          avatar_url: string
          created_at: string
          email: string
          full_name: string
          phone: string
          roles: Database["public"]["Enums"]["app_role"][]
          user_id: string
        }[]
      }
      setup_demo_school:
        | {
            Args: {
              _academic_year_end?: string
              _academic_year_name?: string
              _academic_year_start?: string
              _country?: string
              _currency?: string
              _default_language?: string
              _levels?: Json
              _name: string
              _school_type?: Database["public"]["Enums"]["school_type"]
            }
            Returns: string
          }
        | { Args: { _payload: Json }; Returns: string }
    }
    Enums: {
      app_role:
        | "super_admin"
        | "director"
        | "deputy_director"
        | "secretary"
        | "accountant"
        | "teacher"
        | "main_teacher"
        | "supervisor"
        | "librarian"
        | "nurse"
        | "transport_manager"
        | "canteen_manager"
        | "student"
        | "parent"
        | "driver"
        | "hr_manager"
        | "alumni_manager"
        | "security_agent"
      assessment_type:
        | "exam"
        | "quiz"
        | "homework"
        | "project"
        | "oral"
        | "continuous"
      attendance_status: "present" | "absent" | "late" | "excused"
      blood_type:
        | "A+"
        | "A-"
        | "B+"
        | "B-"
        | "AB+"
        | "AB-"
        | "O+"
        | "O-"
        | "unknown"
      calendar_system: "trimester" | "semester" | "sequence_6" | "quarter"
      document_type:
        | "birth_certificate"
        | "id_card"
        | "passport"
        | "previous_report"
        | "medical_certificate"
        | "photo"
        | "vaccination_record"
        | "parent_id"
        | "address_proof"
        | "other"
      enrollment_status:
        | "enrolled"
        | "reenrolled"
        | "withdrawn"
        | "completed"
        | "repeating"
      fee_periodicity: "yearly" | "termly" | "monthly" | "one_time"
      gender: "male" | "female" | "other"
      grading_system:
        | "out_of_20"
        | "out_of_100"
        | "out_of_10"
        | "letter"
        | "gpa_4"
        | "competency"
      guardian_type: "father" | "mother" | "legal_guardian" | "other"
      payment_method:
        | "cash"
        | "bank_transfer"
        | "mobile_money"
        | "check"
        | "card"
        | "other"
      school_type:
        | "kindergarten"
        | "primary"
        | "middle_school"
        | "high_school"
        | "university"
        | "driving_school"
        | "art_school"
        | "sport_school"
        | "professional_school"
        | "preschool"
        | "vocational"
        | "arts_sports_school"
      student_status:
        | "active"
        | "suspended"
        | "transferred"
        | "expelled"
        | "graduated"
        | "withdrawn"
        | "archived"
      theme_mode: "light" | "dark" | "system"
      transfer_type: "incoming" | "outgoing" | "expulsion" | "graduation"
      weekday:
        | "monday"
        | "tuesday"
        | "wednesday"
        | "thursday"
        | "friday"
        | "saturday"
        | "sunday"
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
      app_role: [
        "super_admin",
        "director",
        "deputy_director",
        "secretary",
        "accountant",
        "teacher",
        "main_teacher",
        "supervisor",
        "librarian",
        "nurse",
        "transport_manager",
        "canteen_manager",
        "student",
        "parent",
        "driver",
        "hr_manager",
        "alumni_manager",
        "security_agent",
      ],
      assessment_type: [
        "exam",
        "quiz",
        "homework",
        "project",
        "oral",
        "continuous",
      ],
      attendance_status: ["present", "absent", "late", "excused"],
      blood_type: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "unknown"],
      calendar_system: ["trimester", "semester", "sequence_6", "quarter"],
      document_type: [
        "birth_certificate",
        "id_card",
        "passport",
        "previous_report",
        "medical_certificate",
        "photo",
        "vaccination_record",
        "parent_id",
        "address_proof",
        "other",
      ],
      enrollment_status: [
        "enrolled",
        "reenrolled",
        "withdrawn",
        "completed",
        "repeating",
      ],
      fee_periodicity: ["yearly", "termly", "monthly", "one_time"],
      gender: ["male", "female", "other"],
      grading_system: [
        "out_of_20",
        "out_of_100",
        "out_of_10",
        "letter",
        "gpa_4",
        "competency",
      ],
      guardian_type: ["father", "mother", "legal_guardian", "other"],
      payment_method: [
        "cash",
        "bank_transfer",
        "mobile_money",
        "check",
        "card",
        "other",
      ],
      school_type: [
        "kindergarten",
        "primary",
        "middle_school",
        "high_school",
        "university",
        "driving_school",
        "art_school",
        "sport_school",
        "professional_school",
        "preschool",
        "vocational",
        "arts_sports_school",
      ],
      student_status: [
        "active",
        "suspended",
        "transferred",
        "expelled",
        "graduated",
        "withdrawn",
        "archived",
      ],
      theme_mode: ["light", "dark", "system"],
      transfer_type: ["incoming", "outgoing", "expulsion", "graduation"],
      weekday: [
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
        "sunday",
      ],
    },
  },
} as const
