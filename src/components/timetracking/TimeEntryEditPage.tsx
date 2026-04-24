import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Textarea } from "../ui/textarea";
import { Avatar, AvatarFallback } from "../ui/avatar";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Loader2,
  MapPin,
  Save,
  User,
} from "lucide-react";
import { timeEntryService } from "@/services/timeEntryService";
import { employeeService } from "@/services/employeeService";
import type { Employee } from "@/types/employee";
import type { CurrentUser } from "@/types/auth";
import { computeWorkedHours } from "@/lib/timeUtils";
import { useFactories } from "@/contexts/FactoriesContext";

interface TimeEntryEditPageProps {
  timeEntryId: string;
  currentUser: CurrentUser | null;
  onBack: () => void;
  onSaved: () => void;
}

/** Status no formulário (FIGMA: Ativo, Concluído, Em Pausa) */
type FormStatus = "active" | "completed" | "break";

const toTimeInput = (t: string | null | undefined) => {
  if (!t) return "";
  const s = String(t).trim();
  return s.length >= 5 ? s.slice(0, 5) : s;
};

function formStatusFromDb(status: string | undefined): FormStatus {
  const s = (status || "").toLowerCase();
  if (s === "active" || s === "ativo") return "active";
  return "completed";
}

function formStatusToApi(s: FormStatus): "active" | "completed" {
  if (s === "completed") return "completed";
  return "active";
}

