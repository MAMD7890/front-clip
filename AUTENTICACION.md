# 🔐 Sistema de Autenticación - Folder Clip Frontend

## 📋 Descripción

El sistema de autenticación ha sido implementado completamente en el frontend de Angular usando:
- **Component**: `LoginComponent` - Maneja Login y Registro
- **Service**: `AuthService` - Comunica con el backend
- **Interceptor**: `AuthInterceptor` - Agrega token automáticamente a las peticiones

---

## 🎯 Características Implementadas

✅ **Formulario de Login**
- Campo de usuario y contraseña
- Validación de campos
- Manejo de errores

✅ **Formulario de Registro**
- Mismo formulario con toggle mode
- Validaciones mínimas (3+ caracteres usuario, 6+ contraseña)
- Registro automático y login después de registrarse

✅ **Gestión de Tokens**
- Almacenamiento en `localStorage`
- Inclusión automática en header `Authorization: Bearer <token>`
- Eliminación al logout

✅ **Interceptor HTTP**
- Agrega token automáticamente a todas las peticiones
- Detecta respuestas 401 (no autorizado)
- Redirige al login si token expirá

✅ **Diseño**
- Interfaz estilo "Folder Clip"
- Banner de fondo personalizado
- Logo centrado
- Botón amarillo (#fdc830)
- Responsive en móvil

---

## 🔧 Estructura de Archivos

```
src/app/
├── login/
│   ├── login.component.ts       ← Lógica de login/registro
│   ├── login.component.html     ← Template con formulario
│   └── login.component.css      ← Estilos personalizados
├── services/
│   ├── auth.service.ts          ← Servicio de autenticación
│   └── auth.interceptor.ts      ← Interceptor HTTP
└── app.module.ts                ← Módulo principal (actualizado con interceptor)
```

---

## 🚀 Uso en el Componente de Login

### Cambiar entre Login y Registro

El componente tiene una propiedad `isRegister` que se alterna con el método `toggleMode()`:

```typescript
// En el template
{{ isRegister ? 'Crear Cuenta' : 'Bienvenido' }}
```

### Manejo de Errores

El componente captura dos tipos de errores:

1. **Validación de campos**: Errores de cada campo (username, password)
   ```typescript
   errors: { username?: string, password?: string }
   ```

2. **Error general**: Mensaje de error del backend
   ```typescript
   error: string | null
   ```

---

## 📡 Peticiones HTTP

### Automáticamente agregada por el interceptor:

```typescript
// Todas estas peticiones incluyen el token automáticamente
this.http.get('/protected-endpoint')
this.http.post('/products', data)
this.http.put('/products/123', data)
```

**Header automático:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 🔑 Flujo de Autenticación

### 1️⃣ Login
```
Usuario ingresa credenciales
    ↓
POST /auth/login { username, password }
    ↓
Recibe token
    ↓
localStorage.setItem('token', token)
    ↓
Redirige al dashboard
```

### 2️⃣ Registro
```
Usuario completa form de registro
    ↓
POST /auth/register { username, password }
    ↓
Recibe token
    ↓
localStorage.setItem('token', token)
    ↓
Redirige al dashboard
```

### 3️⃣ Peticiones Protegidas
```
App intenta hacer petición a /products
    ↓
AuthInterceptor agrega: Authorization: Bearer {token}
    ↓
Backend valida token
    ↓
Si válido → Retorna datos
    ↓
Si expirado (401) → AuthInterceptor redirige a /login
```

---

## 🛡️ Seguridad

- ✅ Token almacenado en **localStorage** (accessible solo desde JavaScript)
- ✅ Incluido automáticamente en todas las peticiones protegidas
- ✅ Detecta tokens expirados y redirige al login
- ✅ Validación lado **cliente** (mínimo 3 y 6 caracteres)
- ✅ Validación lado **backend** (obligatorios, formatos, etc.)

---

## 📝 Ejemplos de Uso

### Usar en otros componentes

```typescript
import { AuthService } from './services/auth.service';

constructor(private authService: AuthService) {}

// Obtener token
const token = this.authService.getToken();

// Verificar si está autenticado
if (this.authService.isAuthenticated()) {
  console.log('Usuario autenticado');
}

// Logout
logout() {
  this.authService.logout();
  this.router.navigate(['/login']);
}
```

### Usar en templates (guards)

```typescript
// En src/app/app.routing.ts
import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from './services/auth.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(private auth: AuthService, private router: Router) {}

  canActivate(): boolean {
    if (this.auth.isAuthenticated()) {
      return true;
    }
    this.router.navigate(['/login']);
    return false;
  }
}

// Usar en rutas protegidas
const routes = [
  { path: 'dashboard', component: DashboardComponent, canActivate: [AuthGuard] },
  { path: 'products', component: ProductsComponent, canActivate: [AuthGuard] }
];
```

---

## 🧪 Pruebas

### Usuario de prueba
```
Usuario: admin
Contraseña: admin
```

### Endpoints disponibles
```
POST   /auth/login         - Login
POST   /auth/register      - Registro
GET    /products          - Listar productos (protegido)
POST   /products          - Crear producto (protegido)
GET    /customers         - Listar clientes (protegido)
POST   /customers         - Crear cliente (protegido)
```

---

## ⚠️ Próximos Pasos

1. **Crear componente de Dashboard** - Página principal después del login
2. **Implementar Guards** - Proteger rutas que requieren autenticación
3. **Agregar módulo de Productos** - CRUD de productos con API
4. **Agregar módulo de Clientes** - CRUD de clientes
5. **Formularios avanzados** - Validaciones complejas

---

## 🐛 Troubleshooting

### Error: CORS no permitido
**Solución**: Configurar CORS en el backend Spring Boot

### Error: 401 o token expirado
**Solución**: El interceptor redirigirá automáticamente a login

### No ve los cambios CSS
**Solución**: Limpiar caché (Ctrl+Shift+Delete en navegador)

---

## 📞 Soporte

Para preguntas sobre la autenticación, revisar:
- `src/app/login/login.component.ts` - Lógica principal
- `src/app/services/auth.service.ts` - Comunicación con backend
- `src/app/services/auth.interceptor.ts` - Headers y errores HTTP
