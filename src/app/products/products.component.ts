import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ProductService } from '../services/product.service';
import { Product, ProductResponse, ProductSearchParams } from '../models/product.models';

@Component({
  selector: 'app-products',
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.css']
})
export class ProductsComponent implements OnInit {
  // Propiedades
  productForm: FormGroup;
  products: ProductResponse[] = [];
  filteredProducts: ProductResponse[] = [];
  loading: boolean = false;
  message: string | null = null;
  messageType: 'success' | 'error' | null = null;
  showForm: boolean = false;
  editingId: number | null = null;
  errors: { [key: string]: string } = {};
  searchQuery: string = '';

  // Paginación
  currentPage: number = 1;
  itemsPerPage: number = 10;
  paginatedProducts: ProductResponse[] = [];
  totalPages: number = 1;

  // Filtros
  showLowStockOnly: boolean = false;
  lowStockCount: number = 0;

  // Modal de Confirmación
  showConfirmDialog: boolean = false;
  confirmMessage: string = '';
  confirmTitle: string = '';
  confirmAction: (() => void) | null = null;

  constructor(
    private fb: FormBuilder,
    private productService: ProductService
  ) {
    this.productForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      code: ['', [Validators.required, Validators.minLength(2)]],
      cost: ['', [Validators.required, Validators.min(0)]],
      finalPrice: [''],
      stockActual: ['', [Validators.required, Validators.min(0)]],
      stockMin: ['', [Validators.required, Validators.min(0)]]
    });
  }

  ngOnInit() {
    this.loadProducts();
  }

  /**
   * Cargar productos del servicio
   */
  loadProducts() {
    this.loading = true;
    this.productService.getProducts().subscribe({
      next: (data) => {
        this.products = data;
        this.lowStockCount = data.filter(p => p.stockActual < p.stockMin).length;
        this.searchProducts(); // Aplica filtros
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.showMessage('Error cargando productos', 'error');
        console.error('Error:', err);
      }
    });
  }

  /**
   * Buscar productos por nombre o código
   */
  searchProducts() {
    let result = this.products;

    // Filtro de búsqueda
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      result = result.filter(p =>
        p.name.toLowerCase().includes(query) ||
        p.code.toLowerCase().includes(query)
      );
    }

    // Filtro de bajo stock
    if (this.showLowStockOnly) {
      result = result.filter(p => p.stockActual < p.stockMin);
    }

    this.filteredProducts = result;
    this.lowStockCount = this.products.filter(p => p.stockActual < p.stockMin).length;
    this.currentPage = 1; // Reset a primera página
    this.updatePagination();
  }

  /**
   * Alternar filtro de bajo stock
   */
  toggleLowStockFilter() {
    this.showLowStockOnly = !this.showLowStockOnly;
    this.searchProducts();
  }

  /**
   * Actualizar paginación
   */
  updatePagination() {
    this.totalPages = Math.ceil(this.filteredProducts.length / this.itemsPerPage);
    if (this.currentPage > this.totalPages && this.totalPages > 0) {
      this.currentPage = this.totalPages;
    }
    
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedProducts = this.filteredProducts.slice(startIndex, endIndex);
  }

  /**
   * Ir a página anterior
   */
  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePagination();
    }
  }

  /**
   * Ir a página siguiente
   */
  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePagination();
    }
  }

  /**
   * Ir a página específica
   */
  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePagination();
    }
  }

  /**
   * Obtener números de página para mostrar
   */
  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxPagesToShow = 3;
    const start = Math.max(2, this.currentPage - 1);
    const end = Math.min(this.totalPages - 1, this.currentPage + 1);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  }

  /**
   * Obtener rango visible de productos
   */
  getVisibleRange(): string {
    const start = (this.currentPage - 1) * this.itemsPerPage + 1;
    const end = Math.min(this.currentPage * this.itemsPerPage, this.filteredProducts.length);
    return `${start} - ${end}`;
  }

  /**
   * Mostrar formulario para nuevo producto
   */
  showNewForm() {
    this.showForm = true;
    this.editingId = null;
    this.productForm.reset();
    this.errors = {};
    this.message = null;
  }

  /**
   * Editar producto existente
   */
  editProduct(product: ProductResponse) {
    this.editingId = product.id;
    this.showForm = true;
    this.errors = {};
    this.message = null;

    this.productForm.patchValue({
      name: product.name,
      code: product.code,
      cost: product.cost,
      finalPrice: product.finalPrice,
      stockActual: product.stockActual,
      stockMin: product.stockMin
    });
  }

  /**
   * Calcular precio final automáticamente
   */
  calculateFinalPrice() {
    const cost = parseFloat(this.productForm.get('cost')?.value || 0);

    if (cost > 0) {
      const calculated = cost * 1.4285714;
      this.productForm.patchValue({ finalPrice: parseFloat(calculated.toFixed(2)) }, { emitEvent: false });
    }
  }

  /**
   * Enviar formulario (crear o actualizar)
   */
  submitForm() {
    if (this.productForm.invalid) {
      this.errors = this.getFormErrors();
      return;
    }

    this.errors = {};
    this.loading = true;
    const formValue = this.productForm.value;

    if (this.editingId) {
      // Actualizar
      this.productService.updateProduct(this.editingId, formValue).subscribe({
        next: (result) => {
          this.showMessage('Producto actualizado correctamente', 'success');
          this.loading = false;
          this.showForm = false;
          this.loadProducts();
        },
        error: (err) => {
          this.loading = false;
          this.handleError(err);
        }
      });
    } else {
      // Crear
      this.productService.createProduct(formValue).subscribe({
        next: (result) => {
          this.showMessage('Producto creado correctamente', 'success');
          this.loading = false;
          this.showForm = false;
          this.productForm.reset();
          this.loadProducts();
        },
        error: (err) => {
          this.loading = false;
          this.handleError(err);
        }
      });
    }
  }

  /**
   * Eliminar producto
   */
  deleteProduct(id: number, name: string) {
    this.confirmTitle = 'Eliminar Producto';
    this.confirmMessage = `¿Estás seguro de que deseas eliminar "${name}"? Esta acción no se puede deshacer.`;
    this.confirmAction = () => {
      this.loading = true;
      this.productService.deleteProduct(id).subscribe({
        next: () => {
          this.showConfirmDialog = false;
          this.showMessage('Producto eliminado correctamente', 'success');
          this.loading = false;
          this.loadProducts();
        },
        error: (err) => {
          this.loading = false;
          this.showConfirmDialog = false;
          
          // Extraer mensaje de error del servidor
          let errorMsg = 'Error al eliminar producto';
          
          if (err?.error) {
            if (typeof err.error === 'string') {
              errorMsg = err.error;
            } else if (typeof err.error === 'object') {
              errorMsg = err.error.error || err.error.message || err.error.detail || JSON.stringify(err.error);
            }
          } else if (err?.message) {
            errorMsg = err.message;
          } else if (err?.statusText) {
            errorMsg = err.statusText;
          }
          
          this.showMessage(errorMsg, 'error');
          console.error('Error completo:', err);
        }
      });
    };
    this.showConfirmDialog = true;
  }

  /**
   * Cancelar formulario
   */
  cancelForm() {
    this.showForm = false;
    this.editingId = null;
    this.productForm.reset();
    this.errors = {};
    this.message = null;
  }

  onOverlayClick(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.cancelForm();
    }
  }

  /**
   * Confirmar acción del diálogo
   */
  confirmDialogAction() {
    if (this.confirmAction) {
      this.confirmAction();
    }
  }

  /**
   * Cancelar diálogo de confirmación
   */
  cancelConfirmDialog() {
    this.showConfirmDialog = false;
    this.confirmAction = null;
    this.confirmMessage = '';
    this.confirmTitle = '';
  }

  /**
   * Mostrar mensaje
   */
  private showMessage(msg: string, type: 'success' | 'error') {
    this.message = msg;
    this.messageType = type;

    // Auto-ocultar después de 5 segundos
    setTimeout(() => {
      this.message = null;
      this.messageType = null;
    }, 5000);
  }

  /**
   * Manejar errores del servidor
   */
  private handleError(err: any) {
    if (err.error && typeof err.error === 'object' && !err.error.error && !err.error.message) {
      // Error de validación de campos
      this.errors = err.error;
      this.showMessage('Por favor, revisa los errores en el formulario', 'error');
    } else {
      // Extraer mensaje descriptivo del error
      let errorMsg = 'Error desconocido';
      
      if (err.error) {
        if (typeof err.error === 'string') {
          errorMsg = err.error;
        } else if (err.error.error) {
          errorMsg = err.error.error;
        } else if (err.error.message) {
          errorMsg = err.error.message;
        }
      } else if (err.message) {
        errorMsg = err.message;
      } else if (err.statusText) {
        errorMsg = err.statusText;
      }
      
      this.showMessage(errorMsg, 'error');
    }
  }

  /**
   * Obtener errores de validación del formulario
   */
  private getFormErrors(): { [key: string]: string } {
    const errors: { [key: string]: string } = {};

    if (this.productForm.get('name')?.hasError('required')) {
      errors['name'] = 'El nombre es requerido';
    } else if (this.productForm.get('name')?.hasError('minlength')) {
      errors['name'] = 'El nombre debe tener al menos 3 caracteres';
    }

    if (this.productForm.get('code')?.hasError('required')) {
      errors['code'] = 'El código es requerido';
    } else if (this.productForm.get('code')?.hasError('minlength')) {
      errors['code'] = 'El código debe tener al menos 2 caracteres';
    }

    if (this.productForm.get('cost')?.hasError('required')) {
      errors['cost'] = 'El costo es requerido';
    } else if (this.productForm.get('cost')?.hasError('min')) {
      errors['cost'] = 'El costo no puede ser negativo';
    }

    if (this.productForm.get('stockActual')?.hasError('required')) {
      errors['stockActual'] = 'El stock actual es requerido';
    } else if (this.productForm.get('stockActual')?.hasError('min')) {
      errors['stockActual'] = 'El stock no puede ser negativo';
    }

    if (this.productForm.get('stockMin')?.hasError('required')) {
      errors['stockMin'] = 'El stock mínimo es requerido';
    } else if (this.productForm.get('stockMin')?.hasError('min')) {
      errors['stockMin'] = 'El stock mínimo no puede ser negativo';
    }

    return errors;
  }

  /**
   * Formatear precio para mostrar
   */
  formatPrice(price: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  }
}
