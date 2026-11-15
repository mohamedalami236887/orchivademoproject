export type Role = 'EMPLOYEE' | 'MANAGER' | 'FINANCE' | 'ADMIN';

export interface AuthenticatedUser {
  id: string;
  username: string;
  email: string;
  displayName: string;
  departmentId: string | null;
  departmentName: string | null;
  roles: Role[];
}

export interface LoginRequest {
  username: string;
  password: string;
}
