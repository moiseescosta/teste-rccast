import { useState } from "react";
import { Card, CardContent, CardHeader } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Loader2, Clock } from "lucide-react";
import type { UserRole } from "@/types/auth";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";

interface LoginPageProps {
  onSuccess: (email: string, role: UserRole, employeeId?: string) => void;
  /** Abre o quiosque (telefone, sem senha). Não é segunda tela de login. */
  onOpenPublicKiosk?: () => void;
}

export function LoginPage({ onSuccess, onOpenPublicKiosk }: LoginPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.trim()) {
      setError("Informe o e-mail.");
      return;
    }
    if (!password) {
      setError("Informe a senha.");
      return;
    }
    if (!isSupabaseConfigured()) {
      setError("Sistema não configurado. Configure Supabase (variáveis de ambiente).");
      return;
    }
    setLoading(true);
    try {
      const supabase = getSupabase();
      // 1) Verificar e-mail + senha na tabela employees (coluna password_hash)
      // Autenticação só pela tabela employees (e-mail + password_hash), sem Supabase Auth
      const { data: loginRow, error: loginError } = await supabase.rpc("get_employee_by_login", {
        p_email: email.trim(),
        p_password: password,
      });
      if (loginError || !loginRow?.length) {
        setError("E-mail ou senha incorretos.");
        return;
      }
      const { emp_id, emp_system_role } = loginRow[0] as { emp_id: string; emp_system_role: string };
      const role: UserRole =
        emp_system_role && ["Admin", "Gerente", "Funcionario"].includes(emp_system_role)
          ? (emp_system_role as UserRole)
          : "Funcionario";
      onSuccess(email.trim(), role, emp_id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao entrar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-border-color shadow-md">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center gap-3 items-center mb-4">
            <div className="h-10 bg-charcoal rounded flex items-center justify-center shrink-0" style={{ width: "40px" }}>
              <span className="text-white font-bold text-sm">RC</span>
            </div>
            <span className="font-semibold text-charcoal text-xl">RC CAST</span>
          </div>
          <h1 className="text-lg font-semibold text-charcoal">Entrar</h1>
          <p className="text-sm text-muted-foreground">Use seu e-mail e senha para acessar o sistema.</p>
        </CardHeader>
        <CardContent className="pt-2">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="login-email" className="text-charcoal">
                E-mail
              </Label>
              <Input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="border-border-color focus:border-charcoal"
                placeholder="seu@email.com"
                autoComplete="email"
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="login-password" className="text-charcoal">
                Senha
              </Label>
              <Input
                id="login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="border-border-color focus:border-charcoal"
                placeholder="••••••••"
                autoComplete="current-password"
                disabled={loading}
              />
            </div>
            {error && (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            )}
            <Button
              type="submit"
              className="w-full bg-charcoal hover:bg-charcoal/90 text-white"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Entrando...
                </>
              ) : (
                "Entrar"
              )}
            </Button>

            {onOpenPublicKiosk && (
              <div className="pt-2 border-t border-border-color">
                <p className="text-xs text-center text-muted-foreground mb-2">
                  É o ponto na obra? Use o telefone, sem precisar da senha aqui.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full border-border-color text-charcoal hover:bg-muted"
                  disabled={loading}
                  onClick={() => onOpenPublicKiosk()}
                >
                  <Clock className="h-4 w-4 mr-2" />
                  Bater ponto pelo telefone
                </Button>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
