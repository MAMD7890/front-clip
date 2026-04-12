import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PaymentMethod } from '../models/payment-method.models';
import { PaymentMethodService } from '../services/payment-method.service';

@Component({
  selector: 'app-payment-methods',
  templateUrl: './payment-methods.component.html',
  styleUrls: ['./payment-methods.component.css']
})
export class PaymentMethodsComponent implements OnInit {
  paymentMethods: PaymentMethod[] = [];
  filteredPaymentMethods: PaymentMethod[] = [];
  paymentMethodForm: FormGroup;

  loading = false;
  showForm = false;
  editingId: number | null = null;
  searchQuery = '';
  message: string | null = null;
  messageType: 'success' | 'error' | null = null;
  errors: { [key: string]: string } = {};

  constructor(
    private fb: FormBuilder,
    private paymentMethodService: PaymentMethodService
  ) {
    this.paymentMethodForm = this.fb.group({
      name: ['', [Validators.required]]
    });
  }

  ngOnInit(): void {
    this.loadPaymentMethods();
  }

  loadPaymentMethods(): void {
    this.loading = true;
    this.paymentMethodService.getAll().subscribe({
      next: (data) => {
        this.paymentMethods = data;
        this.filteredPaymentMethods = data;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.showMessage('Error cargando metodos de pago', 'error');
      }
    });
  }

  searchPaymentMethods(): void {
    const query = this.searchQuery.trim().toLowerCase();
    if (!query) {
      this.filteredPaymentMethods = this.paymentMethods;
      return;
    }

    this.filteredPaymentMethods = this.paymentMethods.filter((item) =>
      item.name.toLowerCase().includes(query)
    );
  }

  showNewForm(): void {
    this.showForm = true;
    this.editingId = null;
    this.errors = {};
    this.paymentMethodForm.reset();
  }

  editPaymentMethod(paymentMethod: PaymentMethod): void {
    this.showForm = true;
    this.editingId = paymentMethod.id || null;
    this.errors = {};
    this.paymentMethodForm.patchValue({
      name: paymentMethod.name
    });
  }

  submitForm(): void {
    if (this.paymentMethodForm.invalid) {
      this.errors = {
        name: 'El nombre es obligatorio'
      };
      this.paymentMethodForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.errors = {};
    const payload: PaymentMethod = {
      name: String(this.paymentMethodForm.value.name).trim()
    };

    if (!payload.name) {
      this.loading = false;
      this.errors = {
        name: 'El nombre es obligatorio'
      };
      return;
    }

    if (this.editingId) {
      this.paymentMethodService.update(this.editingId, payload).subscribe({
        next: () => {
          this.loading = false;
          this.showForm = false;
          this.showMessage('Metodo de pago actualizado correctamente', 'success');
          this.loadPaymentMethods();
        },
        error: (err) => {
          this.loading = false;
          this.handleServerError(err);
        }
      });
      return;
    }

    this.paymentMethodService.create(payload).subscribe({
      next: () => {
        this.loading = false;
        this.showForm = false;
        this.showMessage('Metodo de pago creado correctamente', 'success');
        this.loadPaymentMethods();
      },
      error: (err) => {
        this.loading = false;
        this.handleServerError(err);
      }
    });
  }

  deletePaymentMethod(paymentMethod: PaymentMethod): void {
    if (!paymentMethod.id) {
      return;
    }

    if (!confirm('¿Seguro que deseas eliminar el metodo de pago "' + paymentMethod.name + '"?')) {
      return;
    }

    this.loading = true;
    this.paymentMethodService.delete(paymentMethod.id).subscribe({
      next: () => {
        this.loading = false;
        this.showMessage('Metodo de pago eliminado correctamente', 'success');
        this.loadPaymentMethods();
      },
      error: () => {
        this.loading = false;
        this.showMessage('No se pudo eliminar el metodo de pago', 'error');
      }
    });
  }

  cancelForm(): void {
    this.showForm = false;
    this.editingId = null;
    this.paymentMethodForm.reset();
    this.errors = {};
  }

  onOverlayClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.cancelForm();
    }
  }

  private handleServerError(err: any): void {
    const backendMessage = err?.error?.message || err?.error?.error || '';
    const duplicateText = typeof err?.error === 'string' ? err.error : '';
    const message = (backendMessage || duplicateText || '').toLowerCase();

    if (message.includes('unique') || message.includes('duplic') || message.includes('existe')) {
      this.errors = { name: 'Este metodo de pago ya existe' };
      this.showMessage('El nombre del metodo de pago debe ser unico', 'error');
      return;
    }

    if (err?.error && typeof err.error === 'object' && err.error.name) {
      this.errors = { name: err.error.name };
      this.showMessage('Revisa los datos del formulario', 'error');
      return;
    }

    this.showMessage('No fue posible guardar el metodo de pago', 'error');
  }

  private showMessage(message: string, type: 'success' | 'error'): void {
    this.message = message;
    this.messageType = type;

    setTimeout(() => {
      this.message = null;
      this.messageType = null;
    }, 4500);
  }
}
