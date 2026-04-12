# 🚀 Quick Start - Sistema de Autenticación Folder Clip

## ✅ Requisitos

- Angular CLI verificado
- Backend corriendo en `http://localhost:8080`
- Usuario de prueba: `admin` / `admin`

---

## 🎯 Pasos Rápidos

### 1️⃣ Verificar importaciones en `app.module.ts`

Ya está configurado, pero verifica que tenga:

```typescript
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { AuthInterceptor } from './services/auth.interceptor';

@NgModule({
  imports: [
    HttpClientModule,  // ✅ NECESARIO
    ReactiveFormsModule // ✅ NECESARIO
  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    }
  ]
})
export class AppModule { }
```

### 2️⃣ Prueba el login manual

Abre tu navegador (ChromeDevTools) y ejecuta:

```javascript
// 1. Login
fetch('http://localhost:8080/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username: 'admin', password: 'admin' })
})
.then(r => r.json())
.then(data => {
  localStorage.setItem('token', data.token);
  console.log('Token:', data.token);
});

// 2. Verificar que está guardado
localStorage.getItem('token');

// 3. Usar en petición protegida
const token = localStorage.getItem('token');
fetch('http://localhost:8080/products', {
  headers: { 'Authorization': `Bearer ${token}` }
})
.then(r => r.json())
.then(products => console.log('Productos:', products));

// 4. Logout
localStorage.removeItem('token');
```

### 3️⃣ Probar en la aplicación Angular

```bash
# Instala dependencias (si no las tienes)
npm install

# Inicia la aplicación
ng serve

# O usa npm start (si está configurado)
npm start
```

Abre: `http://localhost:4200`

---

## 🧪 Casos de Prueba

### Test 1: Login exitoso

```
Input:
- Usuario: admin
- Contraseña: admin

Resultado esperado:
✅ Token guardado en localStorage
✅ Redirige a dashboard
✅ Sin errores en consola
```

### Test 2: Login fallido - Credenciales incorrectas

```
Input:
- Usuario: admin
- Contraseña: wrongpassword

Resultado esperado:
❌ Error 401 Unauthorized
❌ Mensaje: "Error en la autenticación" o similar
❌ No redirige, sigue en login
```

### Test 3: Login fallido - Usuario no existe

```
Input:
- Usuario: noexiste
- Contraseña: password123

Resultado esperado:
❌ Error 401 Unauthorized
❌ No guarda token
❌ Muestra error
```

### Test 4: Campos vacíos

```
Input:
- Usuario: [vacío]
- Contraseña: [vacío]

Resultado esperado:
❌ Error de validación del cliente
❌ NO hace petición al backend
❌ Muestra errores: "El usuario es requerido", etc.
```

### Test 5: Registro nuevo usuario

```
Input:
- Usuario: newuser123
- Contraseña: password123

Resultado esperado:
✅ Se registra el usuario
✅ Recibe token automáticamente
✅ Se guarda en localStorage
✅ Redirige a dashboard
```

### Test 6: Petición protegida con token

```
En la consola (despues de login):

fetch('http://localhost:8080/products', {
  headers: { 
    'Authorization': `Bearer ${localStorage.getItem('token')}` 
  }
})
.then(r => r.json())
.then(d => console.log(d));

Resultado:
✅ Retorna lista de productos
❌ Si token inválido → 401 → Redirige a login
```

### Test 7: Logout

```
1. Hacer login exitosamente
2. Verificar localStorage: localStorage.getItem('token') ← debe mostrar token
3. Hacer logout (clic en botón o llamar logout())
4. Verificar localStorage: localStorage.getItem('token') ← debe ser null
5. Intentar acceder a ruta protegida
   ├─ Resultado: Redirige a login
```

---

## 🔨 Personalización

### Cambiar URL del servidor

