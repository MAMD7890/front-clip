import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Credit, CreditPayment } from '../models/credit.models';

@Injectable({
  providedIn: 'root'
})
export class CreditService {
  private baseUrl = `${environment.apiBaseUrl}/credits`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<Credit[]> {
    return this.http.get<Credit[]>(this.baseUrl);
  }

  getById(id: number): Observable<Credit> {
    return this.http.get<Credit>(`${this.baseUrl}/${id}`);
  }

  getPending(): Observable<Credit[]> {
    return this.http.get<Credit[]>(`${this.baseUrl}/pending`);
  }

  getOverdue(): Observable<Credit[]> {
    return this.http.get<Credit[]>(`${this.baseUrl}/overdue`);
  }

  getByCustomer(customerId: number): Observable<Credit[]> {
    return this.http.get<Credit[]>(`${this.baseUrl}/customer/${customerId}`);
  }

  registerPayment(creditId: number, payment: CreditPayment): Observable<CreditPayment> {
    return this.http.post<CreditPayment>(`${this.baseUrl}/${creditId}/payments`, payment);
  }

  cancel(creditId: number): Observable<Credit> {
    return this.http.put<Credit>(`${this.baseUrl}/${creditId}/cancel`, {});
  }
}
