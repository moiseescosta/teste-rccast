import { supabase } from "@/lib/supabase";
import type { Notification, NotificationInsert } from "@/types/notification";

export const notificationService = {
  /** Lista notificações visíveis para funcionários (mais recentes primeiro). */
  async getForEmployees(): Promise<Notification[]> {
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("target", "funcionarios")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data || []) as Notification[];
  },

  /** Lista todas as notificações (para admin/gerente ver o que foi enviado). */
  async getAll(): Promise<Notification[]> {
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data || []) as Notification[];
  },

  /** Cria uma nova notificação (uso por admin/gerente). */
  async create(notification: NotificationInsert): Promise<Notification> {
    const row = {
      title: notification.title,
      body: notification.body,
      created_by: notification.created_by ?? null,
      target: notification.target ?? "funcionarios",
    };
    const { data, error } = await supabase
      .from("notifications")
      .insert(row)
      .select()
      .single();
    if (error) throw error;
    return data as Notification;
  },

  /** Remove uma notificação (opcional, para admin). */
  async delete(id: string): Promise<void> {
    const { error } = await supabase.from("notifications").delete().eq("id", id);
    if (error) throw error;
  },
};
