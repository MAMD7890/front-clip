# 📋 Checklist de Implementación - Sistema de Autenticación

Use este checklist para asegurarse de que todo esté correctamente implementado.

---

## 🔍 Verificación de Archivos

### Archivos que DEBEN existir

- [ ] `src/app/login/login.component.ts` (actualizado)
- [ ] `src/app/login/login.component.html` (actualizado)
- [ ] `src/app/login/login.component.css` (actualizado)
- [ ] `src/app/services/auth.service.ts` (actualizado con register)
- [ ] `src/app/services/auth.interceptor.ts` (NUEVO)
- [ ] `src/app/services/auth.guard.ts` (NUEVO)
- [ ] `src/app/models/auth.models.ts` (NUEVO)
- [ ] `src/app/app.module.ts` (actualizado con HTTP_INTERCEPTORS)

### Documentación que DEBE existir

- [ ] `AUTENTICACION.md`
- [ ] `DIAGRAMAS_AUTENTICACION.md`
- [ ] `EJEMPLOS_AUTENTICACION.ts`
- [ ] `QUICK_START.md`
- [ ] `IMPLEMENTACION_COMPLETADA.md`
- [ ] `CHECKLIST.md` (este archivo)

---

## ✅ Verificación de Código

### En `app.module.ts`

```typescript
// ✅ Debe tener estas importaciones
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { ReactiveFormsModule } from '@angular/forms';
import { AuthInterceptor } from './services/auth.interceptor';

// ✅ Debe tener en imports
@NgModule({
  imports: [
    HttpClientModule,
    ReactiveFormsModule,
    // ... otros
  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    }
  ]
})
```

**Checklist:**
- [ ] `HttpClientModule` importado
- [ ] `ReactiveFormsModule` importado
- [ ] `AuthInterceptor` importado
- [ ] `HTTP_INTERCEPTORS` provider agregado en providers
- [ ] multi: true en el provider

### En `login.component.ts`

```typescript
// ✅ Debe tener
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

// ✅ Debe tener propiedades
authForm: FormGroup;
error: string | null = null;
loading: boolean = false;
isRegister: boolean = false;
errors: { [key: string]: string } = {};

// ✅ Debe tener métodos
submit() { ... }
toggleMode() { ... }
private handleError(err: any) { ... }
private getFormErrors() { ... }
```

**Checklist:**
- [ ] `authForm` es FormGroup
- [ ] `error`, `loading`, `isRegister`, `errors` correctamente tipificados
- [ ] Método `submit()` maneja login Y registro según `isRegister`
- [ ] Método `toggleMode()` existe y limpia formulario
- [ ] `handleError()` procesa respuestas de error

### En `login.component.html`

```html
<!-- ✅ Debe tener logo -->
<img src="https://miro.medium.com/v2/resize:fit:720/format:webp/1*KRhhag-giOP8mLZ3EiHQ9Q.png" alt="Folder Clip" class="logo">

<!-- ✅ Debe tener formulario reactivo -->
<form [formGroup]="authForm" (ngSubmit)="submit()">
  <div class="form-group">
    <input formControlName="username" ... />
  </div>
  <div class="form-group">
    <input formControlName="password" ... />
  </div>
</form>

<!-- ✅ Debe tener manejo de errores -->
<div *ngIf="errors['username']" class="error-message">
  {{ errors['username'] }}
</div>

<!-- ✅ Debe tener botón dinámico -->
<button type="submit" [disabled]="loading">
  {{ loading ? 'Cargando...' : (isRegister ? 'Registrarse' : 'Iniciar sesión') }}
</button>

<!-- ✅ Debe tener toggle -->
<a (click)="toggleMode()" class="toggle-link">
  {{ isRegister ? 'Inicia sesión' : 'Regístrate' }}
</a>
```

**Checklist:**
- [ ] Logo de Folder Clip existe
- [ ] Formulario es reactivo ([formGroup])
- [ ] Campos username y password existen
- [ ] Errores se muestran (username y password)
- [ ] Error general se muestra (*ngIf="error")
- [ ] Botón es dinámico según isRegister y loading
- [ ] Existe toggle entre login y registro

### En `login.component.css`

```css
/* ✅ Debe tener */
.login-container {
  background-image: url('https://miro.medium.com/v2/resize:fit:720/format:webp/1*zEBMKfSNbqsi7OGLkTshlw.png');
  min-height: 100vh;
}

.login-card {
  background: #ffffff;
  border-radius: 20px;
  max-width: 420px;
}

.btn-submit {
  background-color: #fdc830;
  color: #1a1a1a;
}

.btn-submit:hover:not(:disabled) {
  background-color: #f5ba1a;
}
```

