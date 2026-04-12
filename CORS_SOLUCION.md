# 🔴 Error CORS - Solución Implementada

## ❌ El Problema

```
Access to XMLHttpRequest at 'http://localhost:8080/auth/login' from origin 
'http://localhost:4200' has been blocked by CORS policy
```

Esto significa:
- Frontend (`http://localhost:4200`) intenta conectarse al Backend (`http://localhost:8080`)
- El navegador bloquea la solicitud porque vienen de **orígenes diferentes**
- El servidor backend no tiene CORS configurado

---

## ✅ Solución Implementada - Proxy en Angular

He configurado un **proxy de desarrollo** que redirige todas las solicitudes:

### Archivos Modificados:

1. **✨ Nuevo: `proxy.conf.json`** (raíz del proyecto)
   - Redirige `/auth/*` → `http://localhost:8080/auth/*`
   - Redirige `/products/*` → `http://localhost:8080/products/*`
   - Redirige `/customers/*` → `http://localhost:8080/customers/*`
   - Y todos los otros endpoints

2. **✏️ Actualizado: `angular.json`**
   - Agregada configuración: `"proxyConfig": "proxy.conf.json"`

3. **✏️ Actualizado: `src/app/services/auth.service.ts`**
   - Cambió `baseUrl` de `http://localhost:8080` a `/auth`

---

## 🚀 Cómo Usar

### Paso 1: Detén el servidor actual
```bash
# Presiona Ctrl+C en la terminal donde ejecutaste ng serve o npm start
```

### Paso 2: Inicia de nuevo con el proxy
```bash
ng serve
# O si usas npm start, simplemente:
npm start
```

### Paso 3: Accede a la aplicación
```
http://localhost:4200
```

El proxy ahora:
- ✅ Intercepta peticiones a `/auth/login`
- ✅ Las redirige a `http://localhost:8080/auth/login`
- ✅ El navegador ve que vienen del mismo origen (localhost:4200)
- ✅ **Adiós CORS error! 🎉**

---

## ⚙️ ¿Cómo funciona el proxy?

```
Tu navegador (localhost:4200)
        ↓
    Pide: POST /auth/login
        ↓
    Proxy Angular intercepta
        ↓
    Redirige a: http://localhost:8080/auth/login
        ↓
    Backend responde
        ↓
    Proxy devuelve respuesta al navegador
        ↓
Como todo viene de localhost:4200 → ¡Sin CORS error! ✅
```

---

## 📋 Estructura del proxy.conf.json

```json
{
  "/auth": {
    "target": "http://localhost:8080",      // Servidor backend
    "secure": false,                         // No validar certificado SSL
    "changeOrigin": true                     // Cambiar origen de la solicitud
  },
  "/products": { ... },  // Otros endpoints
  "/customers": { ... },
  "/sales": { ... },
  "/reports": { ... },
  "/users": { ... }
}
```

---

## 🧪 Prueba que funciona

1. Abre `http://localhost:4200`
2. Intenta hacer login con:
   - Usuario: `admin`
   - Contraseña: `admin`
3. Mira en la **consola (F12)** → **Network tab**
4. Debes ver:
   - ✅ `login` → Status 200 (exitoso)
   - ✅ Response con `{ token: "..." }`
   - ❌ **NO debe haber error CORS**

---

## 📝 Cambios en el Código

### Antes (con error CORS):
```typescript
private baseUrl = 'http://localhost:8080';

login(username: string, password: string): Observable<AuthResponse> {
  return this.http.post<AuthResponse>(
    `${this.baseUrl}/auth/login`,  // ← Full URL, CORS error ❌
    request
  ).pipe(...);
}
```

### Después (con proxy):
```typescript
private baseUrl = '/auth';

login(username: string, password: string): Observable<AuthResponse> {
  return this.http.post<AuthResponse>(
    `${this.baseUrl}/login`,  // ← URL relativa, proxy la redirige ✅
    request
  ).pipe(...);
}
```

---

## 🎯 Ventajas del Proxy

✅ **Desarrollo fácil** - No necesita cambios en el backend
✅ **Sin CORS errors** - El navegador no detecta orígenes diferentes
✅ **Redireccionamiento automático** - De localhost:4200 a localhost:8080
✅ **Todos los endpoints** - Funciona con /products, /customers, etc.
✅ **Solo en desarrollo** - En producción usarás URLs reales

---

## ❌ Si sigue funcionando mal

### Checklist:

- [ ] ¿Mataste el servidor anterior con Ctrl+C?
- [ ] ¿Ejecutaste `ng serve` de nuevo?
- [ ] ¿El backend está corriendo en `http://localhost:8080`?
- [ ] ¿Limpiaste el caché del navegador (Ctrl+Shift+Delete)?
- [ ] ¿Recargaste la página (Ctrl+R)?

### Debug:

```javascript
// En la consola del navegador (F12)

// 1. Verifica que la petición va a localhost:4200
console.log(window.location.origin);  // Debe ser http://localhost:4200

// 2. Mira en Network tab qué URL se llama
// Debe llamar a: http://localhost:4200/auth/login (no :8080)

// 3. Verifica el proxy está activo
// El servidor debe decir: "[at] 127.0.0.1:4200 - - [...]"
```

---

## 🔐 Alternativa: Configurar CORS en el Backend (Producción)

Para producción, el backend debe tener CORS configurado. Si usas **Spring Boot**:

```java
@Configuration
public class CorsConfig implements WebMvcConfigurer {
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
            .allowedOrigins("http://localhost:4200", "https://tu-dominio.com")
            .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
            .allowedHeaders("*")
            .allowCredentials(true)
            .maxAge(3600);
    }
}
```

O con annotations:

```java
@RestController
@CrossOrigin(origins = "http://localhost:4200")
public class AuthController { ... }
```

---

## 📚 Archivos Afectados

```
✨ proxy.conf.json                           (NUEVO)
✏️  angular.json                              (actualizado - agregado proxyConfig)
✏️  src/app/services/auth.service.ts          (actualizado - URLs relativas)
```

---

## 🎓 Resumen

| Problema | Solución | Estado |
|----------|----------|--------|
| CORS error en `/auth/login` | Proxy proxy.conf.json | ✅ Implementado |
| URLs hardcoded a localhost:8080 | URLs relativas `/auth` | ✅ Actualizado |
| Necesidad de cambiar backend | No es necesario | ✅ Listo |

---

**¡Listo! El error CORS está resuelto. Inicia el servidor con `ng serve` y prueba. 🚀**
