import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { CashRegisterDto, CashMovementDto } from '../models/cash-register.models';

@Injectable({
  providedIn: 'root'
})
export class CashRegisterService {
  private baseUrl = `${environment.apiBaseUrl}/cash-register`;

  constructor(private http: HttpClient) {}

  open(openingAmount: number): Observable<CashRegisterDto> {
    return this.http.post<CashRegisterDto>(`${this.baseUrl}/open`, { openingAmount });
  }

  close(closingAmount: number): Observable<CashRegisterDto> {
    return this.http.post<CashRegisterDto>(`${this.baseUrl}/close`, { closingAmount });
  }

  getCurrent(): Observable<CashRegisterDto | null> {
    return this.http.get<CashRegisterDto>(`${this.baseUrl}/current`, { observe: 'response' }).pipe(
      map((response: HttpResponse<CashRegisterDto>) => {
        if (response.status === 204 || !response.body) {
          return null;
        }
        return response.body;
      }),
      catchError(() => of(null))
    );
  }

  getById(id: number): Observable<CashRegisterDto> {
    return this.http.get<CashRegisterDto>(`${this.baseUrl}/${id}`);
  }

  getAll(): Observable<CashRegisterDto[]> {
    return this.http.get<CashRegisterDto[]>(this.baseUrl);
  }

  addMovement(movement: Partial<CashMovementDto>): Observable<CashMovementDto> {
    return this.http.post<CashMovementDto>(`${this.baseUrl}/movement`, movement);
  }

  downloadCloseReport(id: number): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/${id}/close-report`, { responseType: 'blob' });
  }
}
