import type { CurrentUser, UserRole } from "@/types/auth";

const KEY = "rccast_user_session";

export function loadStoredSession(): CurrentUser | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const o = JSON.parse(raw) as unknown;
    if (!o || typeof o !== "object") return null;
    const email = (o as { email?: string }).email;
    const role = (o as { role?: string }).role;
    if (typeof email !== "string" || typeof role !== "string") return null;
    if (!["Admin", "Gerente", "Funcionario"].includes(role)) return null;
    const employeeId = (o as { employeeId?: string | null }).employeeId;
    return {
      email,
      role: role as UserRole,
      employeeId: typeof employeeId === "string" ? employeeId : null,
    };
  } catch {
    return null;
  }
}

export function saveSession(user: CurrentUser): void {
  sessionStorage.setItem(KEY, JSON.stringify(user));
}

export function clearSession(): void {
  sessionStorage.removeItem(KEY);
}
