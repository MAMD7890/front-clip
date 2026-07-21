import { Component, OnInit } from '@angular/core';
import { ReportService, ProfitReport } from '../services/report.service';
import { SaleService } from '../services/sale.service';
import { PaymentMethodService } from '../services/payment-method.service';
import { DateFormatterService } from '../services/date-formatter.service';
import { PaymentMethod } from '../models/payment-method.models';
import { Sale } from '../models/sale.models';

interface PaymentMethodTotal {
  name: string;
  count: number;
  total: number;
}

@Component({
  selector: 'app-reports',
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.css']
})
export class ReportsComponent implements OnInit {
  report: ProfitReport | null = null;
  loading = true;
  error = false;

  activeTab: 'today' | 'week' | 'month' | 'custom' = 'month';

  // Filtros personalizados
  customStart = '';
  customEnd = '';

  // Ordenar tabla de productos
  sortField: 'profit' | 'revenue' | 'quantitySold' = 'profit';
  sortAsc = false;

  // Totales por periodo
  totalToday = 0;
  totalWeek = 0;
  totalMonth = 0;
  loadingTotals = true;

  // Métodos de pago
  paymentMethods: PaymentMethod[] = [];
  paymentMethodTotals: PaymentMethodTotal[] = [];
  selectedPaymentMethod = '';
  loadingPayments = false;

  constructor(
    private reportService: ReportService,
    private saleService: SaleService,
    private paymentMethodService: PaymentMethodService,
    private dateFormatter: DateFormatterService
  ) {}

  ngOnInit(): void {
    this.initDates();
    this.loadReport();
    this.loadPeriodTotals();
    this.loadPaymentMethods();
  }

  initDates(): void {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    this.customStart = this.formatDate(firstDay);
    this.customEnd = this.formatDate(today);
  }

  setTab(tab: 'today' | 'week' | 'month' | 'custom'): void {
    this.activeTab = tab;
    if (tab !== 'custom') {
      this.loadReport();
    }
  }

  loadReport(): void {
    this.loading = true;
    this.error = false;

    let obs;
    switch (this.activeTab) {
      case 'today':
        obs = this.reportService.getProfitToday();
        break;
      case 'week':
        obs = this.reportService.getProfitWeek();
        break;
      case 'month':
        obs = this.reportService.getProfitMonth();
        break;
      case 'custom':
        if (!this.customStart || !this.customEnd) {
          this.loading = false;
          return;
        }
        obs = this.reportService.getProfitByRange(this.customStart, this.customEnd);
        break;
    }

    obs.subscribe({
      next: (data) => {
        this.report = data;
        this.loading = false;
      },
      error: () => {
        this.error = true;
        this.loading = false;
      }
    });
  }

  loadPeriodTotals(): void {
    this.loadingTotals = true;
    let completed = 0;
    const checkDone = () => { completed++; if (completed === 3) this.loadingTotals = false; };

    this.reportService.getProfitToday().subscribe({
      next: (data) => { this.totalToday = data.totalRevenue; checkDone(); },
      error: () => checkDone()
    });

    this.reportService.getProfitWeek().subscribe({
      next: (data) => { this.totalWeek = data.totalRevenue; checkDone(); },
      error: () => checkDone()
    });

    this.reportService.getProfitMonth().subscribe({
      next: (data) => { this.totalMonth = data.totalRevenue; checkDone(); },
      error: () => checkDone()
    });
  }

  loadPaymentMethods(): void {
    this.paymentMethodService.getAll().subscribe({
      next: (methods) => {
        this.paymentMethods = methods;
        this.loadPaymentMethodTotals();
      },
      error: () => {}
    });
  }

  loadPaymentMethodTotals(): void {
    this.loadingPayments = true;

    // Determinar rango de fechas según tab activo
    const now = new Date();
    let start: string;
    let end: string;

    switch (this.activeTab) {
      case 'today':
        start = this.formatDate(now);
        end = this.formatDate(now);
        break;
      case 'week': {
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        start = this.formatDate(weekStart);
        end = this.formatDate(now);
        break;
      }
      case 'custom':
        start = this.customStart;
        end = this.customEnd;
        break;
      default: {
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        start = this.formatDate(monthStart);
        end = this.formatDate(now);
        break;
      }
    }

    const startIso = start + 'T00:00:00';
    const endIso = end + 'T23:59:59';

    this.saleService.getByDateRange(startIso, endIso).subscribe({
      next: (sales) => {
        this.calculatePaymentTotals(sales);
        this.loadingPayments = false;
      },
      error: () => {
        // Fallback: cargar todas las ventas
        this.saleService.getAll().subscribe({
          next: (sales) => {
            this.calculatePaymentTotals(sales);
            this.loadingPayments = false;
          },
          error: () => { this.loadingPayments = false; }
        });
      }
    });
  }

  private calculatePaymentTotals(sales: Sale[]): void {
    const totals: { [key: string]: PaymentMethodTotal } = {};

    for (const sale of sales) {
      if (sale.paymentMethodNames && sale.paymentMethodNames.length > 0) {
        for (const methodName of sale.paymentMethodNames) {
          if (!totals[methodName]) {
            totals[methodName] = { name: methodName, count: 0, total: 0 };
          }
          totals[methodName].count++;
          totals[methodName].total += (sale.totalValue || 0);
        }
      }
    }

    this.paymentMethodTotals = Object.keys(totals).map(k => totals[k]).sort((a, b) => b.total - a.total);
  }

  filterByPaymentMethod(methodName: string): void {
    this.selectedPaymentMethod = this.selectedPaymentMethod === methodName ? '' : methodName;
  }

  searchCustom(): void {
    if (this.customStart && this.customEnd) {
      this.activeTab = 'custom';
      this.loadReport();
      this.loadPaymentMethodTotals();
    }
  }

  onTabChange(): void {
    this.loadPaymentMethodTotals();
  }

  formatCurrency(value: number): string {
    if (value == null) return '$0';
    return '$' + value.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  }

  sortProducts(field: 'profit' | 'revenue' | 'quantitySold'): void {
    if (this.sortField === field) {
      this.sortAsc = !this.sortAsc;
    } else {
      this.sortField = field;
      this.sortAsc = false;
    }
  }

  get sortedProducts() {
    if (!this.report?.productBreakdown) return [];
    const sorted = [...this.report.productBreakdown];
    sorted.sort((a, b) => {
      const valA = a[this.sortField];
      const valB = b[this.sortField];
      return this.sortAsc ? valA - valB : valB - valA;
    });
    return sorted;
  }

  private formatDate(date: Date): string {
    return this.dateFormatter.getColombiaDay(date);
  }
}
