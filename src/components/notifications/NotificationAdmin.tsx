import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Bell, Loader2, Send, Trash2 } from "lucide-react";
import { notificationService } from "@/services/notificationService";
import type { Notification } from "@/types/notification";
import type { CurrentUser } from "@/types/auth";

interface NotificationAdminProps {
  currentUser: CurrentUser | null;
}

export function NotificationAdmin({ currentUser }: NotificationAdminProps) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [list, setList] = useState<Notification[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadList = () => {
    setListLoading(true);
    notificationService
      .getAll()
      .then(setList)
      .catch((e) => {
        const msg =
          (e && typeof e === "object" && "message" in e && (e as { message?: string }).message) ||
          (e instanceof Error ? e.message : null) ||
          "Erro ao carregar.";
        setError(msg);
      })
      .finally(() => setListLoading(false));
  };

  useEffect(() => {
    loadList();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Preencha o título.");
      return;
    }
    setError(null);
    setLoading(true);
    notificationService
      .create({
        title: title.trim(),
        body: body.trim() || "—",
        created_by: currentUser?.employeeId ?? null,
        target: "funcionarios",
      })
      .then(() => {
        setTitle("");
        setBody("");
        loadList();
      })
      .catch((e) => {
        const msg =
          (e && typeof e === "object" && "message" in e && (e as { message?: string }).message) ||
          (e instanceof Error ? e.message : null) ||
          "Erro ao enviar notificação.";
        setError(msg);
      })
      .finally(() => setLoading(false));
  };

  const handleDelete = (id: string) => {
    if (!confirm("Excluir esta notificação? Os funcionários não a verão mais.")) return;
    notificationService
      .delete(id)
      .then(loadList)
      .catch((e) => setError(e instanceof Error ? e.message : "Erro ao excluir."));
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("pt-BR", {
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
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-charcoal">
            <Bell className="h-5 w-5" />
            Nova notificação para funcionários
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit} className="grid gap-4 max-w-2xl">
            <div className="space-y-2">
              <Label htmlFor="notif-title" className="text-charcoal">Título</Label>
              <Input
                id="notif-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Aviso importante"
                className="text-charcoal"
                maxLength={200}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notif-body" className="text-charcoal">Mensagem</Label>
              <Textarea
                id="notif-body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Texto da notificação que os funcionários verão..."
                className="min-h-[120px] text-charcoal"
                rows={4}
              />
            </div>
            {error && (
              <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                <p className="font-medium">{error}</p>
                {(error.includes("does not exist") || error.includes("não existe") || error.includes("relation")) && (
                  <p className="mt-2 text-muted-foreground">
                    Crie a tabela no Supabase: execute o SQL em{" "}
                    <code className="text-xs bg-muted px-1 rounded">supabase/migrations/20250303000000_create_notifications.sql</code> no SQL Editor do projeto.
                  </p>
                )}
              </div>
            )}
            <Button
              type="submit"
              disabled={loading}
              className="bg-charcoal hover:bg-charcoal/90 text-white"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              <span className="ml-2">Enviar notificação</span>
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-charcoal">Notificações enviadas</CardTitle>
        </CardHeader>
        <CardContent>
          {listLoading ? (
            <div className="flex items-center gap-2 py-8 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Carregando...</span>
            </div>
          ) : list.length === 0 ? (
            <p className="text-muted-foreground py-6">Nenhuma notificação enviada ainda.</p>
          ) : (
            <ul className="space-y-4">
              {list.map((n) => (
                <li
                  key={n.id}
                  className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 p-4 rounded-lg border bg-muted/30"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-charcoal">{n.title}</p>
                    <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{n.body}</p>
                    <p className="text-xs text-muted-foreground mt-2">{formatDate(n.created_at)}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="shrink-0 border-border text-muted-foreground hover:text-destructive hover:border-destructive"
                    onClick={() => handleDelete(n.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="ml-1 sm:ml-2">Excluir</span>
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
