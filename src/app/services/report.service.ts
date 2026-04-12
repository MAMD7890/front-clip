import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ProfitReport {
  periodLabel: string;
  startDate: string;
  endDate: string;
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  profitMargin: number;
  saleCount: number;
  totalItemsSold: number;
  productBreakdown: ProductProfitInfo[];
  dailyBreakdown: DailyProfitInfo[];
}

export interface ProductProfitInfo {
  productId: number;
  productName: string;
  productCode: string;
  quantitySold: number;
  revenue: number;
  cost: number;
  profit: number;
  profitMargin: number;
}

export interface DailyProfitInfo {
  date: string;
  saleCount: number;
  revenue: number;
  cost: number;
  profit: number;
}

@Injectable({
  providedIn: 'root'
})
export class ReportService {
  private baseUrl = `${environment.apiBaseUrl}/reports`;

  constructor(private http: HttpClient) {}

  getProfitToday(): Observable<ProfitReport> {
    return this.http.get<ProfitReport>(`${this.baseUrl}/profit/today`);
  }

  getProfitWeek(): Observable<ProfitReport> {
    return this.http.get<ProfitReport>(`${this.baseUrl}/profit/week`);
  }

  getProfitMonth(): Observable<ProfitReport> {
    return this.http.get<ProfitReport>(`${this.baseUrl}/profit/month`);
  }

  getProfitByRange(start: string, end: string): Observable<ProfitReport> {
    const params = new HttpParams().set('start', start).set('end', end);
    return this.http.get<ProfitReport>(`${this.baseUrl}/profit`, { params });
  }
}
