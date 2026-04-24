import { supabase } from '@/lib/supabase'
import type { HourlyRateHistoryEntry } from '@/types/hourlyRateHistory'

export const hourlyRateHistoryService = {
  async getByEmployeeId(employeeId: string): Promise<HourlyRateHistoryEntry[]> {
    const { data, error } = await supabase
      .from('employee_hourly_rate_history')
      .select('*')
      .eq('employee_id', employeeId)
      .order('effective_date', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data || []) as HourlyRateHistoryEntry[]
  },

  /**
   * Registra uma linha de histórico se for diferente do último registro
   * (evita duplicar ao salvar sem alterar valor/data).
   */
  async appendIfChanged(
    employeeId: string,
    hourly_rate: number | null,
    effective_date: string | null
  ): Promise<void> {
    if (hourly_rate == null || Number.isNaN(Number(hourly_rate))) return

    const list = await this.getByEmployeeId(employeeId)
    const last = list[0]
    const eff = effective_date?.trim() || null
    const rateNum = Number(hourly_rate)

    if (last) {
      const sameRate = Number(last.hourly_rate) === rateNum
      const sameEff = (last.effective_date || null) === eff
      if (sameRate && sameEff) return
    }

    const { error } = await supabase.from('employee_hourly_rate_history').insert({
      employee_id: employeeId,
      hourly_rate: rateNum,
      effective_date: eff,
    })
    if (error) throw error
  },
}
