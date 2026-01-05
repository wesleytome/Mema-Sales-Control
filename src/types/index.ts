// Tipos TypeScript para o sistema

export type DeliveryStatus = 'pending' | 'sent' | 'delivered';
export type InstallmentStatus = 'pending' | 'paid' | 'late' | 'partial';
export type PaymentStatus = 'pending' | 'approved' | 'rejected';

export interface Buyer {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  cpf: string | null;
  cep: string | null;
  address: string | null;
  address_number: string | null;
  address_complement: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  address_reference: string | null;
  created_at: string;
}

export interface Sale {
  id: string;
  buyer_id: string;
  product_description: string;
  purchase_price: number | null;
  sale_price: number;
  sale_date: string;
  delivery_status: DeliveryStatus;
  notes: string | null;
  created_at: string;
  buyer?: Buyer;
}

export interface Installment {
  id: string;
  sale_id: string;
  amount: number;
  paid_amount: number;
  due_date: string;
  status: InstallmentStatus;
  installment_number: number;
  created_at: string;
  sale?: Sale;
}

export interface Payment {
  id: string;
  installment_id: string;
  amount: number;
  proof_url: string | null;
  status: PaymentStatus;
  rejection_reason: string | null;
  created_at: string;
  installment?: Installment;
}

export interface SaleWithDetails extends Sale {
  buyer: Buyer;
  installments: Installment[];
}

export interface InstallmentWithDetails extends Installment {
  sale: Sale;
  payments: Payment[];
}

