import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CustomerService } from '../services/customer.service';
import { Customer } from '../models/customer.models';

@Component({
  selector: 'app-customers',
  templateUrl: './customers.component.html',
  styleUrls: ['./customers.component.css']
})
export class CustomersComponent implements OnInit {
  customerForm: FormGroup;
  customers: Customer[] = [];
  filteredCustomers: Customer[] = [];
  loading: boolean = false;
  message: string | null = null;
  messageType: 'success' | 'error' | null = null;
  showForm: boolean = false;
  editingId: number | null = null;
  errors: { [key: string]: string } = {};
  searchQuery: string = '';

  constructor(
    private fb: FormBuilder,
    private customerService: CustomerService
  ) {
    this.customerForm = this.fb.group({
      razonSocial: ['', [Validators.required, Validators.minLength(3)]],
      nit: ['', [Validators.required, Validators.minLength(3)]],
      direccion: [''],
      telefono: ['']
    });
  }

  ngOnInit() {
    this.loadCustomers();
  }

  loadCustomers() {
    this.loading = true;
    this.customerService.getAll().subscribe({
      next: (data) => {
        this.customers = data;
        this.filteredCustomers = data;
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.showMessage('Error cargando clientes', 'error');
        console.error('Error:', err);
      }
    });
  }

  searchCustomers() {
    if (!this.searchQuery.trim()) {
      this.filteredCustomers = this.customers;
      return;
    }
    const query = this.searchQuery.toLowerCase();
    this.filteredCustomers = this.customers.filter(c =>
      c.razonSocial.toLowerCase().includes(query) ||
      c.nit.toLowerCase().includes(query) ||
      (c.telefono && c.telefono.toLowerCase().includes(query))
    );
  }

  showNewForm() {
    this.showForm = true;
    this.editingId = null;
    this.customerForm.reset();
    this.errors = {};
    this.message = null;
  }

  editCustomer(customer: Customer) {
    this.editingId = customer.id!;
    this.showForm = true;
    this.errors = {};
    this.message = null;
    this.customerForm.patchValue({
      razonSocial: customer.razonSocial,
      nit: customer.nit,
      direccion: customer.direccion,
      telefono: customer.telefono
    });
  }

  submitForm() {
    if (this.customerForm.invalid) {
      this.errors = this.getFormErrors();
      return;
    }

    this.errors = {};
    this.loading = true;
    const formValue = this.customerForm.value;

    if (this.editingId) {
      this.customerService.update(this.editingId, formValue).subscribe({
        next: () => {
          this.showMessage('Cliente actualizado correctamente', 'success');
          this.loading = false;
          this.showForm = false;
          this.loadCustomers();
        },
        error: (err) => {
          this.loading = false;
          this.handleError(err);
        }
      });
    } else {
      this.customerService.create(formValue).subscribe({
        next: () => {
          this.showMessage('Cliente creado correctamente', 'success');
          this.loading = false;
          this.showForm = false;
          this.customerForm.reset();
          this.loadCustomers();
        },
        error: (err) => {
          this.loading = false;
          this.handleError(err);
        }
      });
    }
  }

  deleteCustomer(id: number, name: string) {
    if (confirm(`¿Estás seguro de que deseas eliminar "${name}"?`)) {
      this.loading = true;
      this.customerService.delete(id).subscribe({
        next: () => {
          this.showMessage('Cliente eliminado correctamente', 'success');
          this.loading = false;
          this.loadCustomers();
        },
        error: (err) => {
          this.loading = false;
          this.showMessage('Error al eliminar cliente. Puede tener créditos asociados.', 'error');
          console.error('Error:', err);
        }
      });
    }
  }

  cancelForm() {
    this.showForm = false;
    this.editingId = null;
    this.customerForm.reset();
    this.errors = {};
    this.message = null;
  }

  onOverlayClick(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.cancelForm();
    }
  }

  private showMessage(msg: string, type: 'success' | 'error') {
    this.message = msg;
    this.messageType = type;
    setTimeout(() => {
      this.message = null;
      this.messageType = null;
    }, 5000);
  }

  private handleError(err: any) {
    if (err.error && typeof err.error === 'object' && !err.error.error && !err.error.message) {
      this.errors = err.error;
      this.showMessage('Por favor, revisa los errores en el formulario', 'error');
    } else {
      const errorMsg = err.error?.error || err.error?.message || 'Error desconocido';
      this.showMessage(errorMsg, 'error');
    }
  }

  private getFormErrors(): { [key: string]: string } {
    const errors: { [key: string]: string } = {};

    if (this.customerForm.get('razonSocial')?.hasError('required')) {
      errors['razonSocial'] = 'La razón social es requerida';
    } else if (this.customerForm.get('razonSocial')?.hasError('minlength')) {
      errors['razonSocial'] = 'La razón social debe tener al menos 3 caracteres';
    }

    if (this.customerForm.get('nit')?.hasError('required')) {
      errors['nit'] = 'El NIT es requerido';
    } else if (this.customerForm.get('nit')?.hasError('minlength')) {
      errors['nit'] = 'El NIT debe tener al menos 3 caracteres';
    }

    return errors;
  }
}
