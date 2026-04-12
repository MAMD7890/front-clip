# 📊 Diagramas - Sistema de Autenticación Folder Clip

## 🔄 Flujo de Autenticación Completo

```
┌─────────────────────────────────────────────────────────────────────┐
│                    USUARIO ABRE LA APLICACIÓN                       │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
                    ┌────────────────┐
                    │ ¿Token existe  │
                    │ en localStorage?
                    └────────┬────────┘
                             │
                ┌────────────┴───────────┐
                │                        │
          ┌─────▼────────┐       ┌──────▼─────┐
          │  SÍ (Token)  │       │ NO (Vacío) │
          └──────┬───────┘       └──────┬──────┘
                 │                       │
        ┌────────▼───────────┐   ┌──────▼──────────┐
        │ Redirige a         │   │ Muestra Login   │
        │ Dashboard          │   │ (LoginComponent)│
        └────────────────────┘   └──────┬──────────┘
                                        │
                                        ▼
                            ┌───────────────────────┐
                            │ Usuario ingresa datos │
                            │ username y password   │
                            └───────────┬───────────┘
                                        │
                                        ▼
```

## 🔐 LOGIN / REGISTRO

```
┌──────────────────────────────────────────────────┐
│ Usuario hace submit del formulario               │
│ - username: "admin"                              │
│ - password: "admin"                              │
└────────────────────┬─────────────────────────────┘
                     │
        ┌────────────▼────────────┐
        │ Validación del cliente  │
        │ - Es requerido          │
        │ - Min 3 chars (user)    │
        │ - Min 6 chars (pw)      │
        └────────────┬────────────┘
                     │
        ┌────────────▼────────────┐
        │ POST /auth/login        │
        │ o POST /auth/register   │
        └────────────┬────────────┘
                     │
                     ▼
        ┌────────────────────────┐
        │ Backend valida         │
        │ - Credenciales         │
        │ - Contraseña           │
        └────────────┬───────────┘
                     │
      ┌──────────────┴──────────────┐
      │                             │
  ┌───▼──────┐              ┌──────▼────┐
  │ ✅ OK    │              │ ❌ ERROR  │
  │ Status200│              │ 400/401   │
  └───┬──────┘              └──────┬────┘
      │                            │
      ▼                            ▼
  ┌────────────────────┐   ┌──────────────────┐
  │ Response:          │   │ Muestra error:   │
  │ {                  │   │ "Usuario ya      │
  │   token:           │   │  existe" o       │
  │   "eyJ..."         │   │ "Credenciales    │
  │ }                  │   │  incorrectas"    │
  └────────┬───────────┘   └──────────────────┘
           │
           ▼
  ┌────────────────────────────┐
  │ localStorage.setItem(      │
  │   'token', response.token  │
  │ )                          │
  └────────┬───────────────────┘
           │
           ▼
  ┌────────────────────────┐
  │ this.router.navigate   │
  │   (['/'])              │
  │ (Redirige a Dashboard) │
  └────────────────────────┘
```

## 🛡️ Flujo de Petición Protegida

```
┌─────────────────────────────────────┐
│ Componente hace petición:           │
│ this.http.get('/products')          │
└────────────────┬────────────────────┘
                 │
                 ▼
    ┌────────────────────────────┐
    │ AuthInterceptor           │
    │ intercept() se ejecuta    │
    └────────────┬──────────────┘
                 │
                 ▼
    ┌────────────────────────────┐
    │ ¿Existe token en          │
    │ localStorage?              │
    └────────────┬──────────────┘
                 │
            ┌────┴──────┐
            │           │
       ┌────▼─┐    ┌───▼────┐
       │ SÍ   │    │ NO     │
       └────┬─┘    └───┬────┘
            │          │
     ┌──────▼──┐    ┌──▼──────┐
     │ Agrega  │    │ Continúa│
     │ header: │    │ sin     │
     │ Authz:  │    │ token   │
     │ Bearer  │    └─────────┘
     │ <token> │
     └──────┬──┘
            │
            ▼
    ┌────────────────────┐
    │ Envía petición HTTP│
    │ con header        │
    │ Authorization     │
    └────────┬──────────┘
             │
             ▼
    ┌────────────────────┐
    │ Backend recibe    │
    │ petición          │
    └────────┬──────────┘
             │
             ▼
    ┌────────────────────┐
    │ Valida token      │
    └────────┬──────────┘
             │
    ┌────────┴─────────┐
    │                  │
 ┌──▼────┐        ┌───▼────┐
 │ ✅ OK │        │ ❌ 401 │
 │Válido │        │Expirado│
 └──┬────┘        └───┬────┘
    │                 │
    ▼                 ▼
┌──────────────┐  ┌──────────────────┐
│ Retorna datos│  │ AuthInterceptor: │
│ 200 OK       │  │ - logout()       │
├──────────────┤  │ - router.navigate│
│ [            │  │   (['/login'])   │
│   {...},     │  └──────────────────┘
│   {...}      │
│ ]            │
└──────┬───────┘
       │
       ▼
┌──────────────────┐
│ Componente       │
│ recibe datos     │
│ this.products=...│
│ Actualiza UI     │
└──────────────────┘
```

