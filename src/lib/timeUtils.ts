export function computeWorkedHours(
  clockIn: string | null | undefined,
  clockOut: string | null | undefined,
  breakHours: number | null | undefined
): number {
  if (!clockIn || !clockOut) return 0;
  const [inH, inM] = clockIn.split(":").map(Number);
  const [outH, outM] = clockOut.split(":").map(Number);
  if ([inH, inM, outH, outM].some((v) => Number.isNaN(v))) return 0;

  let start = inH * 60 + inM;
  let end = outH * 60 + outM;
  // Overnight shifts: out on next day.
  if (end < start) end += 24 * 60;
  const rest = Math.max(0, Number(breakHours || 0) * 60);
  const totalMinutes = Math.max(0, end - start - rest);
  return Math.round((totalMinutes / 60) * 100) / 100;
}

export function normalizeTimeEntryStatus(status: string | null | undefined): string {
  const s = (status || "").toLowerCase().trim();
  if (s === "registrado" || s === "completed" || s === "concluido") return "completed";
  if (s === "active" || s === "ativo" || s === "em_andamento") return "active";
  return "completed";
}
