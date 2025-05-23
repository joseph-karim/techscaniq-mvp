export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      companies: {
        Row: {
          id: string
          workspace_id: string
          name: string
          website: string | null
          created_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          name: string
          website?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          workspace_id?: string
          name?: string
          website?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "companies_workspace_id_fkey"
            columns: ["workspace_id"]
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          }
        ]
      }
      scans: {
        Row: {
          id: string
          company_id: string
          user_id: string
          status: string
          thesis_input: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_id: string
          user_id: string
          status: string
          thesis_input: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          user_id?: string
          status?: string
          thesis_input?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "scans_company_id_fkey"
            columns: ["company_id"]
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scans_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      findings: {
        Row: {
          id: string
          scan_id: string
          category: string
          severity: string
          title: string
          description: string
          evidence: Json | null
          ai_confidence: number
          advisor_validated: boolean
          created_at: string
        }
        Insert: {
          id?: string
          scan_id: string
          category: string
          severity: string
          title: string
          description: string
          evidence?: Json | null
          ai_confidence: number
          advisor_validated?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          scan_id?: string
          category?: string
          severity?: string
          title?: string
          description?: string
          evidence?: Json | null
          ai_confidence?: number
          advisor_validated?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "findings_scan_id_fkey"
            columns: ["scan_id"]
            referencedRelation: "scans"
            referencedColumns: ["id"]
          }
        ]
      }
      thesis_alignments: {
        Row: {
          id: string
          scan_id: string
          thesis_criterion: string
          alignment_type: string
          related_findings: Json
          explanation: string
          created_at: string
        }
        Insert: {
          id?: string
          scan_id: string
          thesis_criterion: string
          alignment_type: string
          related_findings: Json
          explanation: string
          created_at?: string
        }
        Update: {
          id?: string
          scan_id?: string
          thesis_criterion?: string
          alignment_type?: string
          related_findings?: Json
          explanation?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "thesis_alignments_scan_id_fkey"
            columns: ["scan_id"]
            referencedRelation: "scans"
            referencedColumns: ["id"]
          }
        ]
      }
      workspaces: {
        Row: {
          id: string
          name: string
          logo_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          logo_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          logo_url?: string | null
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