Edita [src/app/services/auth.service.ts](src/app/services/auth.service.ts#L10):

```typescript
private baseUrl = 'http://localhost:8080'; // ← Cambiar aquí
```

### Cambiar tiempo de sesión

El tiempo de sesión está configurado en el backend, pero puedes agregar:

```typescript
// En auth.service.ts - agregar método para renovar token
refreshToken(): Observable<AuthResponse> {
  return this.http.post<AuthResponse>(
    `${this.baseUrl}/auth/refresh`,
    {}
  ).pipe(
    tap(res => localStorage.setItem('token', res.token)),
    catchError(this.handleError)
  );
}
```

### Agregar más campos al login

En [src/app/login/login.component.ts](src/app/login/login.component.ts):

```typescript
this.authForm = this.fb.group({
  username: ['', [Validators.required, Validators.minLength(3)]],
  password: ['', [Validators.required, Validators.minLength(6)]],
  email: ['', [Validators.required, Validators.email]], // ← Nuevo
  rememberMe: [false] // ← Nuevo
});
```

En [src/app/login/login.component.html](src/app/login/login.component.html):

```html
<div class="form-group">
  <label for="email">Email</label>
  <input id="email" formControlName="email" type="email" class="form-control" />
</div>

<div class="form-group">
  <input type="checkbox" formControlName="rememberMe" id="remember" />
  <label for="remember">Recuerda mis datos</label>
</div>
```

### Cambiar colores del tema

Edita [src/app/login/login.component.css](src/app/login/login.component.css):

```css
/* Cambiar color amarillo a otro */
.btn-submit {
  background-color: #fdc830; /* ← Cambiar aquí */
}

/* Cambiar colores del formulario */
.form-control:focus {
  border-color: #fdc830; /* ← Cambiar aquí */
  box-shadow: 0 0 0 3px rgba(253, 200, 48, 0.1);
}
```

---

## 🐛 Problemas Comunes

### Error: `Cannot POST /auth/login`

**Problema**: Backend no está corriendo

**Solución**:
```bash
# Inicia el backend Spring Boot
java -jar backend.jar
# o
mvn spring-boot:run
```

### Error: `CORS policy: No 'Access-Control-Allow-Origin'`

**Problema**: CORS no está configurado en el backend

**Solución** (en backend Spring Boot):

```java
@Configuration
public class CorsConfig extends WebMvcConfigurer {
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/auth/**")
            .allowedOrigins("http://localhost:4200")
            .allowedMethods("GET", "POST")
            .allowedHeaders("*")
            .allowCredentials(true);
    }
}
```

### Error: `Token is invalid`

**Problema**: Token expirado o corrompido

**Solución**:
1. Limpia localStorage: `localStorage.removeItem('token')`
2. Haz login de nuevo
3. O implementa refresh tokens

### No se guarda el token

**Problema**: localStorage deshabilitado (modo incógnito/privado)

**Solución**: Usar sessionStorage en lugar de localStorage, o usar cookies

```typescript
// En auth.service.ts
private storage = localStorage; // O sessionStorage

this.storage.setItem('token', res.token);
```

### Button sigue en Cargando... indefinidamente

**Problema**: El subscribe nunca termina o hay error en el manejo

**Solución**: Verifica en DevTools:
```javascript
// Abre consola (F12)
// Observa las peticiones (Network tab)
// Revisa los errores (Console tab)
```

---

## 📱 Proximos Pasos Recomendados

- [ ] **Auth Guard** - Proteger rutas privadas
- [ ] **Refresh Tokens** - Renovar tokens automáticamente
- [ ] **Guards de Rol** - Admin, User, etc.
- [ ] **Dashboard** - Página principal después de login
- [ ] **CRUD de Productos** - Gestionar productos
- [ ] **Módulo de Clientes** - Gestionar clientes
- [ ] **Reportes** - Dashboard de datos

---

## 📖 Documentación Completa

Revisa estos archivos para más información:

- [AUTENTICACION.md](AUTENTICACION.md) - Documentación completa
- [DIAGRAMAS_AUTENTICACION.md](DIAGRAMAS_AUTENTICACION.md) - Diagramas de flujo
- [EJEMPLOS_AUTENTICACION.ts](EJEMPLOS_AUTENTICACION.ts) - Código de ejemplo

---

## ✨ Resumen de Archivos Creados

```
src/
├── app/
│   ├── login/
│   │   ├── login.component.ts        (✅ Actualizado)
│   │   ├── login.component.html      (✅ Actualizado)
│   │   └── login.component.css       (✅ Actualizado con diseño)
│   ├── services/
│   │   ├── auth.service.ts           (✅ Actualizado con registro)
│   │   └── auth.interceptor.ts       (🆕 Nuevo)
│   ├── models/
│   │   └── auth.models.ts            (🆕 Nuevo)
│   └── app.module.ts                 (✅ Actualizado con interceptor)
│
├── AUTENTICACION.md                  (🆕 Documentación completa)
├── DIAGRAMAS_AUTENTICACION.md        (🆕 Diagramas visuales)
├── EJEMPLOS_AUTENTICACION.ts         (🆕 Ejemplos de código)
└── QUICK_START.md                    (🆕 Este archivo)
```

---

## 🎓 Consejos Finales

1. **Lee la documentación** antes de hacer cambios
2. **Usa DevTools** para debuguear (F12 → Network + Console)
3. **Prueba manualmente** con curl/Postman antes de usar en la app
4. **Implementa error handling** en todos los componentes
5. **Usa TypeScript** tipos para mejor IDE support
6. **Comenta el código** para que otros lo entiendan
7. **Mantén localStorage seguro** - no guardes datos sensibles

---

**¡Listo para empezar! 🚀**

Si tienes problemas, revisa los archivos de documentación o checa la consola del navegador (F12).
