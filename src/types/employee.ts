export interface Employee {
  id: string
  full_name: string
  email: string
  phone: string | null
  ssn: string | null
  passport: string | null
  issuing_country: string | null
  birth_date: string | null
  origin_country: string | null
  residence_state: string | null
  address: string | null
  city: string | null
  zip_code: string | null
  same_city: boolean
  distance: string | null
  language: string
  photo_url: string | null
  location: string | null
  factory: string | null
  project: string | null
  role: string | null
  system_role?: 'Admin' | 'Gerente' | 'Funcionario' | null
  department: string | null
  supervisor: string | null
  clock_in_time: string | null
  start_date: string | null
  end_date: string | null
  work_notes: string | null
  hourly_rate: number | null
  effective_date: string | null
  /** Folha: recebe auxilio moradia */
  receives_commute_allowance?: boolean | null
  /** Cadastro formal (ex.: registro acordado com RH) */
  is_registered?: boolean | null
  status: string
  created_at: string
  updated_at: string
  passport_image_url?: string | null
  drivers_license_url?: string | null
  extra_documents?: EmployeeExtraDocument[] | null
  employee_movements?: EmployeeMovement[] | null
}

export interface EmployeeExtraDocument {
  id: string
  title: string
  image_url: string
}

export interface EmployeeMovement {
  id: string
  factory: string
  start_date: string
  end_date: string
  clock_in_time?: string | null
  clock_out_time?: string | null
  notes?: string | null
}

export interface EmployeeFormData {
  full_name: string
  email: string
  phone: string
  ssn: string
  passport: string
  issuing_country: string
  birth_date: string
  origin_country: string
  residence_state: string
  address: string
  city: string
  zip_code: string
  same_city: boolean
  distance: string
  language: string
  photo_url: string
  location: string
  factory: string
  project: string
  role: string
  system_role: 'Admin' | 'Gerente' | 'Funcionario'
  department: string
  supervisor: string
  clock_in_time: string
  start_date: string
  end_date: string
  work_notes: string
  hourly_rate: string
  effective_date: string
  receives_commute_allowance: boolean
  is_registered: boolean
  status: string
  passport_image_url: string
  drivers_license_url: string
  extra_documents: EmployeeExtraDocument[]
  employee_movements: EmployeeMovement[]
}

export type EmployeeInsert = Omit<Employee, 'id' | 'created_at' | 'updated_at'>
export type EmployeeUpdate = Partial<EmployeeInsert>

export const emptyEmployeeForm: EmployeeFormData = {
  full_name: '',
  email: '',
  phone: '',
  ssn: '',
  passport: '',
  issuing_country: '',
  birth_date: '',
  origin_country: '',
  residence_state: '',
  address: '',
  city: '',
  zip_code: '',
  same_city: true,
  distance: '',
  language: 'pt',
  photo_url: '',
  location: '',
  factory: '',
  project: '',
  role: '',
  system_role: 'Funcionario',
  department: '',
  supervisor: '',
  clock_in_time: '',
  start_date: '',
  end_date: '',
  work_notes: '',
  hourly_rate: '',
  effective_date: '',
  receives_commute_allowance: false,
  is_registered: false,
  status: 'Ativo',
  passport_image_url: '',
  drivers_license_url: '',
  extra_documents: [],
  employee_movements: [],
}
