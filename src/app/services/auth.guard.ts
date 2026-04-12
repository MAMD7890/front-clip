import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from './auth.service';

/**
 * Auth Guard - Protege rutas que requieren autenticación
 * 
 * Uso en app.routing.ts:
 * 
 * const routes: Routes = [
 *   { path: 'login', component: LoginComponent },
 *   { 
 *     path: 'dashboard', 
 *     component: DashboardComponent, 
 *     canActivate: [AuthGuard]  // ← Protegida
 *   },
 *   { 
 *     path: 'products', 
 *     component: ProductsComponent, 
 *     canActivate: [AuthGuard]  // ← Protegida
 *   }
 * ];
 */
@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {
    // Si usuario está autenticado
    if (this.authService.isAuthenticated()) {
      return true;
    }

    // Si no está autenticado, redirige a login
    // y guarda la URL intendida para redirigir después del login
    this.router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
    return false;
  }
}
