import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Textarea } from "../ui/textarea";
import { Save, X, Plus, Trash2, Loader2 } from "lucide-react";
import { employeeService } from "@/services/employeeService";

// Todos os estados dos EUA (sigla em minúscula para valor, nome para exibição)
const US_STATES: { value: string; label: string }[] = [
  { value: "al", label: "Alabama" },
  { value: "ak", label: "Alaska" },
  { value: "az", label: "Arizona" },
  { value: "ar", label: "Arkansas" },
  { value: "ca", label: "California" },
  { value: "co", label: "Colorado" },
  { value: "ct", label: "Connecticut" },
  { value: "de", label: "Delaware" },
  { value: "dc", label: "District of Columbia" },
  { value: "fl", label: "Florida" },
  { value: "ga", label: "Georgia" },
  { value: "hi", label: "Hawaii" },
  { value: "id", label: "Idaho" },
  { value: "il", label: "Illinois" },
  { value: "in", label: "Indiana" },
  { value: "ia", label: "Iowa" },
  { value: "ks", label: "Kansas" },
  { value: "ky", label: "Kentucky" },
  { value: "la", label: "Louisiana" },
  { value: "me", label: "Maine" },
  { value: "md", label: "Maryland" },
  { value: "ma", label: "Massachusetts" },
  { value: "mi", label: "Michigan" },
  { value: "mn", label: "Minnesota" },
  { value: "ms", label: "Mississippi" },
  { value: "mo", label: "Missouri" },
  { value: "mt", label: "Montana" },
  { value: "ne", label: "Nebraska" },
  { value: "nv", label: "Nevada" },
  { value: "nh", label: "New Hampshire" },
  { value: "nj", label: "New Jersey" },
  { value: "nm", label: "New Mexico" },
  { value: "ny", label: "New York" },
  { value: "nc", label: "North Carolina" },
  { value: "nd", label: "North Dakota" },
  { value: "oh", label: "Ohio" },
  { value: "ok", label: "Oklahoma" },
  { value: "or", label: "Oregon" },
  { value: "pa", label: "Pennsylvania" },
  { value: "ri", label: "Rhode Island" },
  { value: "sc", label: "South Carolina" },
  { value: "sd", label: "South Dakota" },
  { value: "tn", label: "Tennessee" },
  { value: "tx", label: "Texas" },
  { value: "ut", label: "Utah" },
  { value: "vt", label: "Vermont" },
  { value: "va", label: "Virginia" },
  { value: "wa", label: "Washington" },
  { value: "wv", label: "West Virginia" },
  { value: "wi", label: "Wisconsin" },
  { value: "wy", label: "Wyoming" },
];

export type FactoryFormData = {
  name: string;
  code: string;
  status: string;
  country: string;
  state: string;
  city: string;
  address: string;
  zipCode?: string;
  phone?: string;
  email?: string;
  manager?: string;
  capacity?: string;
  operationTypes: { name: string; clock_in_time?: string | null }[];
  notes?: string;
  /** Obra sem relógio de ponto no local — colaborador deve registrar na entrada. */
  no_time_clock?: boolean;
};

function normalizeOperationTypes(
  list: unknown,
  fallbackClockInTime?: string | null
): { name: string; clock_in_time?: string | null }[] {
  if (!Array.isArray(list)) return [];
  return list
    .map((item) => {
      if (typeof item === "string") {
        return { name: item, clock_in_time: fallbackClockInTime ?? null };
      }
      if (item && typeof item === "object") {
        const rawName = (item as { name?: unknown }).name;
        const rawClockIn = (item as { clock_in_time?: unknown }).clock_in_time;
        const name = typeof rawName === "string" ? rawName.trim() : "";
        const clockIn = typeof rawClockIn === "string" ? rawClockIn.trim() : "";
        if (!name) return null;
        return { name, clock_in_time: clockIn || fallbackClockInTime || null };
      }
      return null;
    })
    .filter((item): item is { name: string; clock_in_time?: string | null } => Boolean(item));
}

