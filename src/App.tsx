import { useState, useEffect, useRef, useCallback } from "react";
import { Layout } from "./components/layout/Layout";
import { LoginPage } from "./components/auth/LoginPage";
import { Dashboard } from "./components/dashboard/Dashboard";
import { EmployeeProfile } from "./components/employee/EmployeeProfile";
import { EmployeeList } from "./components/employee/EmployeeList";
import { EmployeeForm } from "./components/employee/EmployeeForm";
import { FactoryList } from "./components/factories/FactoryList";
import { FactoryForm, formDataToFactory, factoryToInitialData } from "./components/factories/FactoryForm";
import { useFactories } from "./contexts/FactoriesContext";
import type { Factory } from "./data/factories";
import { TimeTracking } from "./components/timetracking/TimeTracking";
import { TimeEntryEditPage } from "./components/timetracking/TimeEntryEditPage";
import { Payroll } from "./components/payroll/Payroll";
import { AccommodationList } from "./components/accommodation/AccommodationList";
import { AccommodationForm } from "./components/accommodation/AccommodationForm";
import { NotificationAdmin } from "./components/notifications/NotificationAdmin";
import { QuiosquePage } from "./components/quiosque/QuiosquePage";
import { QuiosquePontoPage } from "./components/quiosque/QuiosquePontoPage";
import { Button } from "./components/ui/button";
import { employeeService } from "./services/employeeService";
import { clearSession, loadStoredSession, saveSession } from "./lib/authSession";
import { Loader2, Users } from "lucide-react";

type View =
  | "dashboard"
  | "employee-profile"
  | "employee-list"
  | "employee-form"
  | "factory-list"
  | "factory-form"
  | "timetracking"
  | "time-entry-edit"
  | "payroll"
  | "accommodation-list"
  | "accommodation-form"
  | "notification-admin"
  | "quiosque";

import type { CurrentUser, UserRole } from "./types/auth";

const FUNCIONARIO_VIEWS: View[] = ["dashboard", "timetracking", "time-entry-edit", "payroll", "quiosque"];

