import { useState, useEffect } from "react";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  Clock,
  ArrowLeft,
  Loader2,
  AlertCircle,
  DollarSign,
  Calendar,
  CheckCircle2,
} from "lucide-react";
import { employeeService } from "@/services/employeeService";
import { timeEntryService } from "@/services/timeEntryService";
import { useFactories } from "@/contexts/FactoriesContext";
import { findFactoryByAssignment, getEffectiveClockInTime } from "@/data/factories";
import type { Employee } from "@/types/employee";
import { normalizeTimeEntryStatus } from "@/lib/timeUtils";

function getEmployeeByPhone(employees: Employee[], phoneId: string): Employee | null {
  const digits = phoneId.replace(/\D/g, "").trim();
  if (!digits) return null;
  return (
    employees.find((e) => {
      const empPhone = (e.phone || "").replace(/\D/g, "").trim();
      return empPhone && (empPhone.endsWith(digits) || digits.endsWith(empPhone));
    }) ?? null
  );
}

interface QuiosquePontoPageProps {
  phoneId: string;
  onBack: () => void;
  onExitToDashboard: () => void;
}

export function QuiosquePontoPage({ phoneId, onBack, onExitToDashboard }: QuiosquePontoPageProps) {
  const { factories } = useFactories();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [success, setSuccess] = useState(false);
  const [successKind, setSuccessKind] = useState<"entrada" | "dia" | null>(null);
  const [awaitingExitPunch, setAwaitingExitPunch] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    setSuccess(false);
    setSuccessKind(null);
    setMessage(null);
    setAwaitingExitPunch(false);
  }, [phoneId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(false);
      try {
        const list = await employeeService.getAll({ status: "Ativo" });
        if (cancelled) return;
        const emp = getEmployeeByPhone(list, phoneId);
        setEmployee(emp);
        if (!emp) setError(true);
      } catch {
        if (!cancelled) {
          setError(true);
          setEmployee(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [phoneId]);

  const effectiveClockIn =
    employee
      ? getEffectiveClockInTime(employee.clock_in_time, employee.factory, factories, employee.department)
      : null;

  const employeeFactory = employee ? findFactoryByAssignment(employee.factory, factories) : null;
  const noTimeClock = employeeFactory?.no_time_clock === true;

  useEffect(() => {
    if (!employee?.id || !noTimeClock) {
      setAwaitingExitPunch(false);
      return;
    }
    const today = new Date().toISOString().split("T")[0];
    let cancelled = false;
    timeEntryService
      .getAll({ employee_id: employee.id, date_from: today, date_to: today })
      .then((entries) => {
        if (cancelled) return;
        const open = entries.some((e) => !e.clock_out || String(e.clock_out).trim() === "");
        setAwaitingExitPunch(open);
      })
      .catch(() => {
        if (!cancelled) setAwaitingExitPunch(false);
      });
    return () => {
      cancelled = true;
    };
  }, [employee?.id, noTimeClock, success]);

  const handleRegister = async () => {
    if (!employee) return;
    setMessage(null);
    setRegistering(true);
    try {
      const today = new Date().toISOString().split("T")[0];
      const now = new Date();
      const nowTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      const existingToday = await timeEntryService.getAll({
        employee_id: employee.id,
        date_from: today,
        date_to: today,
      });

      if (noTimeClock) {
        const openEntry = existingToday.find((e) => !e.clock_out || String(e.clock_out).trim() === "");
        if (openEntry) {
          await timeEntryService.update(openEntry.id, {
            clock_in: openEntry.clock_in || nowTime,
            clock_out: nowTime,
            break_time: openEntry.break_time ?? 1,
            status: normalizeTimeEntryStatus("Registrado"),
            notes: openEntry.notes
              ? `${openEntry.notes}; Quiosque — saída (obra sem relógio)`
              : "Quiosque — saída (obra sem relógio)",
          });
          setSuccessKind("dia");
          setSuccess(true);
          return;
        }
        if (existingToday.some((e) => e.clock_out && String(e.clock_out).trim() !== "")) {
          setMessage("Já existe registro completo de ponto para hoje.");
          return;
        }
        await timeEntryService.create({
          employee_id: employee.id,
          date: today,
          clock_in: nowTime,
          clock_out: null,
          break_time: 0,
          status: normalizeTimeEntryStatus("active"),
          project: null,
          notes: "Quiosque — entrada (obra sem relógio no local)",
          total_hours: 0,
        });
        setSuccessKind("entrada");
        setSuccess(true);
        return;
      }

      if (existingToday.length > 0) {
        setMessage("Já existe registro de ponto para hoje.");
        return;
      }
      await timeEntryService.create({
        employee_id: employee.id,
        date: today,
        clock_in: effectiveClockIn || "07:00",
        clock_out: nowTime,
        break_time: 1,
        status: normalizeTimeEntryStatus("Registrado"),
        project: null,
        notes: "Quiosque",
        total_hours: 0,
      });
      setSuccessKind("dia");
      setSuccess(true);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Erro ao registrar ponto. Tente novamente.");
    } finally {
      setRegistering(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <Loader2 className="h-10 w-10 animate-spin text-charcoal mb-3" />
        <p className="text-muted-foreground">Buscando colaborador...</p>
      </div>
    );
  }

  if (error || !employee) {
    return (
      <div className="max-w-md mx-auto space-y-6">
        <Card className="border-border-color shadow-md p-8 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-destructive/10 text-destructive mb-4">
            <AlertCircle className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-semibold text-charcoal mb-2">Colaborador não encontrado</h2>
          <p className="text-muted-foreground text-sm mb-6">
            Verifique o número ({phoneId.replace(/\D/g, "")}).
          </p>
          <Button
            type="button"
            variant="outline"
            className="border-border-color text-charcoal hover:bg-muted"
            onClick={onBack}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </Card>
      </div>
    );
  }

  const isActive = employee.status === "Ativo";
  const todayFormatted = new Date().toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  return (
    <div className="space-y-6 max-w-md mx-auto">
      <div className="flex justify-start">
        <Button type="button" variant="ghost" className="text-muted-foreground hover:text-charcoal -ml-2" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
      </div>

      <Card className="border-border-color shadow-md overflow-hidden relative">
        {success && (
          <div
            className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center rounded-xl border border-border-color p-6 bg-background"
            style={{ width: "100%", height: "100%" }}
          >
            <div className="flex flex-col items-center justify-center text-center space-y-4 max-w-sm w-full">
              <div className="flex items-center justify-center w-14 h-14 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-charcoal">
                  {successKind === "entrada" ? "Entrada registrada!" : "Ponto registrado!"}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">Olá, {employee.full_name.split(" ")[0]}</p>
                {successKind === "entrada" && (
                  <p className="text-sm text-charcoal mt-3 leading-snug">
                    Ao sair da obra, use o quiosque outra vez para registrar a saída.
                  </p>
                )}
              </div>
              <Button className="w-full bg-charcoal hover:bg-charcoal/90 text-white" onClick={onBack}>
                Voltar ao início
              </Button>
            </div>
          </div>
        )}

        <div
          className="bg-charcoal/5 w-full flex items-center justify-center border-b border-border-color"
          style={{ height: "50px" }}
        >
          <div className="flex items-center gap-2">
            <div
              className="bg-charcoal rounded flex items-center justify-center"
              style={{ width: "36px", height: "36px" }}
            >
              <span className="text-white font-bold text-sm">RC</span>
            </div>
            <span className="font-semibold text-charcoal">RC CAST</span>
          </div>
        </div>

        <CardContent className="pt-6 pb-8 px-6">
          <div className="flex flex-col items-center text-center mb-6">
            <h2 className="text-xl font-semibold text-charcoal">{employee.full_name}</h2>
            <p className="text-sm text-muted-foreground font-medium uppercase tracking-wide mt-0.5">
              {employee.role || "Colaborador"}
            </p>
            <Badge
              variant="outline"
              className={
                isActive
                  ? "mt-2 border-green-500/50 bg-green-500/10 text-green-700 dark:text-green-400"
                  : "mt-2 border-destructive/50 bg-destructive/10 text-destructive"
              }
            >
              {isActive ? "Ativo" : "Inativo"}
            </Badge>
          </div>

          <div className="grid grid-cols-3 gap-2 py-4 border-y border-border-color">
            <div className="flex flex-col items-center p-2">
              <DollarSign className="h-5 w-5 text-charcoal mb-1" />
              <span className="text-xs text-muted-foreground font-medium">Valor/h</span>
              <span className="text-sm font-semibold text-charcoal">
                R$ {employee.hourly_rate != null ? Number(employee.hourly_rate).toFixed(2) : "–"}
              </span>
            </div>
            <div className="flex flex-col items-center p-2 border-x border-border-color">
              <Clock className="h-5 w-5 text-charcoal mb-1" />
              <span className="text-xs text-muted-foreground font-medium">Entrada</span>
              <span className="text-sm font-semibold text-charcoal">
                {noTimeClock
                  ? awaitingExitPunch
                    ? "Saída pendente"
                    : "Na portaria"
                  : effectiveClockIn || "07:00"}
              </span>
            </div>
            <div className="flex flex-col items-center p-2">
              <Calendar className="h-5 w-5 text-charcoal mb-1" />
              <span className="text-xs text-muted-foreground font-medium">Data</span>
              <span className="text-sm font-semibold text-charcoal">{todayFormatted}</span>
            </div>
          </div>

          {noTimeClock && (
            <div
              className="mt-4 rounded-lg border border-amber-500/35 bg-amber-500/10 px-3 py-2.5 text-sm text-charcoal text-left leading-snug"
              role="status"
            >
              Esta obra não possui relógio de ponto no local. Registre a <strong>entrada</strong> ao chegar e a{" "}
              <strong>saída</strong> ao sair (dois usos do quiosque no mesmo dia).
            </div>
          )}

          <div className="pt-6 space-y-3">
            {message && <p className="text-sm text-destructive text-center">{message}</p>}
            <Button
              type="button"
              className="w-full h-12 bg-charcoal hover:bg-charcoal/90 text-white"
              disabled={registering || !isActive}
              onClick={handleRegister}
            >
              {registering ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Registrando...
                </>
              ) : (
                <>
                  <Clock className="h-4 w-4 mr-2" />
                  {noTimeClock
                    ? awaitingExitPunch
                      ? "Registrar saída"
                      : "Registrar entrada"
                    : "Registrar Ponto"}
                </>
              )}
            </Button>
            {!isActive && (
              <p className="text-xs text-muted-foreground text-center">Colaborador inativo não pode registrar ponto.</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Button
        type="button"
        variant="ghost"
        className="w-full text-muted-foreground hover:text-charcoal"
        onClick={onExitToDashboard}
      >
        Ir para o início
      </Button>
    </div>
  );
}
