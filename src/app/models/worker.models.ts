export type WorkerPaymentType = 'PAYMENT' | 'ADVANCE';

export interface Worker {
  id?: number;
  name: string;
  document?: string;
  phone?: string;
  active?: boolean;
  createdDate?: string;
  totalPaid?: number;
  totalAdvances?: number;
}

export interface WorkerPayment {
  id?: number;
  workerId: number;
  workerName?: string;
  type: WorkerPaymentType;
  amount: number;
  date?: string;
  description?: string;
}
