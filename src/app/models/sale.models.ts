export interface SaleItem {
  productId: number;
  quantity: number;
  unitPrice: number;
  totalPrice?: number;
}

export interface Sale {
  id?: number;
  customerId?: number;
  date?: string;
  items: SaleItem[];
  paymentMethodNames: string[];
  totalValue?: number;
  changeValue?: number;
  createdAt?: string;
  saleDate?: string;
  credit?: boolean;
  creditNotes?: string;
  receiptBase64?: string;
}
