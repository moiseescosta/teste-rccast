import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Textarea } from "../ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { HourlyRateHistoryTable } from "./HourlyRateHistoryTable";
import { Camera, Save, X, Loader2, FileImage, Trash2, Plus } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { employeeService } from "@/services/employeeService";
import { hourlyRateHistoryService } from "@/services/hourlyRateHistoryService";
import { uploadEmployeeDocument } from "@/services/documentStorageService";
import type { EmployeeExtraDocument, EmployeeFormData, EmployeeMovement } from "@/types/employee";
import type { HourlyRateHistoryEntry } from "@/types/hourlyRateHistory";
import { getDepartmentClockInTime, getDepartmentOptionsByFactory, getEffectiveClockInTime } from "@/data/factories";
import { useFactories } from "@/contexts/FactoriesContext";

interface EmployeeFormProps {
  mode: "create" | "edit";
  employeeId?: string | null;
  onSave: () => void;
  onCancel: () => void;
}

function parseWorkNotesHistory(raw: string | null | undefined): string[] {
  if (!raw) return [];
  return raw
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function serializeWorkNotesHistory(items: string[]): string {
  return items.map((item) => item.trim()).filter(Boolean).join("\n");
}

function normalizeEmployeeMovements(raw: unknown): EmployeeMovement[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const row = item as Partial<EmployeeMovement>;
      const factory = typeof row.factory === "string" ? row.factory.trim() : "";
      const startDate = typeof row.start_date === "string" ? row.start_date : "";
      const endDate = typeof row.end_date === "string" ? row.end_date : "";
      if (!factory || !startDate || !endDate) return null;
      return {
        id:
          typeof row.id === "string" && row.id.trim()
            ? row.id
            : `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        factory,
        start_date: startDate,
        end_date: endDate,
        clock_in_time: typeof row.clock_in_time === "string" ? row.clock_in_time : null,
        clock_out_time: typeof row.clock_out_time === "string" ? row.clock_out_time : null,
        notes: typeof row.notes === "string" ? row.notes : null,
      } satisfies EmployeeMovement;
    })
    .filter((item): item is EmployeeMovement => Boolean(item));
}

export function EmployeeForm({ mode, employeeId, onSave, onCancel }: EmployeeFormProps) {
  const { factories } = useFactories();
  const [formData, setFormData] = useState<EmployeeFormData>({
    full_name: '',
    email: '',
    phone: '',
    ssn: '',
    passport: '',
    issuing_country: '',
    birth_date: '',
    origin_country: '',
    residence_state: '',
    address: '',
    city: '',
    zip_code: '',
    same_city: true,
    distance: '',
    language: 'pt',
    photo_url: '',
    location: '',
    factory: '',
    project: '',
    role: '',
    department: '',
    supervisor: '',
    clock_in_time: '',
    start_date: '',
    end_date: '',
    work_notes: '',
    hourly_rate: '',
    effective_date: '',
    receives_commute_allowance: false,
    is_registered: false,
    status: 'Ativo',
    passport_image_url: '',
    drivers_license_url: '',
    extra_documents: [],
    employee_movements: [],
  });

  const [activeTab, setActiveTab] = useState("personal");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const photoFileInputRef = useRef<HTMLInputElement>(null);
  const passportFileInputRef = useRef<HTMLInputElement>(null);
  const driversLicenseFileInputRef = useRef<HTMLInputElement>(null);
  // Tipo de usuário (Admin, Gerente, Funcionario) e senha para conta de acesso ao sistema
  const [userType, setUserType] = useState<"Admin" | "Gerente" | "Funcionario">("Funcionario");
  const [password, setPassword] = useState("");
  const [hourlyRateHistory, setHourlyRateHistory] = useState<HourlyRateHistoryEntry[]>([]);
  const [managerOptions, setManagerOptions] = useState<Array<{ id: string; name: string }>>([]);
  const [observationInput, setObservationInput] = useState("");
  const [movementInput, setMovementInput] = useState({
    factory: "",
    start_date: "",
    end_date: "",
    clock_in_time: "",
    clock_out_time: "",
    notes: "",
  });

  useEffect(() => {
    let active = true;
    employeeService
      .getAll({ status: "Ativo" })
      .then((rows) => {
        if (!active) return;
        const managers = rows
          .filter((e) => e.system_role === "Gerente")
          .map((e) => ({ id: e.id, name: e.full_name }));
        setManagerOptions(managers);
      })
      .catch(() => {
        if (active) setManagerOptions([]);
      });
    return () => {
      active = false;
    };
  }, []);

  const addExtraDocument = () => {
    const id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    setFormData((prev) => ({
      ...prev,
      extra_documents: [...prev.extra_documents, { id, title: "", image_url: "" }],
    }));
  };

  const removeExtraDocument = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      extra_documents: prev.extra_documents.filter((doc) => doc.id !== id),
    }));
  };

  const updateExtraDocument = (id: string, updates: Partial<EmployeeExtraDocument>) => {
    setFormData((prev) => ({
      ...prev,
      extra_documents: prev.extra_documents.map((doc) => (doc.id === id ? { ...doc, ...updates } : doc)),
    }));
  };

  const openExtraDocumentPicker = (id: string) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      try {
        const employeeKey = employeeId || formData.email || formData.full_name || "unknown";
        const url = await uploadEmployeeDocument(file, "extra_document", employeeKey);
        updateExtraDocument(id, { image_url: url || "" });
      } catch {
        const reader = new FileReader();
        reader.onload = () => {
          updateExtraDocument(id, { image_url: (reader.result as string) || "" });
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  useEffect(() => {
    if (mode === "edit" && employeeId) {
      setLoadingData(true);
      employeeService.getById(employeeId).then((emp) => {
        if (emp) {
          setFormData({
            full_name: emp.full_name || '',
            email: emp.email || '',
            phone: emp.phone || '',
            ssn: emp.ssn || '',
            passport: emp.passport || '',
            issuing_country: emp.issuing_country || '',
            birth_date: emp.birth_date || '',
            origin_country: emp.origin_country || '',
            residence_state: emp.residence_state || '',
            address: emp.address || '',
            city: emp.city || '',
            zip_code: emp.zip_code || '',
            same_city: emp.same_city ?? true,
            distance: emp.distance || '',
            language: emp.language || 'pt',
            photo_url: emp.photo_url || '',
            location: emp.location || '',
            factory: emp.factory || '',
            project: emp.project || '',
            role: emp.role || '',
            department: emp.department || '',
            supervisor: emp.supervisor || '',
            clock_in_time: emp.clock_in_time || '',
            start_date: emp.start_date || '',
            end_date: emp.end_date || '',
            work_notes: emp.work_notes || '',
            hourly_rate: emp.hourly_rate != null ? String(emp.hourly_rate) : '',
            effective_date: emp.effective_date || '',
            receives_commute_allowance: emp.receives_commute_allowance ?? false,
            is_registered: emp.is_registered ?? false,
            status: emp.status || 'Ativo',
            passport_image_url: emp.passport_image_url || '',
            drivers_license_url: emp.drivers_license_url || '',
            extra_documents: Array.isArray(emp.extra_documents)
              ? emp.extra_documents
                  .filter((doc) => doc && typeof doc === "object")
                  .map((doc) => ({
                    id:
                      typeof (doc as EmployeeExtraDocument).id === "string" &&
                      (doc as EmployeeExtraDocument).id.trim()
                        ? (doc as EmployeeExtraDocument).id
                        : `${Date.now()}-${Math.random().toString(16).slice(2)}`,
                    title:
                      typeof (doc as EmployeeExtraDocument).title === "string"
                        ? (doc as EmployeeExtraDocument).title
                        : "",
                    image_url:
                      typeof (doc as EmployeeExtraDocument).image_url === "string"
                        ? (doc as EmployeeExtraDocument).image_url
                        : "",
                  }))
              : [],
            employee_movements: normalizeEmployeeMovements((emp as { employee_movements?: unknown }).employee_movements),
          });
          setUserType(emp.system_role === 'Admin' || emp.system_role === 'Gerente' ? emp.system_role : 'Funcionario');
        }
      }).catch(() => {
        alert("Erro ao carregar dados do funcionario");
      }).finally(() => {
        setLoadingData(false);
      });
    }
  }, [mode, employeeId]);

  useEffect(() => {
    if (mode !== "edit" || !employeeId) {
      setHourlyRateHistory([]);
      return;
    }
    hourlyRateHistoryService
      .getByEmployeeId(employeeId)
      .then(setHourlyRateHistory)
      .catch(() => setHourlyRateHistory([]));
  }, [mode, employeeId]);

  const handleInputChange = (field: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const observationHistory = parseWorkNotesHistory(formData.work_notes);
  const movementHistory = normalizeEmployeeMovements(formData.employee_movements);

  const addObservation = () => {
    const value = observationInput.trim();
    if (!value) return;
    if (observationHistory.some((item) => item.toLowerCase() === value.toLowerCase())) {
      setObservationInput("");
      return;
    }
    handleInputChange("work_notes", serializeWorkNotesHistory([...observationHistory, value]));
    setObservationInput("");
  };

  const removeObservation = (index: number) => {
    const next = [...observationHistory];
    next.splice(index, 1);
    handleInputChange("work_notes", serializeWorkNotesHistory(next));
  };

  const addMovement = () => {
    const factory = movementInput.factory.trim();
    const startDate = movementInput.start_date;
    const endDate = movementInput.end_date;
    if (!factory || !startDate || !endDate) return;
    if (endDate < startDate) {
      alert("Data fim da movimentação não pode ser menor que a data início.");
      return;
    }
    const movement: EmployeeMovement = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      factory,
      start_date: startDate,
      end_date: endDate,
      clock_in_time: movementInput.clock_in_time.trim() || null,
      clock_out_time: movementInput.clock_out_time.trim() || null,
      notes: movementInput.notes.trim() || null,
    };
    handleInputChange("employee_movements", [...movementHistory, movement]);
    setMovementInput({
      factory: "",
      start_date: "",
      end_date: "",
      clock_in_time: "",
      clock_out_time: "",
      notes: "",
    });
  };

  const removeMovement = (id: string) => {
    handleInputChange(
      "employee_movements",
      movementHistory.filter((item) => item.id !== id)
    );
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.full_name.trim()) newErrors.full_name = "Nome completo e obrigatorio";
    if (!formData.email.trim()) newErrors.email = "E-mail e obrigatorio";
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "E-mail invalido";
    }
    if (mode === "create" && !password.trim()) {
      newErrors.password = "Senha obrigatoria para o funcionario poder logar no sistema.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setSaving(true);
    try {
      const payload = {
        full_name: formData.full_name,
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone || null,
        ssn: formData.ssn || null,
        passport: formData.passport || null,
        issuing_country: formData.issuing_country || null,
        birth_date: formData.birth_date || null,
        origin_country: formData.origin_country || null,
        residence_state: formData.residence_state || null,
        address: formData.address || null,
        city: formData.city || null,
        zip_code: formData.zip_code || null,
        same_city: formData.same_city,
        distance: formData.distance || null,
        language: formData.language || 'pt',
        photo_url: formData.photo_url || null,
        location: formData.location || null,
        factory: formData.factory || null,
        project: formData.project || null,
        role: formData.role || null,
        system_role: userType,
        department: formData.department || null,
        supervisor: formData.supervisor || null,
        clock_in_time: formData.clock_in_time || null,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        work_notes: formData.work_notes || null,
        hourly_rate: formData.hourly_rate ? parseFloat(formData.hourly_rate) : null,
        effective_date: formData.effective_date || null,
        receives_commute_allowance: formData.receives_commute_allowance,
        is_registered: formData.is_registered,
        status: formData.status || 'Ativo',
        passport_image_url: formData.passport_image_url || null,
        drivers_license_url: formData.drivers_license_url || null,
        extra_documents: (formData.extra_documents || [])
          .map((doc) => ({
            id: doc.id,
            title: doc.title.trim(),
            image_url: doc.image_url,
          }))
          .filter((doc) => doc.title || doc.image_url),
        employee_movements: movementHistory,
      };

      let savedId: string;
      if (mode === "edit" && employeeId) {
        try {
          await employeeService.update(employeeId, payload);
        } catch (error) {
          const message = error instanceof Error ? error.message : "";
          if (
            message.includes("extra_documents") &&
            (message.includes("column") || message.includes("schema cache"))
          ) {
            const { extra_documents: _extraDocuments, ...fallbackPayload } = payload;
            await employeeService.update(employeeId, fallbackPayload);
            alert(
              "Funcionário salvo sem os documentos extras. Rode a migration nova no Supabase para habilitar esse campo."
            );
          } else if (
            message.includes("receives_commute_allowance") &&
            (message.includes("column") || message.includes("schema cache"))
          ) {
            const { receives_commute_allowance: _r, ...fallbackPayload } = payload;
            await employeeService.update(employeeId, fallbackPayload);
            alert(
              "Funcionário salvo sem o campo auxílio moradia. Rode a migration nova no Supabase."
            );
          } else if (
            message.includes("employee_movements") &&
            (message.includes("column") || message.includes("schema cache"))
          ) {
            const { employee_movements: _movements, ...fallbackPayload } = payload;
            await employeeService.update(employeeId, fallbackPayload);
            alert(
              "Funcionário salvo sem o histórico de movimentações. Rode a migration nova no Supabase."
            );
          } else if (
            message.includes("is_registered") &&
            (message.includes("column") || message.includes("schema cache"))
          ) {
            const { is_registered: _ir, ...fallbackPayload } = payload;
            await employeeService.update(employeeId, fallbackPayload);
            alert(
              "Funcionário salvo sem o campo «É cadastrado». Rode a migration nova no Supabase."
            );
          } else {
            throw error;
          }
        }
        savedId = employeeId;
      } else {
        let created;
        try {
          created = await employeeService.create(payload as any);
        } catch (error) {
          const message = error instanceof Error ? error.message : "";
          if (
            message.includes("extra_documents") &&
            (message.includes("column") || message.includes("schema cache"))
          ) {
            const { extra_documents: _extraDocuments, ...fallbackPayload } = payload;
            created = await employeeService.create(fallbackPayload as any);
            alert(
              "Funcionário salvo sem os documentos extras. Rode a migration nova no Supabase para habilitar esse campo."
            );
          } else if (
            message.includes("receives_commute_allowance") &&
            (message.includes("column") || message.includes("schema cache"))
          ) {
            const { receives_commute_allowance: _r, ...fallbackPayload } = payload;
            created = await employeeService.create(fallbackPayload as any);
            alert(
              "Funcionário salvo sem o campo auxílio moradia. Rode a migration nova no Supabase."
            );
          } else if (
            message.includes("employee_movements") &&
            (message.includes("column") || message.includes("schema cache"))
          ) {
            const { employee_movements: _movements, ...fallbackPayload } = payload;
            created = await employeeService.create(fallbackPayload as any);
            alert(
              "Funcionário salvo sem o histórico de movimentações. Rode a migration nova no Supabase."
            );
          } else if (
            message.includes("is_registered") &&
            (message.includes("column") || message.includes("schema cache"))
          ) {
            const { is_registered: _ir, ...fallbackPayload } = payload;
            created = await employeeService.create(fallbackPayload as any);
            alert(
              "Funcionário salvo sem o campo «É cadastrado». Rode a migration nova no Supabase."
            );
          } else {
            throw error;
          }
        }
        savedId = created.id;
      }
      if (password.trim()) {
        await employeeService.setPassword(savedId, password);
      }
      try {
        await hourlyRateHistoryService.appendIfChanged(
          savedId,
          payload.hourly_rate,
          payload.effective_date
        );
      } catch {
        /* tabela de historico pode nao existir ainda */
      }
      try {
        const rows = await hourlyRateHistoryService.getByEmployeeId(savedId);
        setHourlyRateHistory(rows);
      } catch {
        setHourlyRateHistory([]);
      }
      onSave();
    } catch (err) {
      alert(`Erro ao salvar: ${err instanceof Error ? err.message : "erro desconhecido"}`);
    } finally {
      setSaving(false);
    }
  };

  const calculateAge = (birthDate: string) => {
    if (!birthDate) return "";
    const today = new Date();
    const birth = new Date(birthDate);
    const age = Math.floor((today.getTime() - birth.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
    return `${age} anos`;
  };

  const employeeFormTabTriggerClassName =
    "h-auto min-h-10 w-full flex-none justify-center px-1.5 text-center text-xs leading-tight data-[state=active]:bg-card data-[state=active]:font-semibold data-[state=active]:text-charcoal sm:text-sm";

  if (loadingData) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-3 text-muted-foreground">Carregando dados...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <CardTitle className="text-charcoal">
              {mode === "create" ? "Novo Funcionario" : "Editar Funcionario"}
            </CardTitle>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={onCancel}
                className="border-border-color text-charcoal hover:bg-muted"
                disabled={saving}
              >
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
              <Button
                onClick={handleSave}
                className="bg-charcoal hover:bg-charcoal/90 text-white"
                disabled={saving}
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {saving ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="!grid h-auto w-full grid-cols-3 gap-1 rounded-xl bg-muted p-1">
              <TabsTrigger value="personal" className={employeeFormTabTriggerClassName}>
                Dados Pessoais
              </TabsTrigger>
              <TabsTrigger value="work" className={employeeFormTabTriggerClassName}>
                Trabalho
              </TabsTrigger>
              <TabsTrigger value="payment" className={employeeFormTabTriggerClassName}>
                Pagamento
              </TabsTrigger>
              <TabsTrigger value="documents" className={employeeFormTabTriggerClassName}>
                Documentos
              </TabsTrigger>
              <TabsTrigger value="observations" className={employeeFormTabTriggerClassName}>
                Observações
              </TabsTrigger>
              <TabsTrigger value="movement" className={employeeFormTabTriggerClassName}>
                Movimentação
              </TabsTrigger>
            </TabsList>

            <TabsContent value="personal" className="mt-6">
              <div className="flex flex-col lg:grid lg:grid-cols-12 gap-6">
                {/* Photo Upload */}
                <div className="lg:col-span-3">
                  <Card>
                    <CardContent className="relative p-6 text-center">
                      <div className="flex flex-col items-center gap-2 mb-4">
                        <div className="w-32 h-32 rounded-lg bg-muted overflow-hidden border border-border-color shrink-0">
                          {formData.photo_url ? (
                            <img
                              src={formData.photo_url}
                              alt="Foto do funcionario"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Camera className="h-8 w-8 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        {formData.photo_url ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleInputChange("photo_url", "")}
                          >
                            <Trash2 className="h-4 w-4 mr-1.5 shrink-0" />
                            Remover foto
                          </Button>
                        ) : null}
                      </div>
                      <div
                        className="absolute left-0 top-0 w-px h-px overflow-hidden opacity-0 m-0 p-0 border-0"
                        aria-hidden
                      >
                        <input
                          ref={photoFileInputRef}
                          type="file"
                          accept="image/*"
                          tabIndex={-1}
                          className="absolute w-px h-px opacity-0"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              try {
                                const employeeKey = employeeId || formData.email || formData.full_name || "unknown";
                                const url = await uploadEmployeeDocument(file, "photo", employeeKey);
                                handleInputChange("photo_url", url);
                              } catch {
                                const reader = new FileReader();
                                reader.onload = () =>
                                  handleInputChange("photo_url", reader.result as string);
                                reader.readAsDataURL(file);
                              }
                            }
                            (e.target as HTMLInputElement).value = "";
                          }}
                        />
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        className="min-w-[110px] border-border-color text-charcoal"
                        onClick={() => photoFileInputRef.current?.click()}
                      >
                        {formData.photo_url ? "Trocar foto" : "Adicionar foto"}
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                {/* Personal Info Form */}
                <div className="lg:col-span-9 grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="full_name" className="text-charcoal">
                      Nome completo <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="full_name"
                      value={formData.full_name}
                      onChange={(e) => handleInputChange("full_name", e.target.value)}
                      className={`border-border-color focus:border-charcoal ${errors.full_name ? "border-destructive" : ""}`}
                      placeholder="Nome completo do funcionario"
                    />
                    {errors.full_name && <p className="text-xs text-destructive">{errors.full_name}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-charcoal">
                      E-mail <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      className={`border-border-color focus:border-charcoal ${errors.email ? "border-destructive" : ""}`}
                      placeholder="email@empresa.com"
                    />
                    {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-charcoal">Senha</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (errors.password) setErrors((prev) => ({ ...prev, password: "" }));
                      }}
                      className={`border-border-color focus:border-charcoal ${errors.password ? "border-destructive" : ""}`}
                      placeholder={mode === "create" ? "Obrigatorio para o funcionario logar" : "Deixe em branco para nao alterar"}
                      autoComplete="new-password"
                    />
                    {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
                  </div>

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
                    <Label htmlFor="user_type" className="text-charcoal">Tipo de usuario</Label>
                    <Select
                      value={userType}
                      onValueChange={(value: "Admin" | "Gerente" | "Funcionario") => setUserType(value)}
                    >
                      <SelectTrigger id="user_type" className="border-border-color focus:border-charcoal">
                        <SelectValue placeholder="Selecionar tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Admin">Admin</SelectItem>
                        <SelectItem value="Gerente">Gerente</SelectItem>
                        <SelectItem value="Funcionario">Funcionario</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ssn" className="text-charcoal">SSN</Label>
                    <Input
                      id="ssn"
                      value={formData.ssn}
                      onChange={(e) => handleInputChange("ssn", e.target.value)}
                      className="border-border-color focus:border-charcoal"
                      placeholder="XXX-XX-XXXX"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="passport" className="text-charcoal">Passaporte / ID</Label>
                    <Input
                      id="passport"
                      value={formData.passport}
                      onChange={(e) => handleInputChange("passport", e.target.value)}
                      className="border-border-color focus:border-charcoal"
                      placeholder="Numero do documento"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="issuing_country" className="text-charcoal">País emissor</Label>
                    <Input
                      id="issuing_country"
                      value={formData.issuing_country}
                      onChange={(e) => handleInputChange("issuing_country", e.target.value)}
                      className="border-border-color focus:border-charcoal"
                      placeholder="Ex: Brasil, Estados Unidos, México"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="birth_date" className="text-charcoal">Data de nascimento</Label>
                    <Input
                      id="birth_date"
                      type="date"
                      value={formData.birth_date}
                      onChange={(e) => handleInputChange("birth_date", e.target.value)}
                      className="border-border-color focus:border-charcoal"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-charcoal">Idade</Label>
                    <div className="flex items-center h-10 px-3 bg-muted rounded-md">
                      <span className="text-sm text-muted-foreground">
                        {calculateAge(formData.birth_date) || "Inserir data de nascimento"}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="origin_country" className="text-charcoal">Pais de origem</Label>
                    <Input
                      id="origin_country"
                      value={formData.origin_country}
                      onChange={(e) => handleInputChange("origin_country", e.target.value)}
                      className="border-border-color focus:border-charcoal"
                      placeholder="Ex: Brasil, Estados Unidos, Mexico"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="residence_state" className="text-charcoal">Estado (EUA)</Label>
                    <Select
                      value={formData.residence_state}
                      onValueChange={(value) => handleInputChange("residence_state", value)}
                    >
                      <SelectTrigger className="border-border-color focus:border-charcoal">
                        <SelectValue placeholder="Selecionar estado" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="AL">Alabama</SelectItem>
                        <SelectItem value="AK">Alaska</SelectItem>
                        <SelectItem value="AZ">Arizona</SelectItem>
                        <SelectItem value="AR">Arkansas</SelectItem>
                        <SelectItem value="CA">California</SelectItem>
                        <SelectItem value="CO">Colorado</SelectItem>
                        <SelectItem value="CT">Connecticut</SelectItem>
                        <SelectItem value="DE">Delaware</SelectItem>
                        <SelectItem value="DC">District of Columbia</SelectItem>
                        <SelectItem value="FL">Florida</SelectItem>
                        <SelectItem value="GA">Georgia</SelectItem>
                        <SelectItem value="HI">Hawaii</SelectItem>
                        <SelectItem value="ID">Idaho</SelectItem>
                        <SelectItem value="IL">Illinois</SelectItem>
                        <SelectItem value="IN">Indiana</SelectItem>
                        <SelectItem value="IA">Iowa</SelectItem>
                        <SelectItem value="KS">Kansas</SelectItem>
                        <SelectItem value="KY">Kentucky</SelectItem>
                        <SelectItem value="LA">Louisiana</SelectItem>
                        <SelectItem value="ME">Maine</SelectItem>
                        <SelectItem value="MD">Maryland</SelectItem>
                        <SelectItem value="MA">Massachusetts</SelectItem>
                        <SelectItem value="MI">Michigan</SelectItem>
                        <SelectItem value="MN">Minnesota</SelectItem>
                        <SelectItem value="MS">Mississippi</SelectItem>
                        <SelectItem value="MO">Missouri</SelectItem>
                        <SelectItem value="MT">Montana</SelectItem>
                        <SelectItem value="NE">Nebraska</SelectItem>
                        <SelectItem value="NV">Nevada</SelectItem>
                        <SelectItem value="NH">New Hampshire</SelectItem>
                        <SelectItem value="NJ">New Jersey</SelectItem>
                        <SelectItem value="NM">New Mexico</SelectItem>
                        <SelectItem value="NY">New York</SelectItem>
                        <SelectItem value="NC">North Carolina</SelectItem>
                        <SelectItem value="ND">North Dakota</SelectItem>
                        <SelectItem value="OH">Ohio</SelectItem>
                        <SelectItem value="OK">Oklahoma</SelectItem>
                        <SelectItem value="OR">Oregon</SelectItem>
                        <SelectItem value="PA">Pennsylvania</SelectItem>
                        <SelectItem value="RI">Rhode Island</SelectItem>
                        <SelectItem value="SC">South Carolina</SelectItem>
                        <SelectItem value="SD">South Dakota</SelectItem>
                        <SelectItem value="TN">Tennessee</SelectItem>
                        <SelectItem value="TX">Texas</SelectItem>
                        <SelectItem value="UT">Utah</SelectItem>
                        <SelectItem value="VT">Vermont</SelectItem>
                        <SelectItem value="VA">Virginia</SelectItem>
                        <SelectItem value="WA">Washington</SelectItem>
                        <SelectItem value="WV">West Virginia</SelectItem>
                        <SelectItem value="WI">Wisconsin</SelectItem>
                        <SelectItem value="WY">Wyoming</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="address" className="text-charcoal">Endereco completo</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => handleInputChange("address", e.target.value)}
                      className="border-border-color focus:border-charcoal mb-2"
                      placeholder="Rua, numero"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        value={formData.city}
                        onChange={(e) => handleInputChange("city", e.target.value)}
                        className="border-border-color focus:border-charcoal"
                        placeholder="Cidade"
                      />
                      <Input
                        value={formData.zip_code}
                        onChange={(e) => handleInputChange("zip_code", e.target.value)}
                        className="border-border-color focus:border-charcoal"
                        placeholder="ZIP Code"
                      />
                    </div>
                  </div>

                  {!formData.same_city && (
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="distance" className="text-charcoal">
                        Distancia/Cidade de origem
                      </Label>
                      <Input
                        id="distance"
                        value={formData.distance}
                        onChange={(e) => handleInputChange("distance", e.target.value)}
                        className="border-border-color focus:border-charcoal"
                        placeholder="Ex: 50 milhas / Sao Paulo"
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="language" className="text-charcoal">Idioma preferido</Label>
                    <Select
                      value={formData.language}
                      onValueChange={(value) => handleInputChange("language", value)}
                    >
                      <SelectTrigger className="border-border-color focus:border-charcoal">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pt">Portugues</SelectItem>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="es">Espanol</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="work" className="mt-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="factory" className="text-charcoal">Fabrica / Obra</Label>
                  <Select
                    value={formData.factory || ""}
                    onValueChange={(value) => {
                      const departmentOptions = getDepartmentOptionsByFactory(value, factories);
                      const keepDepartment =
                        formData.department && departmentOptions.includes(formData.department);
                      const nextDepartment = keepDepartment ? formData.department : "";
                      const inheritedClockIn =
                        getDepartmentClockInTime(value, nextDepartment, factories) ||
                        getEffectiveClockInTime(null, value, factories, nextDepartment) ||
                        "";
                      setFormData((prev) => ({
                        ...prev,
                        factory: value,
                        department: nextDepartment,
                        clock_in_time: prev.clock_in_time?.trim() ? prev.clock_in_time : inheritedClockIn,
                      }));
                      if (errors.factory) setErrors((e) => ({ ...e, factory: "" }));
                    }}
                  >
                    <SelectTrigger
                      id="factory"
                      className="border-border-color focus:border-charcoal"
                    >
                      <SelectValue placeholder="Selecionar fabrica ou obra" />
                    </SelectTrigger>
                    <SelectContent>
                      {factories.map((f) => (
                        <SelectItem key={f.id} value={f.name}>
                          {f.name} ({f.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="department" className="text-charcoal">Setor</Label>
                  <Select
                    value={formData.department || ""}
                    onValueChange={(value) => {
                      const inheritedClockIn =
                        getDepartmentClockInTime(formData.factory, value, factories) ||
                        getEffectiveClockInTime(null, formData.factory, factories, value) ||
                        "";
                      setFormData((prev) => ({
                        ...prev,
                        department: value,
                        clock_in_time: prev.clock_in_time?.trim() ? prev.clock_in_time : inheritedClockIn,
                      }));
                    }}
                    disabled={!formData.factory}
                  >
                    <SelectTrigger
                      id="department"
                      className="border-border-color focus:border-charcoal"
                    >
                      <SelectValue
                        placeholder={
                          formData.factory
                            ? "Ex: Produção, Manutenção"
                            : "Selecione primeiro a Fábrica/Obra"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {getDepartmentOptionsByFactory(formData.factory, factories).map((dept) => (
                        <SelectItem key={dept} value={dept}>
                          {dept}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="clock_in_time" className="text-charcoal">Horário de Entrada</Label>
                  <Input
                    id="clock_in_time"
                    type="text"
                    value={formData.clock_in_time}
                    onChange={(e) => handleInputChange("clock_in_time", e.target.value)}
                    className="border-border-color focus:border-charcoal"
                    placeholder="Ex: 07:00 ou 8:30"
                  />
                  <p className="text-xs text-muted-foreground">
                    Se vazio, usa primeiro o horário do setor e depois o da fábrica/obra.
                  </p>
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="supervisor" className="text-charcoal">Lider/Supervisor (opcional)</Label>
                  <Select
                    value={formData.supervisor || "none"}
                    onValueChange={(value) => handleInputChange("supervisor", value === "none" ? "" : value)}
                  >
                    <SelectTrigger id="supervisor" className="border-border-color focus:border-charcoal">
                      <SelectValue placeholder="Selecione um gerente" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sem gerente</SelectItem>
                      {managerOptions.map((manager) => (
                        <SelectItem key={manager.id} value={manager.name}>
                          {manager.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="start_date" className="text-charcoal">Data de inicio</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => handleInputChange("start_date", e.target.value)}
                    className="border-border-color focus:border-charcoal"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="end_date" className="text-charcoal">Data de fim (opcional)</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => handleInputChange("end_date", e.target.value)}
                    className="border-border-color focus:border-charcoal"
                  />
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
                      <SelectItem value="Ativo">Ativo</SelectItem>
                      <SelectItem value="Inativo">Inativo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="documents" className="mt-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-charcoal">Passaporte</Label>
                  <div className="relative border border-border-color rounded-lg p-4 bg-muted/30 min-h-[180px] flex flex-col items-center justify-center">
                    {formData.passport_image_url ? (
                      <div className="relative w-full">
                        <img
                          src={formData.passport_image_url}
                          alt="Passaporte"
                          className="max-h-48 w-auto mx-auto rounded object-contain"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute top-0 right-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleInputChange("passport_image_url", "")}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <FileImage className="h-10 w-10 text-muted-foreground mb-2" />
                        <div
                          className="absolute left-0 top-0 w-px h-px overflow-hidden opacity-0 m-0 p-0 border-0"
                          aria-hidden
                        >
                          <input
                            ref={passportFileInputRef}
                            type="file"
                            accept="image/*"
                            tabIndex={-1}
                            className="absolute w-px h-px opacity-0"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                try {
                                  const employeeKey = employeeId || formData.email || formData.full_name || "unknown";
                                  const url = await uploadEmployeeDocument(file, "passport", employeeKey);
                                  handleInputChange("passport_image_url", url);
                                } catch {
                                  const reader = new FileReader();
                                  reader.onload = () =>
                                    handleInputChange("passport_image_url", reader.result as string);
                                  reader.readAsDataURL(file);
                                }
                              }
                              (e.target as HTMLInputElement).value = "";
                            }}
                          />
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          className="w-[110px] border-border-color text-charcoal"
                          onClick={() => passportFileInputRef.current?.click()}
                        >
                          Adicionar foto
                        </Button>
                        <p className="text-xs text-muted-foreground mt-2">PNG ou JPG</p>
                      </>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-charcoal">Driver&apos;s License</Label>
                  <div className="relative border border-border-color rounded-lg p-4 bg-muted/30 min-h-[180px] flex flex-col items-center justify-center">
                    {formData.drivers_license_url ? (
                      <div className="relative w-full">
                        <img
                          src={formData.drivers_license_url}
                          alt="Driver's License"
                          className="max-h-48 w-auto mx-auto rounded object-contain"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute top-0 right-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleInputChange("drivers_license_url", "")}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <FileImage className="h-10 w-10 text-muted-foreground mb-2" />
                        <div
                          className="absolute left-0 top-0 w-px h-px overflow-hidden opacity-0 m-0 p-0 border-0"
                          aria-hidden
                        >
                          <input
                            ref={driversLicenseFileInputRef}
                            type="file"
                            accept="image/*"
                            tabIndex={-1}
                            className="absolute w-px h-px opacity-0"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                try {
                                  const employeeKey = employeeId || formData.email || formData.full_name || "unknown";
                                  const url = await uploadEmployeeDocument(file, "drivers_license", employeeKey);
                                  handleInputChange("drivers_license_url", url);
                                } catch {
                                  const reader = new FileReader();
                                  reader.onload = () =>
                                    handleInputChange("drivers_license_url", reader.result as string);
                                  reader.readAsDataURL(file);
                                }
                              }
                              (e.target as HTMLInputElement).value = "";
                            }}
                          />
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          className="w-[110px] border-border-color text-charcoal"
                          onClick={() => driversLicenseFileInputRef.current?.click()}
                        >
                          Adicionar foto
                        </Button>
                        <p className="text-xs text-muted-foreground mt-2">PNG ou JPG</p>
                      </>
                    )}
                  </div>
                </div>
                <div className="sm:col-span-2 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <Label className="text-charcoal">Documentos extras</Label>
                    <Button
                      type="button"
                      variant="outline"
                      className="border-border-color text-charcoal"
                      onClick={addExtraDocument}
                    >
                      Adicionar documento
                    </Button>
                  </div>

                  {formData.extra_documents.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Nenhum documento extra cadastrado.
                    </p>
                  ) : null}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {formData.extra_documents.map((doc) => (
                      <div
                        key={doc.id}
                        className="border border-border-color rounded-lg p-4 bg-muted/20 space-y-3"
                      >
                        <div className="space-y-2">
                          <Label className="text-charcoal">Título</Label>
                          <Input
                            value={doc.title}
                            onChange={(e) => updateExtraDocument(doc.id, { title: e.target.value })}
                            className="border-border-color focus:border-charcoal"
                            placeholder="Ex: Visto de trabalho"
                          />
                        </div>

                        <div className="relative border border-border-color rounded-lg p-3 bg-muted/30 min-h-[160px] flex flex-col items-center justify-center">
                          {doc.image_url ? (
                            <div className="relative w-full">
                              <img
                                src={doc.image_url}
                                alt={doc.title || "Documento extra"}
                                className="max-h-40 w-auto mx-auto rounded object-contain"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute top-0 right-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={() => updateExtraDocument(doc.id, { image_url: "" })}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <>
                              <FileImage className="h-8 w-8 text-muted-foreground mb-2" />
                              <Button
                                type="button"
                                variant="outline"
                                className="w-[120px] border-border-color text-charcoal"
                                onClick={() => openExtraDocumentPicker(doc.id)}
                              >
                                Adicionar foto
                              </Button>
                              <p className="text-xs text-muted-foreground mt-2">PNG ou JPG</p>
                            </>
                          )}
                        </div>

                        <Button
                          type="button"
                          variant="ghost"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10 w-full"
                          onClick={() => removeExtraDocument(doc.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Remover documento
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="observations" className="mt-6">
              <div className="max-w-3xl space-y-3">
                <Label htmlFor="observation-input" className="text-charcoal">
                  Histórico de observações
                </Label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Input
                    id="observation-input"
                    value={observationInput}
                    onChange={(e) => setObservationInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addObservation())}
                    className="flex-1 border-border-color focus:border-charcoal"
                    placeholder="Ex: Treinamento NR-10 concluído em 03/04"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="border-border-color text-charcoal hover:bg-muted"
                    onClick={addObservation}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar
                  </Button>
                </div>

                {observationHistory.length > 0 ? (
                  <div className="space-y-2">
                    {observationHistory.map((item, index) => (
                      <div
                        key={`${item}-${index}`}
                        className="flex items-start justify-between gap-3 rounded-md border border-border bg-muted/30 px-3 py-2"
                      >
                        <p className="text-sm text-charcoal">{item}</p>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          onClick={() => removeObservation(index)}
                          aria-label="Remover observação"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Nenhuma observação adicionada.
                  </p>
                )}

                <p className="text-xs text-muted-foreground">
                  As observações ficam salvas no histórico do funcionário e aparecem no perfil.
                </p>
              </div>
            </TabsContent>

            <TabsContent value="movement" className="mt-6">
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Use esta aba para alocar o funcionário em outra fábrica/obra por período temporário.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-lg border border-border bg-muted/20 p-4">
                  <div className="space-y-2 sm:col-span-2">
                    <Label className="text-charcoal">Fábrica/Obra destino</Label>
                    <Select
                      value={movementInput.factory || "none"}
                      onValueChange={(value) =>
                        setMovementInput((prev) => ({ ...prev, factory: value === "none" ? "" : value }))
                      }
                    >
                      <SelectTrigger className="border-border-color focus:border-charcoal">
                        <SelectValue placeholder="Selecione a fábrica/obra destino" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Selecione</SelectItem>
                        {factories.map((f) => (
                          <SelectItem key={f.id} value={f.name}>
                            {f.name} ({f.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-charcoal">Início da movimentação</Label>
                    <Input
                      type="date"
                      value={movementInput.start_date}
                      onChange={(e) =>
                        setMovementInput((prev) => ({ ...prev, start_date: e.target.value }))
                      }
                      className="border-border-color focus:border-charcoal"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-charcoal">Fim da movimentação</Label>
                    <Input
                      type="date"
                      value={movementInput.end_date}
                      onChange={(e) =>
                        setMovementInput((prev) => ({ ...prev, end_date: e.target.value }))
                      }
                      className="border-border-color focus:border-charcoal"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-charcoal">Entrada no período</Label>
                    <Input
                      type="time"
                      value={movementInput.clock_in_time}
                      onChange={(e) =>
                        setMovementInput((prev) => ({ ...prev, clock_in_time: e.target.value }))
                      }
                      className="border-border-color focus:border-charcoal"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-charcoal">Saída no período</Label>
                    <Input
                      type="time"
                      value={movementInput.clock_out_time}
                      onChange={(e) =>
                        setMovementInput((prev) => ({ ...prev, clock_out_time: e.target.value }))
                      }
                      className="border-border-color focus:border-charcoal"
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label className="text-charcoal">Observação (opcional)</Label>
                    <Input
                      value={movementInput.notes}
                      onChange={(e) =>
                        setMovementInput((prev) => ({ ...prev, notes: e.target.value }))
                      }
                      className="border-border-color focus:border-charcoal"
                      placeholder="Ex: suporte emergencial de manutenção"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Button type="button" variant="outline" onClick={addMovement}>
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar movimentação
                    </Button>
                  </div>
                </div>

                {movementHistory.length === 0 ? (
                  <p className="text-sm text-muted-foreground rounded-lg border border-border bg-muted/30 p-4">
                    Nenhuma movimentação cadastrada.
                  </p>
                ) : (
                  <div className="overflow-x-auto rounded-lg border border-border-color">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead className="text-charcoal">Destino</TableHead>
                          <TableHead className="text-charcoal">Período</TableHead>
                          <TableHead className="text-charcoal">Horário</TableHead>
                          <TableHead className="text-charcoal">Obs.</TableHead>
                          <TableHead className="text-charcoal">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {movementHistory.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="text-sm">{item.factory}</TableCell>
                            <TableCell className="text-sm">
                              {new Date(`${item.start_date}T12:00:00`).toLocaleDateString("pt-BR")} a{" "}
                              {new Date(`${item.end_date}T12:00:00`).toLocaleDateString("pt-BR")}
                            </TableCell>
                            <TableCell className="font-mono text-sm">
                              {item.clock_in_time || "--:--"} - {item.clock_out_time || "--:--"}
                            </TableCell>
                            <TableCell className="text-sm">{item.notes || "-"}</TableCell>
                            <TableCell>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={() => removeMovement(item.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="payment" className="mt-6">
              <div className="space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl">
                <div className="space-y-2">
                  <Label htmlFor="hourly_rate" className="text-charcoal">
                    Valor por hora (USD)
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">$</span>
                    <Input
                      id="hourly_rate"
                      type="number"
                      step="0.01"
                      value={formData.hourly_rate}
                      onChange={(e) => handleInputChange("hourly_rate", e.target.value)}
                      className="pl-8 border-border-color focus:border-charcoal"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="effective_date" className="text-charcoal">
                    Vigente a partir de
                  </Label>
                  <Input
                    id="effective_date"
                    type="date"
                    value={formData.effective_date}
                    onChange={(e) => handleInputChange("effective_date", e.target.value)}
                    className="border-border-color focus:border-charcoal"
                  />
                </div>

                <div className="space-y-4 sm:col-span-2">
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      role="checkbox"
                      id="payment_same_city"
                      aria-checked={!formData.same_city}
                      onClick={() => handleInputChange("same_city", !formData.same_city)}
                      className={`
                          size-4 shrink-0 rounded-[4px] border flex items-center justify-center
                          transition-colors cursor-pointer select-none
                          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-charcoal/50
                          border-border-color
                          ${!formData.same_city ? "bg-charcoal border-charcoal" : "bg-input-background"}
                        `}
                    >
                      {!formData.same_city && (
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
                      htmlFor="payment_same_city"
                      className="text-charcoal cursor-pointer"
                      onClick={() => handleInputChange("same_city", !formData.same_city)}
                    >
                      Reside fora da cidade onde trabalha?
                    </Label>
                  </div>
                  <p className="text-xs text-muted-foreground sm:col-span-2 -mt-2 mb-1 pl-7">
                    Na folha: US$ 20 por dia em que o ponto somar pelo menos 5 horas (soma dos registros do dia).
                  </p>

                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      role="checkbox"
                      id="payment_commute_allowance"
                      aria-checked={formData.receives_commute_allowance}
                      onClick={() =>
                        handleInputChange(
                          "receives_commute_allowance",
                          !formData.receives_commute_allowance
                        )
                      }
                      className={`
                          size-4 shrink-0 rounded-[4px] border flex items-center justify-center
                          transition-colors cursor-pointer select-none
                          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-charcoal/50
                          border-border-color
                          ${formData.receives_commute_allowance ? "bg-charcoal border-charcoal" : "bg-input-background"}
                        `}
                    >
                      {formData.receives_commute_allowance && (
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
                      htmlFor="payment_commute_allowance"
                      className="text-charcoal cursor-pointer"
                      onClick={() =>
                        handleInputChange(
                          "receives_commute_allowance",
                          !formData.receives_commute_allowance
                        )
                      }
                    >
                      Recebe auxílio moradia?
                    </Label>
                  </div>
                  <p className="text-xs text-muted-foreground sm:col-span-2 -mt-2 mb-1 pl-7">
                    Na folha: US$ 125 por semana, proporcional aos dias do período (pode ser combinado com o benefício acima).
                  </p>

                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      role="checkbox"
                      id="payment_is_registered"
                      aria-checked={formData.is_registered}
                      onClick={() =>
                        handleInputChange("is_registered", !formData.is_registered)
                      }
                      className={`
                          size-4 shrink-0 rounded-[4px] border flex items-center justify-center
                          transition-colors cursor-pointer select-none
                          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-charcoal/50
                          border-border-color
                          ${formData.is_registered ? "bg-charcoal border-charcoal" : "bg-input-background"}
                        `}
                    >
                      {formData.is_registered && (
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
                      htmlFor="payment_is_registered"
                      className="text-charcoal cursor-pointer"
                      onClick={() =>
                        handleInputChange("is_registered", !formData.is_registered)
                      }
                    >
                      É Cadastrado?
                    </Label>
                  </div>
                  <p className="text-xs text-muted-foreground sm:col-span-2 -mt-2 mb-1 pl-7">
                    Marque quando o colaborador estiver formalmente cadastrado conforme o processo de RH.
                  </p>
                </div>
              </div>

              <div className="space-y-3 max-w-3xl">
                <h3 className="text-sm font-semibold text-charcoal">
                  Histórico de valor por hora
                </h3>
                <p className="text-xs text-muted-foreground">
                  Cada alteração em valor ou data de vigência gera um novo registro ao salvar.
                </p>
                <HourlyRateHistoryTable
                  rows={hourlyRateHistory}
                  emptyMessage={
                    mode === "edit"
                      ? "Nenhum histórico ainda. Ao salvar com um valor por hora, o primeiro registro será criado."
                      : "Salve o funcionário com valor por hora para iniciar o histórico."
                  }
                />
              </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
