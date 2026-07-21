import { Component, OnInit, OnDestroy } from '@angular/core';
import { CashRegisterDto, CashMovementDto, MovementType } from '../models/cash-register.models';
import { CashRegisterService } from '../services/cash-register.service';
import { DateFormatterService } from '../services/date-formatter.service';
import { interval, Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-cash-register',
  templateUrl: './cash-register.component.html',
  styleUrls: ['./cash-register.component.css']
})
export class CashRegisterComponent implements OnInit, OnDestroy {
  cashRegister: CashRegisterDto | null = null;
  loading = true;

  // Apertura
  openingAmount: number | null = null;

  // Cierre
  showCloseModal = false;
  closingAmount: number | null = null;
  closedCashRegisterData: CashRegisterDto | null = null;

  // Movimiento
  showMovementModal = false;
  movementType: MovementType = 'INCOME';
  movementAmount: number | null = null;
  movementDescription = '';

  message: string | null = null;
  messageType: 'success' | 'error' | null = null;
  submitting = false;
  downloadingPdf = false;

  private refreshSub: Subscription | null = null;

  constructor(
    private cashService: CashRegisterService,
    private dateFormatter: DateFormatterService
  ) {}

  ngOnInit(): void {
    this.loadCurrent();
  }

  ngOnDestroy(): void {
    this.stopAutoRefresh();
  }

  loadCurrent(): void {
    this.loading = true;
    this.cashService.getCurrent().subscribe({
      next: (data) => {
        this.cashRegister = data;
        this.loading = false;
        if (data) {
          this.startAutoRefresh();
        } else {
          this.stopAutoRefresh();
        }
      },
      error: () => {
        this.cashRegister = null;
        this.loading = false;
      }
    });
  }

  // === ABRIR CAJA ===
  openCashRegister(): void {
    if (!this.openingAmount || this.openingAmount < 0) {
      this.showMessage('Ingresa un monto inicial v\u00e1lido', 'error');
      return;
    }

    this.submitting = true;
    this.cashService.open(this.openingAmount).subscribe({
      next: (data) => {
        this.cashRegister = data;
        this.openingAmount = null;
        this.submitting = false;
        this.closedCashRegisterData = null;
        this.showMessage('Caja abierta correctamente', 'success');
        this.startAutoRefresh();
      },
      error: (err) => {
        this.submitting = false;
        const msg = err?.error?.error || err?.error?.message || 'No fue posible abrir la caja';
        this.showMessage(msg, 'error');
      }
    });
  }

  // === CERRAR CAJA ===
  openCloseModal(): void {
    this.closingAmount = null;
    this.showCloseModal = true;
  }

  cancelClose(): void {
    this.showCloseModal = false;
    this.closingAmount = null;
  }

  getCloseDifference(): number {
    if (!this.closingAmount || !this.cashRegister) return 0;
    return this.closingAmount - this.cashRegister.expectedAmount;
  }

  closeCashRegister(): void {
    if (this.closingAmount === null || this.closingAmount < 0) {
      this.showMessage('Ingresa el monto contado', 'error');
      return;
    }

    this.submitting = true;
    this.cashService.close(this.closingAmount).subscribe({
      next: (data) => {
        this.closedCashRegisterData = data;
        this.cashRegister = null;
        this.showCloseModal = false;
        this.closingAmount = null;
        this.submitting = false;
        this.stopAutoRefresh();
        this.showMessage(
          'Caja cerrada correctamente. Diferencia: ' + this.formatPrice(data.difference || 0),
          'success'
        );
      },
      error: (err) => {
        this.submitting = false;
        const msg = err?.error?.error || err?.error?.message || 'No fue posible cerrar la caja';
        this.showMessage(msg, 'error');
      }
    });
  }

  // === DESCARGAR PDF DE CIERRE ===
  downloadCloseReport(): void {
    if (!this.closedCashRegisterData?.id) return;
    this.downloadingPdf = true;
    this.cashService.downloadCloseReport(this.closedCashRegisterData.id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'cierre-caja-' + this.closedCashRegisterData!.id + '.pdf';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        this.downloadingPdf = false;
        this.showMessage('PDF descargado correctamente', 'success');
      },
      error: () => {
        this.downloadingPdf = false;
        this.showMessage('Error al descargar el PDF', 'error');
      }
    });
  }

  dismissCloseReport(): void {
    this.closedCashRegisterData = null;
  }

  // === MOVIMIENTOS ===
  openMovementModal(): void {
    this.movementType = 'INCOME';
    this.movementAmount = null;
    this.movementDescription = '';
    this.showMovementModal = true;
  }

  cancelMovement(): void {
    this.showMovementModal = false;
  }

  saveMovement(): void {
    if (!this.movementAmount || this.movementAmount <= 0) {
      this.showMessage('Ingresa un monto v\u00e1lido', 'error');
      return;
    }

    this.submitting = true;
    this.cashService.addMovement({
      type: this.movementType,
      amount: this.movementAmount,
      description: this.movementDescription || undefined
    }).subscribe({
      next: () => {
        this.submitting = false;
        this.showMovementModal = false;
        this.showMessage('Movimiento registrado correctamente', 'success');
        this.loadCurrent();
      },
      error: (err) => {
        this.submitting = false;
        const msg = err?.error?.error || err?.error?.message || 'No fue posible registrar el movimiento';
        this.showMessage(msg, 'error');
      }
    });
  }

  // === AUTO-REFRESH ===
  private startAutoRefresh(): void {
    this.stopAutoRefresh();
    this.refreshSub = interval(30000).pipe(
      switchMap(() => this.cashService.getCurrent())
    ).subscribe(data => {
      if (data) {
        this.cashRegister = data;
      }
    });
  }

  private stopAutoRefresh(): void {
    if (this.refreshSub) {
      this.refreshSub.unsubscribe();
      this.refreshSub = null;
    }
  }

  // === UTILIDADES ===
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

  getDifferenceIcon(diff: number | null): string {
    if (diff === null) return '';
    if (diff === 0) return '\u2705';
    if (diff > 0) return '\u26a0\ufe0f';
    return '\u274c';
  }

  private showMessage(message: string, type: 'success' | 'error'): void {
    this.message = message;
    this.messageType = type;
    setTimeout(() => {
      this.message = null;
      this.messageType = null;
    }, 6000);
  }
}
