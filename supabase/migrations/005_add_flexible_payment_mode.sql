-- Migration: Adicionar suporte a pagamento flexível
-- Data: 2026-02-14
-- Descrição: Permite vendas com pagamentos variáveis em datas livres

-- 1. Adicionar coluna payment_mode na tabela sales
ALTER TABLE sales 
ADD COLUMN payment_mode TEXT DEFAULT 'fixed' 
CHECK (payment_mode IN ('fixed', 'flexible'));

-- 2. Permitir due_date NULL para installments em modo flexível
ALTER TABLE installments 
ALTER COLUMN due_date DROP NOT NULL;

-- 3. Comentários para documentação
COMMENT ON COLUMN sales.payment_mode IS 
'Modo de pagamento: fixed (parcelas com datas fixas) ou flexible (pagamentos livres em datas variáveis)';

COMMENT ON COLUMN installments.due_date IS 
'Data de vencimento da parcela. NULL em modo flexible (pagamento livre).';
