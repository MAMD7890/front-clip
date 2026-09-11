import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Worker, WorkerPayment, WorkerPaymentType } from '../models/worker.models';
import { PageResponse } from './sale.service';

@Injectable({
  providedIn: 'root'
})
export class WorkerService {
  private baseUrl = `${environment.apiBaseUrl}/workers`;

  constructor(private http: HttpClient) {}

  create(worker: Partial<Worker>): Observable<Worker> {
    return this.http.post<Worker>(this.baseUrl, worker);
  }

  update(id: number, worker: Partial<Worker>): Observable<Worker> {
    return this.http.put<Worker>(`${this.baseUrl}/${id}`, worker);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  getById(id: number): Observable<Worker> {
    return this.http.get<Worker>(`${this.baseUrl}/${id}`);
  }

  /** Lista de trabajadores con sus totales (pagado/adelantado) ya calculados. */
  getAll(): Observable<Worker[]> {
    return this.http.get<Worker[]>(this.baseUrl);
  }

  registerPayment(workerId: number, payment: { type: WorkerPaymentType; amount: number; description?: string }): Observable<WorkerPayment> {
    return this.http.post<WorkerPayment>(`${this.baseUrl}/${workerId}/payments`, payment);
  }

  deletePayment(paymentId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/payments/${paymentId}`);
  }

  /** Historial de pagos/adelantos, paginado. Omite workerId para traer los de todos los trabajadores. */
  searchPayments(
    page: number,
    size: number,
    workerId?: number,
    type?: WorkerPaymentType,
    start?: string,
    end?: string
  ): Observable<PageResponse<WorkerPayment>> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (workerId != null) {
      params = params.set('workerId', workerId);
    }
    if (type) {
      params = params.set('type', type);
    }
    if (start) {
      params = params.set('start', start);
    }
    if (end) {
      params = params.set('end', end);
    }
    return this.http.get<PageResponse<WorkerPayment>>(`${this.baseUrl}/payments`, { params });
  }

  /** Suma total de los pagos que coinciden con los mismos filtros de searchPayments. */
  getPaymentsTotal(workerId?: number, type?: WorkerPaymentType, start?: string, end?: string): Observable<number> {
    let params = new HttpParams();
    if (workerId != null) {
      params = params.set('workerId', workerId);
    }
    if (type) {
      params = params.set('type', type);
    }
    if (start) {
      params = params.set('start', start);
    }
    if (end) {
      params = params.set('end', end);
    }
    return this.http.get<number>(`${this.baseUrl}/payments/total`, { params });
  }
}
