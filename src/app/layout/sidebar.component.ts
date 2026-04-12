import { Component, HostListener, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

interface MenuItem {
  iconClass: string;
  label: string;
  route: string;
  moduleKey: string;
}

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit {
  @Input() isOpen: boolean = true;
  @Output() toggleSidebar = new EventEmitter<void>();

  currentRoute: string = '';
  isMobile: boolean = false;

  allMenuItems: MenuItem[] = [
    { iconClass: 'business_bank', label: 'Inicio', route: '/dashboard', moduleKey: 'dashboard' },
    { iconClass: 'shopping_box', label: 'Productos', route: '/products', moduleKey: 'products' },
    { iconClass: 'shopping_cart-simple', label: 'Vender', route: '/sales/register', moduleKey: 'sales' },
    { iconClass: 'business_money-coins', label: 'Metodos de pago', route: '/payment-methods', moduleKey: 'payment-methods' },
    { iconClass: 'files_paper', label: 'Historial de ventas', route: '/sales/history', moduleKey: 'sales-history' },
    { iconClass: 'users_circle-08', label: 'Clientes', route: '/customers', moduleKey: 'customers' },
    { iconClass: 'business_money-coins', label: 'Créditos', route: '/credits', moduleKey: 'credits' },
    { iconClass: 'business_money-coins', label: 'Caja', route: '/caja', moduleKey: 'cash-register' },
    { iconClass: 'files_paper', label: 'Historial de Caja', route: '/caja/historial', moduleKey: 'cash-register-history' },
    { iconClass: 'business_chart-bar-32', label: 'Reportes', route: '/reports', moduleKey: 'reports' },
    { iconClass: 'business_badge', label: 'Usuarios', route: '/users', moduleKey: 'users' },
    { iconClass: 'files_single-copy-04', label: 'Fact. Externa', route: '/external-invoices', moduleKey: 'external-invoices' }
  ];

  menuItems: MenuItem[] = [];

  constructor(private router: Router, private authService: AuthService) {
    this.currentRoute = this.router.url;
    this.router.events.subscribe(() => {
      this.currentRoute = this.router.url;
    });
  }

  ngOnInit(): void {
    this.checkMobile();
    this.filterMenuByPermissions();
  }

  filterMenuByPermissions(): void {
    if (this.authService.isAdmin()) {
      this.menuItems = [...this.allMenuItems];
    } else {
      this.menuItems = this.allMenuItems.filter(item => this.authService.hasModule(item.moduleKey));
    }
  }

  @HostListener('window:resize')
  onResize(): void {
    this.checkMobile();
  }

  checkMobile(): void {
    this.isMobile = window.innerWidth <= 768;
  }

  onMenuClick() {
    if (this.isMobile) {
      this.toggleSidebar.emit();
    }
  }

  isActive(route: string): boolean {
    return this.currentRoute.startsWith(route);
  }
}