export function TimeEntryEditPage({
  timeEntryId,
  currentUser,
  onBack,
  onSaved,
}: TimeEntryEditPageProps) {
  const isFuncionario = currentUser?.role === "Funcionario";
  const { factories } = useFactories();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [localFactoryId, setLocalFactoryId] = useState<string>("");
  const didInitFactory = useRef(false);

  const [form, setForm] = useState({
    id: "",
    employee_id: "",
    date: "",
    clock_in: "",
    clock_out: "",
    break_time: "0",
    project: "",
    notes: "",
    status: "completed" as FormStatus,
  });

  const [meta, setMeta] = useState({
    employee_name: "",
    employee_factory: "",
  });

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase();

  const load = useCallback(async () => {
    setLoadError(null);
    setLoading(true);
    try {
      const [entry, emps] = await Promise.all([
        timeEntryService.getById(timeEntryId),
        isFuncionario ? Promise.resolve([]) : employeeService.getAll({ status: "Ativo" }),
      ]);
      if (!entry) {
        setLoadError("Registro não encontrado.");
        return;
      }
      if (isFuncionario && currentUser?.employeeId && entry.employee_id !== currentUser.employeeId) {
        setLoadError("Você não tem permissão para editar este registro.");
        return;
      }
      const rawDate = entry.date;
      const dateStr = rawDate?.includes("T") ? rawDate.split("T")[0] : rawDate;
      setForm({
        id: entry.id,
        employee_id: entry.employee_id,
        date: dateStr || "",
        clock_in: toTimeInput(entry.clock_in),
        clock_out: toTimeInput(entry.clock_out),
        break_time: entry.break_time != null ? String(entry.break_time) : "0",
        project: entry.project || "",
        notes: entry.notes || "",
        status: formStatusFromDb(entry.status),
      });
      setMeta({
        employee_name: entry.employee_name || "",
        employee_factory: entry.employee_factory || "",
      });
      setEmployees(emps);
    } catch (e) {
      console.error(e);
      setLoadError("Erro ao carregar o registro.");
    } finally {
      setLoading(false);
    }
  }, [timeEntryId, isFuncionario, currentUser?.employeeId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    didInitFactory.current = false;
  }, [form.employee_id, timeEntryId]);

  useEffect(() => {
    if (loading || !factories.length || !form.employee_id) return;
    if (didInitFactory.current) return;
    didInitFactory.current = true;
    const emp = employees.find((e) => e.id === form.employee_id);
    const label = (emp?.factory || meta.employee_factory || "").trim();
    if (!label) {
      setLocalFactoryId(factories[0]?.id ?? "");
      return;
    }
    const found = factories.find(
      (f) =>
        label.includes(f.code) ||
        label.includes(f.name) ||
        `${f.name} · ${f.code}` === label
    );
    setLocalFactoryId(found?.id ?? factories[0]?.id ?? "");
  }, [loading, factories, form.employee_id, employees, meta.employee_factory]);

  const selectedEmployeeLabel = useMemo(() => {
    if (isFuncionario) return meta.employee_name;
    const emp = employees.find((e) => e.id === form.employee_id);
    return emp?.full_name || meta.employee_name || "—";
  }, [employees, form.employee_id, isFuncionario, meta.employee_name]);

  const factoryLine = useMemo(() => {
    const f = factories.find((x) => x.id === localFactoryId);
    if (f) return `${f.name} · ${f.code}`;
    return meta.employee_factory || "—";
  }, [factories, localFactoryId, meta.employee_factory]);

  const previewTotal = useMemo(() => {
    const br = parseFloat(form.break_time.replace(",", ".")) || 0;
    return computeWorkedHours(form.clock_in, form.clock_out, br);
  }, [form.break_time, form.clock_in, form.clock_out]);

  const handleSave = async () => {
    if (!form.id) return;
    if (!form.employee_id) {
      alert("Selecione um funcionário");
      return;
    }
    setSaving(true);
    try {
      const apiStatus = formStatusToApi(form.status);
      await timeEntryService.update(form.id, {
        employee_id: form.employee_id,
        date: form.date,
        clock_in: form.clock_in || null,
        clock_out: form.status === "active" ? null : form.clock_out || null,
        break_time: parseFloat(form.break_time.replace(",", ".")) || 0,
        project: form.project || null,
        notes: form.notes || null,
        status: apiStatus,
      });
      onSaved();
    } catch {
      alert("Erro ao atualizar registro");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-3 text-muted-foreground">Carregando registro...</span>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="space-y-4">
        <Button type="button" variant="ghost" className="gap-2 -ml-2 text-charcoal hover:bg-muted" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <p className="text-destructive">{loadError}</p>
      </div>
    );
  }

  const inputClass =
    "border-border-color focus:border-charcoal bg-input-background";
  const selectTriggerClass = "border-border-color focus:border-charcoal bg-input-background";

  return (
    <div className="space-y-6">
      {/* Header — alinhado ao FIGMA TimeEntryForm */}
      <div className="flex items-center gap-4 flex-wrap">
        <Button type="button" variant="ghost" onClick={onBack} className="text-charcoal hover:bg-muted shrink-0">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold text-charcoal">Editar Registro de Ponto</h1>
          <p className="text-sm text-muted-foreground">Atualize as informações do registro de ponto</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="border-border-color">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-charcoal">
                <Clock className="h-5 w-5 shrink-0" />
                Informações do Registro
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {isFuncionario ? (
                  <div className="space-y-2">
                    <Label className="text-charcoal">
                      <User className="h-4 w-4 inline mr-1 align-text-bottom" />
                      Funcionário
                    </Label>
                    <div className="flex h-9 w-full items-center rounded-md border border-border-color bg-input-background px-3 text-sm text-charcoal">
                      {selectedEmployeeLabel}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="employee" className="text-charcoal">
                      <User className="h-4 w-4 inline mr-1 align-text-bottom" />
                      Funcionário
                    </Label>
                    <Select
                      value={form.employee_id}
                      onValueChange={(v) => setForm((p) => ({ ...p, employee_id: v }))}
                    >
                      <SelectTrigger id="employee" className={selectTriggerClass}>
                        <SelectValue placeholder="Selecione o funcionário" />
                      </SelectTrigger>
                      <SelectContent>
                        {employees.map((emp) => (
                          <SelectItem key={emp.id} value={emp.id}>
                            {emp.full_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="local" className="text-charcoal">
                    <MapPin className="h-4 w-4 inline mr-1 align-text-bottom" />
                    Local
                  </Label>
                  <Select
                    value={localFactoryId || undefined}
                    onValueChange={setLocalFactoryId}
                    disabled={factories.length === 0}
                  >
                    <SelectTrigger id="local" className={selectTriggerClass}>
                      <SelectValue placeholder={factories.length ? "Selecione o local" : "Carregando locais..."} />
                    </SelectTrigger>
                    <SelectContent>
                      {factories.map((f) => (
                        <SelectItem key={f.id} value={f.id}>
                          {f.name} · {f.code}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date" className="text-charcoal">
                      <Calendar className="h-4 w-4 inline mr-1 align-text-bottom" />
                      Data
                    </Label>
                    <Input
                      id="date"
                      type="date"
                      value={form.date}
                      onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
                      className={`${inputClass} font-sans`}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status" className="text-charcoal">
                      Status
                    </Label>
                    <Select
                      value={form.status}
                      onValueChange={(v) => setForm((p) => ({ ...p, status: v as FormStatus }))}
                    >
                      <SelectTrigger id="status" className={selectTriggerClass}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Ativo</SelectItem>
                        <SelectItem value="completed">Concluído</SelectItem>
                        <SelectItem value="break">Em Pausa</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="clock_in" className="text-charcoal">
                      <Clock className="h-4 w-4 inline mr-1 align-text-bottom" />
                      Entrada
                    </Label>
                    <Input
                      id="clock_in"
                      type="time"
                      value={form.clock_in}
                      onChange={(e) => setForm((p) => ({ ...p, clock_in: e.target.value }))}
                      className={`${inputClass} font-mono`}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="clock_out" className="text-charcoal">
                      <Clock className="h-4 w-4 inline mr-1 align-text-bottom" />
                      Saída
                    </Label>
                    <Input
                      id="clock_out"
                      type="time"
                      value={form.clock_out}
                      onChange={(e) => setForm((p) => ({ ...p, clock_out: e.target.value }))}
                      className={`${inputClass} font-mono`}
                      disabled={form.status === "active"}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="break_time" className="text-charcoal">
                      Pausa (horas)
                    </Label>
                    <Input
                      id="break_time"
                      type="number"
                      step="0.5"
                      min={0}
                      value={form.break_time}
                      onChange={(e) => setForm((p) => ({ ...p, break_time: e.target.value }))}
                      className={inputClass}
                      placeholder="0.0"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="project" className="text-charcoal">
                    Projeto
                  </Label>
                  <Input
                    id="project"
                    value={form.project}
                    onChange={(e) => setForm((p) => ({ ...p, project: e.target.value }))}
                    className={inputClass}
                    placeholder="Nome do projeto ou atividade"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes" className="text-charcoal">
                    Observações
                  </Label>
                  <Textarea
                    id="notes"
                    value={form.notes}
                    onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                    className={`${inputClass} min-h-[100px]`}
                    placeholder="Adicione observações sobre o registro de ponto..."
                  />
                </div>

                <div className="flex flex-wrap gap-3 pt-4 border-t border-border-color">
                  <Button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-charcoal hover:bg-charcoal/90 text-white"
                  >
                    {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                    {saving ? "Salvando..." : "Salvar alterações"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onBack}
                    className="border-border-color text-charcoal hover:bg-muted"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-border-color">
            <CardHeader>
              <CardTitle className="text-charcoal">Funcionário</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-charcoal text-white">{getInitials(selectedEmployeeLabel)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="font-medium text-charcoal truncate">{selectedEmployeeLabel}</p>
                  <p className="text-sm text-muted-foreground truncate">{factoryLine}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border-color">
            <CardHeader>
              <CardTitle className="text-charcoal">Resumo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Entrada</span>
                  <span className="font-mono font-medium text-charcoal">{form.clock_in || "--:--"}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Saída</span>
                  <span className="font-mono font-medium text-charcoal">
                    {form.status === "active" ? "Em andamento" : form.clock_out || "--:--"}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Pausa</span>
                  <span className="font-medium text-charcoal">
                    {form.break_time ? `${form.break_time}h` : "0.0h"}
                  </span>
                </div>
                <div className="border-t border-border-color pt-2 mt-2">
                  <div className="flex justify-between items-baseline">
                    <span className="font-medium text-charcoal">Total</span>
                    <span className="text-lg font-semibold text-charcoal">{previewTotal.toFixed(1)}h</span>
                  </div>
                </div>
              </div>

              {form.status === "active" && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-sm text-green-700">
                    <Clock className="h-4 w-4 inline mr-1 align-text-bottom" />
                    Registro em andamento
                  </p>
                </div>
              )}

              {form.status === "break" && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <p className="text-sm text-amber-800">Em pausa</p>
                </div>
              )}

              {form.status === "completed" && form.clock_in && form.clock_out && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-700">Registro concluído</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
