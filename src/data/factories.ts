/**
 * Lista de fábricas/obras cadastradas.
 * Usada na Lista de Fábricas e no formulário de Novo/Editar Funcionário (campo Fábrica/Obra).
 * Quando integrar com Supabase, substituir por chamada à API.
 */
export interface Factory {
  id: string;
  name: string;
  code: string;
  status: string;
  country: string;
  state: string;
  city: string;
  address: string;
  notes?: string;
  manager?: string;
  supervisor?: string;
  /** Horário de entrada padrão da fábrica/obra (ex: 07:00). Usado quando o funcionário não tem horário próprio. */
  clock_in_time?: string | null;
  /** Setores/tipos de operação cadastrados na fábrica/obra, com horário opcional por setor. */
  operationTypes?: FactoryOperationType[];
  /**
   * Quando true, não há relógio de ponto no local; colaboradores devem registrar o horário na entrada
   * (ex.: quiosque: primeiro toque = entrada, segundo = saída).
   */
  no_time_clock?: boolean;
}

export interface FactoryOperationType {
  name: string;
  clock_in_time?: string | null;
}

function normalizeOperationTypes(items: unknown, fallbackClockInTime?: string | null): FactoryOperationType[] {
  if (!Array.isArray(items)) return [];
  return items
    .map((item) => {
      if (typeof item === "string") {
        return { name: item, clock_in_time: fallbackClockInTime ?? null };
      }
      if (item && typeof item === "object") {
        const rawName = (item as { name?: unknown }).name;
        const rawClockIn = (item as { clock_in_time?: unknown }).clock_in_time;
        const name = typeof rawName === "string" ? rawName.trim() : "";
        const clockInTime = typeof rawClockIn === "string" ? rawClockIn.trim() : "";
        if (!name) return null;
        return {
          name,
          clock_in_time: clockInTime || fallbackClockInTime || null,
        };
      }
      return null;
    })
    .filter((item): item is FactoryOperationType => Boolean(item));
}

/** Retorna todas as opções de Setor (tipos de operação) registradas nas fábricas/obras, sem duplicatas. */
export function getDepartmentOptions(factoriesList?: Factory[]): string[] {
  const list = factoriesList ?? FACTORIES;
  const set = new Set<string>();
  for (const f of list) {
    normalizeOperationTypes(f.operationTypes, f.clock_in_time).forEach((op) => set.add(op.name));
  }
  return Array.from(set).sort();
}

/** Retorna as opções de Setor (tipos de operação) da fábrica/obra informada. Use após o usuário selecionar Fábrica/Obra. */
export function getDepartmentOptionsByFactory(
  factoryName: string,
  factoriesList?: Factory[]
): string[] {
  if (!factoryName.trim()) return [];
  const list = factoriesList ?? FACTORIES;
  const factory = list.find((f) => f.name === factoryName);
  return normalizeOperationTypes(factory?.operationTypes, factory?.clock_in_time)
    .map((op) => op.name)
    .sort();
}

/** Retorna o horário de entrada do setor informado. */
export function getDepartmentClockInTime(
  factoryName: string | null | undefined,
  departmentName: string | null | undefined,
  factoriesList: Factory[]
): string | null {
  const rawFactory = factoryName?.trim();
  const rawDepartment = departmentName?.trim();
  if (!rawFactory || !rawDepartment) return null;
  const factoryNeedle = rawFactory.toLowerCase();
  const departmentNeedle = rawDepartment.toLowerCase();
  const factory =
    factoriesList.find(
      (f) =>
        f.name?.toLowerCase() === factoryNeedle ||
        f.code?.toLowerCase() === factoryNeedle ||
        f.id?.toLowerCase() === factoryNeedle
    ) ?? null;
  if (!factory) return null;
  const operation = normalizeOperationTypes(factory.operationTypes, factory.clock_in_time).find(
    (op) => op.name.toLowerCase() === departmentNeedle
  );
  return operation?.clock_in_time?.trim() || null;
}

