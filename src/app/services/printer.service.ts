import { Injectable } from '@angular/core';

declare var qz: any;

@Injectable({ providedIn: 'root' })
export class PrinterService {
  private readonly printerName = 'impresora termica';
  private securitySet = false;

  private ensureSecurity(): void {
    if (this.securitySet) return;
    qz.security.setCertificatePromise((resolve: Function) => resolve(''));
    qz.security.setSignaturePromise(() => (resolve: Function) => resolve(''));
    this.securitySet = true;
  }

  async printReceipt(receiptBase64: string): Promise<void> {
    console.log('[Printer] Starting print...');
    this.ensureSecurity();

    if (!qz.websocket.isActive()) {
      console.log('[Printer] Connecting to QZ Tray...');
      await qz.websocket.connect();
      console.log('[Printer] Connected');
    }

    const allPrinters: string[] = await qz.printers.find();
    console.log('[Printer] Available:', allPrinters);

    const normalize = (s: string) =>
      s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

    const target = normalize(this.printerName);
    const matched = allPrinters.find((p: string) => normalize(p).includes(target));

    if (!matched) {
      throw new Error(`Impresora "${this.printerName}" no encontrada. Disponibles: ${allPrinters.join(', ')}`);
    }

    console.log(`[Printer] Using: "${matched}"`);
    const config = qz.configs.create(matched);
    await qz.print(config, [{ type: 'raw', format: 'base64', data: receiptBase64 }]);
    console.log('[Printer] Receipt sent OK');
  }
}
