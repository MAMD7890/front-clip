import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  authForm: FormGroup;
  error: string | null = null;
  loading: boolean = false;
  isRegister: boolean = false;
  errors: { [key: string]: string } = {};

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router
  ) {
    this.authForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required]]
    });
  }

  submit() {
    // En modo registro, validar largo mínimo de contraseña
    if (this.isRegister && this.authForm.value.password && this.authForm.value.password.length < 6) {
      this.errors = { password: 'La contraseña debe tener al menos 6 caracteres' };
      return;
    }
    if (this.authForm.invalid) {
      this.errors = this.getFormErrors();
      return;
    }
    
    this.error = null;
    this.errors = {};
    this.loading = true;
    
    const { username, password } = this.authForm.value;
    
    if (this.isRegister) {
      this.auth.register(username, password).subscribe({
        next: () => {
          this.router.navigate(['/products']);
        },
        error: err => {
          this.loading = false;
          this.handleError(err);
        }
      });
    } else {
      this.auth.login(username, password).subscribe({
        next: () => {
          this.router.navigate(['/products']);
        },
        error: err => {
          this.loading = false;
          this.handleError(err);
        }
      });
    }
  }

  toggleMode() {
    this.isRegister = !this.isRegister;
    this.error = null;
    this.errors = {};
    this.authForm.reset();
  }

  private handleError(err: any) {
    if (err.error && typeof err.error === 'object' && !err.error.error) {
      // Validación de campos
      this.errors = err.error;
    } else {
      this.error = err.error?.error || 'Ocurrió un error. Intenta de nuevo.';
    }
  }

  private getFormErrors(): { [key: string]: string } {
    const errors: { [key: string]: string } = {};
    if (this.authForm.get('username')?.hasError('required')) {
      errors['username'] = 'El usuario es requerido';
    } else if (this.authForm.get('username')?.hasError('minlength')) {
      errors['username'] = 'El usuario debe tener al menos 3 caracteres';
    }
    if (this.authForm.get('password')?.hasError('required')) {
      errors['password'] = 'La contraseña es requerida';
    }
    return errors;
  }
}
