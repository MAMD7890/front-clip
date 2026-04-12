/**
 * Modelos de Autenticación
 */

export interface AuthRequest {
  username: string;
  password: string;
}

export interface AuthResponse {
  token: string;
}

export interface ValidationError {
  [key: string]: string;
}

export interface AuthenticatedUser {
  username: string;
  isAuthenticated: boolean;
}
