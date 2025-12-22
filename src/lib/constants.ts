// Constantes do sistema

export const DELIVERY_STATUS_OPTIONS = [
  { value: 'pending', label: 'Pendente' },
  { value: 'sent', label: 'Enviado' },
  { value: 'delivered', label: 'Entregue' },
] as const;

export const INSTALLMENT_STATUS_OPTIONS = [
  { value: 'pending', label: 'Pendente' },
  { value: 'paid', label: 'Pago' },
  { value: 'late', label: 'Atrasado' },
  { value: 'partial', label: 'Parcial' },
] as const;

export const PAYMENT_STATUS_OPTIONS = [
  { value: 'pending', label: 'Pendente' },
  { value: 'approved', label: 'Aprovado' },
  { value: 'rejected', label: 'Rejeitado' },
] as const;

export const ALLOWED_FILE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'application/pdf',
];

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// Nome do bucket de storage baseado no ambiente
// Em desenvolvimento: 'proofs_dev', em produção: 'proofs'
export const STORAGE_BUCKET_NAME = import.meta.env.MODE === 'development' 
  ? 'proofs_dev' 
  : 'proofs';
