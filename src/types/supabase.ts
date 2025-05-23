// Basic type definitions for Supabase
export type Database = {
  public: {
    Tables: {
      companies: {
        Row: {
          id: string
          name: string
          website: string | null
          workspace_id: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          website?: string | null
          workspace_id: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          website?: string | null
          workspace_id?: string
          created_at?: string
        }
      }
      scans: {
        Row: {
          id: string
          company_id: string
          user_id: string
          status: string
          thesis_input: any | null
          workspace_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_id: string
          user_id: string
          status: string
          thesis_input?: any | null
          workspace_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          user_id?: string
          status?: string
          thesis_input?: any | null
          workspace_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      findings: {
        Row: {
          id: string
          scan_id: string
          category: string
          severity: string
          title: string
          description: string | null
          evidence: any | null
          ai_confidence: number | null
          advisor_validated: boolean | null
          created_at: string
        }
        Insert: {
          id?: string
          scan_id: string
          category: string
          severity: string
          title: string
          description?: string | null
          evidence?: any | null
          ai_confidence?: number | null
          advisor_validated?: boolean | null
          created_at?: string
        }
        Update: {
          id?: string
          scan_id?: string
          category?: string
          severity?: string
          title?: string
          description?: string | null
          evidence?: any | null
          ai_confidence?: number | null
          advisor_validated?: boolean | null
          created_at?: string
        }
      }
    }
  }
}