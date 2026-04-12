# 🌍 Guía de Environments - Configuración de URLs por Ambiente

## ¿Qué es un Environment?

Un **environment** es un archivo de configuración que cambia según el ambiente:
- **Desarrollo** (`environment.ts`) → localhost:8080
- **Producción** (`environment.prod.ts`) → https://api.tu-dominio.com
- **Staging** (`environment.staging.ts`) → https://staging-api.tu-dominio.com

---

## 📁 Estructura de Archivos

```
src/
├── environments/
│   ├── environment.ts           ← Desarrollo (ng serve)
│   ├── environment.prod.ts      ← Producción (ng build --prod)
│   └── environment.staging.ts   ← Staging (opcional)
├── app/
│   └── services/
│       ├── auth.service.ts      (✅ Ya usa environment)
│       ├── product.service.ts   (agregar)
│       ├── customer.service.ts  (agregar)
│       └── services.template.ts (patrón a seguir)
```

---

## 🔧 Archivos Configurados

### `environment.ts` (Desarrollo)
```typescript
export const environment = {
  production: false,
  apiBaseUrl: 'http://localhost:8080'
};
```

### `environment.prod.ts` (Producción)
```typescript
export const environment = {
  production: true,
  apiBaseUrl: 'https://tu-dominio-produccion.com'
};
```

---

## ✅ Cómo Auth Service Usa el Environment

**`src/app/services/auth.service.ts`**

```typescript
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private baseUrl = environment.apiBaseUrl; // ← Usa environment
  
  login(username: string, password: string): Observable<AuthResponse> {
    // Construcción dinámica de URL
    // En dev:  http://localhost:8080/auth/login
    // En prod: https://tu-dominio.com/auth/login
    return this.http.post<AuthResponse>(
      `${this.baseUrl}/auth/login`,
      { username, password }
    ).pipe(...);
  }
}
```

---

## 🚀 Uso en Desarrollo

```bash
# Los environments se cargan automáticamente
ng serve
# Usa: src/environments/environment.ts
# apiBaseUrl = http://localhost:8080
```

Accede a: `http://localhost:4200`

---

## 📦 Uso en Producción

```bash
# Build de producción
ng build --prod

# O más explícitamente
ng build --configuration production

# Automáticamente carga: src/environments/environment.prod.ts
# apiBaseUrl = https://tu-dominio-produccion.com
```

---

## 🎯 Crear un Nuevo Servicio usando Environment

### Paso 1: Crear el servicio

**`src/app/services/product.service.ts`**

```typescript
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment'; // ← Importar

@Injectable({ providedIn: 'root' })
export class ProductService {
  private baseUrl = `${environment.apiBaseUrl}/products`; // ← Usar environment

  constructor(private http: HttpClient) {}

  getProducts(): Observable<any[]> {
    return this.http.get<any[]>(this.baseUrl);
  }

  getProductById(id: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/${id}`);
  }

  createProduct(product: any): Observable<any> {
    return this.http.post<any>(this.baseUrl, product);
  }

  updateProduct(id: number, product: any): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/${id}`, product);
  }

  deleteProduct(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
```

### Paso 2: Usar en el componente

**`src/app/components/products/products.component.ts`**

```typescript
import { Component, OnInit } from '@angular/core';
import { ProductService } from '../../services/product.service';

@Component({
  selector: 'app-products',
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.css']
})
export class ProductsComponent implements OnInit {
  products: any[] = [];

  constructor(private productService: ProductService) {}

  ngOnInit() {
    this.loadProducts();
  }

  loadProducts() {
    this.productService.getProducts().subscribe({
      next: (data) => {
        this.products = data;
        console.log('Productos cargados:', this.products);
      },
      error: (err) => {
        console.error('Error cargando productos:', err);
      }
    });
  }

  createProduct(product: any) {
    this.productService.createProduct(product).subscribe({
      next: (newProduct) => {
        this.products.push(newProduct);
      },
      error: (err) => {
        console.error('Error creando producto:', err);
      }
    });
  }
}
```

---

## 📝 Template para Otros Servicios

Usa `src/app/services/services.template.ts` como base:

```typescript
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class MyService {
  private baseUrl = `${environment.apiBaseUrl}/mi-endpoint`; // ← Cambiar endpoint

  constructor(private http: HttpClient) {
    console.log(`Conectando a: ${this.baseUrl}`);
  }

  getAll(): Observable<any[]> {
    return this.http.get<any[]>(this.baseUrl);
  }

  getById(id: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/${id}`);
  }

  create(data: any): Observable<any> {
    return this.http.post<any>(this.baseUrl, data);
  }

  update(id: number, data: any): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/${id}`, data);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
```

