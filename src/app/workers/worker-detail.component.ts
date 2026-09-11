import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Worker, WorkerPayment, WorkerPaymentType } from '../models/worker.models';
import { WorkerService } from '../services/worker.service';
import { DateFormatterService } from '../services/date-formatter.service';

@Component({
  selector: 'app-worker-detail',
  templateUrl: './worker-detail.component.html',
  styleUrls: ['./worker-detail.component.css']
})
export class WorkerDetailComponent implements OnInit {
  workerId!: number;
  worker: Worker | null = null;
  payments: WorkerPayment[] = [];
  loading = false;

  startDate = '';
  endDate = '';
  typeFilter: WorkerPaymentType | 'ALL' = 'ALL';

  // Paginación (server-side)
  currentPage = 1;
  pageSize = 20;
  totalPages = 0;
  totalElements = 0;

  // Modal registrar pago/adelanto
  showPaymentForm = false;
  paymentType: WorkerPaymentType = 'PAYMENT';
  paymentAmount: number | null = null;
  paymentDescription = '';
  submitting = false;

  message: string | null = null;
  messageType: 'success' | 'error' | null = null;

  constructor(
    private route: ActivatedRoute,
    private workerService: WorkerService,
    private dateFormatter: DateFormatterService
  ) {}

  ngOnInit(): void {
    this.workerId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadWorker();
    this.loadPayments();
  }

  loadWorker(): void {
    this.workerService.getById(this.workerId).subscribe({
      next: (data) => (this.worker = data),
      error: () => this.showMessage('No fue posible cargar el trabajador', 'error')
    });
  }

  loadPayments(): void {
    this.loading = true;
    const start = this.startDate ? this.toIso8601(this.startDate) : undefined;
    const end = this.endDate ? this.toIso8601(this.endDate) : undefined;
    const type = this.typeFilter === 'ALL' ? undefined : this.typeFilter;

    this.workerService.searchPayments(this.currentPage - 1, this.pageSize, this.workerId, type, start, end).subscribe({
      next: (page) => {
        this.payments = page.content;
        this.totalPages = page.totalPages;
        this.totalElements = page.totalElements;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.showMessage('No fue posible cargar los pagos', 'error');
      }
    });
  }

  applyFilters(): void {
    this.currentPage = 1;
    this.loadPayments();
  }

  clearFilters(): void {
    this.startDate = '';
    this.endDate = '';
    this.typeFilter = 'ALL';
    this.currentPage = 1;
    this.loadPayments();
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
      this.currentPage = page;
      this.loadPayments();
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

  // === REGISTRAR PAGO / ADELANTO ===
  openPaymentForm(type: WorkerPaymentType): void {
    this.paymentType = type;
    this.paymentAmount = null;
    this.paymentDescription = '';
    this.showPaymentForm = true;
  }

  cancelPaymentForm(): void {
    this.showPaymentForm = false;
  }

  submitPayment(): void {
    if (!this.paymentAmount || this.paymentAmount <= 0) {
      this.showMessage('Ingresa un monto válido', 'error');
      return;
    }

    this.submitting = true;
    this.workerService.registerPayment(this.workerId, {
      type: this.paymentType,
      amount: this.paymentAmount,
      description: this.paymentDescription || undefined
    }).subscribe({
      next: () => {
        this.submitting = false;
        this.showPaymentForm = false;
        this.showMessage(this.paymentType === 'PAYMENT' ? 'Pago registrado correctamente' : 'Adelanto registrado correctamente', 'success');
        this.loadWorker();
        this.currentPage = 1;
        this.loadPayments();
      },
      error: () => {
        this.submitting = false;
        this.showMessage('No fue posible registrar el movimiento', 'error');
      }
    });
  }

  deletePayment(payment: WorkerPayment): void {
    if (!payment.id) {
      return;
    }
    if (!confirm('¿Seguro que deseas eliminar este registro?')) {
      return;
    }
    this.workerService.deletePayment(payment.id).subscribe({
      next: () => {
        this.showMessage('Registro eliminado correctamente', 'success');
        this.loadWorker();
        this.loadPayments();
      },
      error: () => this.showMessage('No fue posible eliminar el registro', 'error')
    });
  }

  getTypeLabel(type: WorkerPaymentType): string {
    return type === 'PAYMENT' ? 'Pago' : 'Adelanto';
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