**Checklist:**
- [ ] `.login-container` tiene background-image del banner
- [ ] `.login-card` tiene estilos (bgcolor, border-radius, max-width)
- [ ] `.btn-submit` tiene color amarillo #fdc830
- [ ] Hover states y disabled states existen
- [ ] Estilos responsive (@media queries)

### En `auth.service.ts`

```typescript
// ✅ Debe tener
import { AuthRequest, AuthResponse } from '../models/auth.models';

// ✅ Debe tener método de login
login(username: string, password: string): Observable<AuthResponse> { ... }

// ✅ Debe tener método de registro
register(username: string, password: string): Observable<AuthResponse> { ... }

// ✅ Debe tener métodos auxiliares
logout() { ... }
getToken(): string | null { ... }
isAuthenticated(): boolean { ... }

// ✅ Debe tener error handling
private handleError(error: HttpErrorResponse) { ... }
```

**Checklist:**
- [ ] `login()` existe y usa POST `/auth/login`
- [ ] `register()` existe y usa POST `/auth/register`
- [ ] Ambos usan `tap()` para guardar token
- [ ] Ambos usan `catchError()` para manejar errores
- [ ] `logout()` elimina token
- [ ] `getToken()` retorna token o null
- [ ] `isAuthenticated()` es boolean

### En `auth.interceptor.ts`

```typescript
// ✅ Debe tener
implements HttpInterceptor

// ✅ Debe tener método intercept
intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
  // Agregar token
  if (token) {
    request = request.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
  }
  
  // Manejar 401
  return next.handle(request).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        this.authService.logout();
        this.router.navigate(['/login']);
      }
      return throwError(() => error);
    })
  );
}
```

**Checklist:**
- [ ] Implementa `HttpInterceptor`
- [ ] Método `intercept()` existe
- [ ] Agrega header `Authorization: Bearer {token}` si existe token
- [ ] Captura respuestas 401
- [ ] Llama `logout()` en 401
- [ ] Redirige a `/login` en 401
- [ ] Retorna el error para que el componente lo maneje

### En `auth.guard.ts`

```typescript
// ✅ Debe tener
implements CanActivate

// ✅ Debe tener método canActivate
canActivate(
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
): boolean {
  if (this.authService.isAuthenticated()) {
    return true;
  }
  this.router.navigate(['/login'], { 
    queryParams: { returnUrl: state.url } 
  });
  return false;
}
```

**Checklist:**
- [ ] Implementa `CanActivate`
- [ ] Verifica `isAuthenticated()`
- [ ] Retorna true si está autenticado
- [ ] Redirige a `/login` si no
- [ ] Guarda returnUrl para redirigir después

### En `auth.models.ts`

```typescript
// ✅ Debe tener estos interfaces
export interface AuthRequest {
  username: string;
  password: string;
}

export interface AuthResponse {
  token: string;
}

export interface ValidationError {
  [key: string]: string;
}

export interface AuthenticatedUser {
  username: string;
  isAuthenticated: boolean;
}
```

**Checklist:**
- [ ] `AuthRequest` existe con username y password
- [ ] `AuthResponse` existe con token
- [ ] `ValidationError` existe (tipo dictionary)
- [ ] `AuthenticatedUser` existe (opcional pero recomendado)

---

## 🚀 Verificación Funcional

### Test 1: Compilación sin errores

```bash
ng build
```

**Checklist:**
- [ ] No hay errores de TypeScript
- [ ] No hay warnings de compilación
- [ ] Build completa exitosamente

### Test 2: Desarrollo sin errores

```bash
ng serve
```

**Checklist:**
- [ ] La aplicación carga sin errores
- [ ] Console (F12) no muestra errores rojos
- [ ] La página de login carga correctamente

### Test 3: Login exitoso

```
1. Abre http://localhost:4200
2. Entra usuario: "admin"
3. Entra password: "admin"
4. Haz clic en "Iniciar sesión"
```

**Checklist:**
- [ ] No muestra error
- [ ] Token se guarda en localStorage
- [ ] Se redirige al dashboard (o donde corresponda)
- [ ] No hay errores en console

### Test 4: Registro exitoso

```
1. En login, haz clic en "Regístrate"
2. Entra usuario: "newuser"
3. Entra password: "password123"
4. Haz clic en "Registrarse"
```

**Checklist:**
- [ ] Se registra sin errores
- [ ] Token se guarda
- [ ] Se redirige al dashboard
- [ ] Pode ingresar al dashboard

