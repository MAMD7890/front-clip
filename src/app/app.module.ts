import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { ToastrModule } from 'ngx-toastr';

import { AppRoutingModule } from './app.routing';

import { AppComponent } from './app.component';
import { LoginComponent } from './login/login.component';
import { ProductsComponent } from './products/products.component';
import { ImportProductosComponent } from './products/import-productos.component';
import { LayoutComponent } from './layout/layout.component';
import { NavbarComponent } from './layout/navbar.component';
import { SidebarComponent } from './layout/sidebar.component';
import { ChangePasswordComponent } from './layout/change-password.component';
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
import { ExpensesComponent } from './expenses/expenses.component';
import { WorkersComponent } from './workers/workers.component';
import { WorkerDetailComponent } from './workers/worker-detail.component';
import { ReactiveFormsModule } from '@angular/forms';
import { AuthService } from './services/auth.service';
import { AuthInterceptor } from './services/auth.interceptor';

@NgModule({
  imports: [
    BrowserAnimationsModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    RouterModule,
    AppRoutingModule,
    NgbModule,
    ToastrModule.forRoot()
  ],
  declarations: [
    AppComponent,
    LoginComponent,
    ProductsComponent,
    ImportProductosComponent,
    LayoutComponent,
    NavbarComponent,
    SidebarComponent,
    ChangePasswordComponent,
    PaymentMethodsComponent,
    SaleRegisterComponent,
    SaleHistoryComponent,
    CashRegisterComponent,
    CashRegisterHistoryComponent,
    CustomersComponent,
    CreditsComponent,
    DashboardComponent,
    ReportsComponent,
    UsersComponent,
    ExternalInvoicesComponent,
    ExpensesComponent,
    WorkersComponent,
    WorkerDetailComponent
  ],
  providers: [
    AuthService,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
