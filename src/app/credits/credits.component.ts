import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CreditService } from '../services/credit.service';
import { DateFormatterService } from '../services/date-formatter.service';
import { PaymentMethodService } from '../services/payment-method.service';
import { Credit, CreditPayment, CustomerCredits } from '../models/credit.models';
import { PaymentMethod } from '../models/payment-method.models';

@Component({
  selector: 'app-credits',
  templateUrl: './credits.component.html',
  styleUrls: ['./credits.component.css']
})
export class CreditsComponent implements OnInit {
  credits: Credit[] = [];
  customerGroups: CustomerCredits[] = [];
  filteredGroups: CustomerCredits[] = [];
  loading = false;
  message: string | null = null;
  messageType: 'success' | 'error' | null = null;

  // Filtros
  searchQuery = '';
  statusFilter = 'ALL';

  // Vista: 'customers' | 'all'
  viewMode: 'customers' | 'all' = 'customers';

  // Detalle de crédito seleccionado
  selectedCredit: Credit | null = null;
  showDetail = false;

  // Modal de abono
  showPaymentForm = false;
  paymentForm: FormGroup;
  paymentCreditId: number | null = null;

  // Resumen
  totalDebt = 0;
  totalOverdue = 0;
  totalCredits = 0;

  paymentMethods: PaymentMethod[] = [];

  constructor(
    private creditService: CreditService,
    private fb: FormBuilder,
    private dateFormatter: DateFormatterService,
    private paymentMethodService: PaymentMethodService
  ) {
    this.paymentForm = this.fb.group({
      amount: ['', [Validators.required, Validators.min(1)]],
      paymentMethod: ['', Validators.required],
      notes: ['']
    });
  }

  ngOnInit() {
    this.loadCredits();
    this.loadPaymentMethods();
  }

  loadPaymentMethods() {
    this.paymentMethodService.getAll().subscribe({
      next: (data) => (this.paymentMethods = data),
      error: () => (this.paymentMethods = [])
    });
  }

  loadCredits() {
    this.loading = true;
    this.creditService.getAll().subscribe({
      next: (data) => {
        this.credits = data;
        this.buildCustomerGroups();
        this.calculateSummary();
        this.applyFilters();
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.showMessage('Error cargando créditos', 'error');
        console.error(err);
      }
    });
  }

  buildCustomerGroups() {
    const map = new Map<number, CustomerCredits>();
    for (const credit of this.credits) {
      const cid = credit.customerId;
      if (!map.has(cid)) {
        map.set(cid, {
          customerId: cid,
          customerName: credit.customerName || 'Sin nombre',
          credits: [],
          totalDebt: 0,
          totalPaid: 0
        });
      }
      const group = map.get(cid)!;
      group.credits.push(credit);
      if (credit.status !== 'CANCELLED') {
        group.totalDebt += credit.remainingAmount || 0;
      }
      group.totalPaid += credit.paidAmount || 0;
    }
    this.customerGroups = Array.from(map.values());
    // Ordenar por deuda mayor primero
    this.customerGroups.sort((a, b) => b.totalDebt - a.totalDebt);
  }

  calculateSummary() {
    this.totalCredits = this.credits.length;
    this.totalDebt = this.credits
      .filter(c => c.status !== 'CANCELLED')
      .reduce((sum, c) => sum + (c.remainingAmount || 0), 0);
    this.totalOverdue = this.credits.filter(c => c.status === 'OVERDUE').length;
  }

  applyFilters() {
    let groups = this.customerGroups.map(g => ({
      ...g,
      credits: g.credits.filter(c => {
        if (this.statusFilter !== 'ALL' && c.status !== this.statusFilter) return false;
        return true;
      })
    })).filter(g => g.credits.length > 0);

    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      groups = groups.filter(g =>
        g.customerName.toLowerCase().includes(q) ||
        g.credits.some(c => c.saleId?.toString().includes(q))
      );
    }

    // Recalcular totales filtrados
    groups.forEach(g => {
      g.totalDebt = g.credits
        .filter(c => c.status !== 'CANCELLED')
        .reduce((s, c) => s + (c.remainingAmount || 0), 0);
      g.totalPaid = g.credits.reduce((s, c) => s + (c.paidAmount || 0), 0);
    });

