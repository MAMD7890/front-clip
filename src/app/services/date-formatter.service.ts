import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DateFormatterService {
  constructor() {}

  /**
   * Formatea una fecha en la zona horaria de Colombia (America/Bogota)
   * @param dateStr Fecha como string o Date
   * @param format Formato deseado ('short' | 'long' | 'datetime' | 'time')
   * @returns String formateado
   */
  formatDate(dateStr: string | Date, format: 'short' | 'long' | 'datetime' | 'time' = 'datetime'): string {
    const date = typeof dateStr === 'string' ? new Date(dateStr) : new Date(dateStr);

    if (isNaN(date.getTime())) {
      return 'Sin fecha';
    }

    const options: Intl.DateTimeFormatOptions = {
      timeZone: 'America/Bogota'
    };

    switch (format) {
      case 'short':
        return new Intl.DateTimeFormat('es-CO', {
          ...options,
          year: '2-digit',
          month: '2-digit',
          day: '2-digit'
        }).format(date);

      case 'long':
        return new Intl.DateTimeFormat('es-CO', {
          ...options,
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }).format(date);

      case 'time':
        return new Intl.DateTimeFormat('es-CO', {
          ...options,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false
        }).format(date);

      case 'datetime':
      default:
        return new Intl.DateTimeFormat('es-CO', {
          ...options,
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false
        }).format(date);
    }
  }

  /**
   * Obtiene el día en formato "YYYY-MM-DD" en la zona horaria de Colombia
   * @param dateStr Fecha como string o Date
   * @returns String en formato YYYY-MM-DD
   */
  getColombiaDay(dateStr: string | Date): string {
    const date = typeof dateStr === 'string' ? new Date(dateStr) : new Date(dateStr);
    
    if (isNaN(date.getTime())) {
      return '';
    }

    // Usar formato sv-SE que devuelve "YYYY-MM-DD"
    const dateFormatter = new Intl.DateTimeFormat('sv-SE', {
      timeZone: 'America/Bogota',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    
    return dateFormatter.format(date);
  }

  /**
   * Compara si dos fechas son del mismo día en la zona horaria de Colombia
   * @param date1 Primera fecha
   * @param date2 Segunda fecha
   * @returns true si son del mismo día
   */
  isSameDay(date1: string | Date, date2: string | Date): boolean {
    return this.getColombiaDay(date1) === this.getColombiaDay(date2);
  }

  /**
   * Obtiene el nombre del día en español
   * @param dateStr Fecha como string o Date
   * @returns Nombre del día (Lunes, Martes, etc.)
   */
  getDayName(dateStr: string | Date): string {
    const date = typeof dateStr === 'string' ? new Date(dateStr) : new Date(dateStr);
    
    if (isNaN(date.getTime())) {
      return '';
    }

    const dayFormatter = new Intl.DateTimeFormat('es-CO', {
      timeZone: 'America/Bogota',
      weekday: 'long'
    });
    
    return dayFormatter.format(date);
  }
}
