import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Product, ProductResponse, ProductSearchParams, ExcelProductImportResponse } from '../models/product.models';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private baseUrl = `${environment.apiBaseUrl}/products`;


  constructor(private http: HttpClient) {
    console.log(`[ProductService] Conectando a: ${this.baseUrl}`);
  }

  /**
   * Obtener todos los productos con filtros opcionales
   */
  getProducts(filters?: ProductSearchParams): Observable<ProductResponse[]> {
    let params = new HttpParams();

    if (filters) {
      if (filters.name) params = params.set('name', filters.name);
      if (filters.code) params = params.set('code', filters.code);
      if (filters.minPrice) params = params.set('minPrice', filters.minPrice.toString());
      if (filters.maxPrice) params = params.set('maxPrice', filters.maxPrice.toString());
    }

    return this.http.get<ProductResponse[]>(this.baseUrl, { params });
  }

  /**
   * Obtener un producto por ID
   */
  getProductById(id: number): Observable<ProductResponse> {
    return this.http.get<ProductResponse>(`${this.baseUrl}/${id}`);
  }

  /**
   * Crear un nuevo producto
   */
  createProduct(product: Product): Observable<ProductResponse> {
    return this.http.post<ProductResponse>(this.baseUrl, product);
  }

  /**
   * Actualizar un producto existente
   */
  updateProduct(id: number, product: Product): Observable<ProductResponse> {
    return this.http.put<ProductResponse>(`${this.baseUrl}/${id}`, product);
  }

  /**
   * Eliminar un producto
   */
  deleteProduct(id: number): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/${id}/delete`, {});
  }

  /**
   * Importar productos desde un archivo Excel
   */
  importarExcel(file: File): Observable<ExcelProductImportResponse> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<ExcelProductImportResponse>(`${this.baseUrl}/importar-excel`, formData);
  }
}
