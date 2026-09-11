import { Component, OnInit } from '@angular/core';
import { Customer } from '../models/customer.models';
import { ProductResponse } from '../models/product.models';
import { Sale } from '../models/sale.models';
import { CustomerService } from '../services/customer.service';
import { ProductService } from '../services/product.service';
import { SaleService } from '../services/sale.service';
import { DateFormatterService } from '../services/date-formatter.service';
import { PrinterService } from '../services/printer.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-sale-history',
  templateUrl: './sale-history.component.html',
  styleUrls: ['./sale-history.component.css']
})
export class SaleHistoryComponent implements OnInit {
  sales: Sale[] = [];
  customersById: { [key: number]: Customer } = {};
  productsById: { [key: number]: ProductResponse } = {};
  loading = false;

  startDate = '';
  endDate = '';
  paymentMethodFilter = '';
  totalFilter: number | null = null;
  expandedSales: { [key: number]: boolean } = {};
  message: string | null = null;
  messageType: 'success' | 'error' | null = null;

  // Paginación (server-side)
  currentPage = 1;
  pageSize = 20;
  totalPages = 0;
  totalElements = 0;

  private filterDebounce: any = null;
  printingSaleId: number | null = null;
  cancellingSaleId: number | null = null;
  showCancelConfirm = false;
  saleToCancel: Sale | null = null;

  constructor(
    private saleService: SaleService,
    private customerService: CustomerService,
    private productService: ProductService,
    private dateFormatter: DateFormatterService,
    private printerService: PrinterService,
    private authService: AuthService
  ) {}

  get isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  ngOnInit(): void {
    this.loadCustomers();
    this.loadProducts();
    this.loadSales();
  }

  loadCustomers(): void {
    this.customerService.getAll().subscribe({
      next: (data) => {
        this.customersById = data.reduce((acc, customer) => {
          if (customer.id) {
            acc[customer.id] = customer;
          }
          return acc;
        }, {} as { [key: number]: Customer });
      },
      error: () => {
        this.showMessage('No fue posible cargar el catalogo de clientes', 'error');
      }
    });
  }

  loadProducts(): void {
    this.productService.getProducts().subscribe({
      next: (data) => {
        this.productsById = data.reduce((acc, product) => {
          if (product.id) {
            acc[product.id] = product;
          }
          return acc;
        }, {} as { [key: number]: ProductResponse });
      },
      error: () => {
        this.showMessage('No fue posible cargar el catalogo de productos', 'error');
      }
    });
  }

  getProductName(productId: number): string {
    const product = this.productsById[productId];
    return product ? product.name : 'Producto #' + productId;
  }

  /** Trae la página actual desde el servidor, aplicando los filtros vigentes. */
  loadSales(): void {
    this.loading = true;
    const start = this.startDate ? this.toIso8601(this.startDate) : undefined;
    const end = this.endDate ? this.toIso8601(this.endDate) : undefined;
    const paymentMethod = this.paymentMethodFilter.trim() || undefined;
    const total = this.totalFilter != null ? this.totalFilter : undefined;

    this.saleService.search(this.currentPage - 1, this.pageSize, start, end, paymentMethod, total).subscribe({
      next: (page) => {
        this.sales = page.content;
        this.totalPages = page.totalPages;
        this.totalElements = page.totalElements;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.showMessage('No fue posible cargar el historial de ventas', 'error');
      }
    });
  }

  /** Cambios de fecha: recargan de inmediato desde la página 1. */
  applyFilters(): void {
    this.currentPage = 1;
    this.loadSales();
  }

  /** Los filtros de texto/número se debouncen para no disparar una petición por cada tecla. */
  onFilterInput(): void {
    if (this.filterDebounce) {
      clearTimeout(this.filterDebounce);
    }
    this.filterDebounce = setTimeout(() => this.applyFilters(), 400);
  }

  clearFilters(): void {
    this.startDate = '';
    this.endDate = '';
    this.paymentMethodFilter = '';
    this.totalFilter = null;
    this.currentPage = 1;
    this.loadSales();
  }

  toggleDetails(saleId?: number): void {
    if (!saleId) {
      return;
    }
    this.expandedSales[saleId] = !this.expandedSales[saleId];
  }

  reprint(saleId?: number): void {
    if (!saleId || this.printingSaleId) {
      return;
    }
    this.printingSaleId = saleId;
    this.saleService.getReceiptBytes(saleId).subscribe({
      next: (bytes) => {
        const base64 = this.arrayBufferToBase64(bytes);
        this.printerService.printReceipt(base64)
          .catch((err: any) => {
            console.error('[Printer] Error al imprimir:', err);
            const detail = err && err.message ? err.message : 'verifica que QZ Tray esté activo en este PC.';
            this.showMessage('No se pudo imprimir — ' + detail, 'error');
          })
          .then(() => {
            this.printingSaleId = null;
          });
      },
      error: () => {
        this.printingSaleId = null;
        this.showMessage('No fue posible obtener el recibo de la venta #' + saleId, 'error');
      }
    });
  }

  cancelSale(sale: Sale): void {
    if (!sale.id || this.cancellingSaleId) {
      return;
    }
    this.saleToCancel = sale;
    this.showCancelConfirm = true;
  }

  dismissCancelConfirm(): void {
    this.showCancelConfirm = false;
    this.saleToCancel = null;
  }

  confirmCancelSale(): void {
    const sale = this.saleToCancel;
    if (!sale || !sale.id) {
      return;
    }
    this.showCancelConfirm = false;

    this.cancellingSaleId = sale.id;
    this.saleService.cancel(sale.id).subscribe({
      next: (updated) => {
        this.cancellingSaleId = null;
        this.saleToCancel = null;
        sale.cancelled = updated.cancelled;
        sale.cancelledDate = updated.cancelledDate;
        this.showMessage('Venta #' + sale.id + ' cancelada correctamente', 'success');
      },
      error: (err) => {
        this.cancellingSaleId = null;
        this.saleToCancel = null;
        const msg = err?.error?.error || err?.error?.message || 'No fue posible cancelar la venta';
        this.showMessage(msg, 'error');
      }
    });
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  isExpanded(saleId?: number): boolean {
    if (!saleId) {
      return false;
    }
    return !!this.expandedSales[saleId];
  }

  getCustomerName(customerId?: number): string {
    if (!customerId) {
      return 'Venta sin cliente';
    }

    const customer = this.customersById[customerId];
    return customer ? customer.razonSocial : 'Cliente #' + customerId;
  }

  getSaleDate(sale: Sale): string {
    const raw = sale.date || sale.createdAt || sale.saleDate;
    if (!raw) {
      return 'Sin fecha';
    }

    return this.dateFormatter.formatDate(raw, 'datetime');
  }

  formatPrice(value?: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(value || 0);
  }

  private toIso8601(input: string): string {
    const candidate = input.includes(':') && input.length === 16 ? input + ':00' : input;
    return candidate;
  }

  private showMessage(message: string, type: 'success' | 'error'): void {
    this.message = message;
    this.messageType = type;

    setTimeout(() => {
      this.message = null;
      this.messageType = null;
    }, 5000);
  }

  // Paginación
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
      this.currentPage = page;
      this.loadSales();
    }
  }

  /** Ventana de páginas alrededor de la actual, para no listar cientos de botones. */
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
}
