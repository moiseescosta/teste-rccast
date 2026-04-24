import { supabase } from "@/lib/supabase";
import { isSupabaseConfigured } from "@/lib/supabase";
import type { Factory } from "@/data/factories";
import type { FactoryOperationType } from "@/data/factories";

/** Formato da linha no Supabase (snake_case). */
type FactoryRow = {
  id: string;
  name: string;
  code: string;
  status: string;
  country: string;
  state: string;
  city: string;
  address: string;
  notes: string | null;
  manager: string | null;
  supervisor: string | null;
  operation_types: unknown[] | null;
  clock_in_time: string | null;
  no_time_clock?: boolean | null;
  created_at?: string;
  updated_at?: string;
};

function normalizeOperationTypes(
  items: unknown[] | null,
  fallbackClockInTime?: string | null
): FactoryOperationType[] {
  if (!Array.isArray(items)) return [];
  return items
    .map((item) => {
      if (typeof item === "string") {
        return { name: item, clock_in_time: fallbackClockInTime ?? null };
      }
      if (item && typeof item === "object") {
        const rawName = (item as { name?: unknown }).name;
        const rawClock = (item as { clock_in_time?: unknown }).clock_in_time;
        const name = typeof rawName === "string" ? rawName.trim() : "";
        const clockIn = typeof rawClock === "string" ? rawClock.trim() : "";
        if (!name) return null;
        return { name, clock_in_time: clockIn || fallbackClockInTime || null };
      }
      return null;
    })
    .filter((item): item is FactoryOperationType => Boolean(item));
}

function rowToFactory(row: FactoryRow): Factory {
  const rawTime = row.clock_in_time;
  const clockInTime =
    typeof rawTime === "string" && rawTime.trim()
      ? rawTime.replace(/:\d{2}$/, "") || null
      : null;
  return {
    id: row.id,
    name: row.name,
    code: row.code,
    status: row.status,
    country: row.country,
    state: row.state,
    city: row.city,
    address: row.address,
    notes: row.notes ?? undefined,
    manager: row.manager ?? undefined,
    supervisor: row.supervisor ?? undefined,
    operationTypes: normalizeOperationTypes(row.operation_types, clockInTime),
    clock_in_time: clockInTime ?? undefined,
    no_time_clock: Boolean(row.no_time_clock),
  };
}

/** Payload para inserir (sem id; id gerado pelo Supabase). */
export type FactoryInsert = Omit<Factory, "id">;

/** Payload para atualizar (campos opcionais). */
export type FactoryUpdate = Partial<Omit<Factory, "id">>;

export const factoryService = {
  async getAll(): Promise<Factory[]> {
    if (!isSupabaseConfigured()) return [];
    const { data, error } = await supabase
      .from("factories")
      .select("*")
      .order("name", { ascending: true });
    if (error) throw error;
    return (data || []).map((row) => rowToFactory(row as FactoryRow));
  },

  async getById(id: string): Promise<Factory | null> {
    if (!isSupabaseConfigured()) return null;
    const { data, error } = await supabase
      .from("factories")
      .select("*")
      .eq("id", id)
      .single();
    if (error) {
      if (error.code === "PGRST116") return null;
      throw error;
    }
    return data ? rowToFactory(data as FactoryRow) : null;
  },

  async create(factory: FactoryInsert): Promise<Factory> {
    const clockIn = factory.clock_in_time?.trim();
    const { data, error } = await supabase
      .from("factories")
      .insert({
        name: factory.name,
        code: factory.code,
        status: factory.status,
        country: factory.country,
        state: factory.state,
        city: factory.city,
        address: factory.address,
        notes: factory.notes ?? null,
        manager: factory.manager ?? null,
        supervisor: factory.supervisor ?? null,
        operation_types: factory.operationTypes ?? [],
        clock_in_time: clockIn ? (clockIn.length <= 5 ? `${clockIn}:00` : clockIn) : null,
        no_time_clock: factory.no_time_clock ?? false,
      })
      .select()
      .single();
    if (error) throw error;
    return rowToFactory(data as FactoryRow);
  },

  async update(id: string, updates: FactoryUpdate): Promise<Factory> {
    const payload: Record<string, unknown> = {};
    if (updates.name !== undefined) payload.name = updates.name;
    if (updates.code !== undefined) payload.code = updates.code;
    if (updates.status !== undefined) payload.status = updates.status;
    if (updates.country !== undefined) payload.country = updates.country;
    if (updates.state !== undefined) payload.state = updates.state;
    if (updates.city !== undefined) payload.city = updates.city;
    if (updates.address !== undefined) payload.address = updates.address;
    if (updates.notes !== undefined) payload.notes = updates.notes;
    if (updates.manager !== undefined) payload.manager = updates.manager;
    if (updates.supervisor !== undefined) payload.supervisor = updates.supervisor;
    if (updates.operationTypes !== undefined) payload.operation_types = updates.operationTypes;
    if (updates.clock_in_time !== undefined) {
      const t = updates.clock_in_time?.trim();
      payload.clock_in_time = t ? (t.length <= 5 ? `${t}:00` : t) : null;
    }
    if (updates.no_time_clock !== undefined) payload.no_time_clock = updates.no_time_clock;
    payload.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from("factories")
      .update(payload)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return rowToFactory(data as FactoryRow);
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from("factories").delete().eq("id", id);
    if (error) throw error;
  },
};
