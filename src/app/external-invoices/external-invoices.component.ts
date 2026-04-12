import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ExternalInvoice, ExternalInvoiceService, ExternalInvoiceSummary } from '../services/external-invoice.service';
import { ProductService } from '../services/product.service';
import { ProductResponse } from '../models/product.models';

@Component({
  selector: 'app-external-invoices',
  templateUrl: './external-invoices.component.html',
  styleUrls: ['./external-invoices.component.css']
})
export class ExternalInvoicesComponent implements OnInit {
  // Tabs
  activeTab: 'register' | 'history' = 'register';

  // Formulario de registro
  invoiceForm: FormGroup;
  products: ProductResponse[] = [];
  filteredProducts: { [key: number]: ProductResponse[] } = {};
  loadingSubmit = false;
  message: string | null = null;
  messageType: 'success' | 'error' | null = null;

  // Historial
  invoices: ExternalInvoice[] = [];
  loadingHistory = false;
  filterStart = '';
  filterEnd = '';

  // Resumen
  summary: ExternalInvoiceSummary | null = null;

  // Detalle
  selectedInvoice: ExternalInvoice | null = null;

  // Confirmacion eliminar
  invoiceToDelete: ExternalInvoice | null = null;

  constructor(
    private fb: FormBuilder,
    private externalInvoiceService: ExternalInvoiceService,
    private productService: ProductService
  ) {
    this.invoiceForm = this.fb.group({
      invoiceNumber: ['', [Validators.required]],
      description: [''],
      items: this.fb.array([this.createItemForm()])
    });
  }

  ngOnInit(): void {
    this.loadProducts();
    this.setDefaultDates();
  }

  setDefaultDates(): void {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    this.filterStart = this.formatDate(startOfMonth);
    this.filterEnd = this.formatDate(now);
  }

  formatDate(d: Date): string {
    const year = d.getFullYear();
    const month = ('0' + (d.getMonth() + 1)).slice(-2);
    const day = ('0' + d.getDate()).slice(-2);
    return year + '-' + month + '-' + day;
  }

  loadProducts(): void {
    this.productService.getProducts().subscribe({
      next: (data) => this.products = data,
      error: () => this.showMessage('Error cargando productos', 'error')
    });
  }

  get items(): FormArray {
    return this.invoiceForm.get('items') as FormArray;
  }

  createItemForm(): FormGroup {
    return this.fb.group({
      productSearch: ['', [Validators.required]],
      productId: [null, [Validators.required]],
      quantity: [1, [Validators.required, Validators.min(1)]],
      unitPrice: [null, [Validators.min(0)]]
    });
  }

  addItem(): void {
    this.items.push(this.createItemForm());
  }

  removeItem(index: number): void {
    if (this.items.length === 1) return;
    this.items.removeAt(index);
    delete this.filteredProducts[index];
  }

  filterProducts(index: number): void {
    const search = this.items.at(index).get('productSearch')?.value || '';
    if (search.length < 1) {
      this.filteredProducts[index] = [];
      return;
    }
    const term = search.toLowerCase();
    this.filteredProducts[index] = this.products.filter(p =>
      p.name.toLowerCase().includes(term) || (p.code && p.code.toLowerCase().includes(term))
    ).slice(0, 10);
  }

  selectProduct(index: number, product: ProductResponse): void {
    const itemGroup = this.items.at(index) as FormGroup;
    itemGroup.patchValue({
      productSearch: product.name + ' (' + product.code + ')',
      productId: product.id,
      unitPrice: product.finalPrice
    });
    this.filteredProducts[index] = [];
  }

  getItemTotal(index: number): number {
    const item = this.items.at(index);
    const qty = item.get('quantity')?.value || 0;
    const price = item.get('unitPrice')?.value || 0;
    return qty * price;
  }

  getGrandTotal(): number {
    let total = 0;
    for (let i = 0; i < this.items.length; i++) {
      total += this.getItemTotal(i);
    }
    return total;
  }

