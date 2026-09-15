import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Customer } from '../models/customer.models';
import { PaymentMethod } from '../models/payment-method.models';
import { ProductResponse } from '../models/product.models';
import { Sale } from '../models/sale.models';
import { CustomerService } from '../services/customer.service';
import { PaymentMethodService } from '../services/payment-method.service';
import { ProductService } from '../services/product.service';
import { SaleService } from '../services/sale.service';
import { PrinterService } from '../services/printer.service';

@Component({
  selector: 'app-sale-register',
  templateUrl: './sale-register.component.html',
  styleUrls: ['./sale-register.component.css']
})
export class SaleRegisterComponent implements OnInit {
  saleForm: FormGroup;
  customers: Customer[] = [];
  products: ProductResponse[] = [];
  paymentMethods: PaymentMethod[] = [];

  loadingCatalogs = false;
  loadingSubmit = false;
  message: string | null = null;
  messageType: 'success' | 'error' | null = null;

  showPrintConfirm = false;
  printingReceipt = false;
  private pendingReceipt: { saleId: any; base64: string } | null = null;

  constructor(
    private fb: FormBuilder,
    private customerService: CustomerService,
    private productService: ProductService,
    private paymentMethodService: PaymentMethodService,
    private saleService: SaleService,
    private printerService: PrinterService
  ) {
    this.saleForm = this.fb.group({
      customerId: [null],
      valueReceived: [null, [Validators.min(0)]],
      changeValue: [null, [Validators.min(0)]],
      paymentMethodNames: [[], [Validators.required]],
      items: this.fb.array([this.createItemForm()])
    });

    // Escuchar cambios en valueReceived para calcular el cambio automáticamente
    this.saleForm.get('valueReceived')?.valueChanges.subscribe(() => {
      this.updateCalculatedChange();
    });
  }

  ngOnInit(): void {
    this.loadCatalogs();

    // Escuchar cambios en los items para recalcular el cambio
    this.items.valueChanges.subscribe(() => {
      this.updateCalculatedChange();
    });
  }

  get items(): FormArray {
    return this.saleForm.get('items') as FormArray;
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
    if (this.items.length === 1) {
      return;
    }
    this.items.removeAt(index);
  }

  loadCatalogs(): void {
    this.loadingCatalogs = true;

    this.customerService.getAll().subscribe({
      next: (data) => {
        this.customers = data;
      },
      error: () => {
        this.showMessage('No fue posible cargar clientes', 'error');
      }
    });

    this.productService.getProducts().subscribe({
      next: (data) => {
        this.products = data;
      },
      error: () => {
        this.showMessage('No fue posible cargar productos', 'error');
      }
    });

    this.paymentMethodService.getAll().subscribe({
      next: (data) => {
        this.paymentMethods = data;
        this.loadingCatalogs = false;
      },
      error: () => {
        this.loadingCatalogs = false;
        this.showMessage('No fue posible cargar metodos de pago', 'error');
      }
    });
  }

  onProductSearchChange(index: number): void {
    const row = this.items.at(index) as FormGroup;
    const query = String(row.get('productSearch')?.value || '').trim().toLowerCase();
    const selectedProduct = this.products.find((p) =>
      this.getProductDisplayName(p).toLowerCase() === query || p.name.toLowerCase() === query
    );

    if (!selectedProduct) {
      row.patchValue({ productId: null, unitPrice: null }, { emitEvent: false });
      return;
    }

    row.patchValue({ productId: selectedProduct.id }, { emitEvent: false });

    // Siempre asignar el finalPrice como unitPrice (es obligatorio)
    row.patchValue({ unitPrice: selectedProduct.finalPrice });
  }

  getProductDisplayName(product: ProductResponse): string {
    return `${product.name} (${product.code})`;
  }

  togglePaymentMethod(name: string, checked: boolean): void {
    const currentValues = [...this.saleForm.get('paymentMethodNames')?.value];

    if (checked && !currentValues.includes(name)) {
      currentValues.push(name);
    }

    if (!checked) {
      const index = currentValues.indexOf(name);
      if (index !== -1) {
        currentValues.splice(index, 1);
      }
    }

    this.saleForm.patchValue({ paymentMethodNames: currentValues });
    this.saleForm.get('paymentMethodNames')?.markAsTouched();

    // Si se selecciona 'credito', hacer el cliente obligatorio
    this.updateCustomerRequirement();
  }

  isCreditSelected(): boolean {
    const selected: string[] = this.saleForm.get('paymentMethodNames')?.value || [];
    return selected.some(name => name.toLowerCase() === 'credito');
  }

  private updateCustomerRequirement(): void {
    const customerControl = this.saleForm.get('customerId');
    if (this.isCreditSelected()) {
      customerControl?.setValidators([Validators.required]);
    } else {
      customerControl?.clearValidators();
    }
    customerControl?.updateValueAndValidity();
  }

  isPaymentMethodSelected(name: string): boolean {
    const selected: string[] = this.saleForm.get('paymentMethodNames')?.value || [];
    return selected.includes(name);
  }

  getLineTotal(index: number): number {
    const row = this.items.at(index);
    const quantity = Number(row.get('quantity')?.value || 0);
    const unitPrice = Number(row.get('unitPrice')?.value || 0);
    return quantity * unitPrice;
  }

