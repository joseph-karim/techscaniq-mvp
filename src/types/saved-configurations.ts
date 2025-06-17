export interface SavedInvestmentThesis {
  id: string
  user_id: string
  name: string
  description?: string
  thesis_type: string
  custom_thesis_name?: string
  criteria: Array<{
    id: string
    name: string
    weight: number
    description: string
  }>
  focus_areas: string[]
  time_horizon?: string
  target_multiple?: string
  notes?: string
  is_default: boolean
  created_at: string
  updated_at: string
}

export interface SavedVendorProfile {
  id: string
  user_id: string
  name: string
  description?: string
  offering: string
  ideal_customer_profile: {
    industry?: string
    companySize?: string
    geography?: string
    techStack?: string[]
    painPoints?: string[]
  }
  use_cases: string[]
  budget_range?: {
    min?: number
    max?: number
    currency: string
  }
  decision_criteria?: string[]
  competitive_alternatives?: string[]
  evaluation_timeline?: string
  is_default: boolean
  created_at: string
  updated_at: string
}

export interface CreateSavedInvestmentThesisInput {
  name: string
  description?: string
  thesis_type: string
  custom_thesis_name?: string
  criteria: Array<{
    id: string
    name: string
    weight: number
    description: string
  }>
  focus_areas: string[]
  time_horizon?: string
  target_multiple?: string
  notes?: string
  is_default?: boolean
}

export interface CreateSavedVendorProfileInput {
  name: string
  description?: string
  offering: string
  ideal_customer_profile: {
    industry?: string
    companySize?: string
    geography?: string
    techStack?: string[]
    painPoints?: string[]
  }
  use_cases: string[]
  budget_range?: {
    min?: number
    max?: number
    currency: string
  }
  decision_criteria?: string[]
  competitive_alternatives?: string[]
  evaluation_timeline?: string
  is_default?: boolean
}