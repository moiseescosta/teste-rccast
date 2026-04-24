import { supabase } from '@/lib/supabase';
import type { Employee, EmployeeInsert, EmployeeUpdate } from '@/types/employee';

export const employeeService = {
  async getAll(filters?: {
    search?: string;
    status?: string;
    department?: string;
    factory?: string;
    supervisor?: string;
  }): Promise<Employee[]> {
    let query = supabase
      .from('employees')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.search) {
      query = query.or(
        `full_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,role.ilike.%${filters.search}%`
      );
    }
    if (filters?.status && filters.status !== 'Todos') {
      query = query.eq('status', filters.status);
    }
    if (filters?.department && filters.department !== 'Todos') {
      query = query.eq('department', filters.department);
    }
    if (filters?.factory && filters.factory !== 'Todos') {
      query = query.eq('factory', filters.factory);
    }
    if (filters?.supervisor) {
      query = query.eq('supervisor', filters.supervisor);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async getById(id: string): Promise<Employee | null> {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  async create(employee: EmployeeInsert): Promise<Employee> {
    const { data, error } = await supabase
      .from('employees')
      .insert(employee)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id: string, updates: EmployeeUpdate): Promise<Employee> {
    const { data, error } = await supabase
      .from('employees')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('employees')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  /** Define ou altera a senha do funcionário (para login). Chamar após create/update quando o usuário preencher a senha. */
  async setPassword(employeeId: string, password: string): Promise<void> {
    const p = password?.trim();
    if (!p) return;
    const { error } = await supabase.rpc('set_employee_password', {
      p_employee_id: employeeId,
      p_password: p,
    });
    if (error) throw error;
  },

  async getStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    departments: string[];
    factories: string[];
  }> {
    const { data, error } = await supabase
      .from('employees')
      .select('status, department, factory');
    if (error) throw error;
    const employees = data || [];
    return {
      total: employees.length,
      active: employees.filter((e) => e.status === 'Ativo').length,
      inactive: employees.filter((e) => e.status === 'Inativo').length,
      departments: [...new Set(employees.map((e) => e.department).filter(Boolean))] as string[],
      factories: [...new Set(employees.map((e) => e.factory).filter(Boolean))] as string[],
    };
  },
};
