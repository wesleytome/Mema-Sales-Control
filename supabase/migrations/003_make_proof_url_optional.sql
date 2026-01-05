-- Migration: Tornar proof_url opcional na tabela payments
-- Data: 2024

-- Altera a coluna proof_url para permitir NULL
ALTER TABLE payments 
ALTER COLUMN proof_url DROP NOT NULL;

-- Adiciona comentário na coluna
COMMENT ON COLUMN payments.proof_url IS 'URL do comprovante de pagamento (opcional)';

