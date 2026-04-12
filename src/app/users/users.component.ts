import { Component, OnInit } from '@angular/core';
import { UserService, UserDto } from '../services/user.service';
import { RoleService, RoleDto } from '../services/role.service';
import { AuthService } from '../services/auth.service';

interface ModuleOption {
  key: string;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.css']
})
export class UsersComponent implements OnInit {
  activeTab: string = 'users';

  // ---- USERS ----
  users: UserDto[] = [];
  roles: RoleDto[] = [];
  loadingUsers = false;
  showUserModal = false;
  editingUser: UserDto | null = null;
  userForm: UserDto = { username: '', password: '', roles: [] };
  selectedRole: string = '';

  // ---- ROLES ----
  loadingRoles = false;
  showRoleModal = false;
  editingRole: RoleDto | null = null;
  roleForm: RoleDto = { name: '', modules: [] };
  selectedModules: { [key: string]: boolean } = {};

  message: string = '';
  messageType: string = 'success';

  allModules: ModuleOption[] = [
    { key: 'dashboard', label: 'Inicio / Dashboard', icon: 'business_bank' },
    { key: 'products', label: 'Productos', icon: 'shopping_box' },
    { key: 'sales', label: 'Vender', icon: 'shopping_cart-simple' },
    { key: 'payment-methods', label: 'Métodos de pago', icon: 'business_money-coins' },
    { key: 'sales-history', label: 'Historial de ventas', icon: 'files_paper' },
    { key: 'customers', label: 'Clientes', icon: 'users_circle-08' },
    { key: 'credits', label: 'Créditos', icon: 'business_money-coins' },
    { key: 'cash-register', label: 'Caja', icon: 'business_money-coins' },
    { key: 'cash-register-history', label: 'Historial de Caja', icon: 'files_paper' },
    { key: 'reports', label: 'Reportes', icon: 'business_chart-bar-32' },
    { key: 'users', label: 'Gestión Usuarios/Roles', icon: 'business_badge' },
    { key: 'external-invoices', label: 'Facturación Externa', icon: 'files_single-copy-04' }
  ];

  constructor(
    private userService: UserService,
    private roleService: RoleService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.loadUsers();
    this.loadRoles();
  }

  // ================================
  // TAB SWITCHING
  // ================================
  switchTab(tab: string) {
    this.activeTab = tab;
    this.clearMessage();
  }

  // ================================
  // USERS
  // ================================
  loadUsers() {
    this.loadingUsers = true;
    this.userService.getAll().subscribe({
      next: (data) => { this.users = data; this.loadingUsers = false; },
      error: () => { this.showMessage('Error al cargar usuarios', 'danger'); this.loadingUsers = false; }
    });
  }

  openCreateUser() {
    this.editingUser = null;
    this.userForm = { username: '', password: '', roles: [] };
    this.selectedRole = this.roles.length > 0 ? this.roles[0].name : '';
    this.showUserModal = true;
  }

  openEditUser(user: UserDto) {
    this.editingUser = user;
    this.userForm = { username: user.username, password: '', roles: [...user.roles] };
    this.selectedRole = user.roles.length > 0 ? user.roles[0] : '';
    this.showUserModal = true;
  }

  saveUser() {
    if (!this.userForm.username) {
      this.showMessage('El nombre de usuario es requerido', 'danger');
      return;
    }

    this.userForm.roles = this.selectedRole ? [this.selectedRole] : [];

    if (this.editingUser) {
      const updateData: any = { roles: this.userForm.roles };
      if (this.userForm.password) {
        updateData.password = this.userForm.password;
      }
      this.userService.update(this.editingUser.id!, updateData).subscribe({
        next: () => {
          this.showMessage('Usuario actualizado correctamente', 'success');
          this.showUserModal = false;
          this.loadUsers();
        },
        error: (err: any) => this.showMessage(err.error?.error || 'Error al actualizar', 'danger')
      });
    } else {
      if (!this.userForm.password) {
        this.showMessage('La contraseña es requerida para nuevo usuario', 'danger');
        return;
      }
      this.userService.create(this.userForm).subscribe({
        next: () => {
          this.showMessage('Usuario creado correctamente', 'success');
          this.showUserModal = false;
          this.loadUsers();
        },
        error: (err: any) => this.showMessage(err.error?.error || 'Error al crear usuario', 'danger')
      });
    }
  }

