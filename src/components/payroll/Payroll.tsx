import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { employeeService } from "@/services/employeeService";
import type { Employee } from "@/types/employee";
import type { CurrentUser } from "@/types/auth";
import { payrollService, getPayrollPeriodBounds } from "@/services/payrollService";
import { timeEntryService } from "@/services/timeEntryService";
import {
  buildHoursByDateForEmployee,
  countQualifyingDaysOutsideCity,
  housingAllowanceForPeriod,
  outsideCityBonusUsd,
} from "@/lib/payrollBenefits";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Badge } from "../ui/badge";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { PayrollEditDialog, type PayrollEntry } from "./PayrollEditDialog";
import { 
  DollarSign, 
  Calendar, 
  Download, 
  Eye, 
  FileText,
  Calculator,
  Clock,
  TrendingUp,
  AlertCircle,
  Pencil,
} from "lucide-react";

interface PayrollProps {
  currentUser: CurrentUser | null;
}

/** Soma horas trabalhadas no período (fallback da folha quando não há `payroll_entries` no banco). */
function sumWorkedHoursForEmployee(
  entries: Awaited<ReturnType<typeof timeEntryService.getAll>>,
  employeeId: string
): number {
  const total = entries
    .filter((e) => e.employee_id === employeeId)
    .reduce((acc, e) => acc + Number(e.total_hours ?? 0), 0);
  return Math.round(total * 100) / 100;
}

