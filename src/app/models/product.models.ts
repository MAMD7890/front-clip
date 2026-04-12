/**
 * Modelos de Productos
 */

export interface Product {
  id?: number;
  name: string;
  code: string;
  cost: number;
  finalPrice?: number;
  stockActual: number;
  stockMin: number;
}

export interface ProductResponse {
  id: number;
  name: string;
  code: string;
  cost: number;
  finalPrice: number;
  profit: number;
  stockActual: number;
  stockMin: number;
}

export interface ProductSearchParams {
  name?: string;
  code?: string;
  minPrice?: number;
  maxPrice?: number;
}
