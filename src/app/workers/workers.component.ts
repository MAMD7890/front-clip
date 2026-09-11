import { Component, OnInit } from '@angular/core';
import { Worker } from '../models/worker.models';
import { WorkerService } from '../services/worker.service';

@Component({
  selector: 'app-workers',
  templateUrl: './workers.component.html',
  styleUrls: ['./workers.component.css']
})
export class WorkersComponent implements OnInit {
  workers: Worker[] = [];
  loading = false;

  showForm = false;
  editingId: number | null = null;
  formName = '';
  formDocument = '';
  formPhone = '';
  submitting = false;

  message: string | null = null;
  messageType: 'success' | 'error' | null = null;

  constructor(private workerService: WorkerService) {}

  ngOnInit(): void {
    this.loadWorkers();
  }

  loadWorkers(): void {
    this.loading = true;
    this.workerService.getAll().subscribe({
      next: (data) => {
        this.workers = data;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.showMessage('No fue posible cargar los trabajadores', 'error');
      }
    });
  }

  get totalPaidAll(): number {
    return this.workers.reduce((sum, w) => sum + (w.totalPaid || 0), 0);
  }

  get totalAdvancesAll(): number {
    return this.workers.reduce((sum, w) => sum + (w.totalAdvances || 0), 0);
  }

  showNewForm(): void {
    this.editingId = null;
    this.formName = '';
    this.formDocument = '';
    this.formPhone = '';
    this.showForm = true;
  }

  editWorker(worker: Worker): void {
    this.editingId = worker.id || null;
    this.formName = worker.name;
    this.formDocument = worker.document || '';
    this.formPhone = worker.phone || '';
    this.showForm = true;
  }

  cancelForm(): void {
    this.showForm = false;
  }

  submitForm(): void {
    if (!this.formName.trim()) {
      this.showMessage('El nombre es obligatorio', 'error');
      return;
    }

    const payload = {
      name: this.formName.trim(),
      document: this.formDocument.trim() || undefined,
      phone: this.formPhone.trim() || undefined
    };

    this.submitting = true;
    const request = this.editingId
      ? this.workerService.update(this.editingId, payload)
      : this.workerService.create(payload);

    request.subscribe({
      next: () => {
        this.submitting = false;
        this.showForm = false;
        this.showMessage(this.editingId ? 'Trabajador actualizado correctamente' : 'Trabajador creado correctamente', 'success');
        this.loadWorkers();
      },
      error: () => {
        this.submitting = false;
        this.showMessage('No fue posible guardar el trabajador', 'error');
      }
    });
  }

  toggleActive(worker: Worker): void {
    if (!worker.id) {
      return;
    }
    this.workerService.update(worker.id, { ...worker, active: !worker.active }).subscribe({
      next: () => {
        this.showMessage(worker.active ? 'Trabajador desactivado' : 'Trabajador activado', 'success');
        this.loadWorkers();
      },
      error: () => this.showMessage('No fue posible actualizar el trabajador', 'error')
    });
  }

  deleteWorker(worker: Worker): void {
    if (!worker.id) {
      return;
    }
    if (!confirm(`¿Seguro que deseas eliminar a "${worker.name}"?`)) {
      return;
    }
    this.workerService.delete(worker.id).subscribe({
      next: () => {
        this.showMessage('Trabajador eliminado correctamente', 'success');
        this.loadWorkers();
      },
      error: (err) => {
        const msg = err?.error?.message || err?.error?.error || 'No fue posible eliminar el trabajador';
        this.showMessage(msg, 'error');
      }
    });
  }

  formatPrice(value: number | null | undefined): string {
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
