import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { PaymentMethod } from '../models/payment-method.models';

@Injectable({
  providedIn: 'root'
})
export class PaymentMethodService {
  private baseUrl = `${environment.apiBaseUrl}/payment-methods`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<PaymentMethod[]> {
    return this.http.get<PaymentMethod[]>(this.baseUrl);
  }

  getById(id: number): Observable<PaymentMethod> {
    return this.http.get<PaymentMethod>(`${this.baseUrl}/${id}`);
  }

  create(paymentMethod: PaymentMethod): Observable<PaymentMethod> {
    return this.http.post<PaymentMethod>(this.baseUrl, paymentMethod);
  }

  update(id: number, paymentMethod: PaymentMethod): Observable<PaymentMethod> {
    return this.http.put<PaymentMethod>(`${this.baseUrl}/${id}`, paymentMethod);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
