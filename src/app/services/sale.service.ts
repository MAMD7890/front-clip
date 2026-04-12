import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Sale } from '../models/sale.models';

@Injectable({
  providedIn: 'root'
})
export class SaleService {
  private baseUrl = `${environment.apiBaseUrl}/sales`;

  constructor(private http: HttpClient) {}

  register(sale: Sale): Observable<Sale> {
    return this.http.post<Sale>(this.baseUrl, sale);
  }

  getAll(): Observable<Sale[]> {
    return this.http.get<Sale[]>(this.baseUrl);
  }

  getByDateRange(start: string, end: string): Observable<Sale[]> {
    const params = new HttpParams().set('start', start).set('end', end);
    return this.http.get<Sale[]>(this.baseUrl, { params });
  }
}
