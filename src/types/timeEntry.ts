export interface TimeEntry {
  id: string
  employee_id: string
  date: string
  clock_in: string | null
  clock_out: string | null
  break_time: number
  total_hours: number
  status: string
  project: string | null
  notes: string | null
  created_at: string
  updated_at: string
  // joined field
  employee?: {
    full_name: string
    location: string | null
    factory: string | null
  }
}

export type TimeEntryInsert = Omit<TimeEntry, 'id' | 'created_at' | 'updated_at' | 'employee'>
export type TimeEntryUpdate = Partial<TimeEntryInsert>

export interface TimeEntryFormData {
  employee_id: string
  date: string
  clock_in: string
  clock_out: string
  break_time: string
  project: string
  notes: string
}

export interface TimeStats {
  totalEntries: number
  totalHours: number
  avgHoursPerDay: number
  activeToday: number
}