## 🔀 Cambio entre Login y Registro

```
┌──────────────────────────┐
│ Página de Login          │
│                          │
│ [Username]               │
│ [Password]               │
│                          │
│ [Iniciar sesión]         │
│                          │
│ ¿No tienes cuenta?       │
│ [Regístrate] ◄━━━ Click  │
│                          │
└──────────┬───────────────┘
           │
           ▼
┌────────────────────────────┐
│ toggleMode() en componente │
│ isRegister = !isRegister   │
│ error = null               │
│ form.reset()               │
└────────────┬───────────────┘
             │
             ▼
┌──────────────────────────┐
│ Página de Registro       │
│                          │
│ [Username]               │
│ [Password]               │
│                          │
│ [Registrarse]            │
│                          │
│ ¿Ya tienes cuenta?       │
│ [Inicia sesión] ◄━━ Click│
│                          │
└──────────────────────────┘
```

## 📝 Estado del Formulario de Login

```
┌─────────────────────────────────────────────┐
│ LoginComponent                              │
│                                             │
│ Propiedades:                                │
│ ├─ authForm: FormGroup                     │
│ ├─ error: string | null                    │
│ ├─ loading: boolean                        │
│ ├─ isRegister: boolean                     │
│ └─ errors: { [key]: string }               │
│                                             │
│ Estados:                                    │
│ ├─ Initial:                                │
│ │  ├─ error = null                         │
│ │  ├─ loading = false                      │
│ │  ├─ isRegister = false                   │
│ │  └─ errors = {}                          │
│ │                                           │
│ ├─ Escribiendo:                            │
│ │  └─ formGroup se actualiza               │
│ │                                           │
│ ├─ Submit:                                 │
│ │  ├─ loading = true                       │
│ │  ├─ errors clear                         │
│ │  └─ POST /auth/login                     │
│ │                                           │
│ ├─ Respuesta exitosa:                      │
│ │  ├─ Token guardado                       │
│ │  ├─ Redirige a dashboard                 │
│ │  └─ loading = false                      │
│ │                                           │
│ └─ Error:                                  │
│    ├─ loading = false                      │
│    └─ error mostrado                       │
│                                             │
└─────────────────────────────────────────────┘
```

## 🔐 Tipos de Errores

```
┌──────────────────────────────────────────┐
│ ERRORES EN AUTENTICACIÓN                 │
└──────┬───────────────────────────────────┘
       │
   ┌───┴───┐
   │       │
┌──▼────┐ ┌──▼────────────┐
│ERRORES│ │ERRORES DE      │
│DE     │ │VALIDACIÓN      │
│SERVER │ │(Campos)        │
└──┬────┘ └──┬─────────────┘
   │         │
   ├─ 400   ├─ username: "must not be blank"
   │ Bad    ├─ password: "must be min 6 chars"
   │ Request├─ username: "Username already taken"
   │        └─ Mostrado campo a campo
   │
   ├─ 401
   │ Unauthorized
   │ (Credenciales incorrectas)
   │
   ├─ 500
   │ Server Error
   │ "Error en el servidor"
   │
   └─ Error de conexión
     "Error en la conexión"
```

