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

/**
 * DTO para importación de Excel
 */
export interface ExcelProductImportDTO {
  numeroFila: number;
  nombre: string;
  codigo: string;
  costo: number;
  precioFinal?: number;
  stockActual: number;
  stockMinimo: number;
  iva?: number;
  estado: 'EXITOSO' | 'ERROR';
  mensaje?: string;
  idProducto?: number;
}

/**
 * Respuesta de importación masiva
 */
export interface ExcelProductImportResponse {
  exitosos: number;
  errores: number;
  total: number;
  mensaje: string;
  detalles: ExcelProductImportDTO[];
}
