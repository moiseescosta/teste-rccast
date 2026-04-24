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
    X
} from "lucide-react";
import { useState } from "react";
import type { UserRole } from "@/types/auth";

type View = "dashboard" | "employee-profile" | "employee-list" | "employee-form" | "factory-list" | "factory-form" | "timetracking" | "payroll" | "accommodation-list" | "accommodation-form";

interface MobileSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    currentView: View;
    onNavigate: (view: View) => void;
    onCreateEmployee: () => void;
    onCreateFactory: () => void;
    onCreateAccommodation: () => void;
    userRole?: UserRole;
}

export function MobileSidebar({
    isOpen,
    onClose,
    currentView,
    onNavigate,
    onCreateEmployee,
    onCreateFactory,
    onCreateAccommodation,
    userRole = "Admin"
}: MobileSidebarProps) {
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
        onClose();
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
            current: currentView === 'timetracking'
        },
        {
            name: 'Folha',
            icon: FileText,
            view: 'payroll' as View,
            current: currentView === 'payroll'
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
                    item.name === "Dashboard" || item.name === "Ponto" || item.name === "Folha"
            )
            : fullNavigation;

    if (!isOpen) return null;

    return (
        <>
            <div
                className="fixed inset-0 bg-black/50 z-40 transition-opacity"
                onClick={onClose}
            />

            <div className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-card border-r border-border transform transition-transform duration-300 ease-in-out flex flex-col
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
                <div className="p-4 flex items-center justify-between border-b border-border">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-charcoal rounded flex items-center justify-center shrink-0">
                            <span className="text-white font-bold text-sm">RC</span>
                        </div>
                        <span className="font-semibold text-charcoal">RC CAST</span>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-muted rounded-lg transition-colors"
                    >
                        <X className="h-5 w-5 text-muted-foreground" />
                    </button>
                </div>

                <nav className="flex-1 overflow-y-auto p-4">
                    <ul className="space-y-1">
                        {navigation.map((item) => {
                            const Icon = item.icon;

                            if (item.disabled) {
                                const label = (item as { disabledLabel?: string }).disabledLabel;
                                return (
                                    <li key={item.name}>
                                        <div className="group flex gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground cursor-not-allowed opacity-50">
                                            <Icon className="h-5 w-5 shrink-0" />
                                            <span className="flex-1 text-left">{item.name}</span>
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
                                    <li key={item.name} className="flex flex-col">
                                        <button
                                            onClick={() => {
                                                toggleExpanded(expandKey);
                                                if (item.submenu && item.submenu.length > 0 && !expandedItems.includes(expandKey)) {
                                                    handleNavigate(item.submenu[0].view);
                                                }
                                            }}
                                            className={`
                        group flex gap-3 rounded-lg px-3 py-2.5 transition-colors text-sm w-full text-left
                        ${item.current
                                                    ? 'bg-charcoal text-white'
                                                    : 'text-charcoal hover:bg-muted'
                                                }
                      `}
                                        >
                                            <Icon className="h-5 w-5 shrink-0" />
                                            <span className="flex-1 text-left">{item.name}</span>
                                            <ChevronDown className={`h-4 w-4 transition-transform ${item.expanded ? '' : 'rotate-180'}`} />
                                        </button>

                                        {item.expanded && item.submenu && (
                                            <ul className="ml-6 mt-1 space-y-1">
                                                {item.submenu.map((subitem) => (
                                                    <li key={subitem.name}>
                                                        <button
                                                            onClick={() => handleNavigate(subitem.view)}
                                                            className={`
                                group flex gap-3 rounded-lg px-3 py-2 transition-colors text-sm w-full text-left
                                ${subitem.current
                                                                    ? 'bg-charcoal text-white font-medium'
                                                                    : 'text-muted-foreground hover:bg-muted hover:text-charcoal'
                                                                }
                              `}
                                                        >
                                                            <span className="text-left">{subitem.name}</span>
                                                        </button>
                                                    </li>
                                                ))}

                                                {item.name === 'Funcionarios' && (
                                                    <li>
                                                        <button
                                                            onClick={() => { onCreateEmployee(); onClose(); }}
                                                            className="group flex gap-3 rounded-lg px-3 py-2 transition-colors text-sm w-full text-left text-muted-foreground hover:bg-muted hover:text-charcoal"
                                                        >
                                                            <Plus className="h-4 w-4 shrink-0" />
                                                            <span className="text-left">Novo Funcionário</span>
                                                        </button>
                                                    </li>
                                                )}

                                                {item.name === 'Fabricas/Obras' && (
                                                    <li>
                                                        <button
                                                            onClick={() => { onCreateFactory(); onClose(); }}
                                                            className="group flex gap-3 rounded-lg px-3 py-2 transition-colors text-sm w-full text-left text-muted-foreground hover:bg-muted hover:text-charcoal"
                                                        >
                                                            <Plus className="h-4 w-4 shrink-0" />
                                                            <span className="text-left">Nova Fábrica/Obra</span>
                                                        </button>
                                                    </li>
                                                )}

                                                {item.name === 'Hospedagem' && (
                                                    <li>
                                                        <button
                                                            onClick={() => { onCreateAccommodation(); onClose(); }}
                                                            className="group flex gap-3 rounded-lg px-3 py-2 transition-colors text-sm w-full text-left text-muted-foreground hover:bg-muted hover:text-charcoal"
                                                        >
                                                            <Plus className="h-4 w-4 shrink-0" />
                                                            <span className="text-left">Nova Propriedade</span>
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
                                        onClick={() => item.view && handleNavigate(item.view)}
                                        className={`
                      group flex gap-3 rounded-lg px-3 py-2.5 transition-colors text-sm w-full text-left
                      ${item.current
                                                ? 'bg-charcoal text-white'
                                                : 'text-charcoal hover:bg-muted hover:text-charcoal'
                                            }
                    `}
                                    >
                                        <Icon className="h-5 w-5 shrink-0" />
                                        <span className="text-left">{item.name}</span>
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                </nav>
            </div>
        </>
    );
}