## 🎨 Diseño UI - Folder Clip

```
┌─────────────────────────────────────┐
│    [Banner de fondo - imagen]       │
│                                     │
│    ┌───────────────────────────┐   │
│    │  ┌─────────────────────┐  │   │
│    │  │   [LOGO FOLDER]     │  │   │
│    │  │      CLIP           │  │   │
│    │  └─────────────────────┘  │   │
│    │                           │   │
│    │  Bienvenido a Folder Clip│   │
│    │  Tu espacio creativo      │   │
│    │                           │   │
│    │  Usuario:                 │   │
│    │  [________________]       │   │
│    │                           │   │
│    │  Contraseña:              │   │
│    │  [________________]       │   │
│    │                           │   │
│    │  [Iniciar sesión]◄────    │   │
│    │  (Botón Amarillo #fdc830) │   │
│    │                           │   │
│    │  ¿No tienes cuenta?       │   │
│    │  [Regístrate]             │   │
│    │                           │   │
│    │  © 2024 Folder Clip       │   │
│    └───────────────────────────┘   │
│                                     │
└─────────────────────────────────────┘
```

## 🚀 Flujo de Navegación

```
                      ┌────────────┐
                      │  Inicio    │
                      └─────┬──────┘
                            │
                    ┌───────▼────────┐
                    │ ¿Auth valida?  │
                    └───────┬────────┘
                            │
                ┌───────────┴──────────┐
                │                      │
            ┌───▼─────┐          ┌────▼─────┐
            │ SÍ      │          │ NO       │
            └───┬─────┘          └────┬─────┘
                │                     │
                ▼                     ▼
        ┌──────────────┐      ┌────────────────┐
        │ Dashboard    │      │ Login Page     │
        │              │      │                │
        │ (Protected)  │      │ - Login form   │
        │              │      │ - Register opt │
        └──────────────┘      └─────┬──────────┘
                                    │
                          ┌─────────┴─────────┐
                          │                   │
                    ┌─────▼──┐         ┌─────▼──┐
                    │ Login  │         │Register│
                    │ OK     │         │ OK     │
                    └─────┬──┘         └─────┬──┘
                          │                  │
                          └──────┬───────────┘
                                 │
                          ┌──────▼────────┐
                          │ Guardar token │
                          │ Redir a Dash  │
                          └───────────────┘
```

---

## 📊 Tabla de Estados HTTP

| Código | Significado | Acción |
|--------|-------------|--------|
| **200** | ✅ Éxito | Guardar token, redirigir |
| **400** | ❌ Bad Request | Mostrar error de validación |
| **401** | ❌ Unauthorized | Redirigir a login (interceptor) |
| **403** | ❌ Forbidden | Usuario sin permisos |
| **404** | ❌ Not Found | Recurso no encontrado |
| **500** | ❌ Server Error | Mostrar error genérico |

---

## 🔄 Ciclo de Vida del Token

```
1. CREAR TOKEN
   │
   ├─ Login exitoso
   │ └─ Backend genera JWT
   │    └─ Contiene data cifrada + firma
   │
   ├─ Respuesta: { token: "eyJ..." }
   │
   └─ Frontend guarda: localStorage

2. USAR TOKEN
   │
   ├─ Cada petición HTTP
   │ ├─ Interceptor agrega header
   │ └─ Authorization: Bearer {token}
   │
   └─ Backend valida
      ├─ Desencripta JWT
      ├─ Verifica firma
      └─ Retorna datos o 401

3. EXPIRAR TOKEN
   │
   ├─ Token tiene fecha de expiración
   │ (configurada en backend)
   │
   ├─ Si petición con token expirado
   │ └─ Backend retorna 401
   │
   ├─ AuthInterceptor captura 401
   │ ├─ logout() elimina token
   │ └─ Redirige a /login
   │
   └─ Usuario debe login de nuevo

4. ELIMINAR TOKEN
   │
   ├─ Usuario hace logout()
   │ └─ localStorage.removeItem('token')
   │
   ├─ Siguiente petición sin token
   │ └─ Servidor rechaza (401)
   │
   └─ Usuario debe login de nuevo
```