export function Payroll({ currentUser }: PayrollProps) {
  const [selectedPeriod, setSelectedPeriod] = useState("current");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [editingEntry, setEditingEntry] = useState<PayrollEntry | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [payrollEntriesDb, setPayrollEntriesDb] = useState<any[]>([]);
  const [managerName, setManagerName] = useState<string>("");
  const [periodTimeEntries, setPeriodTimeEntries] = useState<
    Awaited<ReturnType<typeof timeEntryService.getAll>>
  >([]);

  const isFuncionario = currentUser?.role === "Funcionario";
  const isGerente = currentUser?.role === "Gerente";

  useEffect(() => {
    let mounted = true;
    setLoadingEmployees(true);
    employeeService
      .getAll()
      .then((rows) => {
        if (mounted) setEmployees(rows);
      })
      .catch(() => {
        if (mounted) setEmployees([]);
      })
      .finally(() => {
        if (mounted) setLoadingEmployees(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isGerente || !currentUser?.employeeId) {
      setManagerName("");
      return;
    }
    employeeService
      .getById(currentUser.employeeId)
      .then((emp) => setManagerName(emp?.full_name || ""))
      .catch(() => setManagerName(""));
  }, [isGerente, currentUser?.employeeId]);

  useEffect(() => {
    payrollService
      .getEntries(
        selectedPeriod as "current" | "previous" | "custom",
        selectedStatus,
        isFuncionario ? currentUser?.employeeId : undefined
      )
      .then(setPayrollEntriesDb)
      .catch(() => setPayrollEntriesDb([]));
  }, [selectedPeriod, selectedStatus, isFuncionario, currentUser?.employeeId]);

  const periodBounds = useMemo(
    () => getPayrollPeriodBounds(selectedPeriod as "current" | "previous" | "custom"),
    [selectedPeriod]
  );

  useEffect(() => {
    let mounted = true;
    timeEntryService
      .getAll({ date_from: periodBounds.startDate, date_to: periodBounds.endDate })
      .then((rows) => {
        if (mounted) setPeriodTimeEntries(rows);
      })
      .catch(() => {
        if (mounted) setPeriodTimeEntries([]);
      });
    return () => {
      mounted = false;
    };
  }, [periodBounds.startDate, periodBounds.endDate]);

  const scopedEmployees = isGerente
    ? employees.filter((emp) => (emp.supervisor || "").trim() === managerName.trim())
    : employees;

  const monthLabel =
    selectedPeriod === "previous"
      ? "Mês anterior"
      : selectedPeriod === "custom"
      ? "Período personalizado"
      : "Mês atual";

  const payrollEntries = useMemo(() => {
    const computeBenefits = (
      employeeId: string,
      rawSameCity: boolean | null | undefined,
      receivesHousing: boolean | null | undefined
    ) => {
      const livesOutside = !(rawSameCity ?? true);
      let qualifyingDays = 0;
      let benefitOutside = 0;
      if (livesOutside) {
        const hoursByDate = buildHoursByDateForEmployee(
          periodTimeEntries,
          employeeId,
          periodBounds.startDate,
          periodBounds.endDate
        );
        qualifyingDays = countQualifyingDaysOutsideCity(
          hoursByDate,
          periodBounds.startDate,
          periodBounds.endDate
        );
        benefitOutside = outsideCityBonusUsd(qualifyingDays);
      }
      const benefitHousing = receivesHousing
        ? housingAllowanceForPeriod(periodBounds.start, periodBounds.end)
        : 0;
      return {
        benefitOutsideCityAmount: benefitOutside,
        benefitHousingAmount: benefitHousing,
        qualifyingDaysOutsideCity: qualifyingDays,
      };
    };

    type Row = PayrollEntry & {
      grossPay: number;
      netPay: number;
      regularPay: number;
      overtimePay: number;
      benefitOutsideCityAmount: number;
      benefitHousingAmount: number;
      qualifyingDaysOutsideCity: number;
      employeeId?: string;
    };

    const rawFallback: Row[] = scopedEmployees
      .filter((emp) =>
        isFuncionario && currentUser?.employeeId ? emp.id === currentUser.employeeId : true
      )
      .map((emp, index) => {
        const regularHours = sumWorkedHoursForEmployee(periodTimeEntries, emp.id);
        const overtimeHours = 0;
        const hourlyRate = Number(emp.hourly_rate || 0);
        const bonuses = 0;
        const deductions = 0;
        const regularPay = regularHours * hourlyRate;
        const overtimePay = overtimeHours * hourlyRate * 1.5;
        const b = computeBenefits(emp.id, emp.same_city, emp.receives_commute_allowance ?? false);
        const grossPay = regularPay + overtimePay + bonuses + b.benefitOutsideCityAmount + b.benefitHousingAmount;
        const netPay = grossPay - deductions;
        const status = emp.status === "Inativo" ? "draft" : "processed";

        return {
          id: index + 1,
          employeeId: emp.id,
          employee: emp.full_name,
          employeeInitials: emp.full_name
            .split(" ")
            .map((n) => n[0])
            .filter(Boolean)
            .slice(0, 2)
            .join("")
            .toUpperCase(),
          factory: emp.factory ? `${emp.factory}` : "-",
          period: monthLabel,
          regularHours,
          overtimeHours,
          hourlyRate,
          regularPay,
          overtimePay,
          bonuses,
          deductions,
          grossPay,
          netPay,
          status,
          payDate: new Date().toISOString().slice(0, 10),
          benefitsOutsideCity: !(emp.same_city ?? true),
          receivesHousingAllowance: emp.receives_commute_allowance ?? false,
          benefitOutsideCityAmount: b.benefitOutsideCityAmount,
          benefitHousingAmount: b.benefitHousingAmount,
          qualifyingDaysOutsideCity: b.qualifyingDaysOutsideCity,
        };
      })
      .filter((entry) => (selectedStatus === "all" ? true : entry.status === selectedStatus));

    if (payrollEntriesDb.length > 0) {
      return payrollEntriesDb
        .filter(
          (row) =>
            !isGerente || (row.employees?.supervisor || row.supervisor || "") === managerName
        )
        .map((row) => {
          const regularPay =
            Number(row.regular_hours || 0) * Number(row.hourly_rate || 0);
          const overtimePay =
            Number(row.overtime_hours || 0) *
            Number(row.hourly_rate || 0) *
            Number(row.overtime_multiplier || 1.5);
          const bonuses = Number(row.bonuses || 0);
          const deductions = Number(row.deductions || 0);
          const b = computeBenefits(
            row.employee_id,
            row.employees?.same_city,
            row.employees?.receives_commute_allowance ?? false
          );
          const grossPay =
            regularPay + overtimePay + bonuses + b.benefitOutsideCityAmount + b.benefitHousingAmount;
          const netPay = grossPay - deductions;

          return {
            id: Number(String(row.id).replace(/\D/g, "").slice(0, 8)) || 0,
            employeeId: row.employee_id,
            employee: row.employees?.full_name || "Funcionário",
            employeeInitials: (row.employees?.full_name || "FN")
              .split(" ")
              .map((n: string) => n[0])
              .filter(Boolean)
              .slice(0, 2)
              .join("")
              .toUpperCase(),
            factory: row.employees?.factory || "-",
            period: monthLabel,
            regularHours: Number(row.regular_hours || 0),
            overtimeHours: Number(row.overtime_hours || 0),
            hourlyRate: Number(row.hourly_rate || 0),
            regularPay,
            overtimePay,
            bonuses,
            deductions,
            grossPay,
            netPay,
            status: row.status || "draft",
            payDate: row.pay_date || new Date().toISOString().slice(0, 10),
            benefitsOutsideCity: !(row.employees?.same_city ?? true),
            receivesHousingAllowance: row.employees?.receives_commute_allowance ?? false,
            benefitOutsideCityAmount: b.benefitOutsideCityAmount,
            benefitHousingAmount: b.benefitHousingAmount,
            qualifyingDaysOutsideCity: b.qualifyingDaysOutsideCity,
          } as Row;
        });
    }

    return rawFallback;
  }, [
    payrollEntriesDb,
    scopedEmployees,
    isFuncionario,
    currentUser?.employeeId,
    monthLabel,
    selectedStatus,
    isGerente,
    managerName,
    periodTimeEntries,
    periodBounds.startDate,
    periodBounds.endDate,
    periodBounds.start,
    periodBounds.end,
  ]);

  const summary = isFuncionario
    ? payrollEntries.length > 0
      ? {
          totalEmployees: 1,
          totalGrossPay: payrollEntries.reduce((s, e) => s + e.grossPay, 0),
          totalNetPay: payrollEntries.reduce((s, e) => s + e.netPay, 0),
          totalDeductions: payrollEntries.reduce((s, e) => s + (e.grossPay - e.netPay), 0),
          totalBonuses: payrollEntries.reduce(
            (s, e) =>
              s +
              e.bonuses +
              (e.benefitOutsideCityAmount ?? 0) +
              (e.benefitHousingAmount ?? 0),
            0
          ),
          totalStoredBonuses: payrollEntries.reduce((s, e) => s + e.bonuses, 0),
          totalBenefitOutsideCity: payrollEntries.reduce(
            (s, e) => s + (e.benefitOutsideCityAmount ?? 0),
            0
          ),
          totalBenefitHousing: payrollEntries.reduce(
            (s, e) => s + (e.benefitHousingAmount ?? 0),
            0
          ),
          totalRegularPay: payrollEntries.reduce((s, e) => s + (e.regularPay ?? 0), 0),
          totalOvertimePay: payrollEntries.reduce((s, e) => s + (e.overtimePay ?? 0), 0),
          totalRegularHours: payrollEntries.reduce((s, e) => s + e.regularHours, 0),
          totalOvertimeHours: payrollEntries.reduce((s, e) => s + e.overtimeHours, 0),
          averageHourlyRate: payrollEntries[0]?.hourlyRate ?? 0,
        }
      : {
          totalEmployees: 0,
          totalGrossPay: 0,
          totalNetPay: 0,
          totalDeductions: 0,
          totalBonuses: 0,
          totalStoredBonuses: 0,
          totalBenefitOutsideCity: 0,
          totalBenefitHousing: 0,
          totalRegularPay: 0,
          totalOvertimePay: 0,
          totalRegularHours: 0,
          totalOvertimeHours: 0,
          averageHourlyRate: 0,
        }
    : {
        totalEmployees: payrollEntries.length,
        totalGrossPay: payrollEntries.reduce((s, e) => s + e.grossPay, 0),
        totalNetPay: payrollEntries.reduce((s, e) => s + e.netPay, 0),
        totalDeductions: payrollEntries.reduce((s, e) => s + (e.grossPay - e.netPay), 0),
        totalBonuses: payrollEntries.reduce(
          (s, e) =>
            s +
            e.bonuses +
            (e.benefitOutsideCityAmount ?? 0) +
            (e.benefitHousingAmount ?? 0),
          0
        ),
        totalStoredBonuses: payrollEntries.reduce((s, e) => s + e.bonuses, 0),
        totalBenefitOutsideCity: payrollEntries.reduce(
          (s, e) => s + (e.benefitOutsideCityAmount ?? 0),
          0
        ),
        totalBenefitHousing: payrollEntries.reduce((s, e) => s + (e.benefitHousingAmount ?? 0), 0),
        totalRegularPay: payrollEntries.reduce((s, e) => s + (e.regularPay ?? 0), 0),
        totalOvertimePay: payrollEntries.reduce((s, e) => s + (e.overtimePay ?? 0), 0),
        totalRegularHours: payrollEntries.reduce((s, e) => s + e.regularHours, 0),
        totalOvertimeHours: payrollEntries.reduce((s, e) => s + e.overtimeHours, 0),
        averageHourlyRate:
          payrollEntries.length > 0
            ? payrollEntries.reduce((s, e) => s + e.hourlyRate, 0) / payrollEntries.length
            : 0,
      };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "processed":
        return <Badge className="bg-green-100 text-green-700 border-green-200">Processada</Badge>;
      case "pending":
        return <Badge className="bg-orange-100 text-orange-700 border-orange-200">Pendente</Badge>;
      case "draft":
        return <Badge variant="secondary" className="bg-gray-100 text-gray-700">Rascunho</Badge>;
      case "approved":
        return <Badge className="bg-blue-100 text-blue-700 border-blue-200">Aprovada</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const calculateTaxRate = (grossPay: number) => {
    return ((grossPay - (grossPay * 0.92)) / grossPay * 100).toFixed(1);
  };

  // Somente Admin/Gerente podem editar folha
  if (!isFuncionario && editOpen && editingEntry) {
    return (
      <PayrollEditDialog
        open={editOpen}
        entry={editingEntry}
        onOpenChange={setEditOpen}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Folha Total (Bruto)</p>
                <p className="text-2xl font-semibold text-charcoal">
                  {formatCurrency(summary.totalGrossPay)}
                </p>
                <div className="flex items-center mt-1">
                  <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                  <span className="text-sm text-green-600">+8.2%</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Folha Total (Líquido)</p>
                <p className="text-2xl font-semibold text-charcoal">
                  {formatCurrency(summary.totalNetPay)}
                </p>
                <div className="flex items-center mt-1">
                  <span className="text-sm text-muted-foreground">
                    ~{calculateTaxRate(summary.totalGrossPay)}% deduções
                  </span>
                </div>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Calculator className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total de Horas</p>
                <p className="text-2xl font-semibold text-charcoal">
                  {summary.totalRegularHours + summary.totalOvertimeHours}h
                </p>
                <div className="flex items-center mt-1">
                  <span className="text-sm text-orange-600">
                    {summary.totalOvertimeHours}h extras
                  </span>
                </div>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Clock className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Rate Médio</p>
                <p className="text-2xl font-semibold text-charcoal">
                  {formatCurrency(summary.averageHourlyRate)}/h
                </p>
                <div className="flex items-center mt-1">
                  <span className="text-sm text-muted-foreground">
                    {summary.totalEmployees} funcionários
                  </span>
                </div>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <FileText className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <CardTitle className="flex items-center gap-2 text-charcoal">
              <DollarSign className="h-5 w-5" />
              Folha de Pagamento
            </CardTitle>
            <div className="flex flex-wrap gap-3">
              <Button 
                variant="outline"
                className="border-border-color text-charcoal hover:bg-muted"
              >
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
              {!isFuncionario && (
                <>
                  <Button 
                    variant="outline"
                    className="border-border-color text-charcoal hover:bg-muted"
                  >
                    <Calculator className="h-4 w-4 mr-2" />
                    Calcular Folha
                  </Button>
                  <Button className="bg-charcoal hover:bg-charcoal/90 text-white">
                    <FileText className="h-4 w-4 mr-2" />
                    Processar Pagamento
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {!isFuncionario && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="period" className="text-charcoal">Periodo</Label>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="border-border-color focus:border-charcoal">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="current">Janeiro 2024</SelectItem>
                  <SelectItem value="previous">Dezembro 2023</SelectItem>
                  <SelectItem value="custom">Período personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="status" className="text-charcoal">Status</Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="border-border-color focus:border-charcoal">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="draft">Rascunho</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="approved">Aprovada</SelectItem>
                  <SelectItem value="processed">Processada</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="factory" className="text-charcoal">Local</Label>
              <Select defaultValue="all">
                <SelectTrigger className="border-border-color focus:border-charcoal">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os locais</SelectItem>
                  <SelectItem value="pc001">Petrochemical Plant</SelectItem>
                  <SelectItem value="or002">Oil Refinery</SelectItem>
                  <SelectItem value="cs003">Construction Site</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          )}
        </CardContent>
      </Card>

      {/* Payroll Table */}
      <Card>
        <CardContent className="p-0">
          {loadingEmployees ? (
            <div className="text-center py-12 px-4">
              <p className="text-sm text-muted-foreground">Carregando funcionários...</p>
            </div>
          ) : isFuncionario && payrollEntries.length === 0 ? (
            <div className="text-center py-12 px-4">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-charcoal font-medium">Nenhum holerite encontrado para você.</p>
              <p className="text-sm text-muted-foreground mt-1">Os dados de folha aparecerão aqui quando disponíveis.</p>
            </div>
          ) : (
          <div className="border border-border-color rounded-lg overflow-x-auto">
            <Table className="min-w-[1600px]">
              <TableHeader>
                <TableRow className="bg-muted/50 border-border-color">
                  <TableHead className="text-charcoal">Funcionario</TableHead>
                  <TableHead className="text-charcoal">Local</TableHead>
                  <TableHead className="text-charcoal">Período</TableHead>
                  <TableHead className="text-charcoal">Horas Reg.</TableHead>
                  <TableHead className="text-charcoal">Horas Extra</TableHead>
                  <TableHead className="text-charcoal">Rate/h</TableHead>
                  <TableHead className="text-charcoal text-right whitespace-nowrap">Desloc. (fora)</TableHead>
                  <TableHead className="text-charcoal text-right whitespace-nowrap">Aux. moradia</TableHead>
                  <TableHead className="text-charcoal">Bruto</TableHead>
                  <TableHead className="text-charcoal">Deduções</TableHead>
                  <TableHead className="text-charcoal">Líquido</TableHead>
                  <TableHead className="text-charcoal">Reside fora da cidade?</TableHead>
                  <TableHead className="text-charcoal">Recebe auxílio moradia?</TableHead>
                  <TableHead className="text-charcoal">Status</TableHead>
                  <TableHead className="text-charcoal">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payrollEntries.map((entry) => (
                  <TableRow key={entry.id} className="border-border-color hover:bg-muted/30">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-charcoal text-white text-xs">
                            {entry.employeeInitials}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium text-charcoal">{entry.employee}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{entry.factory}</TableCell>
                    <TableCell>{entry.period}</TableCell>
                    <TableCell className="text-center">{entry.regularHours}h</TableCell>
                    <TableCell className="text-center">
                      {entry.overtimeHours > 0 ? (
                        <span className="text-orange-600 font-medium">{entry.overtimeHours}h</span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="font-mono">{formatCurrency(entry.hourlyRate)}</TableCell>
                    <TableCell className="text-right text-sm font-mono">
                      {(entry.benefitOutsideCityAmount ?? 0) > 0
                        ? formatCurrency(entry.benefitOutsideCityAmount ?? 0)
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right text-sm font-mono">
                      {(entry.benefitHousingAmount ?? 0) > 0
                        ? formatCurrency(entry.benefitHousingAmount ?? 0)
                        : "—"}
                    </TableCell>
                    <TableCell className="font-semibold">{formatCurrency(entry.grossPay ?? 0)}</TableCell>
                    <TableCell className="text-red-600">{formatCurrency(entry.deductions)}</TableCell>
                    <TableCell className="font-semibold text-green-600">
                      {formatCurrency(entry.netPay)}
                    </TableCell>
                    <TableCell>{entry.benefitsOutsideCity ? "Sim" : "Não"}</TableCell>
                    <TableCell>{entry.receivesHousingAllowance ? "Sim" : "Não"}</TableCell>
                    <TableCell>{getStatusBadge(entry.status)}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="h-8 w-8 p-0 hover:bg-muted"
                          type="button"
                          title="Visualizar"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {!isFuncionario && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 hover:bg-muted"
                            type="button"
                            title="Editar"
                            onClick={() => {
                              setEditingEntry({
                                id: entry.id,
                                employee: entry.employee,
                                employeeInitials: entry.employeeInitials,
                                factory: entry.factory,
                                period: entry.period,
                                regularHours: entry.regularHours,
                                overtimeHours: entry.overtimeHours,
                                hourlyRate: entry.hourlyRate,
                                bonuses: entry.bonuses,
                                deductions: entry.deductions,
                                status: entry.status,
                                payDate: entry.payDate,
                                grossPay: entry.grossPay,
                                netPay: entry.netPay,
                                regularPay: entry.regularPay,
                                overtimePay: entry.overtimePay,
                                benefitOutsideCityAmount: entry.benefitOutsideCityAmount,
                                benefitHousingAmount: entry.benefitHousingAmount,
                                qualifyingDaysOutsideCity: entry.qualifyingDaysOutsideCity,
                                benefitsOutsideCity: entry.benefitsOutsideCity,
                                receivesHousingAllowance: entry.receivesHousingAllowance,
                              });
                              setEditOpen(true);
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        )}
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="h-8 w-8 p-0 hover:bg-muted"
                          type="button"
                          title="Baixar"
                        >
                          <Download className="h-4 w-4" />
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

      {/* Breakdown Summary */}
      <div className="grid grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-charcoal">Detalhamento dos Pagamentos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                <span className="text-charcoal">Pagamento regular (horas × rate)</span>
                <span className="font-semibold">{formatCurrency(summary.totalRegularPay)}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                <span className="text-charcoal">Horas extras (1.5×)</span>
                <span className="font-semibold text-orange-600">
                  {formatCurrency(summary.totalOvertimePay)}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                <span className="text-charcoal">Desloc. fora da cidade (US$20/dia, ≥5h no ponto)</span>
                <span className="font-semibold text-blue-600">
                  {formatCurrency(summary.totalBenefitOutsideCity)}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                <span className="text-charcoal">Auxílio moradia (US$125/semana no período)</span>
                <span className="font-semibold text-blue-600">
                  {formatCurrency(summary.totalBenefitHousing)}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                <span className="text-charcoal">Outros bônus (cadastro na folha)</span>
                <span className="font-semibold text-blue-600">
                  {formatCurrency(summary.totalStoredBonuses)}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-muted/20 rounded-lg border border-border">
                <span className="text-charcoal font-medium">Total bruto (inclui benefícios)</span>
                <span className="font-bold">{formatCurrency(summary.totalGrossPay)}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg border border-red-200">
                <span className="text-charcoal">Total de Deduções</span>
                <span className="font-semibold text-red-600">-{formatCurrency(summary.totalDeductions)}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg border border-green-200">
                <span className="font-semibold text-charcoal">Total Líquido</span>
                <span className="font-bold text-green-600">{formatCurrency(summary.totalNetPay)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {!isFuncionario && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-charcoal">
              <AlertCircle className="h-5 w-5" />
              Alertas e Revisões
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                <p className="text-sm font-medium text-orange-800">Horas extras elevadas</p>
                <p className="text-xs text-orange-600 mt-1">Roberto Silva: 20h extras este mês</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm font-medium text-blue-800">Pendente aprovação</p>
                <p className="text-xs text-blue-600 mt-1">1 folha aguardando aprovação do supervisor</p>
              </div>
              <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <p className="text-sm font-medium text-yellow-800">Revisão necessária</p>
                <p className="text-xs text-yellow-600 mt-1">Carlos Lima: ajustar dedução do plano de saúde</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <p className="text-sm font-medium text-green-800">Processamento concluído</p>
                <p className="text-xs text-green-600 mt-1">3 folhas processadas com sucesso</p>
              </div>
            </div>
          </CardContent>
        </Card>
        )}
      </div>
    </div>
  );
}
