import { Component } from '@angular/core';
import { ProductService } from '../services/product.service';
import { ExcelProductImportResponse, ExcelProductImportDTO } from '../models/product.models';

declare const XLSX: any;

@Component({
  selector: 'app-import-productos',
  templateUrl: './import-productos.component.html',
  styleUrls: ['./import-productos.component.css']
})
export class ImportProductosComponent {
  // Propiedades
  selectedFile: File | null = null;
  loading: boolean = false;
  importResult: ExcelProductImportResponse | null = null;
  message: string | null = null;
  messageType: 'success' | 'error' | null = null;
  showDetails: boolean = false;
  dragover: boolean = false;

  constructor(private productService: ProductService) { }

  /**
   * Manejar selección de archivo
   */
  onFileSelected(event: any): void {
    const files = event.target.files;
    if (files && files.length > 0) {
      this.selectFile(files[0]);
    }
  }

  /**
   * Seleccionar archivo
   */
  private selectFile(file: File): void {
    if (!file.name.endsWith('.xlsx')) {
      this.showMessage('Por favor selecciona un archivo .xlsx', 'error');
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10 MB
      this.showMessage('El archivo no puede superar 10 MB', 'error');
      return;
    }

    this.selectedFile = file;
    this.importResult = null;
    this.message = null;
  }

  /**
   * Manejar drag and drop
   */
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragover = true;
  }

  /**
   * Manejar drag leave
   */
  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragover = false;
  }

  /**
   * Manejar drop de archivo
   */
  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragover = false;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.selectFile(files[0]);
    }
  }

  /**
   * Importar archivo
   */
  importFile(): void {
    if (!this.selectedFile) {
      this.showMessage('Por favor selecciona un archivo', 'error');
      return;
    }

    this.loading = true;
    this.productService.importarExcel(this.selectedFile).subscribe({
      next: (result) => {
        this.loading = false;
        this.importResult = result;
        this.message = result.mensaje;
        this.messageType = result.errores === 0 ? 'success' : 'success'; // Success even with some errors
        this.showDetails = true;

        // Reset archivo si la importación fue exitosa
        if (result.errores === 0) {
          this.selectedFile = null;
          setTimeout(() => {
            this.importResult = null;
            this.message = null;
          }, 5000);
        }
      },
      error: (err) => {
        this.loading = false;
        const errorMsg = err.error?.error || err.error?.message || 'Error al importar archivo';
        this.showMessage(errorMsg, 'error');
      }
    });
  }

  /**
   * Limpiar selección de archivo
   */
  clearFile(): void {
    this.selectedFile = null;
    this.importResult = null;
    this.message = null;
  }

  /**
   * Descargar plantilla de Excel
   */
  downloadTemplate(): void {
    try {
      // Crear datos - cada row es un array de valores
      const headers = ['Nombre', 'Código', 'Costo', 'Precio Final', 'Stock Actual', 'Stock Mínimo', 'IVA'];
      
      const datos = [
        ['Balón de Voleibol', 'BAL-VOL-001', 50000, null, 100, 20, 19],
        ['Raqueta de Tenis', 'RAQ-TEN-001', 150000, null, 50, 10, 19],
        ['Guantes de Boxeo', 'GUA-BOX-001', 80000, null, 75, 15, 19],
        ['Casco de Ciclismo', 'CAS-CIC-001', 120000, null, 40, 8, 19],
        ['Malla de Entrenamiento', 'MAL-ENT-001', 35000, null, 200, 30, 19],
        ['Botella de Agua 1L', 'BOT-AGU-001', 15000, null, 500, 100, 8],
        ['Toalla Deportiva', 'TOA-DEP-001', 25000, null, 300, 50, 5],
        ['Banda Elástica', 'BAN-ELA-001', 20000, null, 150, 25, 19],
        ['Cuerda de Saltar', 'CUE-SAL-001', 18000, null, 180, 40, 19],
        ['Colchoneta de Yoga', 'COL-YOG-001', 65000, null, 60, 10, 19]
      ];

      // Combinar headers con datos
      const worksheetData = [headers, ...datos];

      // Crear worksheet desde array de arrays
      const ws = XLSX.utils.aoa_to_sheet(worksheetData);

      // Configurar ancho de columnas
      ws['!cols'] = [
        { wch: 25 }, // Nombre
        { wch: 15 }, // Código
        { wch: 12 }, // Costo
        { wch: 14 }, // Precio Final
        { wch: 13 }, // Stock Actual
        { wch: 14 }, // Stock Mínimo
        { wch: 8 }   // IVA
      ];

      // Crear workbook
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Productos');

      // Descargar archivo
      XLSX.writeFile(wb, 'plantilla-productos.xlsx');
      this.showMessage('Plantilla Excel descargada correctamente', 'success');
    } catch (error) {
      console.error('Error descargando plantilla:', error);
      this.downloadTemplateAsCSV();
    }
  }

  /**
   * Descargar plantilla como CSV (fallback)
   */
  private downloadTemplateAsCSV(): void {
    const data = 'Nombre\tCódigo\tCosto\tPrecio Final\tStock Actual\tStock Mínimo\tIVA\n' +
      'Balón de Voleibol\tBAL-VOL-001\t50000\t\t100\t20\t19\n' +
      'Raqueta de Tenis\tRAQ-TEN-001\t150000\t\t50\t10\t19\n' +
      'Guantes de Boxeo\tGUA-BOX-001\t80000\t\t75\t15\t19\n' +
      'Casco de Ciclismo\tCAS-CIC-001\t120000\t\t40\t8\t19\n' +
      'Malla de Entrenamiento\tMAL-ENT-001\t35000\t\t200\t30\t19\n' +
      'Botella de Agua 1L\tBOT-AGU-001\t15000\t\t500\t100\t8\n' +
      'Toalla Deportiva\tTOA-DEP-001\t25000\t\t300\t50\t5\n' +
      'Banda Elástica\tBAN-ELA-001\t20000\t\t150\t25\t19\n' +
      'Cuerda de Saltar\tCUE-SAL-001\t18000\t\t180\t40\t19\n' +
      'Colchoneta de Yoga\tCOL-YOG-001\t65000\t\t60\t10\t19';

    const blob = new Blob([data], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'plantilla-productos.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    this.showMessage('Plantilla descargada como CSV', 'success');
  }

  /**
   * Obtener clase CSS según el estado
   */
  getStatusClass(dto: ExcelProductImportDTO): string {
    return dto.estado === 'EXITOSO' ? 'status-success' : 'status-error';
  }

  /**
   * Mostrar mensaje
   */
  private showMessage(msg: string, type: 'success' | 'error'): void {
    this.message = msg;
    this.messageType = type;

    // Auto-ocultar después de 5 segundos
    setTimeout(() => {
      this.message = null;
      this.messageType = null;
    }, 5000);
  }

  /**
   * Formatear número como moneda
   */
  formatPrice(price: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  }

  /**
   * Contar productos por estado
   */
  getStatusCount(status: 'EXITOSO' | 'ERROR'): number {
    if (!this.importResult) return 0;
    return this.importResult.detalles.filter(d => d.estado === status).length;
  }
}
