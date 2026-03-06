import type { Database } from './database'

// Row types (shorthand)
export type Client = Database['public']['Tables']['clients']['Row']
export type Document = Database['public']['Tables']['documents']['Row']
export type Building = Database['public']['Tables']['buildings']['Row']
export type VisitSlot = Database['public']['Tables']['visit_slots']['Row']
export type Match = Database['public']['Tables']['matches']['Row']
export type DocumentAccessLog = Database['public']['Tables']['document_access_log']['Row']

// Insert types
export type NewClient = Database['public']['Tables']['clients']['Insert']
export type NewDocument = Database['public']['Tables']['documents']['Insert']
export type NewBuilding = Database['public']['Tables']['buildings']['Insert']
export type NewVisitSlot = Database['public']['Tables']['visit_slots']['Insert']

// Client status flow
export type ClientStatus = Client['status']
export type ProfileType = Client['profile_type']
export type BuildingStatus = Building['status']
export type MatchStatus = Match['status']

// Client preferences shape
export interface ClientPreferences {
  max_rent?: number
  min_rooms?: number
  preferred_neighborhoods?: string[]
  flexible_on_neighborhood?: boolean
  move_in_date?: string
  has_pets?: boolean
}

// Required documents per profile type
export const REQUIRED_DOCS: Record<ProfileType, string[]> = {
  empleado: ['dni', 'contrato', 'nomina_1', 'nomina_2', 'nomina_3', 'vida_laboral'],
  estudiante: ['dni', 'matricula', 'ahorros'],
  autonomo: ['dni', 'renta', 'recibo_autonomo_1', 'recibo_autonomo_2', 'recibo_autonomo_3', 'extracto_bancario'],
  otro: ['pasaporte', 'prueba_ingresos', 'referencia_arrendador'],
}

// Document type labels in Spanish
export const DOC_LABELS: Record<string, string> = {
  dni: 'DNI / NIE',
  nie: 'NIE',
  pasaporte: 'Pasaporte',
  contrato: 'Contrato de trabajo',
  nomina_1: 'Nómina (mes 1)',
  nomina_2: 'Nómina (mes 2)',
  nomina_3: 'Nómina (mes 3)',
  vida_laboral: 'Vida laboral',
  matricula: 'Matrícula universitaria',
  ahorros: 'Comprobación de ahorros',
  renta: 'Declaración de la renta',
  recibo_autonomo_1: 'Recibo autónomo (mes 1)',
  recibo_autonomo_2: 'Recibo autónomo (mes 2)',
  recibo_autonomo_3: 'Recibo autónomo (mes 3)',
  extracto_bancario: 'Extracto bancario (3 meses)',
  prueba_ingresos: 'Prueba de ingresos',
  referencia_arrendador: 'Referencia de arrendador anterior',
}

// Neighborhoods in Barcelona
export const BARCELONA_NEIGHBORHOODS = [
  'Eixample',
  'Gràcia',
  'Sant Martí',
  'Sants-Montjuïc',
  'Sarrià-Sant Gervasi',
  'Les Corts',
  'Nou Barris',
  'Horta-Guinardó',
  'Sant Andreu',
  'Ciutat Vella',
  'Poblenou',
  'Diagonal Mar',
  'Vila Olímpica',
  'Barceloneta',
  'El Born / Sant Pere',
  'El Raval',
  'Poble Sec',
]