  deleteUser(user: UserDto) {
    if (!confirm('¿Eliminar el usuario "' + user.username + '"?')) return;
    this.userService.delete(user.id!).subscribe({
      next: () => { this.showMessage('Usuario eliminado', 'success'); this.loadUsers(); },
      error: (err: any) => this.showMessage(err.error?.error || 'Error al eliminar', 'danger')
    });
  }

  getRolDisplayName(roleName: string): string {
    if (roleName === 'ROLE_ADMIN') return 'Admin';
    if (roleName === 'ROLE_TRABAJADOR') return 'Trabajador';
    return roleName.replace('ROLE_', '');
  }

  // ================================
  // ROLES
  // ================================
  loadRoles() {
    this.loadingRoles = true;
    this.roleService.getAll().subscribe({
      next: (data) => { this.roles = data; this.loadingRoles = false; },
      error: () => { this.showMessage('Error al cargar roles', 'danger'); this.loadingRoles = false; }
    });
  }

  openCreateRole() {
    this.editingRole = null;
    this.roleForm = { name: '', modules: [] };
    this.resetModuleSelection();
    this.showRoleModal = true;
  }

  openEditRole(role: RoleDto) {
    this.editingRole = role;
    this.roleForm = { name: role.name, modules: [...role.modules] };
    this.resetModuleSelection();
    if (role.modules) {
      for (const m of role.modules) {
        this.selectedModules[m] = true;
      }
    }
    this.showRoleModal = true;
  }

  saveRole() {
    const modules: string[] = [];
    for (const key of Object.keys(this.selectedModules)) {
      if (this.selectedModules[key]) {
        modules.push(key);
      }
    }
    this.roleForm.modules = modules;

    if (this.editingRole) {
      this.roleService.update(this.editingRole.id!, this.roleForm).subscribe({
        next: () => {
          this.showMessage('Rol actualizado correctamente', 'success');
          this.showRoleModal = false;
          this.loadRoles();
        },
        error: (err: any) => this.showMessage(err.error?.error || 'Error al actualizar rol', 'danger')
      });
    } else {
      if (!this.roleForm.name) {
        this.showMessage('El nombre del rol es requerido', 'danger');
        return;
      }
      this.roleService.create(this.roleForm).subscribe({
        next: () => {
          this.showMessage('Rol creado correctamente', 'success');
          this.showRoleModal = false;
          this.loadRoles();
        },
        error: (err: any) => this.showMessage(err.error?.error || 'Error al crear rol', 'danger')
      });
    }
  }

  deleteRole(role: RoleDto) {
    if (role.name === 'ROLE_ADMIN') {
      this.showMessage('No se puede eliminar el rol de Administrador', 'danger');
      return;
    }
    if (!confirm('¿Eliminar el rol "' + this.getRolDisplayName(role.name) + '"?')) return;
    this.roleService.delete(role.id!).subscribe({
      next: () => { this.showMessage('Rol eliminado', 'success'); this.loadRoles(); },
      error: (err: any) => this.showMessage(err.error?.error || 'Error al eliminar', 'danger')
    });
  }

  isAdminRole(role: RoleDto): boolean {
    return role.name === 'ROLE_ADMIN';
  }

  getModuleLabels(modules: string[]): string {
    if (!modules || modules.length === 0) return 'Sin permisos';
    if (modules.indexOf('*') >= 0) return 'Todos los módulos';
    return modules.map(m => {
      const found = this.allModules.find(am => am.key === m);
      return found ? found.label : m;
    }).join(', ');
  }

  selectAllModules() {
    for (const m of this.allModules) {
      this.selectedModules[m.key] = true;
    }
  }

  deselectAllModules() {
    for (const m of this.allModules) {
      this.selectedModules[m.key] = false;
    }
  }

  private resetModuleSelection() {
    this.selectedModules = {};
    for (const m of this.allModules) {
      this.selectedModules[m.key] = false;
    }
  }

  // ================================
  // MESSAGES
  // ================================
  showMessage(msg: string, type: string) {
    this.message = msg;
    this.messageType = type;
    setTimeout(() => this.clearMessage(), 4000);
  }

  clearMessage() {
    this.message = '';
  }
}
