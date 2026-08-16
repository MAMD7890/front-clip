import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Sale } from '../models/sale.models';

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

@Injectable({
  providedIn: 'root'
})
export class SaleService {
  private baseUrl = `${environment.apiBaseUrl}/sales`;

  constructor(private http: HttpClient) {}

  register(sale: Sale): Observable<Sale> {
    return this.http.post<Sale>(this.baseUrl, sale);
  }

  /** Lista completa sin paginar. Solo para reportes/exportación. */
  getAll(): Observable<Sale[]> {
    return this.http.get<Sale[]>(`${this.baseUrl}/export`);
  }

  /** Lista completa sin paginar filtrada por fecha. Solo para reportes/exportación. */
  getByDateRange(start: string, end: string): Observable<Sale[]> {
    const params = new HttpParams().set('start', start).set('end', end);
    return this.http.get<Sale[]>(`${this.baseUrl}/export`, { params });
  }

  /** Búsqueda paginada (server-side) para listados en pantalla, p.ej. Historial de Ventas. */
  search(
    page: number,
    size: number,
    start?: string,
    end?: string,
    paymentMethod?: string,
    total?: number
  ): Observable<PageResponse<Sale>> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (start) {
      params = params.set('start', start);
    }
    if (end) {
      params = params.set('end', end);
    }
    if (paymentMethod) {
      params = params.set('paymentMethod', paymentMethod);
    }
    if (total != null) {
      params = params.set('total', total);
    }
    return this.http.get<PageResponse<Sale>>(this.baseUrl, { params });
  }
}
