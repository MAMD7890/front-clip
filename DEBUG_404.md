# 🔴 Error 404 en /auth/register - Diagnóstico

## ❌ El Problema

```
POST http://localhost:4200/auth/register 404 (Not Found)
```

El proxy está **funcionando** (la URL es localhost:4200), pero el backend retorna 404 (no encontrado).

---

## 🔍 Causas Posibles

### 1️⃣ Backend no tiene el endpoint
El backend Spring Boot no tiene configurado `POST /auth/register`

### 2️⃣ Servidor no se reinició
El servidor Angular no reinició el proxy

### 3️⃣ Backend no está corriendo
El backend en `http://localhost:8080` no está activo

### 4️⃣ Ruta incorrecta en el backend
El endpoint está en `/api/auth/register` en lugar de `/auth/register`

---

## 🚀 Soluciones

### Paso 1: Verifica que el backend está corriendo

Abre una **terminal nueva** y prueba:

```bash
# Windows
curl -X POST http://localhost:8080/auth/login -H "Content-Type: application/json" -d "{\"username\":\"admin\",\"password\":\"admin\"}"

# Linux/Mac
curl -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin"}'
```

**Resultado esperado:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Si ves 404 o error de conexión:**
- El backend NO está corriendo
- O el endpoint NO existe en el backend

### Paso 2: Verifica los endpoints del backend

Si usas **Spring Boot**, los endpoints deben verse así:

```java
@RestController
@RequestMapping("/auth")
public class AuthController {

    @PostMapping("/login")  // ← Endpoint: POST /auth/login
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        // ... lógica
    }

    @PostMapping("/register")  // ← Endpoint: POST /auth/register
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        // ... lógica
    }
}
```

### Paso 3: Reinicia ambos servidores

**Terminal 1 - Backend (Spring Boot):**
```bash
# Mata el proceso actual (Ctrl+C)
# Inicia el backend
java -jar backend.jar
# O
mvn spring-boot:run
```

**Terminal 2 - Frontend (Angular):**
```bash
# Mata el proceso actual (Ctrl+C)
# Inicia de nuevo
ng serve
```

### Paso 4: Prueba manualmente desde el navegador

Abre **DevTools** (F12) → **Console** y ejecuta:

```javascript
// Test 1: Login
fetch('http://localhost:4200/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username: 'admin', password: 'admin' })
})
.then(r => {
  console.log('Status:', r.status);
  return r.json();
})
.then(d => console.log('Response:', d))
.catch(e => console.error('Error:', e));

// Test 2: Register
fetch('http://localhost:4200/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username: 'newuser', password: 'password123' })
})
.then(r => {
  console.log('Status:', r.status);
  return r.json();
})
.then(d => console.log('Response:', d))
.catch(e => console.error('Error:', e));
```

**Resultados esperados:**
- ✅ Status: 200 → Login exitoso
- ✅ Status: 200 → Registro exitoso
- ❌ Status: 404 → Endpoint NO existe
- ❌ Status: 401 → Credenciales incorrectas (pero endpoint existe)
- ❌ Status: 500 → Error en el servidor

---

## 📋 Checklist de Depuración

- [ ] ¿El backend está corriendo en `http://localhost:8080`?
- [ ] ¿El endpoint `/auth/login` existe? (Prueba con curl)
- [ ] ¿El endpoint `/auth/register` existe? (Prueba con curl)
- [ ] ¿Se reinició el servidor Angular después de cambiar proxy?
- [ ] ¿Limpiaste el caché del navegador (Ctrl+Shift+Delete)?
- [ ] ¿La petición va a `localhost:4200` (not :8080)?

---

## 💡 Si el Backend NO Tiene CORS Configurado

Si el backend retorna 404 pero estás seguro de que el endpoint existe, podría necesitar configuración CORS.

**Para Spring Boot** (agregar a `@Component` o `@Configuration`):

```java
@Configuration
public class CorsConfig implements WebMvcConfigurer {
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
            .allowedOrigins("http://localhost:4200")
            .allowedMethods("*")
            .allowedHeaders("*")
            .allowCredentials(true);
    }
}
```

O usar `@CrossOrigin` en el controlador:

```java
@RestController
@RequestMapping("/auth")
@CrossOrigin(origins = "http://localhost:4200")
public class AuthController { ... }
```

---

## 🔧 Configuración del Proxy Recomendada

El `proxy.conf.json` que tenemos debería funcionar:

```json
{
  "/auth": {
    "target": "http://localhost:8080",
    "secure": false,
    "changeOrigin": true
  },
  "/products": {
    "target": "http://localhost:8080",
    "secure": false,
    "changeOrigin": true
  }
}
```

Pero si tienes problemas, puedes usar this configuración más simple:

```json
{
  "/": {
    "target": "http://localhost:8080",
    "secure": false,
    "changeOrigin": true,
    "pathRewrite": {
      "^/$": ""
    }
  }
}
```

---

## 📊 Tabla de Diagnóstico

| Situación | Causa | Solución |
|-----------|-------|----------|
| 404 en `/auth/register` | Endpoint NO existe | Crear endpoint en backend |
| 404 en `/auth/login` | Endpoint NO existe | Crear endpoint en backend |
| 502 Bad Gateway | Backend no responde | Iniciar backend |
| 500 Internal Server | Error en el backend | Ver logs del backend |
| Funciona login pero no register | Solo `/login` existe | Crear `/register` en backend |

---

## 🎯 Próximo Paso

1. **Verifica que el backend está corriendo**
2. **Prueba los endpoints con curl/Postman**
3. **Si existen (status 200)**: El frontend debería funcionar
4. **Si no existen (status 404)**: Crea los endpoints en el backend
5. **Si hay CORS error**: Configura CORS en el backend

---

## 📞 Información Útil

### Ver logs del proxy Angular
```bash
# Ejecuta con modo verbose
ng serve --verbose
```

### Ver logs del backend
Depende del framework, pero generalmente muestra en la consola:

```
[INFO] POST /auth/login
[INFO] POST /auth/register
[ERROR] 404 Not Found
```

---

**¿Resultado de tu diagnosis? Avísame qué status obtienes en los tests 🔍**
