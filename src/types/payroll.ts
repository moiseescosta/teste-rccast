export interface PayrollRun {
  id: string;
  period_label: string;
  period_start: string;
  period_end: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface PayrollEntry {
  id: string;
  payroll_run_id: string;
  employee_id: string;
  regular_hours: number;
  overtime_hours: number;
  hourly_rate: number;
  overtime_multiplier: number;
  bonuses: number;
  deductions: number;
  gross_pay: number;
  net_pay: number;
  notes: string | null;
  status: string;
  pay_date: string | null;
  created_at: string;
  updated_at: string;
  employees?: {
    full_name: string;
    factory: string | null;
    supervisor?: string | null;
    same_city?: boolean | null;
    receives_commute_allowance?: boolean | null;
  } | null;
}
