// AUTO-GENERATED — replace with: npx supabase gen types typescript --project-id <your-project-id> > src/types/database.ts
// This is a temporary stub. Run the command above after connecting your Supabase project.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

type ClientRow = {
  id: string; user_id: string | null; full_name: string; phone: string | null
  email: string; profile_type: 'empleado' | 'estudiante' | 'autonomo' | 'otro'
  status: 'unverified' | 'uploading' | 'pending_review' | 'active' | 'inactive'
  monthly_income: number | null; preferences: Json; activated_at: string | null; created_at: string
}
type ClientInsert = {
  id?: string; user_id?: string | null; full_name: string; phone?: string | null
  email: string; profile_type: 'empleado' | 'estudiante' | 'autonomo' | 'otro'
  status?: 'unverified' | 'uploading' | 'pending_review' | 'active' | 'inactive'
  monthly_income?: number | null; preferences?: Json; activated_at?: string | null; created_at?: string
}
type DocumentRow = {
  id: string; client_id: string; doc_type: string; file_path: string
  file_name: string; uploaded_at: string; is_current: boolean
}
type DocumentInsert = {
  id?: string; client_id: string; doc_type: string; file_path: string
  file_name: string; uploaded_at?: string; is_current?: boolean
}
type BuildingRow = {
  id: string; slug: string; name: string; neighborhood: string; address: string | null
  price: number; rooms: number; bathrooms: number | null; size_sqm: number | null
  floor: number | null; has_elevator: boolean; furnished: boolean; photos: string[]
  min_income: number | null; allowed_profiles: string[]; min_solvency_ratio: number
  available_from: string | null; description_es: string | null; description_en: string | null
  real_estate_company: string | null; company_contact: string | null
  status: 'draft' | 'published' | 'closed'; created_at: string
}
type BuildingInsert = {
  id?: string; slug: string; name: string; neighborhood: string; address?: string | null
  price: number; rooms: number; bathrooms?: number | null; size_sqm?: number | null
  floor?: number | null; has_elevator?: boolean; furnished?: boolean; photos?: string[]
  min_income?: number | null; allowed_profiles?: string[]; min_solvency_ratio?: number
  available_from?: string | null; description_es?: string | null; description_en?: string | null
  real_estate_company?: string | null; company_contact?: string | null
  status?: 'draft' | 'published' | 'closed'; created_at?: string
}
type VisitSlotRow = {
  id: string; building_id: string; datetime: string; duration_minutes: number
  booked_by_client_id: string | null; booked_at: string | null
}
type VisitSlotInsert = {
  id?: string; building_id: string; datetime: string; duration_minutes?: number
  booked_by_client_id?: string | null; booked_at?: string | null
}
type MatchRow = {
  id: string; client_id: string; building_id: string; score: number
  notified_at: string | null; status: 'pending' | 'notified' | 'visited' | 'applied' | 'rejected'
  created_at: string
}
type MatchInsert = {
  id?: string; client_id: string; building_id: string; score?: number
  notified_at?: string | null; status?: 'pending' | 'notified' | 'visited' | 'applied' | 'rejected'
  created_at?: string
}

export type Database = {
  public: {
    Tables: {
      clients: { Row: ClientRow; Insert: ClientInsert; Update: Partial<ClientInsert>; Relationships: [] }
      documents: { Row: DocumentRow; Insert: DocumentInsert; Update: Partial<DocumentInsert>; Relationships: [] }
      buildings: { Row: BuildingRow; Insert: BuildingInsert; Update: Partial<BuildingInsert>; Relationships: [] }
      visit_slots: { Row: VisitSlotRow; Insert: VisitSlotInsert; Update: Partial<VisitSlotInsert>; Relationships: [] }
      matches: { Row: MatchRow; Insert: MatchInsert; Update: Partial<MatchInsert>; Relationships: [] }
    }
    Views: Record<string, never>
    Functions: {
      book_visit_slot: { Args: { p_slot_id: string; p_client_id: string }; Returns: Json }
      match_building: {
        Args: { p_building_id: string }
        Returns: Array<{
          client_id: string; building_id: string; score: number; full_name: string
          phone: string | null; email: string; building_name: string; building_price: number
          building_slug: string; building_neighborhood: string
        }>
      }
      is_admin: { Args: Record<string, never>; Returns: boolean }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
