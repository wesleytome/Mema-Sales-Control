-- Migration: Adicionar campo payment_date na tabela payments
ALTER TABLE payments
ADD COLUMN payment_date DATE DEFAULT CURRENT_DATE;

COMMENT ON COLUMN payments.payment_date IS
'Data em que o pagamento foi realizado (informada pelo usuário)';
