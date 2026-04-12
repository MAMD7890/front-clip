import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface DashboardStats {
  salesToday: number;
  salesWeek: number;
  salesMonth: number;
  revenueToday: number;
  revenueWeek: number;
  revenueMonth: number;
  activeCredits: number;
  overdueCredits: number;
  totalPendingDebt: number;
  totalOverdueDebt: number;
  creditsDueSoon: number;
  totalProducts: number;
  lowStockProducts: number;
  totalCustomers: number;
  topDebtors: DebtorInfo[];
  lowStockList: LowStockInfo[];
  recentSales: RecentSaleInfo[];
}

export interface DebtorInfo {
  customerId: number;
  customerName: string;
  totalDebt: number;
  activeCreditsCount: number;
  overdueCreditsCount: number;
}

export interface LowStockInfo {
  productId: number;
  productName: string;
  productCode: string;
  stockActual: number;
  stockMin: number;
}

export interface RecentSaleInfo {
  saleId: number;
  customerName: string;
  totalValue: number;
  date: string;
  itemCount: number;
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private baseUrl = `${environment.apiBaseUrl}/dashboard`;

  constructor(private http: HttpClient) {}

  getStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(this.baseUrl);
  }
}
