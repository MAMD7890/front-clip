export type MovementType = 'SALE' | 'INCOME' | 'EXPENSE' | 'WITHDRAWAL';

export interface CashMovementDto {
  id?: number;
  type: MovementType;
  amount: number;
  description?: string;
  date?: string;
  saleId?: number | null;
  paymentMethodNames?: string[];
}

export interface CashRegisterDto {
  id: number;
  openingAmount: number;
  openingDate: string;
  closingDate: string | null;
  closingAmount: number | null;
  expectedAmount: number;
  difference: number | null;
  status: 'OPEN' | 'CLOSED';
  totalSales: number;
  totalIncomes: number;
  totalExpenses: number;
  totalWithdrawals: number;
  saleCount: number;
  movements: CashMovementDto[];
}
