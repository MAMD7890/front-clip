import { Component, EventEmitter, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-change-password',
  templateUrl: './change-password.component.html',
  styleUrls: ['./change-password.component.css']
})
export class ChangePasswordComponent {
  @Output() close = new EventEmitter<void>();

  form: FormGroup;
  loading: boolean = false;
  message: string | null = null;
  messageType: 'success' | 'error' | null = null;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService
  ) {
    this.form = this.fb.group({
      currentPassword: ['', [Validators.required, Validators.minLength(6)]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    });
  }

  submit() {
    if (this.form.invalid) {
      this.message = 'Por favor, completa todos los campos';
      this.messageType = 'error';
      return;
    }

    const { currentPassword, newPassword, confirmPassword } = this.form.value;

    if (newPassword !== confirmPassword) {
      this.message = 'Las contraseñas no coinciden';
      this.messageType = 'error';
      return;
    }

    if (newPassword === currentPassword) {
      this.message = 'La nueva contraseña debe ser diferente a la actual';
      this.messageType = 'error';
      return;
    }

    this.loading = true;
    this.auth.changePassword(currentPassword, newPassword).subscribe({
      next: () => {
        this.message = 'Contraseña actualizada exitosamente';
        this.messageType = 'success';
        this.loading = false;
        setTimeout(() => {
          this.close.emit();
        }, 1500);
      },
      error: (err) => {
        this.loading = false;
        this.message = err.error?.error || 'Error al cambiar la contraseña';
        this.messageType = 'error';
      }
    });
  }

  onClose() {
    this.close.emit();
  }
}
