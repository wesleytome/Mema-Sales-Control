-- Migration: Adicionar campo origin na tabela payments
-- Descrição: Identifica se o pagamento foi informado pelo comprador ou vendedor

-- 1. Adicionar coluna origin
ALTER TABLE payments
ADD COLUMN origin TEXT DEFAULT 'buyer'
CHECK (origin IN ('buyer', 'seller'));

-- 2. Tornar proof_url opcional (já pode ser NULL pela migration 003)
-- Nenhuma ação necessária

-- 3. Comentários para documentação
COMMENT ON COLUMN payments.origin IS
'Origem do pagamento: buyer (informado pelo comprador) ou seller (registrado pelo vendedor)';
