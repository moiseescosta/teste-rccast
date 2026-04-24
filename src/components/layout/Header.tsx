import { Button } from "../ui/button";
import { Menu } from "lucide-react";

interface HeaderProps {
  title: string;
  subtitle?: string;
  showActions?: boolean;
  onSave?: () => void;
  onCancel?: () => void;
  isEditing?: boolean;
  onMenuClick?: () => void;
  onLogout?: () => void;
}

export function Header({ 
  title, 
  subtitle, 
  showActions = false, 
  onSave, 
  onCancel, 
  isEditing = false,
  onMenuClick,
  onLogout,
}: HeaderProps) {
  return (
    <header className="bg-card border-b border-border px-3 py-3 sm:px-4 sm:py-3.5 lg:px-6 lg:py-4 flex items-center min-h-[52px] sm:min-h-[48px]">
      <div className="flex items-center justify-between gap-2 sm:gap-3 min-w-0 w-full">
        <div className="flex items-center gap-3 flex-1 min-w-0 overflow-hidden">
          <button
            type="button"
            onClick={onMenuClick}
            className="p-2 hover:bg-muted rounded-lg transition-colors flex-shrink-0"
            aria-label="Abrir menu"
          >
            <Menu className="h-5 w-5 text-charcoal" />
          </button>
          <div className="min-w-0 flex-1 overflow-hidden">
            <h1 className="text-base sm:text-lg lg:text-xl font-semibold text-charcoal truncate">{title}</h1>
            {subtitle && (
              <p className="text-muted-foreground mt-0.5 sm:mt-1 text-xs sm:text-sm truncate">{subtitle}</p>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {showActions && isEditing && (
            <>
              <Button
                variant="outline"
                size="sm"
                className="border-border-color text-charcoal hover:bg-muted text-xs sm:text-sm"
                onClick={onCancel}
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={onSave}
                className="bg-charcoal hover:bg-charcoal/90 text-white text-xs sm:text-sm"
              >
                Salvar
              </Button>
            </>
          )}
          {onLogout && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-charcoal text-xs sm:text-sm"
              onClick={onLogout}
            >
              Sair
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
