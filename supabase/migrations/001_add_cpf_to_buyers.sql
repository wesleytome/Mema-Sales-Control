-- Migration: Adicionar campo CPF na tabela buyers
-- Data: 2024

-- Adiciona coluna CPF na tabela buyers
ALTER TABLE buyers 
ADD COLUMN cpf TEXT;

-- Adiciona índice para melhorar performance em buscas por CPF
CREATE INDEX idx_buyers_cpf ON buyers(cpf) WHERE cpf IS NOT NULL;

-- Comentário na coluna
COMMENT ON COLUMN buyers.cpf IS 'CPF do comprador (apenas números, 11 dígitos)';

