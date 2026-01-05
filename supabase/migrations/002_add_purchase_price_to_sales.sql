-- Migration: Adicionar campo purchase_price e renomear total_amount para sale_price
-- Data: 2024

-- Adiciona coluna purchase_price (valor de compra)
ALTER TABLE sales 
ADD COLUMN purchase_price DECIMAL(10, 2);

-- Renomeia total_amount para sale_price (valor de venda)
ALTER TABLE sales 
RENAME COLUMN total_amount TO sale_price;

-- Adiciona comentários nas colunas
COMMENT ON COLUMN sales.purchase_price IS 'Valor de compra do produto';
COMMENT ON COLUMN sales.sale_price IS 'Valor de venda do produto';

