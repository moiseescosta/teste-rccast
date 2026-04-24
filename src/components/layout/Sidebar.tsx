import { 
  Users, 
  Clock, 
  FileText, 
  Building2, 
  Truck, 
  Archive, 
  DollarSign, 
  Briefcase, 
  Settings,
  LayoutDashboard,
  ChevronDown,
  Plus,
  Bell,
  Smartphone,
} from "lucide-react";
import { useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

type View = "dashboard" | "employee-profile" | "employee-list" | "employee-form" | "factory-list" | "factory-form" | "timetracking" | "time-entry-edit" | "payroll" | "accommodation-list" | "accommodation-form" | "notification-admin" | "quiosque";

type UserRole = "Admin" | "Gerente" | "Funcionario";

interface SidebarProps {
  currentView: View;
  onNavigate: (view: View) => void;
  onCreateEmployee: () => void;
  onCreateFactory: () => void;
  onCreateAccommodation: () => void;
  userRole?: UserRole;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

function SidebarContent({ currentView, onNavigate, onCreateEmployee, onCreateFactory, onCreateAccommodation, userRole = "Admin", onItemClick }: SidebarProps & { onItemClick?: () => void }) {
  const [expandedItems, setExpandedItems] = useState<string[]>(["funcionarios", "fabricas", "hospedagem"]);

  const toggleExpanded = (itemName: string) => {
    setExpandedItems(prev => 
      prev.includes(itemName) 
        ? prev.filter(item => item !== itemName)
        : [...prev, itemName]
    );
  };

  const handleNavigate = (view: View) => {
    onNavigate(view);
    onItemClick?.();
  };

  const fullNavigation = [
    { 
      name: 'Dashboard', 
      icon: LayoutDashboard, 
      view: 'dashboard' as View,
      current: currentView === 'dashboard'
    },
    { 
      name: 'Funcionarios', 
      icon: Users, 
      expandable: true,
      expandKey: 'funcionarios',
      expanded: expandedItems.includes('funcionarios'),
      current: currentView.includes('employee'),
      submenu: [
        { name: 'Lista de Funcionarios', view: 'employee-list' as View, current: currentView === 'employee-list' },
        { name: 'Perfil Funcionario', view: 'employee-profile' as View, current: currentView === 'employee-profile' },
      ]
    },
    { 
      name: 'Ponto', 
      icon: Clock, 
      view: 'timetracking' as View,
      current: currentView === 'timetracking' || currentView === 'time-entry-edit'
    },
    { 
      name: 'Bater Ponto', 
      icon: Smartphone, 
      view: 'quiosque' as View,
      current: currentView === 'quiosque'
    },
    { 
      name: 'Folha', 
      icon: FileText, 
      view: 'payroll' as View,
      current: currentView === 'payroll'
    },
    { 
      name: 'Notificações', 
      icon: Bell, 
      view: 'notification-admin' as View,
      current: currentView === 'notification-admin'
    },
    { 
      name: 'Fabricas/Obras', 
      icon: Building2, 
      expandable: true,
      expandKey: 'fabricas',
      expanded: expandedItems.includes('fabricas'),
      current: currentView.includes('factory'),
      submenu: [
        { name: 'Lista de Fabricas', view: 'factory-list' as View, current: currentView === 'factory-list' }
      ]
    },
    { 
      name: 'Hospedagem', 
      icon: Building2, 
      expandable: true,
      expandKey: 'hospedagem',
      expanded: expandedItems.includes('hospedagem'),
      current: currentView.includes('accommodation'),
      submenu: [
        { name: 'Lista de Hospedagem', view: 'accommodation-list' as View, current: currentView === 'accommodation-list' }
      ]
    },
    { name: 'Frota', icon: Truck, disabled: true, disabledLabel: 'Em breve' },
    { name: 'Storage', icon: Archive, disabled: true, disabledLabel: 'Em breve' },
    { name: 'Financeiro', icon: DollarSign, disabled: true, disabledLabel: 'Em breve' },
    { name: 'Office', icon: Briefcase, disabled: true, disabledLabel: 'Em breve' },
    { name: 'Configuracoes', icon: Settings, disabled: true, disabledLabel: 'Em breve' },
  ];

  // Funcionário vê apenas Dashboard, Ponto e Folha
  const navigation =
    userRole === "Funcionario"
      ? fullNavigation.filter(
          (item) =>
            item.name === "Dashboard" ||
            item.name === "Ponto" ||
            item.name === "Bater Ponto" ||
            item.name === "Folha"
        )
      : fullNavigation;

  return (
    <div className="flex flex-col h-full bg-card text-charcoal min-h-0 w-full min-w-0">
      <nav className="px-3 py-2 flex-1 overflow-y-auto overflow-x-hidden min-w-0">
        <ul className="space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon;
            
            if (item.disabled) {
              const label = (item as { disabledLabel?: string }).disabledLabel;
              return (
                <li key={item.name}>
                  <div
                    className="group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground cursor-not-allowed opacity-70 min-w-0"
                    title={label}
                    role="button"
                    aria-disabled="true"
                    aria-label={`${item.name} (${label || 'indisponível'})`}
                  >
                    <Icon className="h-5 w-5 shrink-0 flex-shrink-0" />
                    <span className="flex-1 min-w-0 truncate">{item.name}</span>
                    {label && (
                      <span className="text-[10px] uppercase tracking-wide opacity-70">{label}</span>
                    )}
                  </div>
                </li>
              );
            }
            
            if (item.expandable) {
              const expandKey = (item as { expandKey?: string }).expandKey ?? item.name.toLowerCase().replace(/\s*\/\s*/g, '').replace(/\s+/g, '');
              return (
                <li key={item.name}>
                  <button
                    type="button"
                    onClick={() => {
                      toggleExpanded(expandKey);
                      if (item.submenu && item.submenu.length > 0 && !expandedItems.includes(expandKey)) {
                        handleNavigate(item.submenu[0].view);
                      }
                    }}
                    aria-expanded={item.expanded}
                    aria-haspopup="true"
                    className={`
                      group flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors text-sm w-full text-left min-w-0
                      ${item.current 
                        ? 'bg-charcoal text-white' 
                        : 'text-charcoal hover:bg-muted'
                      }
                    `}
                  >
                    <Icon className="h-5 w-5 shrink-0 flex-shrink-0" />
                    <span className="flex-1 min-w-0 truncate">{item.name}</span>
                    <ChevronDown className={`h-4 w-4 shrink-0 flex-shrink-0 transition-transform ${item.expanded ? '' : 'rotate-180'}`} />
                  </button>
                  
                  {item.expanded && item.submenu && (
                    <ul className="ml-6 mt-1 space-y-1">
                      {item.submenu.map((subitem) => (
                        <li key={subitem.name}>
                          <button
                            type="button"
                            onClick={() => handleNavigate(subitem.view)}
                            className={`
                              group flex items-center gap-2 rounded-lg px-3 py-2 transition-colors text-sm w-full text-left min-w-0
                              ${subitem.current 
                                ? 'bg-charcoal text-white font-medium' 
                                : 'text-charcoal hover:bg-muted'
                              }
                            `}
                          >
                            <span className="flex-1 min-w-0 truncate">{subitem.name}</span>
                          </button>
                        </li>
                      ))}
                      
                      {item.name === 'Funcionarios' && (
                        <li>
                          <button
                            type="button"
                            onClick={() => { onCreateEmployee(); onItemClick?.(); }}
                            className="group flex items-center gap-2 rounded-lg px-3 py-2 transition-colors text-sm w-full text-muted-foreground hover:bg-muted hover:text-charcoal text-left min-w-0"
                          >
                            <Plus className="h-4 w-4 shrink-0 flex-shrink-0" />
                            <span className="flex-1 min-w-0 truncate">Novo Funcionário</span>
                          </button>
                        </li>
                      )}
                      
                      {item.name === 'Fabricas/Obras' && (
                        <li>
                          <button
                            type="button"
                            onClick={() => { onCreateFactory(); onItemClick?.(); }}
                            className="group flex items-center gap-2 rounded-lg px-3 py-2 transition-colors text-sm w-full text-muted-foreground hover:bg-muted hover:text-charcoal text-left min-w-0"
                          >
                            <Plus className="h-4 w-4 shrink-0 flex-shrink-0" />
                            <span className="flex-1 min-w-0 truncate">Nova Fábrica/Obra</span>
                          </button>
                        </li>
                      )}
                      
                      {item.name === 'Hospedagem' && (
                        <li>
                          <button
                            type="button"
                            onClick={() => { onCreateAccommodation(); onItemClick?.(); }}
                            className="group flex items-center gap-2 rounded-lg px-3 py-2 transition-colors text-sm w-full text-muted-foreground hover:bg-muted hover:text-charcoal text-left min-w-0"
                          >
                            <Plus className="h-4 w-4 shrink-0 flex-shrink-0" />
                            <span className="flex-1 min-w-0 truncate">Nova Propriedade</span>
                          </button>
                        </li>
                      )}
                    </ul>
                  )}
                </li>
              );
            }
            
            return (
              <li key={item.name}>
                <button
                  type="button"
                  onClick={() => item.view && handleNavigate(item.view)}
                  className={`
                    group flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors text-sm w-full text-left min-w-0
                    ${item.current 
                      ? 'bg-charcoal text-white' 
                      : 'text-charcoal hover:bg-muted'
                    }
                  `}
                >
                  <Icon className="h-5 w-5 shrink-0 flex-shrink-0" />
                  <span className="flex-1 min-w-0 truncate">{item.name}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}

export function Sidebar({ currentView, onNavigate, onCreateEmployee, onCreateFactory, onCreateAccommodation, userRole = "Admin", open = false, onOpenChange }: SidebarProps) {
  const handleClose = () => onOpenChange?.(false);

  if (!open) return null;

  return createPortal(
    <>
      {/* Overlay - clique fecha o menu */}
      <div
        className="fixed inset-0 bg-black/50 z-[99998]"
        onClick={handleClose}
        aria-hidden="true"
      />
      {/* Painel do menu - largura maior para evitar quebra de texto */}
      <div
        className="fixed left-0 top-0 h-full w-[280px] min-w-[280px] max-w-[85vw] bg-card border-r border-border z-[99999] flex flex-col shadow-xl"
        role="dialog"
        aria-label="Menu de navegação"
      >
        {/* Header: logo + X (estilo Figma) */}
        <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
          <button
            type="button"
            onClick={() => { onNavigate('dashboard'); handleClose(); }}
            className="flex items-center gap-3 min-w-0 rounded-lg hover:bg-muted p-1 -m-1 transition-colors text-left"
            aria-label="Ir para Dashboard"
          >
            <div className="w-8 h-8 bg-charcoal rounded flex items-center justify-center shrink-0">
              <span className="text-white font-bold text-sm">RC</span>
            </div>
            <span className="font-semibold text-charcoal truncate">RC CAST</span>
          </button>
          <button
            type="button"
            onClick={handleClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors shrink-0"
            aria-label="Fechar menu"
          >
            <X className="h-5 w-5 text-charcoal" />
          </button>
        </div>
        {/* Conteúdo da navegação */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0">
          <SidebarContent
            currentView={currentView}
            onNavigate={onNavigate}
            onCreateEmployee={onCreateEmployee}
            onCreateFactory={onCreateFactory}
            onCreateAccommodation={onCreateAccommodation}
            userRole={userRole}
            onItemClick={handleClose}
          />
        </div>
      </div>
    </>,
    document.body
  );
}
