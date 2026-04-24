import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { Badge } from "../ui/badge";
import {
  Users,
  Building2,
  Clock,
  FileText,
  ArrowRight,
  Loader2,
  TrendingUp,
  DollarSign,
  AlertTriangle,
  Calendar,
  Bell,
} from "lucide-react";
import { employeeService } from "@/services/employeeService";
import { timeEntryService } from "@/services/timeEntryService";
import { notificationService } from "@/services/notificationService";
import { isSupabaseConfigured } from "@/lib/supabase";
import type { Notification } from "@/types/notification";
import type { Employee } from "@/types/employee";
import type { CurrentUser } from "@/types/auth";

interface DashboardProps {
  currentUser: CurrentUser | null;
  onNavigate: (view: string) => void;
  onCreateEmployee: () => void;
  onCreateFactory?: () => void;
}

export function Dashboard({ currentUser, onNavigate, onCreateEmployee, onCreateFactory }: DashboardProps) {
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [myEmployee, setMyEmployee] = useState<Employee | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    departments: [] as string[],
    factories: [] as string[],
  });
  const [weekSummary, setWeekSummary] = useState({ totalHours: 0, totalDays: 0, averageHours: 0 });
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const isFuncionario = currentUser?.role === "Funcionario";

  const isPlaceholderOrUnreachable = (msg: string) =>
    /Failed to fetch|fetch failed|NetworkError|placeholder\.supabase/i.test(msg) ||
    (import.meta.env.VITE_SUPABASE_URL || "").includes("placeholder");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setConnectionError(null);
        setPreviewMode(false);

        if (!isSupabaseConfigured()) {
          setConnectionError("Supabase nao esta configurado. Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY nas variaveis de ambiente.");
          setLoading(false);
          return;
        }

        if (isFuncionario && currentUser?.employeeId) {
          try {
            const [emp, summaryData, notifs] = await Promise.all([
              employeeService.getById(currentUser.employeeId),
              timeEntryService.getWeekSummary(currentUser.employeeId),
              notificationService.getForEmployees(),
            ]);
            setMyEmployee(emp ?? null);
            setEmployees(emp ? [emp] : []);
            setStats({ total: 1, active: emp?.status === "Ativo" ? 1 : 0, inactive: emp?.status !== "Ativo" ? 1 : 0, departments: emp?.department ? [emp.department] : [], factories: emp?.factory ? [emp.factory] : [] });
            setWeekSummary(summaryData);
            setNotifications(notifs);
          } catch {
            setMyEmployee(null);
            setEmployees([]);
            setStats({ total: 0, active: 0, inactive: 0, departments: [], factories: [] });
            setWeekSummary({ totalHours: 0, totalDays: 0, averageHours: 0 });
            setNotifications([]);
          }
        } else {
          const [empData, statsData, summaryData] = await Promise.all([
            employeeService.getAll(),
            employeeService.getStats(),
            timeEntryService.getWeekSummary(),
          ]);
          setEmployees(empData.slice(0, 5));
          setMyEmployee(null);
          setStats(statsData);
          setWeekSummary(summaryData);
        }
      } catch (err: unknown) {
        let msg = "Erro desconhecido";
        if (err instanceof Error) {
          msg = err.message;
        } else if (err && typeof err === "object") {
          const supaErr = err as Record<string, unknown>;
          msg = (supaErr.message as string) || (supaErr.error_description as string) || JSON.stringify(err);
        } else {
          msg = String(err);
        }
        if (isPlaceholderOrUnreachable(msg)) {
          setPreviewMode(true);
          setEmployees([]);
          setMyEmployee(null);
          setStats({ total: 0, active: 0, inactive: 0, departments: [], factories: [] });
          setWeekSummary({ totalHours: 0, totalDays: 0, averageHours: 0 });
        } else {
          setConnectionError(`Erro ao conectar com Supabase: ${msg}`);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [isFuncionario, currentUser?.employeeId]);

  const getInitials = (name: string) =>
    name.split(" ").map((n) => n[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 sm:py-24 px-3">
        <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-muted-foreground shrink-0" />
        <span className="ml-2 sm:ml-3 text-sm sm:text-base text-muted-foreground">Carregando dashboard...</span>
      </div>
    );
  }

  if (connectionError) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <Card className="border-destructive/50">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center flex-shrink-0">
                <Users className="h-5 w-5 text-destructive" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-charcoal mb-1">Erro de Conexao com Supabase</h3>
                <p className="text-sm text-muted-foreground mb-3">{connectionError}</p>
                <div className="bg-muted rounded-lg p-4 text-sm font-mono space-y-1">
                  <p className="text-charcoal font-semibold mb-2">Verifique:</p>
                  <p>1. VITE_SUPABASE_URL esta configurada: <span className={import.meta.env.VITE_SUPABASE_URL ? "text-green-600" : "text-destructive"}>{import.meta.env.VITE_SUPABASE_URL ? "Sim" : "Nao"}</span></p>
                  <p>2. VITE_SUPABASE_ANON_KEY esta configurada: <span className={import.meta.env.VITE_SUPABASE_ANON_KEY ? "text-green-600" : "text-destructive"}>{import.meta.env.VITE_SUPABASE_ANON_KEY ? "Sim" : "Nao"}</span></p>
                  <p>3. As tabelas foram criadas no banco (scripts/001, 002, 003)</p>
                  <p>4. O URL do Supabase esta acessivel neste ambiente</p>
                </div>
                <Button
                  className="mt-4 bg-charcoal hover:bg-charcoal/90 text-white"
                  onClick={() => window.location.reload()}
                >
                  Tentar novamente
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const monthlyHours = Math.round(weekSummary.totalHours * 4.33);
  const payrollEstimate = employees.length > 0
    ? employees.reduce((sum, e) => sum + (Number(e.hourly_rate) || 0) * (monthlyHours / Math.max(stats.active, 1)), 0)
    : 0;

  const dashboardStats = isFuncionario
    ? [
        {
          title: "Meu status",
          value: myEmployee?.status ?? "—",
          trend: "Seu vínculo",
          icon: Users,
          iconBg: "bg-green-100 text-green-700",
        },
        {
          title: "Minhas horas (semana)",
          value: String(weekSummary.totalHours),
          trend: `${weekSummary.totalDays} dias`,
          icon: Clock,
          iconBg: "bg-purple-100 text-purple-700",
        },
        {
          title: "Meu local",
          value: myEmployee?.factory ?? "—",
          trend: myEmployee?.location ?? "",
          icon: Building2,
          iconBg: "bg-blue-100 text-blue-700",
        },
        {
          title: "Minha folha (estimativa)",
          value: payrollEstimate > 0 ? `US$ ${Math.round(payrollEstimate).toLocaleString("pt-BR")}` : "US$ 0",
          trend: "Somente seus dados",
          icon: DollarSign,
          iconBg: "bg-orange-100 text-orange-700",
        },
      ]
    : [
        {
          title: "Funcionários Ativos",
          value: String(stats.active),
          trend: "+12 vs mês anterior",
          icon: Users,
          iconBg: "bg-green-100 text-green-700",
        },
        {
          title: "Fábricas/Obras Ativas",
          value: String(stats.factories.length),
          trend: "+2 vs mês anterior",
          icon: Building2,
          iconBg: "bg-blue-100 text-blue-700",
        },
        {
          title: "Horas Trabalhadas (Mês)",
          value: monthlyHours > 0 ? monthlyHours.toLocaleString("pt-BR") : "0",
          trend: "+5.2% vs mês anterior",
          icon: Clock,
          iconBg: "bg-purple-100 text-purple-700",
        },
        {
          title: "Folha de Pagamento",
          value: payrollEstimate > 0 ? `US$ ${Math.round(payrollEstimate).toLocaleString("pt-BR")}` : "US$ 0",
          trend: "+8.1% vs mês anterior",
          icon: DollarSign,
          iconBg: "bg-orange-100 text-orange-700",
        },
      ];

  const recentActivities = employees.slice(0, 5).map((emp, i) => ({
    title: isFuncionario ? `Seus dados: ${emp.full_name}` : `Novo funcionário cadastrado: ${emp.full_name}`,
    subtitle: isFuncionario ? "Somente suas informações" : `${[ "2 horas atrás", "5 horas atrás", "1 dia atrás", "2 dias atrás", "3 dias atrás" ][i] || "Recentemente"} por ${emp.full_name.split(" ")[0] || "Sistema"}`,
    initials: getInitials(emp.full_name),
  }));

  const mainLocations = stats.factories.slice(0, 5).map((name, i) => ({
    name,
    avgRate: "US$ 17.2/h avg",
    employees: isFuncionario ? 1 : stats.active > 0 ? Math.max(1, Math.round(stats.active / Math.max(stats.factories.length, 1))) : 0,
  }));

  const pendingActions = [
    { id: 1, title: "Certificados vencendo", count: 3, description: "3 certificados vencem nos próximos 30 dias", urgency: "medium" as const, action: "Revisar certificados" },
    { id: 2, title: "Funcionários inativos agendados", count: 2, description: "2 funcionários com inativação programada esta semana", urgency: "high" as const, action: "Processar inativações" },
    { id: 3, title: "Documentos pendentes", count: 8, description: "8 funcionários com documentos de identidade pendentes", urgency: "medium" as const, action: "Solicitar documentos" },
    { id: 4, title: "Aprovações de rate", count: 5, description: "5 solicitações de alteração de rate aguardando aprovação", urgency: "low" as const, action: "Revisar solicitações" },
  ];

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "high": return "bg-red-100 text-red-700 border-red-200";
      case "medium": return "bg-orange-100 text-orange-700 border-orange-200";
      case "low": return "bg-yellow-100 text-yellow-700 border-yellow-200";
      default: return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const formatNotifDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-4 sm:space-y-5 lg:space-y-6">
      {isFuncionario && notifications.length > 0 && (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-charcoal text-base sm:text-lg">
              <Bell className="h-4 w-4 sm:h-5 sm:w-5 shrink-0 text-charcoal" />
              Avisos
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <ul className="space-y-4">
              {notifications.map((n) => (
                <li key={n.id} className="p-3 rounded-lg border bg-card">
                  <p className="font-medium text-charcoal">{n.title}</p>
                  <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{n.body}</p>
                  <p className="text-xs text-muted-foreground mt-2">{formatNotifDate(n.created_at)}</p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
      {previewMode && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 sm:p-4 text-sm text-amber-800 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-3">
          <span className="font-medium shrink-0">Modo preview</span>
          <span className="text-amber-700 flex-1 min-w-0">
            Supabase inacessível (URL placeholder ou sem rede). Você pode navegar e ver o design; para dados reais, configure um projeto em{" "}
            <a href="https://supabase.com" target="_blank" rel="noreferrer" className="underline">supabase.com</a> e atualize o .env.
          </span>
          <Button variant="outline" size="sm" onClick={() => window.location.reload()} className="w-full sm:w-auto sm:ml-auto border-amber-300 text-amber-800 hover:bg-amber-100 shrink-0">
            Tentar novamente
          </Button>
        </div>
      )}
      {/* 4 cards de métricas (estilo Figma) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        {dashboardStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="bg-gray-100/80 border-gray-200/80">
              <CardContent className="p-4 sm:p-5 lg:p-6">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm text-gray-600">{stat.title}</p>
                    <p className="text-2xl sm:text-3xl font-bold text-charcoal mt-1">{stat.value}</p>
                    <p className="text-sm text-green-600 font-medium mt-1 flex items-center gap-1">
                      <TrendingUp className="h-3.5 w-3.5 shrink-0" />
                      {stat.trend}
                    </p>
                  </div>
                  <div className={`rounded-lg flex items-center justify-center shrink-0 ${stat.iconBg}`} style={{ width: "40px", height: "40px" }}>
                    <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Atividades Recentes + Principais Locais (estilo Figma) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
        <Card>
          <CardHeader className="p-4 sm:p-5 border-b border-border">
            <CardTitle className="flex items-center gap-2 text-charcoal text-base sm:text-lg">
              <Clock className="h-4 w-4 sm:h-5 sm:w-5 shrink-0 text-charcoal" />
              Atividades Recentes
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-5">
            {recentActivities.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground text-sm mb-3">Nenhuma atividade recente</p>
                <Button onClick={onCreateEmployee} className="bg-charcoal hover:bg-charcoal/90 text-white">
                  Cadastrar funcionário
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {recentActivities.map((act, i) => (
                  <div key={i} className="flex gap-3">
                    <Avatar className="h-10 w-10 shrink-0 bg-charcoal text-white">
                      <AvatarFallback className="bg-charcoal text-white text-sm">{act.initials}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-charcoal">{act.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{act.subtitle}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {!isFuncionario && (
              <Button
                variant="outline"
                className="w-full mt-4 border-border text-charcoal hover:bg-muted text-sm"
                onClick={() => onNavigate("employee-list")}
              >
                Ver todos
                <ArrowRight className="h-4 w-4 ml-2 shrink-0" />
              </Button>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 sm:p-5 border-b border-border">
            <CardTitle className="flex items-center gap-2 text-charcoal text-base sm:text-lg">
              <Building2 className="h-4 w-4 sm:h-5 sm:w-5 shrink-0 text-charcoal" />
              Principais Locais
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-5">
            {mainLocations.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground text-sm">Nenhum local cadastrado</p>
                <Button variant="outline" className="mt-3" onClick={() => onNavigate("factory-list")}>
                  Ir para Fábricas/Obras
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {mainLocations.map((loc, i) => (
                  <div key={i} className="flex items-center justify-between gap-3 p-3 rounded-lg bg-muted/30">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-charcoal">{loc.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{loc.employees} funcionários</p>
                    </div>
                    <span className="text-xs font-medium px-2 py-1 rounded-full bg-charcoal/10 text-charcoal shrink-0">
                      {loc.avgRate}
                    </span>
                  </div>
                ))}
              </div>
            )}
            {!isFuncionario && (
              <Button
                variant="outline"
                className="w-full mt-4 border-border text-charcoal hover:bg-muted text-sm"
                onClick={() => onNavigate("factory-list")}
              >
                Ver todos os locais
                <ArrowRight className="h-4 w-4 ml-2 shrink-0" />
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Ações Pendentes (oculto para Funcionário – só vê suas informações) */}
      {!isFuncionario && (
      <Card>
        <CardHeader className="p-4 sm:p-5 border-b border-border">
          <CardTitle className="flex items-center gap-2 text-charcoal text-base sm:text-lg">
            <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 shrink-0 text-charcoal" />
            Ações Pendentes
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {pendingActions.map((action) => (
              <div key={action.id} className="p-4 border border-border-color rounded-lg">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="min-w-0">
                    <h4 className="font-medium text-charcoal text-sm sm:text-base">{action.title}</h4>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1">{action.description}</p>
                  </div>
                  <Badge className={`text-xs shrink-0 ${getUrgencyColor(action.urgency)}`}>
                    {action.count}
                  </Badge>
                </div>
                <Button variant="outline" size="sm" className="w-full border-border-color text-charcoal hover:bg-muted text-xs sm:text-sm">
                  {action.action}
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      )}

      {/* Quick Actions: Funcionário vê só Ponto e Folha */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
        {isFuncionario ? (
          <>
            <Button className="bg-charcoal hover:bg-charcoal/90 text-white p-4 sm:p-6 h-auto flex flex-col gap-1.5 sm:gap-2 text-sm sm:text-base" onClick={() => onNavigate("timetracking")}>
              <Clock className="h-5 w-5 sm:h-6 sm:w-6 shrink-0" />
              <span className="truncate">Meu Ponto</span>
            </Button>
            <Button className="bg-charcoal hover:bg-charcoal/90 text-white p-4 sm:p-6 h-auto flex flex-col gap-1.5 sm:gap-2 text-sm sm:text-base" onClick={() => onNavigate("payroll")}>
              <FileText className="h-5 w-5 sm:h-6 sm:w-6 shrink-0" />
              <span className="truncate">Minha Folha</span>
            </Button>
          </>
        ) : (
          <>
            <Button className="bg-charcoal hover:bg-charcoal/90 text-white p-4 sm:p-6 h-auto flex flex-col gap-1.5 sm:gap-2 text-sm sm:text-base" onClick={onCreateEmployee}>
              <Users className="h-5 w-5 sm:h-6 sm:w-6 shrink-0" />
              <span className="truncate">Novo Funcionário</span>
            </Button>
            <Button variant="outline" className="border-border-color text-charcoal hover:bg-muted p-4 sm:p-6 h-auto flex flex-col gap-1.5 sm:gap-2 text-sm sm:text-base" onClick={() => onCreateFactory?.()}>
              <Building2 className="h-5 w-5 sm:h-6 sm:w-6 shrink-0" />
              <span className="truncate">Nova Fábrica/Obra</span>
            </Button>
            <Button variant="outline" className="border-border-color text-charcoal hover:bg-muted p-4 sm:p-6 h-auto flex flex-col gap-1.5 sm:gap-2 text-sm sm:text-base" onClick={() => onNavigate("payroll")}>
              <FileText className="h-5 w-5 sm:h-6 sm:w-6 shrink-0" />
              <span className="truncate">Relatório</span>
            </Button>
            <Button variant="outline" className="border-border-color text-charcoal hover:bg-muted p-4 sm:p-6 h-auto flex flex-col gap-1.5 sm:gap-2 text-sm sm:text-base" onClick={() => onNavigate("timetracking")}>
              <Calendar className="h-5 w-5 sm:h-6 sm:w-6 shrink-0" />
              <span className="truncate">Agendar</span>
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