/** Gera código tipo PC001 quando o usuário não preenche (campo removido da UI). */
function computeSuggestedFactoryCode(
  operationTypes: { name: string }[],
  facilityName: string
): string {
  const prefixes: Record<string, string> = {
    petrochemical: "PC",
    refinery: "OR",
    construction: "CS",
    pipeline: "PP",
    manufacturing: "MF",
    refinaria: "OR",
    petroquímica: "PC",
    petroquimica: "PC",
    construção: "CS",
    construcao: "CS",
    manufatura: "MF",
  };
  const first = operationTypes[0]?.name?.toLowerCase().replace(/\s+/g, "") || "";
  let prefix = prefixes[first] || "UN";
  if (!operationTypes.length && facilityName.trim()) {
    const letters = facilityName.replace(/[^a-zA-Z]/g, "").toUpperCase();
    if (letters.length >= 2) prefix = letters.slice(0, 2);
  }
  const number = String(Math.floor(Math.random() * 900) + 100).padStart(3, "0");
  return `${prefix}${number}`;
}

const STATUS_TO_FORM: Record<string, string> = {
  Ativo: "active",
  Inativo: "inactive",
  "Em construção": "construction",
  Manutenção: "maintenance",
};
const COUNTRY_TO_FORM: Record<string, string> = {
  "Estados Unidos": "us",
  Canadá: "ca",
  México: "mx",
};

/** Converte um Factory (do contexto/lista) para o formato de initialData do formulário. */
export function factoryToInitialData(
  factory: import("@/data/factories").Factory
): FactoryFormData {
  const stateValue =
    US_STATES.find((s) => s.label === factory.state)?.value ?? factory.state;
  const rawTime = factory.clock_in_time;
  const clockInTime = typeof rawTime === "string" ? rawTime.replace(/:\d{2}$/, "") || null : null;
  return {
    name: factory.name || "",
    code: factory.code || "",
    status: STATUS_TO_FORM[factory.status] ?? "active",
    country: COUNTRY_TO_FORM[factory.country] ?? "us",
    state: stateValue,
    city: factory.city || "",
    address: factory.address || "",
    notes: factory.notes || "",
    operationTypes: normalizeOperationTypes(factory.operationTypes, clockInTime),
    no_time_clock: factory.no_time_clock ?? false,
  };
}

/** Converte dados do formulário para o tipo Factory (para persistência em memória ou API). */
export function formDataToFactory(data: FactoryFormData): import("@/data/factories").Factory {
  const statusMap: Record<string, string> = {
    active: "Ativo",
    inactive: "Inativo",
    construction: "Em construção",
    maintenance: "Manutenção",
  };
  const countryMap: Record<string, string> = {
    us: "Estados Unidos",
    ca: "Canadá",
    mx: "México",
  };
  const stateLabel = US_STATES.find((s) => s.value === data.state)?.label ?? data.state;
  const operationTypes = normalizeOperationTypes(data.operationTypes);
  const factoryClockInTime = operationTypes.find((op) => op.clock_in_time?.trim())?.clock_in_time?.trim() || undefined;
  return {
    id: data.code,
    name: data.name.trim(),
    code: data.code.trim(),
    status: statusMap[data.status] ?? data.status,
    country: countryMap[data.country] ?? data.country,
    state: stateLabel,
    city: data.city.trim(),
    address: data.address.trim(),
    notes: data.notes?.trim() || undefined,
    operationTypes,
    clock_in_time: factoryClockInTime ?? null,
    no_time_clock: Boolean(data.no_time_clock),
  };
}

interface FactoryFormProps {
  mode: "create" | "edit";
  onSave?: (data: FactoryFormData) => void | Promise<void>;
  onCancel: () => void;
  initialData?: any;
}

