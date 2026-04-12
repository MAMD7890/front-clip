/**
 * ✅ EJEMPLOS DE USO DEL SISTEMA DE AUTENTICACIÓN
 * 
 * Este archivo contiene ejemplos prácticos de cómo usar
 * la autenticación en diferentes contextos de la aplicación.
 */

// ============================================================================
// 1️⃣ USAR AUTHSERVICE EN UN COMPONENTE
// ============================================================================

import { Component } from '@angular/core';
import { AuthService } from './services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  template: `
    <div>
      <h1>Dashboard</h1>
      <button (click)="logout()">Logout</button>
    </div>
  `
})
export class DashboardComponent {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  // Cualquier otro método puede usar:
  makeProtectedRequest() {
    // El token se agrega automáticamente por el interceptor
    // this.http.get('/products') incluye Authorization: Bearer <token>
  }
}

// ============================================================================
// 2️⃣ AUTH GUARD - PROTEGER RUTAS
// ============================================================================

import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    if (this.authService.isAuthenticated()) {
      return true;
    }
    this.router.navigate(['/login']);
    return false;
  }
}

// Usar en app.routing.ts:
/*
const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { 
    path: 'dashboard', 
    component: DashboardComponent, 
    canActivate: [AuthGuard] 
  },
  { 
    path: 'products', 
    component: ProductsComponent, 
    canActivate: [AuthGuard] 
  },
  { 
    path: 'customers', 
    component: CustomersComponent, 
    canActivate: [AuthGuard] 
  }
];
*/

// ============================================================================
// 3️⃣ USAR EN TEMPLATES CON *ngIf
// ============================================================================

/*
<div *ngIf="isAuthenticated; else loginPage">
  <h1>Área Protegida</h1>
  <button (click)="logout()">Logout</button>
</div>

<ng-template #loginPage>
  <p>Debes iniciar sesión para ver este contenido</p>
</ng-template>

// En el componente:
isAuthenticated = false;

constructor(private authService: AuthService) {
  this.isAuthenticated = this.authService.isAuthenticated();
}
*/

// ============================================================================
// 4️⃣ SERVICIO PARA OBTENER DATOS PROTEGIDOS
// ============================================================================

import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private baseUrl = 'http://localhost:8080/products';

  constructor(private http: HttpClient) {}

  // El interceptor agrega automáticamente: Authorization: Bearer <token>
  getProducts() {
    return this.http.get(`${this.baseUrl}`);
  }

  getProductById(id: number) {
    return this.http.get(`${this.baseUrl}/${id}`);
  }

  createProduct(product: any) {
    return this.http.post(this.baseUrl, product);
  }

  updateProduct(id: number, product: any) {
    return this.http.put(`${this.baseUrl}/${id}`, product);
  }

  deleteProduct(id: number) {
    return this.http.delete(`${this.baseUrl}/${id}`);
  }
}

// ============================================================================
// 5️⃣ COMPONENTE QUE USA PRODUCTOS PROTEGIDOS
// ============================================================================

@Component({
  selector: 'app-products',
  template: `
    <div>
      <h2>Productos</h2>
      <ul>
        <li *ngFor="let product of products">
          {{ product.name }} - ${{ product.price }}
        </li>
      </ul>
    </div>
  `
})
export class ProductsComponent {
  products: any[] = [];

  constructor(private productService: ProductService) {
    this.loadProducts();
  }

  loadProducts() {
    // El token se incluye automáticamente
    this.productService.getProducts().subscribe({
      next: (data: any) => {
        this.products = data;
      },
      error: (error) => {
        console.error('Error cargando productos:', error);
        // Si es 401, el interceptor redirige a login
      }
    });
  }
}

// ============================================================================
// 6️⃣ MANEJO AVANZADO DE ERRORES
// ============================================================================

/*
En cualquier subscribe que haga peticiones protegidas:

this.productService.getProducts().subscribe({
  next: (data) => {
    console.log('Éxito:', data);
  },
  error: (error) => {
    if (error.status === 401) {
      // Token expirado - el interceptor ya lo maneja
      console.log('Token expirado');
    } else if (error.status === 403) {
      // Prohibido - no tienes permisos
      console.log('No autorizado para esta acción');
    } else if (error.status === 404) {
      // No encontrado
      console.log('Recurso no encontrado');
    } else {
      // Otro error
      console.log('Error:', error.message);
    }
  }
});
*/

// ============================================================================
// 7️⃣ LOCALSTORAGE Y SEGURIDAD
// ============================================================================

/*
⚠️ IMPORTANTE:
- El token se guarda en localStorage (accesible desde JavaScript)
- En producción, considerar usar httpOnly cookies para mayor seguridad
- No guardar información sensible en localStorage
- Siempre usar HTTPS en producción
- Implementar refresh tokens para renovar tokens expirados

El flujo actual:
1. Usuario login → recibe token
2. Guardamos en localStorage
3. Interceptor agrega a todas las peticiones
4. Si 401 → redirigir a login
5. En logout → eliminar token

Para mayor seguridad (opcional):
- Implementar refresh tokens
- Usar httpOnly cookies
- CSRF protection
- Token rotation
*/

// ============================================================================
// 8️⃣ TESTING
// ============================================================================

/*
Ejemplo de test unitario:

import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AuthService]
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('debe guardar token después de login exitoso', () => {
    const mockToken = 'test-token-123';
    
    service.login('admin', 'admin').subscribe(() => {
      expect(localStorage.getItem('token')).toBe(mockToken);
    });

    const req = httpMock.expectOne('http://localhost:8080/auth/login');
    expect(req.request.method).toBe('POST');
    req.flush({ token: mockToken });
  });
});
*/

// ============================================================================
// 9️⃣ RESUMEN DE FLUJOS
// ============================================================================

/*

FLUJO DE LOGIN:
================
Usuario ingresa credenciales
    ↓
submit() en LoginComponent
    ↓
authService.login(username, password)
    ↓
HTTP POST /auth/login
    ↓
Backend valida credenciales
    ↓
✅ Si OK → Retorna { token: "..." }
   ❌ Si NO → Retorna error (400 o 401)
    ↓
Si OK:
  - tap() guarda en localStorage
  - Redirige a dashboard
Si NO:
  - handleError() procesa el error
  - Muestra mensaje de error


FLUJO DE PETICIÓN PROTEGIDA:
============================
Componente hace: this.http.get('/products')
    ↓
AuthInterceptor intercepta la petición
    ↓
Agrega header: Authorization: Bearer {token}
    ↓
Envía petición al servidor
    ↓
Backend valida token
    ↓
✅ Si válido → Retorna datos
   ❌ Si inválido/expirado → 401
    ↓
Si 401:
  - Interceptor llama logout()
  - Redirige a /login
Si OK:
  - Componente recibe los datos
  - Actualiza la UI


FLUJO DE LOGOUT:
================
Usuario hace clic en logout
    ↓
authService.logout()
    ↓
localStorage.removeItem('token')
    ↓
router.navigate(['/login'])
    ↓
Usuario redirigido a login
   (Ahora todas las peticiones no incluyen token)

*/

export {}; // Archivo de referencia, no exporta nada
