import { NgModule } from '@angular/core';
import { CommonModule, } from '@angular/common';
import { BrowserModule  } from '@angular/platform-browser';
import { Routes, RouterModule } from '@angular/router';

import { LoginComponent } from './login/login.component';
import { LayoutComponent } from './layout/layout.component';
import { ProductsComponent } from './products/products.component';
import { ImportProductosComponent } from './products/import-productos.component';
import { PaymentMethodsComponent } from './payment-methods/payment-methods.component';
import { SaleRegisterComponent } from './sales/sale-register.component';
import { SaleHistoryComponent } from './sales/sale-history.component';
import { CashRegisterComponent } from './cash-register/cash-register.component';
import { CashRegisterHistoryComponent } from './cash-register/cash-register-history.component';
import { CustomersComponent } from './customers/customers.component';
import { CreditsComponent } from './credits/credits.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { ReportsComponent } from './reports/reports.component';
import { UsersComponent } from './users/users.component';
import { ExternalInvoicesComponent } from './external-invoices/external-invoices.component';
import { AuthGuard } from './services/auth.guard';

const routes: Routes =[
  { path: 'login', component: LoginComponent },
  {
    path: '',
    component: LayoutComponent,
    canActivate: [AuthGuard],
    children: [
      { path: 'dashboard', component: DashboardComponent },
      { path: 'products', component: ProductsComponent },
      { path: 'products/import', component: ImportProductosComponent },
      { path: 'payment-methods', component: PaymentMethodsComponent },
      { path: 'sales/register', component: SaleRegisterComponent },
      { path: 'sales/history', component: SaleHistoryComponent },
      { path: 'caja', component: CashRegisterComponent },
      { path: 'caja/historial', component: CashRegisterHistoryComponent },
      { path: 'customers', component: CustomersComponent },
      { path: 'credits', component: CreditsComponent },
      { path: 'reports', component: ReportsComponent },
      { path: 'users', component: UsersComponent },
      { path: 'external-invoices', component: ExternalInvoicesComponent },
      { path: 'vender', redirectTo: '/sales/register', pathMatch: 'full' },
      { path: '', redirectTo: '/dashboard', pathMatch: 'full' }
    ]
  },
  {
    path: '**',
    redirectTo: '/',
    pathMatch: 'full'
  }
];

@NgModule({
  imports: [
    CommonModule,
    BrowserModule,
    RouterModule.forRoot(routes)
  ],
  exports: [
  ],
})
export class AppRoutingModule { }
