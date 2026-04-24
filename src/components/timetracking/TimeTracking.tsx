import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Badge } from "../ui/badge";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Textarea } from "../ui/textarea";
import {
  Clock,
  Play,
  Calendar,
  Download,
  MapPin,
  User,
  Plus,
  Loader2,
  Trash2,
  Pencil,
} from "lucide-react";
import { timeEntryService } from "@/services/timeEntryService";
import { employeeService } from "@/services/employeeService";
import type { Employee } from "@/types/employee";
import type { CurrentUser } from "@/types/auth";

interface TimeTrackingProps {
  currentUser: CurrentUser | null;
  onOpenEditEntry: (entryId: string) => void;
  onOpenQuiosque?: () => void;
}

export function TimeTracking({ currentUser, onOpenEditEntry, onOpenQuiosque }: TimeTrackingProps) {
  const isFuncionario = currentUser?.role === "Funcionario";
  const isGerente = currentUser?.role === "Gerente";

  const [entries, setEntries] = useState<any[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [weekSummary, setWeekSummary] = useState({ totalHours: 0, totalDays: 0, averageHours: 0 });
  const [filterEmployee, setFilterEmployee] = useState(isFuncionario ? (currentUser?.employeeId ?? "all") : "all");
  const [filterCompany, setFilterCompany] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // New entry form (Funcionário só pode registrar para si)
  const [newEntry, setNewEntry] = useState({
    employee_id: isFuncionario ? (currentUser?.employeeId ?? "") : "",
    date: new Date().toISOString().split("T")[0],
    clock_in: "07:00",
    clock_out: "16:00",
    break_time: "1",
    project: "",
    notes: "",
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      if (isFuncionario && !currentUser?.employeeId) {
        setEntries([]);
        setEmployees([]);
        setWeekSummary({ totalHours: 0, totalDays: 0, averageHours: 0 });
        setLoading(false);
        return;
      }
      let gerenteNome: string | undefined;
      if (isGerente && currentUser?.employeeId) {
        const gerente = await employeeService.getById(currentUser.employeeId);
        gerenteNome = gerente?.full_name || undefined;
      }
      const gerenteEmployees = isGerente
        ? await employeeService.getAll({ status: "Ativo", supervisor: gerenteNome })
        : [];
      const gerenteEmployeeIds = new Set(gerenteEmployees.map((e) => e.id));
      const employeeFilter = isFuncionario ? currentUser?.employeeId : filterEmployee !== "all" ? filterEmployee : undefined;
      const summaryFilter = isFuncionario ? currentUser?.employeeId : undefined;
      const [entriesData, employeesData, summaryData] = await Promise.all([
        timeEntryService.getAll({ employee_id: employeeFilter }),
        isFuncionario
          ? Promise.resolve([])
          : isGerente
          ? Promise.resolve(gerenteEmployees)
          : employeeService.getAll({ status: "Ativo" }),
        timeEntryService.getWeekSummary(summaryFilter),
      ]);
      const scopedByRole = isGerente
        ? entriesData.filter((entry) => gerenteEmployeeIds.has(entry.employee_id))
        : entriesData;
      const filteredEntries =
        isFuncionario || filterCompany === "all"
          ? scopedByRole
          : scopedByRole.filter((entry) => (entry.employee_factory || "") === filterCompany);
      setEntries(filteredEntries);
      setEmployees(isFuncionario ? [] : employeesData);
      setWeekSummary(summaryData);
    } catch (err) {
      console.error("Erro ao carregar dados:", err);
    } finally {
      setLoading(false);
    }
  }, [filterEmployee, filterCompany, isFuncionario, isGerente, currentUser?.employeeId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreateEntry = async () => {
    if (!newEntry.employee_id) {
      alert("Selecione um funcionario");
      return;
    }
    setSaving(true);
    try {
      await timeEntryService.create({
        employee_id: newEntry.employee_id,
        date: newEntry.date,
        clock_in: newEntry.clock_in || null,
        clock_out: newEntry.clock_out || null,
        break_time: parseFloat(newEntry.break_time) || 0,
        total_hours: 0,
        status: newEntry.clock_out ? "completed" : "active",
        project: newEntry.project || null,
        notes: newEntry.notes || null,
      });
      setDialogOpen(false);
      setNewEntry({
        employee_id: isFuncionario ? (currentUser?.employeeId ?? "") : "",
        date: new Date().toISOString().split("T")[0],
        clock_in: "07:00",
        clock_out: "16:00",
        break_time: "1",
        project: "",
        notes: "",
      });
      fetchData();
    } catch (err) {
      alert("Erro ao criar registro");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Excluir este registro de ponto?")) return;
    try {
      await timeEntryService.delete(id);
      fetchData();
    } catch {
      alert("Erro ao excluir");
    }
  };

  const getInitials = (name: string) =>
    name.split(" ").map((n) => n[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-700 border-green-200">Ativo</Badge>;
      case "completed":
        return <Badge variant="secondary" className="bg-gray-100 text-gray-700">Concluido</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatHours = (hours: number) => {
    if (!hours || hours === 0) return "-";
    return `${hours.toFixed(1)}h`;
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <Card>
          <CardContent className="p-6 text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mx-auto mb-3">
              <User className="h-6 w-6 text-blue-600" />
            </div>
            <p className="text-2xl font-semibold text-charcoal">{isFuncionario ? "1" : employees.length}</p>
            <p className="text-sm text-muted-foreground">{isFuncionario ? "Meus registros" : "Funcionarios ativos"}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg mx-auto mb-3">
              <Play className="h-6 w-6 text-green-600" />
            </div>
            <p className="text-2xl font-semibold text-green-600">
              {entries.filter((e) => e.status === "active").length}
            </p>
            <p className="text-sm text-muted-foreground">Trabalhando agora</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg mx-auto mb-3">
              <Clock className="h-6 w-6 text-purple-600" />
            </div>
            <p className="text-2xl font-semibold text-charcoal">{entries.length}</p>
            <p className="text-sm text-muted-foreground">Registros</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-orange-100 rounded-lg mx-auto mb-3">
              <Calendar className="h-6 w-6 text-orange-600" />
            </div>
            <p className="text-2xl font-semibold text-charcoal">{formatHours(weekSummary.totalHours)}</p>
            <p className="text-sm text-muted-foreground">Horas esta semana</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <CardTitle className="flex items-center gap-2 text-charcoal">
              <Clock className="h-5 w-5" />
              Controle de Ponto
            </CardTitle>
            <div className="flex flex-wrap gap-3">
              <Button
                type="button"
                variant="outline"
                className="border-border-color text-charcoal hover:bg-muted"
                onClick={() => onOpenQuiosque?.()}
              >
                <Clock className="h-4 w-4 mr-2" />
                Bater Ponto
              </Button>
              <Button
                variant="outline"
                className="border-border-color text-charcoal hover:bg-muted"
              >
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>

              <Dialog
                open={dialogOpen}
                onOpenChange={(open) => {
                  setDialogOpen(open);
                  if (open && isFuncionario && currentUser?.employeeId) {
                    setNewEntry((p) => ({ ...p, employee_id: currentUser.employeeId ?? p.employee_id }));
                  }
                }}
              >
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="text-charcoal">Novo Registro de Ponto</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    {!isFuncionario && (
                    <div className="space-y-2">
                      <Label className="text-charcoal">Funcionario *</Label>
                      <Select
                        value={newEntry.employee_id}
                        onValueChange={(v) => setNewEntry((p) => ({ ...p, employee_id: v }))}
                      >
                        <SelectTrigger className="border-border-color">
                          <SelectValue placeholder="Selecionar funcionario" />
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
                      <Label className="text-charcoal">Data</Label>
                      <Input
                        type="date"
                        value={newEntry.date}
                        onChange={(e) => setNewEntry((p) => ({ ...p, date: e.target.value }))}
                        className="border-border-color"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-charcoal">Entrada</Label>
                        <Input
                          type="time"
                          value={newEntry.clock_in}
                          onChange={(e) => setNewEntry((p) => ({ ...p, clock_in: e.target.value }))}
                          className="border-border-color"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-charcoal">Saida</Label>
                        <Input
                          type="time"
                          value={newEntry.clock_out}
                          onChange={(e) => setNewEntry((p) => ({ ...p, clock_out: e.target.value }))}
                          className="border-border-color"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-charcoal">Pausa (horas)</Label>
                      <Input
                        type="number"
                        step="0.5"
                        value={newEntry.break_time}
                        onChange={(e) => setNewEntry((p) => ({ ...p, break_time: e.target.value }))}
                        className="border-border-color"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-charcoal">Projeto</Label>
                      <Input
                        value={newEntry.project}
                        onChange={(e) => setNewEntry((p) => ({ ...p, project: e.target.value }))}
                        className="border-border-color"
                        placeholder="Nome do projeto"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-charcoal">Observacoes</Label>
                      <Textarea
                        value={newEntry.notes}
                        onChange={(e) => setNewEntry((p) => ({ ...p, notes: e.target.value }))}
                        className="border-border-color"
                        placeholder="Notas opcionais"
                      />
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                      <Button
                        variant="outline"
                        onClick={() => setDialogOpen(false)}
                        className="border-border-color"
                      >
                        Cancelar
                      </Button>
                      <Button
                        onClick={handleCreateEntry}
                        disabled={saving}
                        className="bg-charcoal hover:bg-charcoal/90 text-white"
                      >
                        {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                        {saving ? "Salvando..." : "Salvar"}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {!isFuncionario && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label className="text-charcoal">Funcionario</Label>
              <Select value={filterEmployee} onValueChange={setFilterEmployee}>
                <SelectTrigger className="border-border-color focus:border-charcoal">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os funcionarios</SelectItem>
                  {employees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-charcoal">Empresa</Label>
              <Select value={filterCompany} onValueChange={setFilterCompany}>
                <SelectTrigger className="border-border-color focus:border-charcoal">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as empresas</SelectItem>
                  {Array.from(new Set(employees.map((emp) => emp.factory).filter(Boolean))).map((company) => (
                    <SelectItem key={company} value={company as string}>
                      {company}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          )}
        </CardContent>
      </Card>

      {/* Time Entries Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <span className="ml-3 text-muted-foreground">Carregando registros...</span>
            </div>
          ) : entries.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-muted-foreground mb-2">Nenhum registro de ponto encontrado</p>
              <Button onClick={() => setDialogOpen(true)} className="bg-charcoal hover:bg-charcoal/90 text-white">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar primeiro registro
              </Button>
            </div>
          ) : (
            <div className="border border-border-color rounded-lg overflow-x-auto">
              <Table className="min-w-[1000px]">
                <TableHeader>
                  <TableRow className="bg-muted/50 border-border-color">
                    <TableHead className="text-charcoal">Funcionario</TableHead>
                    <TableHead className="text-charcoal">Data</TableHead>
                    <TableHead className="text-charcoal">Entrada</TableHead>
                    <TableHead className="text-charcoal">Saida</TableHead>
                    <TableHead className="text-charcoal">Pausa</TableHead>
                    <TableHead className="text-charcoal">Total</TableHead>
                    <TableHead className="text-charcoal">Status</TableHead>
                    <TableHead className="text-charcoal">Projeto</TableHead>
                    <TableHead className="text-charcoal">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map((entry) => (
                    <TableRow key={entry.id} className="border-border-color hover:bg-muted/30">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-charcoal text-white text-xs">
                              {getInitials(entry.employee_name || "?")}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <span className="font-medium text-charcoal block">
                              {entry.employee_name}
                            </span>
                            {entry.employee_factory && (
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {entry.employee_factory}
                              </span>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {entry.date ? new Date(entry.date + "T00:00:00").toLocaleDateString("pt-BR") : "-"}
                      </TableCell>
                      <TableCell className="font-mono">{entry.clock_in || "-"}</TableCell>
                      <TableCell className="font-mono">
                        {entry.clock_out || (
                          <Badge className="bg-green-100 text-green-700 border-green-200">
                            Em andamento
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>{entry.break_time ? `${entry.break_time}h` : "-"}</TableCell>
                      <TableCell className="font-medium">{formatHours(entry.total_hours)}</TableCell>
                      <TableCell>{getStatusBadge(entry.status)}</TableCell>
                      <TableCell className="max-w-xs">
                        <span className="text-sm truncate block">{entry.project || "-"}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            type="button"
                            className="h-8 w-8 p-0 hover:bg-muted"
                            title="Editar"
                            onClick={() => onOpenEditEntry(entry.id)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            type="button"
                            className="h-8 w-8 p-0 hover:bg-destructive/10 text-destructive"
                            title="Excluir"
                            onClick={() => handleDelete(entry.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Week Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-charcoal">Resumo da Semana</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            <div className="text-center p-4 bg-muted/30 rounded-lg">
              <p className="text-2xl font-semibold text-charcoal">{formatHours(weekSummary.totalHours)}</p>
              <p className="text-sm text-muted-foreground">Total de horas</p>
            </div>
            <div className="text-center p-4 bg-muted/30 rounded-lg">
              <p className="text-2xl font-semibold text-charcoal">{weekSummary.totalDays}</p>
              <p className="text-sm text-muted-foreground">Dias com registro</p>
            </div>
            <div className="text-center p-4 bg-muted/30 rounded-lg">
              <p className="text-2xl font-semibold text-charcoal">{formatHours(weekSummary.averageHours)}</p>
              <p className="text-sm text-muted-foreground">Media por dia</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
