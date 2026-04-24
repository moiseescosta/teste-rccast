import { ReactNode, useState } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import type { UserRole } from "@/types/auth";

type View = "dashboard" | "employee-profile" | "employee-list" | "employee-form" | "factory-list" | "factory-form" | "timetracking" | "time-entry-edit" | "payroll" | "accommodation-list" | "accommodation-form" | "notification-admin" | "quiosque";

interface LayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
  showActions?: boolean;
  onSave?: () => void;
  onCancel?: () => void;
  isEditing?: boolean;
  currentView: View;
  onNavigate: (view: View) => void;
  onCreateEmployee: () => void;
  onCreateFactory: () => void;
  onCreateAccommodation: () => void;
  userRole?: UserRole;
  onLogout?: () => void;
}

export function Layout({ 
  children, 
  title, 
  subtitle, 
  showActions, 
  onSave, 
  onCancel, 
  isEditing,
  currentView,
  onNavigate,
  onCreateEmployee,
  onCreateFactory,
  onCreateAccommodation,
  userRole = "Admin",
  onLogout,
}: LayoutProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar
        currentView={currentView}
        onNavigate={onNavigate}
        onCreateEmployee={onCreateEmployee}
        onCreateFactory={onCreateFactory}
        onCreateAccommodation={onCreateAccommodation}
        userRole={userRole}
        open={menuOpen}
        onOpenChange={setMenuOpen}
      />
      <div className="relative z-0 min-w-0 flex-1 flex flex-col overflow-x-hidden w-full">
        <Header
          title={title}
          subtitle={subtitle}
          showActions={showActions}
          onSave={onSave}
          onCancel={onCancel}
          isEditing={isEditing}
          onMenuClick={() => setMenuOpen(true)}
          onLogout={onLogout}
        />
        <main className="px-3 py-4 sm:px-4 sm:py-5 lg:px-6 lg:py-6 flex-1 min-h-0">
          <div className="max-w-7xl mx-auto w-full min-w-0">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
