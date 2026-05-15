export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type UserRole = 'user' | 'admin'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          display_name: string | null
          avatar_url: string | null
          role: UserRole
          is_approved: boolean
          theme: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          display_name?: string | null
          avatar_url?: string | null
          role?: UserRole
          is_approved?: boolean
          theme?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          display_name?: string | null
          avatar_url?: string | null
          role?: UserRole
          is_approved?: boolean
          theme?: Json | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      books: {
        Row: {
          id: string
          title: string
          slug: string
          description: string | null
          cover_image_url: string | null
          display_order: number
          is_published: boolean
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          slug: string
          description?: string | null
          cover_image_url?: string | null
          display_order?: number
          is_published?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          slug?: string
          description?: string | null
          cover_image_url?: string | null
          display_order?: number
          is_published?: boolean
          created_at?: string
        }
        Relationships: []
      }
      chapters: {
        Row: {
          id: string
          book_id: string
          title: string
          chapter_number: number
          description: string | null
          display_order: number
          is_published: boolean
          created_at: string
        }
        Insert: {
          id?: string
          book_id: string
          title: string
          chapter_number: number
          description?: string | null
          display_order?: number
          is_published?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          book_id?: string
          title?: string
          chapter_number?: number
          description?: string | null
          display_order?: number
          is_published?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chapters_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          }
        ]
      }
      sessions: {
        Row: {
          id: string
          chapter_id: string
          title: string
          session_number: number
          scripture_reference: string | null
          content: string | null
          display_order: number
          is_published: boolean
          published_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          chapter_id: string
          title: string
          session_number: number
          scripture_reference?: string | null
          content?: string | null
          display_order?: number
          is_published?: boolean
          published_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          chapter_id?: string
          title?: string
          session_number?: number
          scripture_reference?: string | null
          content?: string | null
          display_order?: number
          is_published?: boolean
          published_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sessions_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          }
        ]
      }
      session_media: {
        Row: {
          id: string
          session_id: string
          type: 'image' | 'audio' | 'video' | 'slides'
          title: string | null
          url: string
          display_order: number
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          type: 'image' | 'audio' | 'video' | 'slides'
          title?: string | null
          url: string
          display_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          type?: 'image' | 'audio' | 'video' | 'slides'
          title?: string | null
          url?: string
          display_order?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_media_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          }
        ]
      }
      user_notes: {
        Row: {
          id: string
          user_id: string
          session_id: string | null
          chapter_id: string | null
          book_id: string | null
          scope: 'session' | 'chapter' | 'book' | 'global'
          content: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          session_id?: string | null
          chapter_id?: string | null
          book_id?: string | null
          scope: 'session' | 'chapter' | 'book' | 'global'
          content: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          session_id?: string | null
          chapter_id?: string | null
          book_id?: string | null
          scope?: 'session' | 'chapter' | 'book' | 'global'
          content?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_bookmarks: {
        Row: {
          id: string
          user_id: string
          session_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          session_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          session_id?: string
          created_at?: string
        }
        Relationships: []
      }
      user_highlights: {
        Row: {
          id: string
          user_id: string
          session_id: string
          start_offset: number
          end_offset: number
          text_snippet: string
          color: 'yellow' | 'green' | 'blue' | 'pink'
          note: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          session_id: string
          start_offset: number
          end_offset: number
          text_snippet: string
          color?: 'yellow' | 'green' | 'blue' | 'pink'
          note?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          session_id?: string
          start_offset?: number
          end_offset?: number
          text_snippet?: string
          color?: 'yellow' | 'green' | 'blue' | 'pink'
          note?: string | null
          created_at?: string
        }
        Relationships: []
      }
      quizzes: {
        Row: {
          id: string
          session_id: string | null
          chapter_id: string | null
          title: string
          description: string | null
          is_published: boolean
          created_at: string
        }
        Insert: {
          id?: string
          session_id?: string | null
          chapter_id?: string | null
          title: string
          description?: string | null
          is_published?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string | null
          chapter_id?: string | null
          title?: string
          description?: string | null
          is_published?: boolean
          created_at?: string
        }
        Relationships: []
      }
      quiz_questions: {
        Row: {
          id: string
          quiz_id: string
          question_text: string
          question_type: 'multiple_choice' | 'true_false' | 'fill_blank'
          options: Json | null
          correct_answer: string
          display_order: number
        }
        Insert: {
          id?: string
          quiz_id: string
          question_text: string
          question_type: 'multiple_choice' | 'true_false' | 'fill_blank'
          options?: Json | null
          correct_answer: string
          display_order?: number
        }
        Update: {
          id?: string
          quiz_id?: string
          question_text?: string
          question_type?: 'multiple_choice' | 'true_false' | 'fill_blank'
          options?: Json | null
          correct_answer?: string
          display_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "quiz_questions_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          }
        ]
      }
      quiz_attempts: {
        Row: {
          id: string
          quiz_id: string
          user_id: string
          answers: Json
          score: number
          total: number
          completed_at: string
        }
        Insert: {
          id?: string
          quiz_id: string
          user_id: string
          answers?: Json
          score?: number
          total?: number
          completed_at?: string
        }
        Update: {
          id?: string
          quiz_id?: string
          user_id?: string
          answers?: Json
          score?: number
          total?: number
          completed_at?: string
        }
        Relationships: []
      }
      discussion_posts: {
        Row: {
          id: string
          session_id: string | null
          chapter_id: string | null
          user_id: string
          parent_id: string | null
          content: string
          is_deleted: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          session_id?: string | null
          chapter_id?: string | null
          user_id: string
          parent_id?: string | null
          content: string
          is_deleted?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          session_id?: string | null
          chapter_id?: string | null
          user_id?: string
          parent_id?: string | null
          content?: string
          is_deleted?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      announcements: {
        Row: {
          id: string
          title: string
          content: string
          priority: 'info' | 'important' | 'urgent'
          starts_at: string
          ends_at: string | null
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          content: string
          priority?: 'info' | 'important' | 'urgent'
          starts_at?: string
          ends_at?: string | null
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          content?: string
          priority?: 'info' | 'important' | 'urgent'
          starts_at?: string
          ends_at?: string | null
          is_active?: boolean
          created_at?: string
        }
        Relationships: []
      }
      announcement_dismissals: {
        Row: {
          id: string
          announcement_id: string
          user_id: string
          dismissed_at: string
        }
        Insert: {
          id?: string
          announcement_id: string
          user_id: string
          dismissed_at?: string
        }
        Update: {
          id?: string
          announcement_id?: string
          user_id?: string
          dismissed_at?: string
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          key: string
          value: Json
          updated_at: string
        }
        Insert: {
          key: string
          value: Json
          updated_at?: string
        }
        Update: {
          key?: string
          value?: Json
          updated_at?: string
        }
        Relationships: []
      }
      scripture_cache: {
        Row: {
          id: string
          reference: string
          translation: string
          content: string
          cached_at: string
        }
        Insert: {
          id?: string
          reference: string
          translation?: string
          content: string
          cached_at?: string
        }
        Update: {
          id?: string
          reference?: string
          translation?: string
          content?: string
          cached_at?: string
        }
        Relationships: []
      }
      reading_progress: {
        Row: {
          id: string
          user_id: string
          session_id: string
          last_read_at: string
        }
        Insert: {
          id?: string
          user_id: string
          session_id: string
          last_read_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          session_id?: string
          last_read_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reading_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reading_progress_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          }
        ]
      }
      preapproved_emails: {
        Row: {
          id: string
          email: string
          added_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          email: string
          added_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          added_by?: string | null
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
