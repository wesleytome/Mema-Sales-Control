-- Migration: Adicionar campos de endereço na tabela buyers
-- Data: 2024

-- Adiciona colunas de endereço na tabela buyers
ALTER TABLE buyers 
ADD COLUMN cep TEXT,
ADD COLUMN address TEXT,
ADD COLUMN address_number TEXT,
ADD COLUMN address_complement TEXT,
ADD COLUMN neighborhood TEXT,
ADD COLUMN city TEXT,
ADD COLUMN state TEXT,
ADD COLUMN address_reference TEXT;

-- Adiciona índices para melhorar performance em buscas
CREATE INDEX idx_buyers_cep ON buyers(cep) WHERE cep IS NOT NULL;
CREATE INDEX idx_buyers_city ON buyers(city) WHERE city IS NOT NULL;
CREATE INDEX idx_buyers_state ON buyers(state) WHERE state IS NOT NULL;

-- Comentários nas colunas
COMMENT ON COLUMN buyers.cep IS 'CEP do endereço (formato: 00000-000)';
COMMENT ON COLUMN buyers.address IS 'Logradouro (rua, avenida, etc.)';
COMMENT ON COLUMN buyers.address_number IS 'Número do endereço';
COMMENT ON COLUMN buyers.address_complement IS 'Complemento (apto, bloco, sala, etc.)';
COMMENT ON COLUMN buyers.neighborhood IS 'Bairro';
COMMENT ON COLUMN buyers.city IS 'Cidade';
COMMENT ON COLUMN buyers.state IS 'Estado (UF)';
COMMENT ON COLUMN buyers.address_reference IS 'Ponto de referência para entregas';