/** Retorna o horário de entrada efetivo: do funcionário se preenchido, senão da fábrica. */
export function getEffectiveClockInTime(
  employeeClockIn: string | null | undefined,
  factoryName: string | null | undefined,
  factoriesList: Factory[],
  departmentName?: string | null
): string | null {
  const empTime = employeeClockIn?.trim();
  if (empTime) return empTime;
  const departmentClockIn = getDepartmentClockInTime(factoryName, departmentName, factoriesList);
  if (departmentClockIn) return departmentClockIn;
  const rawFactory = factoryName?.trim();
  if (!rawFactory) return null;
  const needle = rawFactory.toLowerCase();
  const factory =
    factoriesList.find(
      (f) =>
        f.name?.toLowerCase() === needle ||
        f.code?.toLowerCase() === needle ||
        f.id?.toLowerCase() === needle
    ) ?? null;
  const factoryTime = factory?.clock_in_time;
  return factoryTime?.trim() || null;
}

/** Resolve fábrica/obra pelo nome, código ou id (mesma lógica de horário efetivo). */
export function findFactoryByAssignment(
  factoryName: string | null | undefined,
  factoriesList: Factory[]
): Factory | null {
  const raw = factoryName?.trim();
  if (!raw) return null;
  const needle = raw.toLowerCase();
  return (
    factoriesList.find(
      (f) =>
        f.name?.toLowerCase() === needle ||
        f.code?.toLowerCase() === needle ||
        f.id?.toLowerCase() === needle
    ) ?? null
  );
}

export const FACTORIES: Factory[] = [
  {
    id: "PC001",
    name: "Petrochemical Plant Houston",
    code: "PC001",
    status: "Ativo",
    country: "Estados Unidos",
    state: "Texas",
    city: "Houston",
    address: "1500 Industrial Blvd, Houston, TX 77001",
    notes: "Planta principal de processamento petroquímico",
    operationTypes: [
      { name: "Petroquímica", clock_in_time: "07:00" },
      { name: "Produção", clock_in_time: "07:30" },
      { name: "Manutenção", clock_in_time: "08:00" },
    ],
  },
  {
    id: "OR002",
    name: "Oil Refinery Dallas",
    code: "OR002",
    status: "Ativo",
    country: "Estados Unidos",
    state: "Texas",
    city: "Dallas",
    address: "2300 Refinery Road, Dallas, TX 75201",
    notes: "Refinaria de petróleo com capacidade de 150.000 barris/dia",
    operationTypes: [
      { name: "Refinaria", clock_in_time: "07:00" },
      { name: "Produção", clock_in_time: "07:30" },
      { name: "Logística", clock_in_time: "08:00" },
    ],
  },
  {
    id: "CS003",
    name: "Construction Site Austin",
    code: "CS003",
    status: "Em construção",
    country: "Estados Unidos",
    state: "Texas",
    city: "Austin",
    address: "4500 Construction Ave, Austin, TX 73301",
    notes: "Novo complexo industrial em desenvolvimento",
    operationTypes: [
      { name: "Construção", clock_in_time: "07:00" },
      { name: "Engenharia", clock_in_time: "08:00" },
      { name: "Segurança", clock_in_time: "06:30" },
    ],
  },
  {
    id: "PP004",
    name: "Pipeline Project South",
    code: "PP004",
    status: "Inativo",
    country: "Estados Unidos",
    state: "Texas",
    city: "Beaumont",
    address: "800 Pipeline St, Beaumont, TX 77701",
    notes: "Projeto de oleoduto - temporariamente suspenso",
    operationTypes: [
      { name: "Pipeline", clock_in_time: "07:00" },
      { name: "Manutenção", clock_in_time: "08:00" },
      { name: "Operações", clock_in_time: "07:30" },
    ],
  },
  {
    id: "MF005",
    name: "Manufacturing Facility West",
    code: "MF005",
    status: "Ativo",
    country: "Estados Unidos",
    state: "Texas",
    city: "El Paso",
    address: "3200 Manufacturing Dr, El Paso, TX 79901",
    notes: "Fábrica de equipamentos industriais",
    operationTypes: [
      { name: "Manufatura", clock_in_time: "07:00" },
      { name: "Produção", clock_in_time: "07:30" },
      { name: "Qualidade", clock_in_time: "08:30" },
    ],
  },
];
