import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { AuthRequest, AuthResponse } from '../models/auth.models';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private baseUrl = environment.apiBaseUrl; // Usar URL del environment

  constructor(private http: HttpClient) {}

  /**
   * Inicia sesión con usuario y contraseña
   */
  login(username: string, password: string): Observable<AuthResponse> {
    const request: AuthRequest = { username, password };
    return this.http.post<AuthResponse>(`${this.baseUrl}/auth/login`, request).pipe(
      tap(res => {
        localStorage.setItem('token', res.token);
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Registra un nuevo usuario
   */
  register(username: string, password: string): Observable<AuthResponse> {
    const request: AuthRequest = { username, password };
    return this.http.post<AuthResponse>(`${this.baseUrl}/auth/register`, request).pipe(
      tap(res => {
        localStorage.setItem('token', res.token);
      }),
      catchError(this.handleError)
    );
  }

  logout() {
    localStorage.removeItem('token');
  }

  /**
   * Cambia la contraseña del usuario
   */
  changePassword(currentPassword: string, newPassword: string): Observable<{ message: string }> {
    const request = { currentPassword, newPassword };
    return this.http.post<{ message: string }>(`${this.baseUrl}/auth/change-password`, request).pipe(
      catchError(this.handleError)
    );
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  /** Decode JWT payload without external library */
  private decodeToken(): any {
    const token = this.getToken();
    if (!token) return null;
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      return JSON.parse(atob(payload));
    } catch (e) {
      return null;
    }
  }

  getUsername(): string {
    const decoded = this.decodeToken();
    return decoded ? decoded.sub : '';
  }

  getRoles(): string[] {
    const decoded = this.decodeToken();
    if (!decoded || !decoded.roles) return [];
    return decoded.roles.split(',').filter((r: string) => r.length > 0);
  }

  getModules(): string[] {
    const decoded = this.decodeToken();
    if (!decoded || !decoded.modules) return [];
    return decoded.modules.split(',').filter((m: string) => m.length > 0);
  }

  /** Returns true if modules claim exists in the token */
  hasModulesClaim(): boolean {
    const decoded = this.decodeToken();
    return decoded && decoded.modules !== undefined && decoded.modules !== null;
  }

  isAdmin(): boolean {
    // If token has no modules claim (old token), treat as admin for backwards compat
    if (!this.hasModulesClaim()) return true;
    const modules = this.getModules();
    return modules.indexOf('*') >= 0;
  }

  hasModule(moduleKey: string): boolean {
    if (this.isAdmin()) return true;
    return this.getModules().indexOf(moduleKey) >= 0;
  }

  /**
   * Manejo de errores HTTP
   */
  private handleError(error: HttpErrorResponse) {
    let errorObj = {
      error: 'Ocurrió un error. Intenta de nuevo.',
      status: error.status
    };

    if (error.error instanceof ErrorEvent) {
      // Error del lado del cliente
      errorObj.error = error.error.message;
    } else {
      // Error del backend
      errorObj.error = error.error?.error || error.error?.message || 'Error en el servidor';
    }

    return throwError(() => errorObj);
  }
}