  getSaleTotal(): number {
    return this.items.controls.reduce((acc, _, index) => acc + this.getLineTotal(index), 0);
  }

  updateCalculatedChange(): void {
    const valueReceived = Number(this.saleForm.get('valueReceived')?.value || 0);
    const saleTotal = this.getSaleTotal();
    const calculatedChange = valueReceived - saleTotal;
    this.saleForm.patchValue({ changeValue: calculatedChange > 0 ? calculatedChange : 0 }, { emitEvent: false });
  }

  getCalculatedChange(): number {
    const valueReceived = Number(this.saleForm.get('valueReceived')?.value || 0);
    const saleTotal = this.getSaleTotal();
    return valueReceived - saleTotal;
  }

  submitSale(): void {
    if (this.saleForm.invalid || this.items.length === 0) {
      this.saleForm.markAllAsTouched();
      if (this.isCreditSelected() && !this.saleForm.get('customerId')?.value) {
        this.showMessage('Para ventas a crédito es obligatorio seleccionar un cliente', 'error');
        return;
      }
      this.showMessage('Revisa los campos requeridos de la venta', 'error');
      return;
    }

    const paymentMethodNames = this.saleForm.get('paymentMethodNames')?.value as string[];
    if (!paymentMethodNames || paymentMethodNames.length === 0) {
      this.saleForm.get('paymentMethodNames')?.setErrors({ required: true });
      this.saleForm.markAllAsTouched();
      this.showMessage('Debes seleccionar al menos un metodo de pago', 'error');
      return;
    }

    const raw = this.saleForm.value;

    // Validar stock disponible antes de enviar
    const stockErrors: string[] = [];
    this.items.controls.forEach((row) => {
      const productId = row.get('productId')?.value;
      const quantity = parseInt(row.get('quantity')?.value, 10) || 0;
      const product = this.products.find(p => p.id === productId);

      if (product && quantity > product.stockActual) {
        stockErrors.push(
          `"${product.name}" — solicitado: ${quantity}, disponible: ${product.stockActual}`
        );
      }
    });

    if (stockErrors.length > 0) {
      this.showMessage(
        'Stock insuficiente para: ' + stockErrors.join(' | '),
        'error'
      );
      return;
    }

    // Construir items de venta con validación estricta
    const items = this.items.controls.map((row) => {
      const productId = row.get('productId')?.value;
      const quantity = row.get('quantity')?.value;
      const unitPriceValue = row.get('unitPrice')?.value;

      if (!productId || !quantity || quantity <= 0) {
        throw new Error('Datos de producto inválidos');
      }

      // unitPrice es OBLIGATORIO - debe siempre estar presente
      if (unitPriceValue === null || unitPriceValue === '' || isNaN(parseFloat(unitPriceValue))) {
        throw new Error('El precio unitario es requerido para cada producto');
      }

      const unitPrice = parseFloat(unitPriceValue);
      const qty = parseInt(quantity, 10);
      const totalPrice = unitPrice * qty;

      return {
        productId: parseInt(productId, 10),
        quantity: qty,
        unitPrice: unitPrice,
        totalPrice: totalPrice
      };
    });

    const salePayload: Sale = {
      items,
      paymentMethodNames
    };

    // Agregar customerId solo si está seleccionado
    if (raw.customerId) {
      salePayload.customerId = parseInt(raw.customerId, 10);
    }

    // Si es venta a crédito, enviar flag
    if (this.isCreditSelected()) {
      salePayload.credit = true;
    }

    this.loadingSubmit = true;
    this.saleService.register(salePayload).subscribe({
      next: (sale) => {
        this.loadingSubmit = false;
        this.showMessage('Venta registrada correctamente. ID #' + sale.id, 'success');
        this.resetForm();

        if (sale.receiptBase64) {
          this.pendingReceipt = { saleId: sale.id, base64: sale.receiptBase64 };
          this.showPrintConfirm = true;
        }
      },
      error: (err) => {
        this.loadingSubmit = false;
        const backendMsg = err?.error?.message || err?.error?.error || 'No fue posible registrar la venta';
        this.showMessage(backendMsg, 'error');
      }
    });
  }

  confirmPrint(): void {
    if (!this.pendingReceipt) {
      return;
    }
    const receipt = this.pendingReceipt;
    this.printingReceipt = true;
    this.printerService.printReceipt(receipt.base64)
      .catch((err: any) => {
        console.error('[Printer] Error al imprimir:', err);
        const detail = err && err.message ? err.message : 'verifica que QZ Tray esté activo en este PC.';
        this.showMessage('No se pudo imprimir — ' + detail, 'error');
      })
      .then(() => {
        this.printingReceipt = false;
        this.showPrintConfirm = false;
        this.pendingReceipt = null;
      });
  }

  cancelPrint(): void {
    this.showPrintConfirm = false;
    this.pendingReceipt = null;
  }

  resetForm(): void {
    this.saleForm.reset({
      customerId: null,
      valueReceived: null,
      changeValue: null,
      paymentMethodNames: []
    });

    while (this.items.length > 0) {
      this.items.removeAt(0);
    }
    this.items.push(this.createItemForm());
  }

  formatPrice(value: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(value || 0);
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