export function FactoryForm({ mode, onSave, onCancel, initialData }: FactoryFormProps) {
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    code: initialData?.code || "",
    status: initialData?.status || "active",
    country: initialData?.country || "us",
    state: initialData?.state || "",
    city: initialData?.city || "",
    address: initialData?.address || "",
    zipCode: initialData?.zipCode || "",
    phone: initialData?.phone || "",
    email: initialData?.email || "",
    manager: initialData?.manager || "",
    capacity: initialData?.capacity || "",
    operationTypes: normalizeOperationTypes(
      Array.isArray(initialData?.operationTypes)
        ? initialData.operationTypes
        : initialData?.operationType
          ? String(initialData.operationType).split(/,\s*/).filter(Boolean)
          : [],
      initialData?.clock_in_time ?? null
    ),
    notes: initialData?.notes || "",
    no_time_clock: initialData?.no_time_clock ?? false,
  });

  const [operationTypeInput, setOperationTypeInput] = useState("");
  const [operationTypeClockInInput, setOperationTypeClockInInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [managerOptions, setManagerOptions] = useState<string[]>([]);

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    let mounted = true;
    employeeService
      .getAll({ status: "Ativo" })
      .then((list) => {
        if (!mounted) return;
        const managers = list
          .filter((employee) => employee.system_role === "Gerente")
          .map((employee) => employee.full_name.trim())
          .filter(Boolean);
        const uniqueManagers = Array.from(new Set(managers)).sort((a, b) => a.localeCompare(b));
        setManagerOptions(uniqueManagers);
      })
      .catch(() => {
        if (mounted) setManagerOptions([]);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ""
      }));
    }
  };

  const validateForm = (data: FactoryFormData) => {
    const newErrors: Record<string, string> = {};

    if (!data.name.trim()) newErrors.name = "Nome é obrigatório";
    if (!data.code.trim()) newErrors.code = "Código é obrigatório";
    if (!data.state) newErrors.state = "Estado é obrigatório";
    if (!data.city.trim()) newErrors.city = "Cidade é obrigatória";
    if (!data.address.trim()) newErrors.address = "Endereço é obrigatório";

    const codeUpper = data.code.trim().toUpperCase();
    if (codeUpper && !/^[A-Z]{2}\d{3}$/.test(codeUpper)) {
      newErrors.code = "Formato inválido (ex: PC001)";
    }

    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      newErrors.email = "E-mail inválido";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    const ops = normalizeOperationTypes(formData.operationTypes);
    const code =
      formData.code.trim().toUpperCase() ||
      computeSuggestedFactoryCode(ops, formData.name);
    const merged: FactoryFormData = { ...formData, code, operationTypes: ops };

    if (!validateForm(merged)) return;

    setSaving(true);
    try {
      await onSave?.(merged);
    } finally {
      setSaving(false);
    }
  };

  const addOperationType = () => {
    const value = operationTypeInput.trim();
    if (!value) return;
    const clockInValue = operationTypeClockInInput.trim();
    const list = normalizeOperationTypes(formData.operationTypes);
    if (list.some((item) => item.name.toLowerCase() === value.toLowerCase())) return;
    handleInputChange("operationTypes", [
      ...list,
      { name: value, clock_in_time: clockInValue || null },
    ]);
    setOperationTypeInput("");
    setOperationTypeClockInInput("");
  };

  const removeOperationType = (index: number) => {
    const list = [...normalizeOperationTypes(formData.operationTypes)];
    list.splice(index, 1);
    handleInputChange("operationTypes", list);
  };

  const operationTypes = useMemo(
    () => normalizeOperationTypes(formData.operationTypes),
    [formData.operationTypes]
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <CardTitle className="text-charcoal">
              {mode === "create" ? "Nova Fabrica/Obra" : "Editar Fabrica/Obra"}
            </CardTitle>
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={onCancel}
                className="border-border-color text-charcoal hover:bg-muted"
              >
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
              <Button 
                onClick={handleSave}
                disabled={saving}
                className="bg-charcoal hover:bg-charcoal/90 text-white"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Salvar
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div className="space-y-6 sm:col-span-2">
              <h3 className="text-lg font-semibold text-charcoal">Informações Básicas</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-charcoal">
                    Nome da Fábrica/Obra <span className="text-destructive">*</span>
                  </Label>
                  <Input 
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    className={`border-border-color focus:border-charcoal ${errors.name ? "border-destructive" : ""}`}
                    placeholder="Ex: Petrochemical Plant Houston"
                  />
                  {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status" className="text-charcoal">Status</Label>
                  <Select 
                    value={formData.status} 
                    onValueChange={(value) => handleInputChange("status", value)}
                  >
                    <SelectTrigger className="border-border-color focus:border-charcoal">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Ativo</SelectItem>
                      <SelectItem value="inactive">Inativo</SelectItem>
                      <SelectItem value="construction">Em construção</SelectItem>
                      <SelectItem value="maintenance">Manutenção</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="operationType" className="text-charcoal">Setores</Label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Input
                      id="operationType"
                      value={operationTypeInput}
                      onChange={(e) => setOperationTypeInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addOperationType())}
                      className="flex-1 border-border-color focus:border-charcoal rounded-md"
                      placeholder="Ex: Refinaria, Petroquímica"
                    />
                    <Input
                      id="operationTypeClockIn"
                      value={operationTypeClockInInput}
                      onChange={(e) => setOperationTypeClockInInput(e.target.value)}
                      className="sm:w-44 border-border-color focus:border-charcoal rounded-md"
                      placeholder="Horário (ex: 07:00)"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addOperationType}
                      className="border-border-color text-charcoal hover:bg-muted shrink-0 rounded-md h-9"
                    >
                      <Plus className="h-4 w-4" />
                      Adicionar Operação
                    </Button>
                  </div>
                  {operationTypes.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {operationTypes.map((op, index) => (
                        <span
                          key={`${op.name}-${index}`}
                          className="inline-flex items-center gap-1.5 rounded-md border border-border bg-muted/50 px-3 py-1.5 text-sm text-charcoal"
                        >
                          {op.name}
                          {op.clock_in_time?.trim() ? ` (${op.clock_in_time})` : ""}
                          <button
                            type="button"
                            onClick={() => removeOperationType(index)}
                            className="p-0.5 rounded hover:bg-muted text-muted-foreground hover:text-charcoal"
                            aria-label="Remover operação"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Ao vincular um funcionário ao setor, ele herda este horário se não tiver horário próprio.
                  </p>
                </div>
              </div>
            </div>

            {/* Location */}
            <div className="space-y-6 sm:col-span-2">
              <h3 className="text-lg font-semibold text-charcoal">Localização</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="country" className="text-charcoal">País</Label>
                  <Select 
                    value={formData.country} 
                    onValueChange={(value) => handleInputChange("country", value)}
                  >
                    <SelectTrigger className="border-border-color focus:border-charcoal">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="us">Estados Unidos</SelectItem>
                      <SelectItem value="ca">Canadá</SelectItem>
                      <SelectItem value="mx">México</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state" className="text-charcoal">
                    Estado <span className="text-destructive">*</span>
                  </Label>
                  <Select 
                    value={formData.state} 
                    onValueChange={(value) => handleInputChange("state", value)}
                  >
                    <SelectTrigger className={`border-border-color focus:border-charcoal ${errors.state ? "border-destructive" : ""}`}>
                      <SelectValue placeholder="Selecionar estado" />
                    </SelectTrigger>
                    <SelectContent>
                      {US_STATES.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.state && <p className="text-xs text-destructive">{errors.state}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city" className="text-charcoal">
                    Cidade <span className="text-destructive">*</span>
                  </Label>
                  <Input 
                    id="city"
                    value={formData.city}
                    onChange={(e) => handleInputChange("city", e.target.value)}
                    className={`border-border-color focus:border-charcoal ${errors.city ? "border-destructive" : ""}`}
                    placeholder="Nome da cidade"
                  />
                  {errors.city && <p className="text-xs text-destructive">{errors.city}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="zipCode" className="text-charcoal">ZIP Code</Label>
                  <Input 
                    id="zipCode"
                    value={formData.zipCode}
                    onChange={(e) => handleInputChange("zipCode", e.target.value)}
                    className="border-border-color focus:border-charcoal"
                    placeholder="12345"
                  />
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="address" className="text-charcoal">
                    Endereço <span className="text-destructive">*</span>
                  </Label>
                  <Input 
                    id="address"
                    value={formData.address}
                    onChange={(e) => handleInputChange("address", e.target.value)}
                    className={`border-border-color focus:border-charcoal ${errors.address ? "border-destructive" : ""}`}
                    placeholder="Rua, número, complemento"
                  />
                  {errors.address && <p className="text-xs text-destructive">{errors.address}</p>}
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-6 sm:col-span-2">
              <h3 className="text-lg font-semibold text-charcoal">Informações de Contato</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-charcoal">Telefone</Label>
                  <Input 
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    className="border-border-color focus:border-charcoal"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-charcoal">E-mail</Label>
                  <Input 
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className={`border-border-color focus:border-charcoal ${errors.email ? "border-destructive" : ""}`}
                    placeholder="factory@rccast.com"
                  />
                  {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="manager" className="text-charcoal">Gerente Responsável</Label>
                  <Select
                    value={formData.manager || "none"}
                    onValueChange={(value) => handleInputChange("manager", value === "none" ? "" : value)}
                  >
                    <SelectTrigger id="manager" className="border-border-color focus:border-charcoal">
                      <SelectValue placeholder="Selecione o gerente" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Selecione o gerente</SelectItem>
                      {managerOptions.map((managerName) => (
                        <SelectItem key={managerName} value={managerName}>
                          {managerName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="capacity" className="text-charcoal">Capacidade</Label>
                  <Input 
                    id="capacity"
                    value={formData.capacity}
                    onChange={(e) => handleInputChange("capacity", e.target.value)}
                    className="border-border-color focus:border-charcoal"
                    placeholder="Ex: 150.000 barris/dia"
                  />
                </div>
              </div>

              <div className="space-y-4 sm:col-span-2">
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    role="checkbox"
                    id="factory_no_time_clock"
                    aria-checked={formData.no_time_clock}
                    onClick={() => handleInputChange("no_time_clock", !formData.no_time_clock)}
                    className={`
                          size-4 shrink-0 rounded-[4px] border flex items-center justify-center
                          transition-colors cursor-pointer select-none
                          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-charcoal/50
                          border-border-color
                          ${formData.no_time_clock ? "bg-charcoal border-charcoal" : "bg-input-background"}
                        `}
                  >
                    {formData.no_time_clock && (
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="white"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="shrink-0"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </button>
                  <Label
                    htmlFor="factory_no_time_clock"
                    className="text-charcoal cursor-pointer"
                    onClick={() => handleInputChange("no_time_clock", !formData.no_time_clock)}
                  >
                    Obra sem máquina de ponto no local?
                  </Label>
                </div>
                <p className="text-xs text-muted-foreground sm:col-span-2 -mt-2 mb-1 pl-7">
                  Quando marcado, colaboradores desta fábrica devem registrar o ponto na entrada (o quiosque usa
                  primeiro o toque como entrada e o segundo como saída).
                </p>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-6 sm:col-span-2">
              <h3 className="text-lg font-semibold text-charcoal">Observações</h3>
              
              <div className="space-y-2">
                <Label htmlFor="notes" className="text-charcoal">Notas adicionais</Label>
                <Textarea 
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleInputChange("notes", e.target.value)}
                  className="min-h-24 border-border-color focus:border-charcoal"
                  placeholder="Informações adicionais sobre a fábrica/obra..."
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
