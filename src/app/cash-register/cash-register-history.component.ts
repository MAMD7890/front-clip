import { Component, OnInit } from '@angular/core';
import { CashRegisterDto, MovementType } from '../models/cash-register.models';
import { CashRegisterService } from '../services/cash-register.service';

@Component({
  selector: 'app-cash-register-history',
  templateUrl: './cash-register-history.component.html',
  styleUrls: ['./cash-register-history.component.css']
})
export class CashRegisterHistoryComponent implements OnInit {
  cajas: CashRegisterDto[] = [];
  loading = true;
  expandedCajas: { [key: number]: boolean } = {};
  message: string | null = null;
  messageType: 'success' | 'error' | null = null;

  constructor(private cashService: CashRegisterService) {}

  ngOnInit(): void {
    this.loadHistory();
  }

  loadHistory(): void {
    this.loading = true;
    this.cashService.getAll().subscribe({
      next: (data) => {
        this.cajas = data;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.showMessage('No fue posible cargar el historial de cajas', 'error');
      }
    });
  }

  toggleDetail(id: number): void {
    this.expandedCajas[id] = !this.expandedCajas[id];
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
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleString('es-CO');
  }

  formatTime(dateStr: string | null | undefined): string {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
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
