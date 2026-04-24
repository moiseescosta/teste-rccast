import { useState, useEffect, useCallback } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Badge } from "../ui/badge";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Search, Plus, Download, Eye, Pencil, Trash2, Loader2 } from "lucide-react";
import { employeeService } from "@/services/employeeService";
import type { Employee } from "@/types/employee";
import type { CurrentUser } from "@/types/auth";

interface EmployeeListProps {
  onViewProfile: (id: string) => void;
  onCreateNew: () => void;
  onEdit: (id: string) => void;
  currentUser: CurrentUser | null;
}

export function EmployeeList({ onViewProfile, onCreateNew, onEdit, currentUser }: EmployeeListProps) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [departmentFilter, setDepartmentFilter] = useState("Todos");
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0, departments: [] as string[], factories: [] as string[] });
  const [previewMode, setPreviewMode] = useState(false);

  const isPreviewConnectionError = (msg: string) =>
    /Failed to fetch|fetch failed|NetworkError|placeholder\.supabase/i.test(msg);

  const fetchEmployees = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setPreviewMode(false);
      let managerName: string | undefined = undefined;
      if (currentUser?.role === "Gerente" && currentUser.employeeId) {
        const manager = await employeeService.getById(currentUser.employeeId);
        managerName = manager?.full_name || undefined;
      }
      const [data, statsData] = await Promise.all([
        employeeService.getAll({
          search: search || undefined,
          status: statusFilter,
          department: departmentFilter,
          supervisor: managerName,
        }),
        employeeService.getStats(),
      ]);
      setEmployees(data);
      if (currentUser?.role === "Gerente") {
        setStats({
          total: data.length,
          active: data.filter((e) => e.status === "Ativo").length,
          inactive: data.filter((e) => e.status === "Inativo").length,
          departments: [...new Set(data.map((e) => e.department).filter(Boolean))] as string[],
          factories: [...new Set(data.map((e) => e.factory).filter(Boolean))] as string[],
        });
      } else {
        setStats(statsData);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao carregar funcionarios";
      if (isPreviewConnectionError(msg)) {
        setPreviewMode(true);
        setEmployees([]);
        setStats({ total: 0, active: 0, inactive: 0, departments: [], factories: [] });
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, departmentFilter, currentUser?.role, currentUser?.employeeId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchEmployees();
    }, search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [fetchEmployees, search]);

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Tem certeza que deseja excluir ${name}?`)) return;
    try {
      await employeeService.delete(id);
      fetchEmployees();
    } catch (err) {
      alert("Erro ao excluir funcionario");
    }
  };

  const getInitials = (name: string) => {
    return name.split(" ").map((n) => n[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Ativo":
        return <Badge className="bg-green-100 text-green-700 border-green-200">Ativo</Badge>;
      case "Inativo":
        return <Badge variant="secondary" className="bg-gray-100 text-gray-700 border-gray-200">Inativo</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8">
      {previewMode && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs sm:text-sm text-amber-800">
          Modo preview — dados não conectados. Configure Supabase no .env para ver dados reais.
        </div>
      )}
      {/* Header with Actions + Filters - área isolada para não ser coberta pela tabela */}
      <div className="relative z-10">
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <CardTitle className="text-charcoal text-base sm:text-lg">Funcionarios</CardTitle>
              <div className="flex gap-2 sm:gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-border-color text-charcoal hover:bg-muted text-xs sm:text-sm"
                >
                  <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                  <span className="hidden sm:inline">Exportar</span>
                </Button>
                <Button
                  size="sm"
                  className="bg-charcoal hover:bg-charcoal/90 text-white text-xs sm:text-sm"
                  onClick={onCreateNew}
                >
                  <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                  <span className="hidden sm:inline">Novo funcionario</span>
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0 pb-4 sm:pb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="relative sm:col-span-2 lg:col-span-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar funcionarios..."
                  className="pl-10 border-border-color focus:border-charcoal"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="border-border-color focus:border-charcoal">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Todos">Todos os status</SelectItem>
                  <SelectItem value="Ativo">Ativo</SelectItem>
                  <SelectItem value="Inativo">Inativo</SelectItem>
                </SelectContent>
              </Select>

              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger className="border-border-color focus:border-charcoal">
                  <SelectValue placeholder="Departamento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Todos">Todos os departamentos</SelectItem>
                  {stats.departments.map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select>
                <SelectTrigger className="border-border-color focus:border-charcoal">
                  <SelectValue placeholder="Fabrica" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as fabricas</SelectItem>
                  {stats.factories.map((f) => (
                    <SelectItem key={f} value={f}>
                      {f}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Employees Table - abaixo da área de filtros, sem sobrepor */}
      <Card className="relative z-0">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-10 sm:py-16 px-3">
              <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-muted-foreground shrink-0" />
              <span className="ml-2 sm:ml-3 text-sm sm:text-base text-muted-foreground">Carregando funcionarios...</span>
            </div>
          ) : error ? (
            <div className="text-center py-10 sm:py-16 px-3">
              <p className="text-destructive text-sm sm:text-base mb-3">{error}</p>
              <Button variant="outline" size="sm" onClick={fetchEmployees}>
                Tentar novamente
              </Button>
            </div>
          ) : employees.length === 0 ? (
            <div className="text-center py-10 sm:py-16 px-3">
              <p className="text-muted-foreground text-sm mb-3">Nenhum funcionario encontrado</p>
              <Button onClick={onCreateNew} className="bg-charcoal hover:bg-charcoal/90 text-white text-sm sm:text-base" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar primeiro funcionario
              </Button>
            </div>
          ) : (
            <div className="border-0 sm:border border-border-color rounded-none sm:rounded-lg overflow-x-auto -mx-px sm:mx-0">
              <Table className="min-w-[560px] sm:min-w-[760px]">
                <TableHeader>
                  <TableRow className="bg-muted/50 border-border-color">
                    <TableHead className="text-charcoal text-xs sm:text-sm py-2 sm:py-3 px-2 sm:px-4">Funcionario</TableHead>
                    <TableHead className="text-charcoal text-xs sm:text-sm py-2 sm:py-3 px-2 sm:px-4 hidden md:table-cell">E-mail</TableHead>
                    <TableHead className="text-charcoal text-xs sm:text-sm py-2 sm:py-3 px-2 sm:px-4 hidden lg:table-cell">Fabrica/Obra</TableHead>
                    <TableHead className="text-charcoal text-xs sm:text-sm py-2 sm:py-3 px-2 sm:px-4 hidden md:table-cell">Setor</TableHead>
                    <TableHead className="text-charcoal text-xs sm:text-sm py-2 sm:py-3 px-2 sm:px-4">Status</TableHead>
                    <TableHead className="text-charcoal text-xs sm:text-sm py-2 sm:py-3 px-2 sm:px-4">Valor/hora</TableHead>
                    <TableHead className="text-charcoal text-xs sm:text-sm py-2 sm:py-3 px-2 sm:px-4 w-[80px] sm:w-auto">Acoes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employees.map((employee) => (
                    <TableRow key={employee.id} className="border-border-color hover:bg-muted/30">
                      <TableCell className="py-2 sm:py-3 px-2 sm:px-4">
                        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                          <Avatar className="w-7 h-7 sm:w-8 sm:h-8 shrink-0">
                            <AvatarFallback className="bg-charcoal text-white text-xs">
                              {getInitials(employee.full_name)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium text-charcoal text-sm truncate">{employee.full_name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs sm:text-sm py-2 sm:py-3 px-2 sm:px-4 hidden md:table-cell">{employee.email}</TableCell>
                      <TableCell className="text-xs sm:text-sm py-2 sm:py-3 px-2 sm:px-4 hidden lg:table-cell">{employee.factory || "-"}</TableCell>
                      <TableCell className="text-xs sm:text-sm py-2 sm:py-3 px-2 sm:px-4 hidden md:table-cell">{employee.department || "-"}</TableCell>
                      <TableCell className="py-2 sm:py-3 px-2 sm:px-4">{getStatusBadge(employee.status)}</TableCell>
                      <TableCell className="font-medium text-xs sm:text-sm py-2 sm:py-3 px-2 sm:px-4">
                        {employee.hourly_rate ? `US$ ${Number(employee.hourly_rate).toFixed(2)}/h` : "-"}
                      </TableCell>
                      <TableCell className="py-2 sm:py-3 px-2 sm:px-4">
                        <div className="flex items-center gap-0.5 sm:gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="hover:bg-muted"
                            onClick={() => onViewProfile(employee.id)}
                            title="Visualizar perfil"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="hover:bg-muted"
                            onClick={() => onEdit(employee.id)}
                            title="Editar perfil"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="hover:bg-destructive/10 text-destructive"
                            onClick={() => handleDelete(employee.id, employee.full_name)}
                            title="Excluir"
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

      {/* Summary Stats - mobile: 2x2, sm+: 4 cols */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
        <Card>
          <CardContent className="p-3 sm:p-4 text-center">
            <p className="text-xl sm:text-2xl font-semibold text-charcoal">{stats.total}</p>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">Total de funcionarios</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4 text-center">
            <p className="text-xl sm:text-2xl font-semibold text-green-600">{stats.active}</p>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">Ativos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4 text-center">
            <p className="text-xl sm:text-2xl font-semibold text-gray-600">{stats.inactive}</p>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">Inativos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4 text-center">
            <p className="text-xl sm:text-2xl font-semibold text-blue-600">{stats.departments.length}</p>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">Departamentos</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
