# 🔴 Error CORS en Producción - Solución Backend

## ❌ El Problema

```
Access to XMLHttpRequest at 'https://52-15-186-80.nip.io/auth/login' 
from origin 'https://djj250gaxlwsw.cloudfront.net' has been blocked by CORS policy
```

**Causa**: El `@CrossOrigin` en el controlador NO funciona con Spring Security activo. 
El preflight request (`OPTIONS`) es bloqueado por Spring Security **antes de llegar al controlador**.

---

## ✅ Solución: Configurar CORS Globalmente

### Paso 1: Crear la clase `CorsConfig.java`

**Ubicación**: `src/main/java/galacticos_app_back/galacticos/config/CorsConfig.java`

```java
package galacticos_app_back.galacticos.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import java.util.Arrays;

@Configuration
public class CorsConfig {

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        
        // ✅ Orígenes permitidos
        configuration.setAllowedOrigins(Arrays.asList(
            "http://localhost:4200",
            "http://localhost:3000",
            "http://localhost:8080",
            "https://52-15-186-80.nip.io",
            "http://52.15.186.80:8080",
            "https://djj250gaxlwsw.cloudfront.net",
            "https://papeleriafolderclip.com.co",
            "https://www.papeleriafolderclip.com.co"
        ));
        
        // ✅ Métodos HTTP permitidos
        configuration.setAllowedMethods(Arrays.asList(
            "GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"
        ));
        
        // ✅ Headers permitidos
        configuration.setAllowedHeaders(Arrays.asList("*"));
        
        // ✅ Permitir credenciales (cookies, Authorization)
        configuration.setAllowCredentials(true);
        
        // ✅ Cache del preflight (en segundos)
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
```

---

### Paso 2: Actualizar `SecurityConfig.java`

**Ubicación**: `src/main/java/galacticos_app_back/galacticos/config/SecurityConfig.java` (o similar)

**Busca este método**:
```java
@Bean
public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
```

**Y reemplázalo por esto**:
```java
@Bean
public SecurityFilterChain securityFilterChain(HttpSecurity http, CorsConfigurationSource corsConfigurationSource) throws Exception {
    http
        // ✅ AGREGAR ESTO: Configurar CORS ANTES que CSRF
        .cors(cors -> cors.configurationSource(corsConfigurationSource))
        
        // Deshabilitar CSRF para APIs REST
        .csrf(csrf -> csrf.disable())
        
        // Autorización
        .authorizeHttpRequests(auth -> auth
            .requestMatchers("/auth/**").permitAll()  // ✅ Login y Register sin autenticación
            .anyRequest().authenticated()
        )
        
        // ... resto de tu configuración (filters, exception handlers, etc.)
        ;
    
    return http.build();
}
```

---

### Paso 3: Remover `@CrossOrigin` del Controlador (OPCIONAL)

**Antes** (NO recomendado con Spring Security):
```java
@RestController
@RequestMapping("/auth")
@CrossOrigin(origins = {...})  // ❌ No funciona bien con Security
public class AuthController {
```

**Después** (RECOMENDADO):
```java
@RestController
@RequestMapping("/auth")
// ❌ Remover @CrossOrigin - Ya está en CorsConfig
public class AuthController {
```

---

## 🧪 Verificación

### En desarrollador (F12 → Network):

1. Abre `https://djj250gaxlwsw.cloudfront.net/login`
2. Ingresa usuario y contraseña
3. En Network, busca la solicitud `login` (OPTIONS y POST)
4. ✅ Debes ver estos headers en la respuesta:

```
Access-Control-Allow-Origin: https://djj250gaxlwsw.cloudfront.net
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS, PATCH
Access-Control-Allow-Headers: *
Access-Control-Allow-Credentials: true
Access-Control-Max-Age: 3600
```

---

## 🚀 Deploying

```bash
# 1. Compilar
mvn clean package

# 2. Ejecutar
java -jar target/galacticos-app-back.jar

# 3. Probar
curl -X OPTIONS https://52-15-186-80.nip.io/auth/login \
  -H "Origin: https://djj250gaxlwsw.cloudfront.net" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -v
```

---

## 📋 Estructura de Archivos

```
galacticos_app_back/
└── src/main/java/galacticos_app_back/galacticos/
    └── config/
        ├── CorsConfig.java          ← CREAR ESTO
        ├── SecurityConfig.java      ← ACTUALIZAR ESTO
        └── ...
    └── controller/
        └── AuthController.java      ← (opcional) Remover @CrossOrigin
```

---

## ⚠️ Troubleshooting

| Problema | Solución |
|----------|----------|
| Still CORS error | Verifica que `CorsConfig` esté siendo escaneado (`@Configuration`) |
| 404 en OPTIONS | Asegúrate que `/auth/**` está en `permitAll()` |
| No ve los headers | Limpia caché del navegador (Ctrl+Shift+Del) |
| Localhost funciona pero producción no | Verifica que el origen CloudFront esté en `allowedOrigins` |

---

## 📞 Preguntas

- ¿Tienes otra clase `SecurityFilterChain` o `WebSecurityConfigurerAdapter`?
- ¿Usas JWT? El token debe ir en el header `Authorization: Bearer <token>`
- ¿Hay otros filtros que puedan estar bloqueando?

Comparte tu `SecurityConfig.java` completo si aún hay errores.
