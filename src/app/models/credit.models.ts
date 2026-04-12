export interface Credit {
  id?: number;
  saleId: number;
  customerId: number;
  customerName?: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  status: string;
  createdDate?: string;
  dueDate?: string;
  notes?: string;
  payments?: CreditPayment[];
  overdue?: boolean;
  daysRemaining?: number;
}

export interface CreditPayment {
  id?: number;
  creditId?: number;
  amount: number;
  paymentDate?: string;
  paymentMethod: string;
  notes?: string;
}

export interface CustomerCredits {
  customerId: number;
  customerName: string;
  credits: Credit[];
  totalDebt: number;
  totalPaid: number;
}
