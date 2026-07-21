import { Component, OnInit } from '@angular/core';
import { Customer } from '../models/customer.models';
import { ProductResponse } from '../models/product.models';
import { Sale } from '../models/sale.models';
import { CustomerService } from '../services/customer.service';
import { ProductService } from '../services/product.service';
import { SaleService } from '../services/sale.service';
import { DateFormatterService } from '../services/date-formatter.service';

@Component({
  selector: 'app-sale-history',
  templateUrl: './sale-history.component.html',
  styleUrls: ['./sale-history.component.css']
})
export class SaleHistoryComponent implements OnInit {
  sales: Sale[] = [];
  filteredSales: Sale[] = [];
  customersById: { [key: number]: Customer } = {};
  productsById: { [key: number]: ProductResponse } = {};
  loading = false;

  startDate = '';
  endDate = '';
  paymentMethodFilter = '';
  expandedSales: { [key: number]: boolean } = {};
  message: string | null = null;
  messageType: 'success' | 'error' | null = null;

  // Paginación
  currentPage = 1;
  pageSize = 20;

  constructor(
    private saleService: SaleService,
    private customerService: CustomerService,
    private productService: ProductService,
    private dateFormatter: DateFormatterService
  ) {}

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

  loadSales(): void {
    this.loading = true;
    this.saleService.getAll().subscribe({
      next: (data) => {
        this.sales = data.sort((a, b) => {
          const dateA = new Date(a.date || a.createdAt || a.saleDate || 0).getTime();
          const dateB = new Date(b.date || b.createdAt || b.saleDate || 0).getTime();
          return dateB - dateA;
        });
        this.filteredSales = this.sales;
        this.currentPage = 1;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.showMessage('No fue posible cargar el historial de ventas', 'error');
      }
    });
  }

  applyFilters(): void {
    // Filtro por rango de fechas
    let filtered = this.sales;

    if (this.startDate || this.endDate) {
      this.loading = true;
      const start = this.startDate ? this.toIso8601(this.startDate) : '';
      const end = this.endDate ? this.toIso8601(this.endDate) : '';

      this.saleService.getByDateRange(start, end).subscribe({
        next: (data) => {
          filtered = data.sort((a, b) => {
            const dateA = new Date(a.date || a.createdAt || a.saleDate || 0).getTime();
            const dateB = new Date(b.date || b.createdAt || b.saleDate || 0).getTime();
            return dateB - dateA;
          });
          // Aplicar filtro de método de pago después del filtro de fecha
          this.applyPaymentMethodFilter(filtered);
          this.loading = false;
        },
        error: () => {
          this.loading = false;
          this.showMessage('No fue posible filtrar el historial', 'error');
        }
      });
    } else {
      // Aplicar solo filtro de método de pago
      this.applyPaymentMethodFilter(filtered);
    }
  }

  private applyPaymentMethodFilter(data: Sale[]): void {
    if (!this.paymentMethodFilter.trim()) {
      this.filteredSales = data;
    } else {
      const method = this.paymentMethodFilter.trim().toLowerCase();
      this.filteredSales = data.filter((sale) =>
        sale.paymentMethodNames?.some((pm) =>
          pm.toLowerCase().includes(method)
        )
      );
    }
    this.currentPage = 1;
  }

  clearFilters(): void {
    this.startDate = '';
    this.endDate = '';
    this.paymentMethodFilter = '';
    this.loadSales();
  }

  toggleDetails(saleId?: number): void {
    if (!saleId) {
      return;
    }
    this.expandedSales[saleId] = !this.expandedSales[saleId];
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
  get paginatedSales(): Sale[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredSales.slice(start, start + this.pageSize);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredSales.length / this.pageSize);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  get pages(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }
}