export default function App() {
  const { addFactory, updateFactory } = useFactories();
  const [sessionChecked, setSessionChecked] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [currentView, setCurrentView] = useState<View>("dashboard");
  const [isEditing, setIsEditing] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [selectedFactory, setSelectedFactory] = useState<Factory | null>(null);
  const [selectedTimeEntryId, setSelectedTimeEntryId] = useState<string | null>(null);
  /** Passo do quiosque (logado): null = digitar telefone; string = painel do colaborador */
  const [quiosquePhoneId, setQuiosquePhoneId] = useState<string | null>(null);
  /** Quiosque público antes do login (só telefone) — uma tela só de login + esta alternativa */
  const [showPublicKiosk, setShowPublicKiosk] = useState(false);
  const [publicKioskPhoneId, setPublicKioskPhoneId] = useState<string | null>(null);
  const [profileEmployeeName, setProfileEmployeeName] = useState<string | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const profileAutoSelectDone = useRef(false);

  useEffect(() => {
    const stored = loadStoredSession();
    if (stored) {
      setCurrentUser(stored);
      setIsAuthenticated(true);
    }
    setSessionChecked(true);
  }, []);

  // Resolver employeeId do funcionário logado (por e-mail) quando role é Funcionario
  useEffect(() => {
    if (!currentUser || currentUser.role !== "Funcionario" || currentUser.employeeId != null || !currentUser.email) return;
    employeeService
      .getAll()
      .then((list) => {
        const emp = list.find((e) => e.email?.toLowerCase() === currentUser.email.toLowerCase());
        if (emp) setCurrentUser((prev) => (prev ? { ...prev, employeeId: emp.id } : null));
      })
      .catch(() => {});
  }, [currentUser?.email, currentUser?.role, currentUser?.employeeId]);

  useEffect(() => {
    if (!isAuthenticated || !currentUser) return;
    saveSession(currentUser);
  }, [isAuthenticated, currentUser]);

  // Funcionário só pode acessar Dashboard, Ponto e Folha; redirecionar se estiver em outra tela
  useEffect(() => {
    if (!currentUser || currentUser.role !== "Funcionario") return;
    if (!FUNCIONARIO_VIEWS.includes(currentView)) setCurrentView("dashboard");
  }, [currentUser?.role, currentView]);

  useEffect(() => {
    if (currentView === "time-entry-edit" && !selectedTimeEntryId) {
      setCurrentView("timetracking");
    }
  }, [currentView, selectedTimeEntryId]);

  useEffect(() => {
    if (currentView !== "quiosque") {
      setQuiosquePhoneId(null);
    }
  }, [currentView]);

  const navigateView = useCallback((v: View) => {
    if (v === "quiosque") setQuiosquePhoneId(null);
    setCurrentView(v);
  }, []);

  const getPageTitle = () => {
    switch (currentView) {
      case "dashboard":
        return "Dashboard";
      case "employee-profile":
        return "Funcionarios";
      case "employee-list":
        return "Funcionarios";
      case "employee-form":
        return "Funcionarios";
      case "factory-list":
        return "Fabricas / Obras";
      case "factory-form":
        return "Fabricas / Obras";
      case "timetracking":
        return "Controle de Ponto";
      case "time-entry-edit":
        return "RC CAST";
      case "payroll":
        return "Folha de Pagamento";
      case "accommodation-list":
        return "Hospedagem";
      case "accommodation-form":
        return "Hospedagem";
      case "notification-admin":
        return "Notificações";
      case "quiosque":
        return "Bater Ponto";
      default:
        return "Dashboard";
    }
  };

  const getPageSubtitle = () => {
    switch (currentView) {
      case "dashboard":
        return "Visao geral do sistema";
      case "employee-profile":
        return profileEmployeeName ? `Perfil > ${profileEmployeeName}` : "Perfil";
      case "employee-list":
        return "Lista de funcionarios";
      case "employee-form":
        return formMode === "create" ? "Novo funcionario" : "Editar funcionario";
      case "factory-list":
        return "Cadastro de fabricas e obras";
      case "factory-form":
        return formMode === "create" ? "Nova fabrica/obra" : "Editar fabrica/obra";
      case "timetracking":
        return "Controle de horarios e ponto";
      case "time-entry-edit":
        return "";
      case "payroll":
        return "Gestao da folha de pagamento";
      case "accommodation-list":
        return "Gestao de propriedades de hospedagem";
      case "accommodation-form":
        return formMode === "create" ? "Nova propriedade" : "Editar propriedade";
      case "notification-admin":
        return "Enviar avisos para os funcionários";
      case "quiosque":
        return quiosquePhoneId
          ? "Confirme seu registro"
          : "Digite o telefone para localizar o colaborador";
      default:
        return "";
    }
  };

  const handleSave = () => {
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  // Employee navigation handlers
  const handleViewEmployeeProfile = (id: string) => {
    setSelectedEmployeeId(id);
    setProfileEmployeeName(null);
    profileAutoSelectDone.current = false;
    setCurrentView("employee-profile");
  };

  // Ao abrir "Perfil Funcionário" pela sidebar sem funcionário selecionado, carregar o primeiro da lista
  useEffect(() => {
    if (currentView !== "employee-profile") {
      profileAutoSelectDone.current = false;
      return;
    }
    if (selectedEmployeeId != null) return;
    if (profileAutoSelectDone.current) return;
    profileAutoSelectDone.current = true;
    setProfileLoading(true);
    employeeService
      .getAll()
      .then((list) => {
        if (list.length > 0) {
          setSelectedEmployeeId(list[0].id);
        }
      })
      .catch(() => {})
      .finally(() => setProfileLoading(false));
  }, [currentView, selectedEmployeeId]);

  const handleEditEmployee = (id: string) => {
    setSelectedEmployeeId(id);
    setFormMode("edit");
    setCurrentView("employee-form");
  };

  const handleCreateEmployee = () => {
    setSelectedEmployeeId(null);
    setFormMode("create");
    setCurrentView("employee-form");
  };

  const handleEmployeeSaved = () => {
    setCurrentView("employee-list");
  };

  const handleCreateFactory = () => {
    setSelectedFactory(null);
    setFormMode("create");
    setCurrentView("factory-form");
  };

  const handleEditFactory = (factory: Factory) => {
    setSelectedFactory(factory);
    setFormMode("edit");
    setCurrentView("factory-form");
  };

  const handleCreateAccommodation = () => {
    setFormMode("create");
    setCurrentView("accommodation-form");
  };

  const renderContent = () => {
    switch (currentView) {
      case "dashboard":
        return (
          <Dashboard
            currentUser={currentUser}
            onNavigate={(view: string) => setCurrentView(view as View)}
            onCreateEmployee={handleCreateEmployee}
            onCreateFactory={handleCreateFactory}
          />
        );
      case "employee-profile":
        if (profileLoading) {
          return (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <span className="ml-3 text-muted-foreground">Carregando perfil...</span>
            </div>
          );
        }
        if (selectedEmployeeId) {
          return (
            <EmployeeProfile
              employeeId={selectedEmployeeId}
              onBack={() => setCurrentView("employee-list")}
              onEdit={handleEditEmployee}
              onLoaded={(emp) => setProfileEmployeeName(emp.full_name)}
            />
          );
        }
        return (
          <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-lg font-semibold text-charcoal mb-2">Nenhum funcionário selecionado</h2>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm">
              Abra a Lista de Funcionários para escolher um perfil ou cadastre um novo.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Button
                variant="outline"
                className="border-border text-charcoal hover:bg-muted"
                onClick={() => setCurrentView("employee-list")}
              >
                Ir para Lista de Funcionários
              </Button>
              <Button
                className="bg-charcoal hover:bg-charcoal/90 text-white"
                onClick={handleCreateEmployee}
              >
                Novo funcionário
              </Button>
            </div>
          </div>
        );
      case "employee-list":
        return (
          <EmployeeList
            onViewProfile={handleViewEmployeeProfile}
            onCreateNew={handleCreateEmployee}
            onEdit={handleEditEmployee}
            currentUser={currentUser}
          />
        );
      case "employee-form":
        return (
          <EmployeeForm
            mode={formMode}
            employeeId={selectedEmployeeId}
            onSave={handleEmployeeSaved}
            onCancel={() => setCurrentView("employee-list")}
          />
        );
      case "factory-list":
        return (
          <FactoryList
            onCreateFactory={handleCreateFactory}
            onEditFactory={handleEditFactory}
          />
        );
      case "factory-form":
        return (
          <FactoryForm
            mode={formMode}
            initialData={
              selectedFactory ? factoryToInitialData(selectedFactory) : undefined
            }
            onSave={async (data) => {
              const factory = formDataToFactory(data);
              try {
                if (formMode === "edit" && selectedFactory) {
                  await updateFactory(factory, selectedFactory.id);
                } else {
                  await addFactory(factory);
                }
                setSelectedFactory(null);
                setCurrentView("factory-list");
              } catch (err) {
                alert(
                  err instanceof Error ? err.message : "Erro ao salvar fábrica/obra. Tente novamente."
                );
              }
            }}
            onCancel={() => {
              setSelectedFactory(null);
              setCurrentView("factory-list");
            }}
          />
        );
      case "timetracking":
        return (
          <TimeTracking
            currentUser={currentUser}
            onOpenEditEntry={(id) => {
              setSelectedTimeEntryId(id);
              setCurrentView("time-entry-edit");
            }}
            onOpenQuiosque={() => navigateView("quiosque")}
          />
        );
      case "quiosque":
        return quiosquePhoneId ? (
          <QuiosquePontoPage
            phoneId={quiosquePhoneId}
            onBack={() => setQuiosquePhoneId(null)}
            onExitToDashboard={() => setCurrentView("dashboard")}
          />
        ) : (
          <QuiosquePage
            onContinue={(digits) => setQuiosquePhoneId(digits)}
            onCancel={() => setCurrentView("dashboard")}
          />
        );
      case "time-entry-edit":
        return selectedTimeEntryId ? (
          <TimeEntryEditPage
            timeEntryId={selectedTimeEntryId}
            currentUser={currentUser}
            onBack={() => {
              setSelectedTimeEntryId(null);
              setCurrentView("timetracking");
            }}
            onSaved={() => {
              setSelectedTimeEntryId(null);
              setCurrentView("timetracking");
            }}
          />
        ) : null;
      case "payroll":
        return <Payroll currentUser={currentUser} />;
      case "accommodation-list":
        return <AccommodationList />;
      case "accommodation-form":
        return (
          <AccommodationForm
            mode={formMode}
            onSave={() => setCurrentView("accommodation-list")}
            onCancel={() => setCurrentView("accommodation-list")}
          />
        );
      case "notification-admin":
        return <NotificationAdmin currentUser={currentUser} />;
      default:
        return (
          <Dashboard
            onNavigate={(view: string) => setCurrentView(view as View)}
            onCreateEmployee={handleCreateEmployee}
            onCreateFactory={handleCreateFactory}
          />
        );
    }
  };

  const handleLoginSuccess = (email: string, role: import("./types/auth").UserRole, employeeId?: string) => {
    const user: CurrentUser = { role, email: email.trim(), employeeId: employeeId ?? null };
    setCurrentUser(user);
    setIsAuthenticated(true);
    saveSession(user);
  };

  const handleLogout = useCallback(() => {
    clearSession();
    setIsAuthenticated(false);
    setCurrentUser(null);
    setCurrentView("dashboard");
    setQuiosquePhoneId(null);
    setShowPublicKiosk(false);
    setPublicKioskPhoneId(null);
  }, []);

  if (!sessionChecked) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" aria-label="Carregando sessão" />
      </div>
    );
  }

  if (!isAuthenticated) {
    if (showPublicKiosk) {
      return (
        <div className="min-h-screen bg-background flex flex-col p-4 py-8">
          <div className="flex-1 w-full max-w-7xl mx-auto min-w-0">
            {publicKioskPhoneId ? (
              <QuiosquePontoPage
                phoneId={publicKioskPhoneId}
                onBack={() => setPublicKioskPhoneId(null)}
                onExitToDashboard={() => {
                  setPublicKioskPhoneId(null);
                  setShowPublicKiosk(false);
                }}
              />
            ) : (
              <QuiosquePage
                onContinue={(digits) => setPublicKioskPhoneId(digits)}
                onCancel={() => {
                  setPublicKioskPhoneId(null);
                  setShowPublicKiosk(false);
                }}
              />
            )}
          </div>
        </div>
      );
    }
    return (
      <LoginPage
        onSuccess={handleLoginSuccess}
        onOpenPublicKiosk={() => {
          setPublicKioskPhoneId(null);
          setShowPublicKiosk(true);
        }}
      />
    );
  }

  return (
    <Layout
      title={getPageTitle()}
      subtitle={getPageSubtitle()}
      showActions={currentView === "employee-profile"}
      isEditing={isEditing}
      onSave={handleSave}
      onCancel={handleCancel}
      currentView={currentView}
      onNavigate={navigateView}
      onCreateEmployee={handleCreateEmployee}
      onCreateFactory={handleCreateFactory}
      onCreateAccommodation={handleCreateAccommodation}
      userRole={currentUser?.role ?? "Admin"}
      onLogout={handleLogout}
    >
      {renderContent()}
    </Layout>
  );
}
