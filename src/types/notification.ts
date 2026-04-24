export interface Notification {
  id: string;
  title: string;
  body: string;
  created_by: string | null;
  target: string;
  created_at: string;
}

export interface NotificationInsert {
  title: string;
  body: string;
  created_by: string | null;
  target?: string;
}
