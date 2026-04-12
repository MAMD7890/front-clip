import { Component, Output, EventEmitter, OnInit } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit {
  @Output() toggleSidebar = new EventEmitter<void>();

  username: string = '';
  showUserMenu: boolean = false;
  showChangePasswordModal: boolean = false;

  constructor(
    private auth: AuthService,
    private router: Router
  ) { }

  ngOnInit(): void {
    // Obtener username del localStorage o de AuthService
    const token = this.auth.getToken();
    if (token) {
      // Decodificar token para obtener username (claim 'sub' en JWT)
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        this.username = payload.sub || 'Usuario';
      } catch (e) {
        this.username = 'Usuario';
      }
    }
  }

  onToggleSidebar() {
    this.toggleSidebar.emit();
  }

  toggleUserMenu() {
    this.showUserMenu = !this.showUserMenu;
  }

  openChangePassword() {
    this.showChangePasswordModal = true;
    this.showUserMenu = false;
  }

  closeChangePassword() {
    this.showChangePasswordModal = false;
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