---

## 🌐 Múltiples Ambientes (Recomendado)

### Crear `environment.staging.ts`

```typescript
export const environment = {
  production: false,
  apiBaseUrl: 'https://staging-api.tu-dominio.com'
};
```

### Actualizar `angular.json`

```json
{
  "projects": {
    "folder-app": {
      "architect": {
        "build": {
          "configurations": {
            "production": {
              "fileReplacements": [
                {
                  "replace": "src/environments/environment.ts",
                  "with": "src/environments/environment.prod.ts"
                }
              ]
            },
            "staging": {
              "fileReplacements": [
                {
                  "replace": "src/environments/environment.ts",
                  "with": "src/environments/environment.staging.ts"
                }
              ]
            }
          }
        },
        "serve": {
          "configurations": {
            "staging": {
              "browserTarget": "folder-app:build:staging"
            }
          }
        }
      }
    }
  }
}
```

### Usar los diferentes ambientes

```bash
# Desarrollo (por defecto)
ng serve
# Usa: environment.ts → localhost:8080

# Staging
ng serve --configuration staging
# Usa: environment.staging.ts → staging-api.tu-dominio.com

# Producción (build)
ng build --prod
# Usa: environment.prod.ts → api.tu-dominio.com
```

---

## 🔍 Verificar Qué Environment se Usa

### En desarrollador (F12 Console)

```javascript
// Importa el environment
import { environment } from 'src/environments/environment';

console.log('Environment:', environment);
console.log('API Base URL:', environment.apiBaseUrl);
console.log('Production:', environment.production);
```

### Log automático

Agrega esto en `app.component.ts`:

```typescript
import { Component, OnInit } from '@angular/core';
import { environment } from '../environments/environment';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  ngOnInit() {
    console.log('[AppComponent] Ambiente:', environment.production ? 'PRODUCCIÓN' : 'DESARROLLO');
    console.log('[AppComponent] API URL:', environment.apiBaseUrl);
  }
}
```

---

## 📊 Comparación: Antes vs Después

### ❌ Antes (con URLs hardcoded)

```typescript
// auth.service.ts
private baseUrl = 'http://localhost:8080';

// product.service.ts
private baseUrl = 'http://localhost:8080';

// customer.service.ts
private baseUrl = 'http://localhost:8080';

// Problema: Para producción, necesitas cambiar en cada servicio
```

### ✅ Después (con environments)

```typescript
// Cualquier servicio
import { environment } from '../../environments/environment';
private baseUrl = environment.apiBaseUrl;

// Cambiar TODO es tan fácil como cambiar environment.prod.ts
```

---

## 🎯 Ventajas

| Característica | Antes | Después |
|---|---|---|
| Cambiar URL para producción | ❌ Editar cada servicio | ✅ Un solo archivo |
| Múltiples ambientes | ❌ No soportado | ✅ dev, staging, prod |
| URL centralizada | ❌ Duplicada en servicios | ✅ Un solo lugar |
| Configurar en build | ❌ Manual | ✅ Automático |
| CI/CD friendly | ❌ Complicado | ✅ Fácil |

---

## 📋 Checklist

- [x] Environment configurado con apiBaseUrl
- [x] Auth service usa environment
- [x] Nuevo servicio template disponible
- [ ] Crear ProductService usando el environment
- [ ] Crear CustomerService usando el environment
- [ ] Crear SalesService usando el environment
- [ ] Procuear que TODOS los servicios usen environment

---

## 🚀 Próximos Pasos

1. **Crear los servicios necesarios:**
   - ProductService
   - CustomerService
   - SalesService
   - ReportsService
   - UserService

2. **Todos deben seguir el patrón:**
   ```typescript
   import { environment } from '../../environments/environment';
   private baseUrl = `${environment.apiBaseUrl}/endpoint`;
   ```

3. **Para actualizar URLs:**
   - Desarrollo: Edita `environment.ts`
   - Producción: Edita `environment.prod.ts`
   - **¡Listo! Automático en todos los servicios**

---

## 📚 Archivo de Referencia

Archivo template con ejemplo: `services.template.ts`
- Úsalo como referencia para crear nuevos servicios
- Reemplaza `products` por tu endpoint
- Mantén la estructura igual

---

**¡Listo! Tu aplicación ahora usa environments correctamente. 🌍✨**
