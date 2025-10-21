export interface User {
  id: number
  username: string
  role: "Admin" | "Engineer" | "Supervisor" | "Operator"
  is_active: boolean
}

export interface DashboardStats {
  total_users: number
  total_reports: number
  open_reports: number
  recent_audits: number
  recent_reports: Array<[number, string, string, string, string]>
  recent_users: Array<[string, string]>
  my_reports?: number
  my_open_reports?: number
  my_closed_reports?: number
}

export interface DMTRecord {
  id: number
  dmt_number: string
  title: string
  description: string
  status: string
  workflow_stage: string
  created_by: string
  created_at: string
  updated_at: string
}

export interface AuditLog {
  id: number
  action: string
  entity_type: string
  entity_id: number
  user: string
  timestamp: string
  details: string
}