  submitInvoice(): void {
    if (this.invoiceForm.invalid) {
      this.showMessage('Completa todos los campos requeridos', 'error');
      return;
    }

    this.loadingSubmit = true;
    const formValue = this.invoiceForm.value;

    const invoice: ExternalInvoice = {
      invoiceNumber: formValue.invoiceNumber,
      description: formValue.description,
      items: formValue.items.map((item: any) => ({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice
      }))
    };

    this.externalInvoiceService.register(invoice).subscribe({
      next: (result) => {
        this.showMessage('Factura #' + result.invoiceNumber + ' registrada — Total: $' + (result.totalValue || 0).toLocaleString(), 'success');
        this.loadingSubmit = false;
        this.resetForm();
        this.loadProducts(); // Recargar stock actualizado
      },
      error: (err) => {
        const msg = err.error?.message || err.error || 'Error al registrar la factura';
        this.showMessage(msg, 'error');
        this.loadingSubmit = false;
      }
    });
  }

  resetForm(): void {
    this.invoiceForm.reset();
    this.invoiceForm.patchValue({ invoiceNumber: '', description: '' });
    while (this.items.length > 1) {
      this.items.removeAt(1);
    }
    this.items.at(0).reset({ productSearch: '', productId: null, quantity: 1, unitPrice: null });
    this.filteredProducts = {};
  }

  // --- Tab Historial ---
  switchTab(tab: 'register' | 'history'): void {
    this.activeTab = tab;
    if (tab === 'history') {
      this.loadHistory();
    }
  }

  loadHistory(): void {
    this.loadingHistory = true;
    const start = this.filterStart + 'T00:00:00';
    const end = this.filterEnd + 'T23:59:59';

    this.externalInvoiceService.getByPeriod(start, end).subscribe({
      next: (data) => {
        this.invoices = data;
        this.loadingHistory = false;
        this.loadSummary(start, end);
      },
      error: () => {
        this.loadingHistory = false;
        this.showMessage('Error cargando historial', 'error');
      }
    });
  }

  loadSummary(start: string, end: string): void {
    this.externalInvoiceService.getSummary(start, end).subscribe({
      next: (data) => this.summary = data,
      error: () => {}
    });
  }

  viewDetail(invoice: ExternalInvoice): void {
    this.selectedInvoice = invoice;
  }

  closeDetail(): void {
    this.selectedInvoice = null;
  }

  confirmDelete(invoice: ExternalInvoice): void {
    this.invoiceToDelete = invoice;
  }

  cancelDelete(): void {
    this.invoiceToDelete = null;
  }

  deleteInvoice(): void {
    if (!this.invoiceToDelete || !this.invoiceToDelete.id) return;
    this.externalInvoiceService.delete(this.invoiceToDelete.id).subscribe({
      next: () => {
        this.showMessage('Factura eliminada y stock devuelto', 'success');
        this.invoiceToDelete = null;
        this.loadHistory();
        this.loadProducts();
      },
      error: () => {
        this.showMessage('Error al eliminar factura', 'error');
        this.invoiceToDelete = null;
      }
    });
  }

  showMessage(msg: string, type: 'success' | 'error'): void {
    this.message = msg;
    this.messageType = type;
    setTimeout(() => { this.message = null; this.messageType = null; }, 5000);
  }

  formatCurrency(value: number): string {
    return '$' + (value || 0).toLocaleString('es-CO', { minimumFractionDigits: 0 });
  }

  formatDateTime(dateStr: string): string {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const day = ('0' + d.getDate()).slice(-2);
    const month = ('0' + (d.getMonth() + 1)).slice(-2);
    const year = d.getFullYear();
    const hours = ('0' + d.getHours()).slice(-2);
    const mins = ('0' + d.getMinutes()).slice(-2);
    return day + '/' + month + '/' + year + ' ' + hours + ':' + mins;
  }
}
