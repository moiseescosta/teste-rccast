import { supabase } from "@/lib/supabase";
import type { PayrollEntry, PayrollRun } from "@/types/payroll";

function toDateRange(period: "current" | "previous" | "custom") {
  const now = new Date();
  if (period === "previous") {
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const end = new Date(now.getFullYear(), now.getMonth(), 0);
    return { start, end, label: start.toLocaleString("pt-BR", { month: "long", year: "numeric" }) };
  }
  // custom uses current until a dedicated custom filter exists
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return { start, end, label: start.toLocaleString("pt-BR", { month: "long", year: "numeric" }) };
}

/** Período da folha (mês atual, anterior ou custom) para cálculos e consulta ao ponto. */
export function getPayrollPeriodBounds(period: "current" | "previous" | "custom"): {
  start: Date;
  end: Date;
  startDate: string;
  endDate: string;
  label: string;
} {
  const { start, end, label } = toDateRange(period);
  return {
    start,
    end,
    label,
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
  };
}

export const payrollService = {
  async getEntries(period: "current" | "previous" | "custom", status: string, employeeId?: string): Promise<PayrollEntry[]> {
    const { start, end } = toDateRange(period);
    const startDate = start.toISOString().slice(0, 10);
    const endDate = end.toISOString().slice(0, 10);

    let query = supabase
      .from("payroll_entries")
      .select("*, employees(full_name, factory, supervisor, same_city, receives_commute_allowance)")
      .gte("pay_date", startDate)
      .lte("pay_date", endDate)
      .order("created_at", { ascending: false });

    if (status !== "all") query = query.eq("status", status);
    if (employeeId) query = query.eq("employee_id", employeeId);

    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as PayrollEntry[];
  },

  async getOrCreateRun(period: "current" | "previous" | "custom"): Promise<PayrollRun> {
    const { start, end, label } = toDateRange(period);
    const startDate = start.toISOString().slice(0, 10);
    const endDate = end.toISOString().slice(0, 10);

    const { data: existing, error: findError } = await supabase
      .from("payroll_runs")
      .select("*")
      .eq("period_start", startDate)
      .eq("period_end", endDate)
      .maybeSingle();
    if (findError) throw findError;
    if (existing) return existing as PayrollRun;

    const { data, error } = await supabase
      .from("payroll_runs")
      .insert({
        period_label: label,
        period_start: startDate,
        period_end: endDate,
        status: "draft",
      })
      .select()
      .single();
    if (error) throw error;
    return data as PayrollRun;
  },
};
