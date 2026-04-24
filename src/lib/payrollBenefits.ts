/** Benefícios automáticos da folha (alinhados ao cadastro do funcionário + ponto). */

export const OUTSIDE_CITY_DAILY_USD = 20;
export const HOUSING_WEEKLY_USD = 125;
export const MIN_HOURS_FOR_OUTSIDE_CITY_BONUS = 5;

export function periodInclusiveDayCount(start: Date, end: Date): number {
  const s = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const e = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  const diff = Math.round((e.getTime() - s.getTime()) / 86400000);
  return diff >= 0 ? diff + 1 : 0;
}

/**
 * Auxílio moradia: US$ 125 por semana, proporcional aos dias do período de folha.
 * Ex.: 30 dias → 30/7 × 125.
 */
export function housingAllowanceForPeriod(start: Date, end: Date): number {
  const days = periodInclusiveDayCount(start, end);
  if (days <= 0) return 0;
  const raw = HOUSING_WEEKLY_USD * (days / 7);
  return Math.round(raw * 100) / 100;
}

/**
 * Funcionário reside fora da cidade (`same_city === false`): US$ 20 por dia em que
 * o ponto totalizar ≥ 5h (soma de todos os registros do dia).
 */
export function countQualifyingDaysOutsideCity(
  hoursByDate: Map<string, number>,
  periodStart: string,
  periodEnd: string
): number {
  let count = 0;
  for (const [date, hours] of hoursByDate) {
    if (date < periodStart || date > periodEnd) continue;
    if (Number(hours) >= MIN_HOURS_FOR_OUTSIDE_CITY_BONUS) count++;
  }
  return count;
}

export function outsideCityBonusUsd(qualifyingDays: number): number {
  return Math.round(qualifyingDays * OUTSIDE_CITY_DAILY_USD * 100) / 100;
}

export function buildHoursByDateForEmployee(
  entries: Array<{ employee_id: string; date: string; total_hours: number | null }>,
  employeeId: string,
  periodStart: string,
  periodEnd: string
): Map<string, number> {
  const map = new Map<string, number>();
  for (const e of entries) {
    if (e.employee_id !== employeeId) continue;
    const d = e.date;
    if (!d || d < periodStart || d > periodEnd) continue;
    const h = Number(e.total_hours ?? 0);
    map.set(d, (map.get(d) ?? 0) + h);
  }
  return map;
}