    this.filteredGroups = groups;
  }

  onFilterChange() {
    this.applyFilters();
  }

  // ====== DETALLE DE CRÉDITO ======

  viewCreditDetail(credit: Credit) {
    this.loading = true;
    this.creditService.getById(credit.id!).subscribe({
      next: (full) => {
        this.selectedCredit = full;
        this.showDetail = true;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.showMessage('Error cargando detalle del crédito', 'error');
      }
    });
  }

  closeDetail() {
    this.showDetail = false;
    this.selectedCredit = null;
  }

  // ====== REGISTRAR ABONO ======

  openPaymentForm(creditId: number) {
    this.paymentCreditId = creditId;
    this.showPaymentForm = true;
    this.paymentForm.reset({ paymentMethod: this.paymentMethods[0]?.name || '' });
  }

  cancelPayment() {
    this.showPaymentForm = false;
    this.paymentCreditId = null;
    this.paymentForm.reset();
  }

  submitPayment() {
    if (this.paymentForm.invalid || !this.paymentCreditId) return;

    this.loading = true;
    const payment: CreditPayment = this.paymentForm.value;

    this.creditService.registerPayment(this.paymentCreditId, payment).subscribe({
      next: () => {
        this.showMessage('Abono registrado correctamente', 'success');
        this.showPaymentForm = false;
        this.paymentCreditId = null;
        this.loading = false;
        // Recargar todo
        this.loadCredits();
        // Recargar detalle si está abierto
        if (this.selectedCredit && this.selectedCredit.id === this.paymentCreditId) {
          this.viewCreditDetail(this.selectedCredit);
        }
      },
      error: (err) => {
        this.loading = false;
        const msg = err.error?.message || err.error?.error || 'Error registrando abono';
        this.showMessage(msg, 'error');
      }
    });
  }

  // ====== CANCELAR CRÉDITO ======

  cancelCredit(credit: Credit) {
    if (!confirm(`¿Cancelar crédito #${credit.id} de ${credit.customerName}?`)) return;
    this.loading = true;
    this.creditService.cancel(credit.id!).subscribe({
      next: () => {
        this.showMessage('Crédito cancelado', 'success');
        this.loading = false;
        this.loadCredits();
        if (this.showDetail) this.closeDetail();
      },
      error: () => {
        this.loading = false;
        this.showMessage('Error cancelando crédito', 'error');
      }
    });
  }

  // ====== UTILIDADES ======

  getStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      'PENDING': 'Pendiente',
      'PARTIALLY_PAID': 'Parcial',
      'PAID': 'Pagado',
      'OVERDUE': 'Vencido',
      'CANCELLED': 'Cancelado'
    };
    return labels[status] || status;
  }

  getStatusClass(status: string): string {
    const classes: { [key: string]: string } = {
      'PENDING': 'status-pending',
      'PARTIALLY_PAID': 'status-partial',
      'PAID': 'status-paid',
      'OVERDUE': 'status-overdue',
      'CANCELLED': 'status-cancelled'
    };
    return classes[status] || '';
  }

  formatCurrency(value: number): string {
    if (value == null) return '$0';
    return '$' + value.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  }

  formatDate(date: string | undefined): string {
    if (!date) return '—';
    return this.dateFormatter.formatDate(date, 'short');
  }

  formatDateTime(date: string | undefined): string {
    if (!date) return '—';
    return this.dateFormatter.formatDate(date, 'datetime');
  }

  getProgressPercent(credit: Credit): number {
    if (!credit.totalAmount || credit.totalAmount === 0) return 0;
    return Math.min(100, Math.round((credit.paidAmount / credit.totalAmount) * 100));
  }

  onOverlayClick(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      if (this.showPaymentForm) this.cancelPayment();
      else if (this.showDetail) this.closeDetail();
    }
  }

  private showMessage(msg: string, type: 'success' | 'error') {
    this.message = msg;
    this.messageType = type;
    setTimeout(() => { this.message = null; this.messageType = null; }, 5000);
  }
}
