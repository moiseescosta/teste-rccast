import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import { FACTORIES, type Factory } from "@/data/factories";
import { factoryService } from "@/services/factoryService";
import { isSupabaseConfigured } from "@/lib/supabase";

type FactoriesContextValue = {
  factories: Factory[];
  loading: boolean;
  error: string | null;
  refreshFactories: () => Promise<void>;
  addFactory: (factory: Factory) => Promise<Factory>;
  /** Atualiza uma fábrica existente. Use originalId em edição para identificar o registro (evita duplicata se o usuário mudar o código). */
  updateFactory: (factory: Factory, originalId?: string) => Promise<Factory>;
};

const FactoriesContext = createContext<FactoriesContextValue | null>(null);

export function FactoriesProvider({ children }: { children: ReactNode }) {
  const [factories, setFactories] = useState<Factory[]>(FACTORIES);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshFactories = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setFactories(FACTORIES);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const list = await factoryService.getAll();
      setFactories(list.length > 0 ? list : FACTORIES);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao carregar fábricas");
      setFactories(FACTORIES);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshFactories();
  }, [refreshFactories]);

  const addFactory = useCallback(async (factory: Factory): Promise<Factory> => {
    if (!isSupabaseConfigured()) {
      setFactories((prev) => {
        if (prev.some((f) => f.id === factory.id || f.code === factory.code)) return prev;
        return [...prev, factory];
      });
      return factory;
    }
    try {
      const created = await factoryService.create({
        name: factory.name,
        code: factory.code,
        status: factory.status,
        country: factory.country,
        state: factory.state,
        city: factory.city,
        address: factory.address,
        notes: factory.notes,
        operationTypes: factory.operationTypes,
        clock_in_time: factory.clock_in_time,
        no_time_clock: factory.no_time_clock ?? false,
      });
      setFactories((prev) => [...prev, created]);
      return created;
    } catch (e) {
      throw e;
    }
  }, []);

  const updateFactory = useCallback(
    async (factory: Factory, originalId?: string): Promise<Factory> => {
      const idToReplace = originalId ?? factory.id;
      if (!isSupabaseConfigured()) {
        setFactories((prev) =>
          prev.map((f) =>
            f.id === idToReplace ? { ...factory, id: idToReplace, code: factory.code } : f
          )
        );
        return factory;
      }
      try {
        const updated = await factoryService.update(idToReplace, {
          name: factory.name,
          code: factory.code,
          status: factory.status,
          country: factory.country,
          state: factory.state,
          city: factory.city,
          address: factory.address,
          notes: factory.notes,
          operationTypes: factory.operationTypes,
          clock_in_time: factory.clock_in_time,
          no_time_clock: factory.no_time_clock ?? false,
        });
        setFactories((prev) =>
          prev.map((f) => (f.id === idToReplace ? updated : f))
        );
        return updated;
      } catch (e) {
        throw e;
      }
    },
    []
  );

  return (
    <FactoriesContext.Provider
      value={{ factories, loading, error, refreshFactories, addFactory, updateFactory }}
    >
      {children}
    </FactoriesContext.Provider>
  );
}

export function useFactories() {
  const ctx = useContext(FactoriesContext);
  if (!ctx) {
    return {
      factories: FACTORIES,
      loading: false,
      error: null,
      refreshFactories: async () => {},
      addFactory: async (f) => f,
      updateFactory: async (f) => f,
    };
  }
  return ctx;
}
