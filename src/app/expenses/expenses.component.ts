import { Component, OnInit } from '@angular/core';
import { CashMovementDto } from '../models/cash-register.models';
import { CashRegisterService } from '../services/cash-register.service';
import { DateFormatterService } from '../services/date-formatter.service';

@Component({
  selector: 'app-expenses',
  templateUrl: './expenses.component.html',
  styleUrls: ['./expenses.component.css']
})
export class ExpensesComponent implements OnInit {
  expenses: CashMovementDto[] = [];
  loading = false;

  startDate = '';
  endDate = '';
  descriptionFilter = '';

  message: string | null = null;
  messageType: 'success' | 'error' | null = null;

  // Paginación (server-side)
  currentPage = 1;
  pageSize = 20;
  totalPages = 0;
  totalElements = 0;
  totalAmount = 0;

  private filterDebounce: any = null;

  constructor(
    private cashService: CashRegisterService,
    private dateFormatter: DateFormatterService
  ) {}

  ngOnInit(): void {
    this.loadExpenses();
  }

  loadExpenses(): void {
    this.loading = true;
    const start = this.startDate ? this.toIso8601(this.startDate) : undefined;
    const end = this.endDate ? this.toIso8601(this.endDate) : undefined;
    const description = this.descriptionFilter.trim() || undefined;

    this.cashService.searchMovements('EXPENSE', this.currentPage - 1, this.pageSize, start, end, description).subscribe({
      next: (page) => {
        this.expenses = page.content;
        this.totalPages = page.totalPages;
        this.totalElements = page.totalElements;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.showMessage('No fue posible cargar los gastos', 'error');
      }
    });

    this.cashService.getMovementsTotal('EXPENSE', start, end, description).subscribe({
      next: (total) => (this.totalAmount = total),
      error: () => (this.totalAmount = 0)
    });
  }

  applyFilters(): void {
    this.currentPage = 1;
    this.loadExpenses();
  }

  /** Los filtros de texto se debouncen para no disparar una petición por cada tecla. */
  onFilterInput(): void {
    if (this.filterDebounce) {
      clearTimeout(this.filterDebounce);
    }
    this.filterDebounce = setTimeout(() => this.applyFilters(), 400);
  }

  clearFilters(): void {
    this.startDate = '';
    this.endDate = '';
    this.descriptionFilter = '';
    this.currentPage = 1;
    this.loadExpenses();
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
      this.currentPage = page;
      this.loadExpenses();
    }
  }

  get pages(): number[] {
    const maxPagesToShow = 3;
    const start = Math.max(1, this.currentPage - 1);
    const end = Math.min(this.totalPages, this.currentPage + 1);
    const pages: number[] = [];
    for (let i = start; i <= end && pages.length < maxPagesToShow; i++) {
      pages.push(i);
    }
    return pages;
  }

  get visibleRange(): string {
    if (this.totalElements === 0) {
      return '0';
    }
    const start = (this.currentPage - 1) * this.pageSize + 1;
    const end = Math.min(this.currentPage * this.pageSize, this.totalElements);
    return `${start} - ${end} de ${this.totalElements}`;
  }

  formatDate(dateStr: string | null | undefined): string {
    if (!dateStr) {
      return '—';
    }
    return this.dateFormatter.formatDate(dateStr, 'datetime');
  }

  formatPrice(value: number | null | undefined): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(value || 0);
  }

  private toIso8601(input: string): string {
    return input.includes(':') && input.length === 16 ? input + ':00' : input;
  }

  private showMessage(message: string, type: 'success' | 'error'): void {
    this.message = message;
    this.messageType = type;
    setTimeout(() => {
      this.message = null;
      this.messageType = null;
    }, 5000);
  }
}