### Test 5: Peticiones protegidas

```javascript
// En console:
localStorage.getItem('token');  // Debe retornar el token
```

**Checklist:**
- [ ] Token existe en localStorage
- [ ] Token tiene formato JWT (empieza con "eyJ...")
- [ ] Peticiones incluyen header Authorization

### Test 6: Token expirado

```javascript
// En console:
localStorage.removeItem('token');
// Intenta hacer una petición protegida
```

**Checklist:**
- [ ] Si hace una petición sin token, debería redirigir a login
- [ ] Interceptor maneja 401 correctamente

### Test 7: Logout

```javascript
// En console o desde el componente:
logoutFunction();  // Llamar método logout
localStorage.getItem('token');  // Debe retornar null
```

**Checklist:**
- [ ] Token se elimina
- [ ] Redirección a login
- [ ] Página de login se muestra

---

## 🔧 Configuración Requerida

### Backend (Spring Boot)

- [ ] Servidor corriendo en `http://localhost:8080`
- [ ] Endpoint POST `/auth/login` implementado
- [ ] Endpoint POST `/auth/register` implementado
- [ ] CORS configurado para `http://localhost:4200`
- [ ] JWT tokens siendo generados
- [ ] Validación de credenciales implementada

### Frontend (Angular)

- [ ] Node.js v14+ instalado
- [ ] Angular CLI 13+ instalado
- [ ] `npm install` ejecutado
- [ ] Archivos de autenticación en su lugar
- [ ] `app.module.ts` actualizado

---

## 📊 Verificación de Performance

### Load Times

- [ ] Página de login carga en < 3s
- [ ] Después de login, redirección en < 1s
- [ ] Peticiones protegidas responden normalmente

### Memory Usage

- [ ] Token en localStorage (~1-2KB)
- [ ] No memory leaks en subscriptions
- [ ] No múltiples interceptors registrados

### Network

- [ ] Peticiones `/auth/login` con método POST
- [ ] Peticiones `/auth/register` con método POST
- [ ] Peticiones protegidas incluyen Authorization header
- [ ] Solo 1 header adicional por petición

---

## 🐛 Debugging

Si algo no funciona, verifica:

### En Browser Console (F12)

```javascript
// 1. Verifica si hay errores
console.error() o console.log()

// 2. Verifica localStorage
localStorage.getItem('token');

// 3. Verifica que el backend responde
fetch('http://localhost:8080/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username: 'admin', password: 'admin' })
})
.then(r => r.json())
.then(d => console.log(d));

// 4. Verifica interceptor
// En Network tab (F12), cada petición debe tener:
// Authorization: Bearer eyJ...
```

**Checklist:**
- [ ] No hay errores en console
- [ ] Backend responde a requests
- [ ] Token se guarda y recupera
- [ ] Header se incluye en peticiones

### En VS Code

- [ ] Abre terminal integrada
- [ ] Ejecuta `ng serve`
- [ ] Revisa que compile sin errores
- [ ] Revisa linea de "compiled successfully"

**Checklist:**
- [ ] Compilación exitosa
- [ ] No hay warnings de TypeScript
- [ ] dev server escuchando en localhost:4200

---

## ✅ Final Checklist

Marca esto al finalizar la implementación:

- [ ] Todos los archivos existen
- [ ] Todos los archivos tienen el código correcto
- [ ] No hay errores de compilación
- [ ] Es posible hacer login
- [ ] Es posible hacer registro
- [ ] El token se guarda en localStorage
- [ ] Las peticiones protegidas funcionan
- [ ] El logout funciona
- [ ] Se redirige a login en 401
- [ ] Responsive en móvil
- [ ] Documentación está completa
- [ ] Tests manuales pasaron

---

## 🎓 Próximos Pasos

Una vez completados todos los checklist anteriores:

1. **Crear componentes adicionales**
   - [ ] Dashboard
   - [ ] Navbar con botón logout
   - [ ] Sidebar de navegación

2. **Proteger rutas**
   - [ ] Importar `AuthGuard` en `app.routing.ts`
   - [ ] Agregar `canActivate: [AuthGuard]` a rutas protegidas

3. **Agregar más funcionalidades**
   - [ ] Refresh tokens
   - [ ] Recuperación de contraseña
   - [ ] Cambio de contraseña
   - [ ] Perfil de usuario

4. **Mejorar seguridad**
   - [ ] Implementar httpOnly cookies
   - [ ] Rate limiting
   - [ ] CSRF protection

---

**Completa este checklist para asegurar que todo está correcto! ✅**
