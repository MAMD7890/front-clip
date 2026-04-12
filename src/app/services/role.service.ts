import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface RoleDto {
  id?: number;
  name: string;
  modules: string[];
}

@Injectable({
  providedIn: 'root'
})
export class RoleService {
  private baseUrl = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  getAll(): Observable<RoleDto[]> {
    return this.http.get<RoleDto[]>(`${this.baseUrl}/roles`);
  }

  getById(id: number): Observable<RoleDto> {
    return this.http.get<RoleDto>(`${this.baseUrl}/roles/${id}`);
  }

  create(role: RoleDto): Observable<RoleDto> {
    return this.http.post<RoleDto>(`${this.baseUrl}/roles`, role);
  }

  update(id: number, role: RoleDto): Observable<RoleDto> {
    return this.http.put<RoleDto>(`${this.baseUrl}/roles/${id}`, role);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/roles/${id}`);
  }
}
