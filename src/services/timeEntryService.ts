import { supabase } from '@/lib/supabase';
import type { TimeEntry, TimeEntryInsert, TimeEntryUpdate } from '@/types/timeEntry';
import { computeWorkedHours, normalizeTimeEntryStatus } from '@/lib/timeUtils';

export const timeEntryService = {
  async getById(
    id: string
  ): Promise<(TimeEntry & { employee_name?: string; employee_factory?: string; employee_role?: string }) | null> {
    const { data, error } = await supabase
      .from('time_entries')
      .select('*, employees(full_name, factory, role)')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    const row = data as Record<string, unknown>;
    const employees = row.employees as { full_name: string; factory: string; role: string } | null;
    return {
      ...row,
      employee_name: employees?.full_name || 'Desconhecido',
      employee_factory: employees?.factory || '',
      employee_role: employees?.role || '',
    } as TimeEntry & { employee_name?: string; employee_factory?: string; employee_role?: string };
  },

  async getAll(filters?: {
    employee_id?: string;
    date_from?: string;
    date_to?: string;
    status?: string;
  }): Promise<(TimeEntry & { employee_name?: string })[]> {
    let query = supabase
      .from('time_entries')
      .select('*, employees(full_name, factory, role)')
      .order('date', { ascending: false })
      .order('clock_in', { ascending: false });

    if (filters?.employee_id) {
      query = query.eq('employee_id', filters.employee_id);
    }
    if (filters?.date_from) {
      query = query.gte('date', filters.date_from);
    }
    if (filters?.date_to) {
      query = query.lte('date', filters.date_to);
    }
    if (filters?.status && filters.status !== 'Todos') {
      query = query.eq('status', filters.status);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map((entry: Record<string, unknown>) => {
      const employees = entry.employees as { full_name: string; factory: string; role: string } | null;
      return {
        ...entry,
        employee_name: employees?.full_name || 'Desconhecido',
        employee_factory: employees?.factory || '',
        employee_role: employees?.role || '',
      };
    }) as (TimeEntry & { employee_name?: string; employee_factory?: string; employee_role?: string })[];
  },

  async create(entry: TimeEntryInsert): Promise<TimeEntry> {
    const totalHours = computeWorkedHours(entry.clock_in, entry.clock_out, entry.break_time);

    const { data, error } = await supabase
      .from('time_entries')
      .insert({
        ...entry,
        status: normalizeTimeEntryStatus(entry.status),
        total_hours: Math.round(totalHours * 100) / 100,
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id: string, updates: TimeEntryUpdate): Promise<TimeEntry> {
    let totalHours = updates.total_hours;

    if (updates.clock_in && updates.clock_out) {
      totalHours = computeWorkedHours(updates.clock_in, updates.clock_out, updates.break_time);
    }

    const { data, error } = await supabase
      .from('time_entries')
      .update({
        ...updates,
        status: updates.status ? normalizeTimeEntryStatus(updates.status) : updates.status,
        total_hours: totalHours,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('time_entries')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  async getWeekSummary(employeeId?: string): Promise<{
    totalHours: number;
    totalDays: number;
    averageHours: number;
  }> {
    const today = new Date();
    const weekAgo = new Date(today);
    weekAgo.setDate(today.getDate() - 7);

    let query = supabase
      .from('time_entries')
      .select('total_hours, date')
      .gte('date', weekAgo.toISOString().split('T')[0])
      .lte('date', today.toISOString().split('T')[0]);

    if (employeeId) {
      query = query.eq('employee_id', employeeId);
    }

    const { data, error } = await query;
    if (error) throw error;
    const entries = data || [];
    const totalHours = entries.reduce((sum, e) => sum + (e.total_hours || 0), 0);
    const uniqueDays = new Set(entries.map((e) => e.date)).size;
    return {
      totalHours: Math.round(totalHours * 100) / 100,
      totalDays: uniqueDays,
      averageHours: uniqueDays > 0 ? Math.round((totalHours / uniqueDays) * 100) / 100 : 0,
    };
  },
};
