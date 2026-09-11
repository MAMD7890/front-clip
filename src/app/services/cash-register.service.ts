import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { CashRegisterDto, CashMovementDto, MovementType } from '../models/cash-register.models';
import { PageResponse } from './sale.service';

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

  /** Historial de movimientos (todas las cajas), paginado y filtrable — usado por el módulo de Gastos. */
  searchMovements(
    type: MovementType,
    page: number,
    size: number,
    start?: string,
    end?: string,
    description?: string
  ): Observable<PageResponse<CashMovementDto>> {
    let params = new HttpParams().set('type', type).set('page', page).set('size', size);
    if (start) {
      params = params.set('start', start);
    }
    if (end) {
      params = params.set('end', end);
    }
    if (description) {
      params = params.set('description', description);
    }
    return this.http.get<PageResponse<CashMovementDto>>(`${this.baseUrl}/movements`, { params });
  }

  /** Suma total de los movimientos que coinciden con los mismos filtros de searchMovements. */
  getMovementsTotal(type: MovementType, start?: string, end?: string, description?: string): Observable<number> {
    let params = new HttpParams().set('type', type);
    if (start) {
      params = params.set('start', start);
    }
    if (end) {
      params = params.set('end', end);
    }
    if (description) {
      params = params.set('description', description);
    }
    return this.http.get<number>(`${this.baseUrl}/movements/total`, { params });
  }
}
