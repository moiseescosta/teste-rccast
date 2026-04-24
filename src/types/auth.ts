export type UserRole = "Admin" | "Gerente" | "Funcionario";

export interface CurrentUser {
  role: UserRole;
  email: string;
  employeeId: string | null;
}
