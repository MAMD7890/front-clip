import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ExternalInvoiceItem {
  productId: number;
  productName?: string;
  productCode?: string;
  quantity: number;
  unitPrice?: number;
  totalPrice?: number;
}

export interface ExternalInvoice {
  id?: number;
  invoiceNumber: string;
  description?: string;
  date?: string;
  items: ExternalInvoiceItem[];
  totalValue?: number;
}

export interface ExternalInvoiceSummary {
  totalFacturado: number;
  cantidadFacturas: number;
  cantidadProductos: number;
}

@Injectable({
  providedIn: 'root'
})
export class ExternalInvoiceService {
  private baseUrl = `${environment.apiBaseUrl}/external-invoices`;

  constructor(private http: HttpClient) {}

  register(invoice: ExternalInvoice): Observable<ExternalInvoice> {
    return this.http.post<ExternalInvoice>(this.baseUrl, invoice);
  }

  getAll(): Observable<ExternalInvoice[]> {
    return this.http.get<ExternalInvoice[]>(this.baseUrl);
  }

  getById(id: number): Observable<ExternalInvoice> {
    return this.http.get<ExternalInvoice>(`${this.baseUrl}/${id}`);
  }

  getByPeriod(start: string, end: string): Observable<ExternalInvoice[]> {
    const params = new HttpParams().set('start', start).set('end', end);
    return this.http.get<ExternalInvoice[]>(`${this.baseUrl}/period`, { params });
  }

  getSummary(start: string, end: string): Observable<ExternalInvoiceSummary> {
    const params = new HttpParams().set('start', start).set('end', end);
    return this.http.get<ExternalInvoiceSummary>(`${this.baseUrl}/summary`, { params });
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
