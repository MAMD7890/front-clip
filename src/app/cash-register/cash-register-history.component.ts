import { Component, OnInit } from '@angular/core';
import { CashRegisterDto, MovementType } from '../models/cash-register.models';
import { CashRegisterService } from '../services/cash-register.service';
import { DateFormatterService } from '../services/date-formatter.service';

@Component({
  selector: 'app-cash-register-history',
  templateUrl: './cash-register-history.component.html',
  styleUrls: ['./cash-register-history.component.css']
})
export class CashRegisterHistoryComponent implements OnInit {
  cajas: CashRegisterDto[] = [];
  loading = true;
  expandedCajas: { [key: number]: boolean } = {};
  loadingDetail: { [key: number]: boolean } = {};
  downloadingCajas: { [key: number]: boolean } = {};
  message: string | null = null;
  messageType: 'success' | 'error' | null = null;

  // Paginación (server-side)
  currentPage = 1;
  pageSize = 20;
  totalPages = 0;
  totalElements = 0;

  constructor(
    private cashService: CashRegisterService,
    private dateFormatter: DateFormatterService
  ) {}

  ngOnInit(): void {
    this.loadHistory();
  }

  loadHistory(): void {
    this.loading = true;
    this.cashService.getAll(this.currentPage - 1, this.pageSize).subscribe({
      next: (page) => {
        this.cajas = page.content;
        this.totalPages = page.totalPages;
        this.totalElements = page.totalElements;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.showMessage('No fue posible cargar el historial de cajas', 'error');
      }
    });
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
      this.currentPage = page;
      this.loadHistory();
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

  /** El detalle (movimientos) de cada caja se trae solo al abrirlo, no de una vez para toda la lista. */
  toggleDetail(caja: CashRegisterDto): void {
    if (!caja.id) {
      return;
    }
    if (this.expandedCajas[caja.id]) {
      this.expandedCajas[caja.id] = false;
      return;
    }

    this.expandedCajas[caja.id] = true;
    if (caja.movements && caja.movements.length > 0) {
      return; // ya se había cargado antes
    }

    this.loadingDetail[caja.id] = true;
    this.cashService.getById(caja.id).subscribe({
      next: (full) => {
        Object.assign(caja, full);
        this.loadingDetail[caja.id!] = false;
      },
      error: () => {
        this.loadingDetail[caja.id!] = false;
        this.showMessage('No fue posible cargar el detalle de la caja', 'error');
      }
    });
  }

  isExpanded(id: number): boolean {
    return !!this.expandedCajas[id];
  }

  getStatusLabel(status: string): string {
    return status === 'OPEN' ? 'Abierta' : 'Cerrada';
  }

  getMovementTypeLabel(type: MovementType): string {
    const labels: Record<MovementType, string> = {
      SALE: 'Venta',
      INCOME: 'Ingreso',
      EXPENSE: 'Gasto',
      WITHDRAWAL: 'Retiro'
    };
    return labels[type] || type;
  }

  getMovementSign(type: MovementType): string {
    return type === 'EXPENSE' || type === 'WITHDRAWAL' ? '-' : '+';
  }

  getDifferenceIconClass(diff: number | null): string {
    if (diff === null) return '';
    if (diff === 0) return 'fa fa-check-circle';
    if (diff > 0) return 'fa fa-exclamation-triangle';
    return 'fa fa-times-circle';
  }

  formatPrice(value: number | null | undefined): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(value || 0);
  }

  formatDate(dateStr: string | null): string {
    if (!dateStr) return '—';
    return this.dateFormatter.formatDate(dateStr, 'datetime');
  }

  formatTime(dateStr: string | null | undefined): string {
    if (!dateStr) return '';
    return this.dateFormatter.formatDate(dateStr, 'time');
  }

  downloadReport(cajaId: number): void {
    if (!cajaId) return;

    this.downloadingCajas[cajaId] = true;
    this.cashService.downloadCloseReport(cajaId).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'cierre-caja-' + cajaId + '.pdf';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        this.downloadingCajas[cajaId] = false;
        this.showMessage('PDF descargado correctamente', 'success');
      },
      error: () => {
        this.downloadingCajas[cajaId] = false;
        this.showMessage('Error al descargar el PDF', 'error');
      }
    });
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
