-- Script de Seed para Popular Banco de Dados com Dados de Teste
-- Execute este script no SQL Editor do Supabase após criar o schema

-- Limpar dados existentes (opcional - descomente se quiser limpar antes de popular)
-- TRUNCATE TABLE payments CASCADE;
-- TRUNCATE TABLE installments CASCADE;
-- TRUNCATE TABLE sales CASCADE;
-- TRUNCATE TABLE buyers CASCADE;

-- ============================================
-- COMPRADORES (BUYERS)
-- ============================================
INSERT INTO buyers (id, name, phone, email, cpf, created_at) VALUES
-- Compradores com dados completos
('a1b2c3d4-e5f6-4789-a012-345678901234', 'João Silva', '(11) 98765-4321', 'joao.silva@email.com', '12345678901', NOW() - INTERVAL '90 days'),
('b2c3d4e5-f6a7-4890-b123-456789012345', 'Maria Santos', '(21) 99876-5432', 'maria.santos@email.com', '23456789012', NOW() - INTERVAL '85 days'),
('c3d4e5f6-a7b8-4901-c234-567890123456', 'Pedro Oliveira', '(31) 98765-4321', 'pedro.oliveira@email.com', '34567890123', NOW() - INTERVAL '80 days'),
('d4e5f6a7-b8c9-4012-d345-678901234567', 'Ana Costa', '(41) 97654-3210', 'ana.costa@email.com', '45678901234', NOW() - INTERVAL '75 days'),
('e5f6a7b8-c9d0-4123-e456-789012345678', 'Carlos Pereira', '(51) 98765-4321', 'carlos.pereira@email.com', '56789012345', NOW() - INTERVAL '70 days'),

-- Compradores sem CPF
('f6a7b8c9-d0e1-4234-f567-890123456789', 'Fernanda Lima', '(11) 98765-1234', 'fernanda.lima@email.com', NULL, NOW() - INTERVAL '65 days'),
('a7b8c9d0-e1f2-4345-a678-901234567890', 'Roberto Alves', '(21) 99876-2345', 'roberto.alves@email.com', NULL, NOW() - INTERVAL '60 days'),
('b8c9d0e1-f2a3-4456-b789-012345678901', 'Juliana Ferreira', '(31) 98765-3456', 'juliana.ferreira@email.com', '67890123456', NOW() - INTERVAL '55 days'),

-- Compradores sem email
('c9d0e1f2-a3b4-4567-c890-123456789012', 'Ricardo Souza', '(41) 97654-4567', NULL, '78901234567', NOW() - INTERVAL '50 days'),
('d0e1f2a3-b4c5-4678-d901-234567890123', 'Patricia Rocha', '(51) 98765-5678', NULL, '89012345678', NOW() - INTERVAL '45 days'),

-- Compradores recentes
('e1f2a3b4-c5d6-4789-e012-345678901234', 'Lucas Martins', '(11) 99876-6789', 'lucas.martins@email.com', '90123456789', NOW() - INTERVAL '10 days'),
('f2a3b4c5-d6e7-4890-f123-456789012345', 'Camila Ribeiro', '(21) 98765-7890', 'camila.ribeiro@email.com', '01234567890', NOW() - INTERVAL '5 days'),
('a3b4c5d6-e7f8-4901-a234-567890123456', 'Bruno Carvalho', '(31) 97654-8901', 'bruno.carvalho@email.com', NULL, NOW() - INTERVAL '3 days');

-- ============================================
-- VENDAS (SALES)
-- ============================================
INSERT INTO sales (id, buyer_id, product_description, purchase_price, sale_price, sale_date, delivery_status, notes, created_at) VALUES
-- Vendas antigas (algumas entregues)
('a1a2b3c4-d5e6-4789-f012-345678901234', 'a1b2c3d4-e5f6-4789-a012-345678901234', 'Playground Modular Premium - 3x3m', 9500.00, 15000.00, CURRENT_DATE - INTERVAL '80 days', 'delivered', 'Cliente satisfeito com a entrega', NOW() - INTERVAL '80 days'),
('a2b3c4d5-e6f7-4890-a123-456789012345', 'b2c3d4e5-f6a7-4890-b123-456789012345', 'Balanço Duplo com Escorregador', 5500.00, 8500.00, CURRENT_DATE - INTERVAL '75 days', 'delivered', NULL, NOW() - INTERVAL '75 days'),
('a3c4d5e6-f7a8-4901-b234-567890123456', 'c3d4e5f6-a7b8-4901-c234-567890123456', 'Gangorra Infantil Resistente', 2000.00, 3200.00, CURRENT_DATE - INTERVAL '70 days', 'sent', 'Aguardando confirmação de recebimento', NOW() - INTERVAL '70 days'),
('a4d5e6f7-a8b9-4012-c345-678901234567', 'd4e5f6a7-b8c9-4012-d345-678901234567', 'Playground Completo 5x5m', 16000.00, 25000.00, CURRENT_DATE - INTERVAL '65 days', 'pending', 'Aguardando produção', NOW() - INTERVAL '65 days'),
('a5e6f7a8-b9c0-4123-d456-789012345678', 'e5f6a7b8-c9d0-4123-e456-789012345678', 'Balanço Triplo Premium', 3500.00, 5500.00, CURRENT_DATE - INTERVAL '60 days', 'delivered', NULL, NOW() - INTERVAL '60 days'),

-- Vendas intermediárias
('a6f7a8b9-c0d1-4234-e567-890123456789', 'f6a7b8c9-d0e1-4234-f567-890123456789', 'Escorregador Curvo 3m', 2700.00, 4200.00, CURRENT_DATE - INTERVAL '55 days', 'sent', NULL, NOW() - INTERVAL '55 days'),
('a7a8b9c0-d1e2-4345-f678-901234567890', 'a7b8c9d0-e1f2-4345-a678-901234567890', 'Playground Modular Médio - 4x4m', 11500.00, 18000.00, CURRENT_DATE - INTERVAL '50 days', 'pending', 'Cliente solicitou alterações', NOW() - INTERVAL '50 days'),
('a8b9c0d1-e2f3-4456-a789-012345678901', 'b8c9d0e1-f2a3-4456-b789-012345678901', 'Balanço Simples com Assento', 1800.00, 2800.00, CURRENT_DATE - INTERVAL '45 days', 'delivered', NULL, NOW() - INTERVAL '45 days'),
('a9c0d1e2-f3a4-4567-b890-123456789012', 'c9d0e1f2-a3b4-4567-c890-123456789012', 'Playground Completo 6x6m Premium', 22000.00, 35000.00, CURRENT_DATE - INTERVAL '40 days', 'pending', 'Orçamento aprovado, aguardando pagamento inicial', NOW() - INTERVAL '40 days'),
('a0d1e2f3-a4b5-4678-c901-234567890123', 'd0e1f2a3-b4c5-4678-d901-234567890123', 'Gangorra Dupla Colorida', 2400.00, 3800.00, CURRENT_DATE - INTERVAL '35 days', 'sent', NULL, NOW() - INTERVAL '35 days'),

-- Vendas recentes
('a1e2f3a4-b5c6-4789-d012-345678901234', 'e1f2a3b4-c5d6-4789-e012-345678901234', 'Balanço Quadruplo com Cobertura', 4600.00, 7200.00, CURRENT_DATE - INTERVAL '8 days', 'pending', NULL, NOW() - INTERVAL '8 days'),
('a2f3a4b5-c6d7-4890-e123-456789012345', 'f2a3b4c5-d6e7-4890-f123-456789012345', 'Escorregador Reto 2.5m', 2200.00, 3500.00, CURRENT_DATE - INTERVAL '3 days', 'pending', NULL, NOW() - INTERVAL '3 days'),
('a3a4b5c6-d7e8-4901-f234-567890123456', 'a3b4c5d6-e7f8-4901-a234-567890123456', 'Playground Modular Pequeno - 2x2m', 6000.00, 9500.00, CURRENT_DATE - INTERVAL '1 day', 'pending', 'Venda recém criada', NOW() - INTERVAL '1 day');

-- ============================================
-- PARCELAS (INSTALLMENTS)
-- ============================================
-- Venda 1: 15000 em 10x de 1500 (algumas pagas, algumas atrasadas)
INSERT INTO installments (id, sale_id, amount, paid_amount, due_date, status, installment_number, created_at) VALUES
('b1a2b3c4-d5e6-4789-f012-345678901234', 'a1a2b3c4-d5e6-4789-f012-345678901234', 1500.00, 1500.00, CURRENT_DATE - INTERVAL '70 days', 'paid', 1, NOW() - INTERVAL '80 days'),
('b2b3c4d5-e6f7-4890-a123-456789012345', 'a1a2b3c4-d5e6-4789-f012-345678901234', 1500.00, 1500.00, CURRENT_DATE - INTERVAL '60 days', 'paid', 2, NOW() - INTERVAL '80 days'),
('b3c4d5e6-f7a8-4901-b234-567890123456', 'a1a2b3c4-d5e6-4789-f012-345678901234', 1500.00, 1500.00, CURRENT_DATE - INTERVAL '50 days', 'paid', 3, NOW() - INTERVAL '80 days'),
('b4d5e6f7-a8b9-4012-c345-678901234567', 'a1a2b3c4-d5e6-4789-f012-345678901234', 1500.00, 1500.00, CURRENT_DATE - INTERVAL '40 days', 'paid', 4, NOW() - INTERVAL '80 days'),
('b5e6f7a8-b9c0-4123-d456-789012345678', 'a1a2b3c4-d5e6-4789-f012-345678901234', 1500.00, 1500.00, CURRENT_DATE - INTERVAL '30 days', 'paid', 5, NOW() - INTERVAL '80 days'),
('b6f7a8b9-c0d1-4234-e567-890123456789', 'a1a2b3c4-d5e6-4789-f012-345678901234', 1500.00, 1500.00, CURRENT_DATE - INTERVAL '20 days', 'paid', 6, NOW() - INTERVAL '80 days'),
('b7a8b9c0-d1e2-4345-f678-901234567890', 'a1a2b3c4-d5e6-4789-f012-345678901234', 1500.00, 0.00, CURRENT_DATE - INTERVAL '10 days', 'late', 7, NOW() - INTERVAL '80 days'),
('b8b9c0d1-e2f3-4456-a789-012345678901', 'a1a2b3c4-d5e6-4789-f012-345678901234', 1500.00, 0.00, CURRENT_DATE - INTERVAL '5 days', 'late', 8, NOW() - INTERVAL '80 days'),
('b9c0d1e2-f3a4-4567-b890-123456789012', 'a1a2b3c4-d5e6-4789-f012-345678901234', 1500.00, 0.00, CURRENT_DATE + INTERVAL '5 days', 'pending', 9, NOW() - INTERVAL '80 days'),
('b0d1e2f3-a4b5-4678-c901-234567890123', 'a1a2b3c4-d5e6-4789-f012-345678901234', 1500.00, 0.00, CURRENT_DATE + INTERVAL '15 days', 'pending', 10, NOW() - INTERVAL '80 days');

-- Venda 2: 8500 em 5x de 1700 (todas pagas)
INSERT INTO installments (id, sale_id, amount, paid_amount, due_date, status, installment_number, created_at) VALUES
('b1e2f3a4-b5c6-4789-d012-345678901234', 'a2b3c4d5-e6f7-4890-a123-456789012345', 1700.00, 1700.00, CURRENT_DATE - INTERVAL '65 days', 'paid', 1, NOW() - INTERVAL '75 days'),
('b2f3a4b5-c6d7-4890-e123-456789012345', 'a2b3c4d5-e6f7-4890-a123-456789012345', 1700.00, 1700.00, CURRENT_DATE - INTERVAL '55 days', 'paid', 2, NOW() - INTERVAL '75 days'),
('b3a4b5c6-d7e8-4901-f234-567890123456', 'a2b3c4d5-e6f7-4890-a123-456789012345', 1700.00, 1700.00, CURRENT_DATE - INTERVAL '45 days', 'paid', 3, NOW() - INTERVAL '75 days'),
('b4b5c6d7-e8f9-4012-a345-678901234567', 'a2b3c4d5-e6f7-4890-a123-456789012345', 1700.00, 1700.00, CURRENT_DATE - INTERVAL '35 days', 'paid', 4, NOW() - INTERVAL '75 days'),
('b5c6d7e8-f9a0-4123-b456-789012345678', 'a2b3c4d5-e6f7-4890-a123-456789012345', 1700.00, 1700.00, CURRENT_DATE - INTERVAL '25 days', 'paid', 5, NOW() - INTERVAL '75 days');

-- Venda 3: 3200 em 4x de 800 (parcialmente paga)
INSERT INTO installments (id, sale_id, amount, paid_amount, due_date, status, installment_number, created_at) VALUES
('b6d7e8f9-a0b1-4234-c567-890123456789', 'a3c4d5e6-f7a8-4901-b234-567890123456', 800.00, 800.00, CURRENT_DATE - INTERVAL '60 days', 'paid', 1, NOW() - INTERVAL '70 days'),
('b7e8f9a0-b1c2-4345-d678-901234567890', 'a3c4d5e6-f7a8-4901-b234-567890123456', 800.00, 800.00, CURRENT_DATE - INTERVAL '50 days', 'paid', 2, NOW() - INTERVAL '70 days'),
('b8f9a0b1-c2d3-4456-e789-012345678901', 'a3c4d5e6-f7a8-4901-b234-567890123456', 800.00, 400.00, CURRENT_DATE - INTERVAL '40 days', 'partial', 3, NOW() - INTERVAL '70 days'),
('b9a0b1c2-d3e4-4567-f890-123456789012', 'a3c4d5e6-f7a8-4901-b234-567890123456', 800.00, 0.00, CURRENT_DATE - INTERVAL '30 days', 'late', 4, NOW() - INTERVAL '70 days');

-- Venda 4: 25000 em 12x de 2083.33 (primeiras parcelas pagas, algumas pendentes)
INSERT INTO installments (id, sale_id, amount, paid_amount, due_date, status, installment_number, created_at) VALUES
('b0b1c2d3-e4f5-4678-a901-234567890123', 'a4d5e6f7-a8b9-4012-c345-678901234567', 2083.33, 2083.33, CURRENT_DATE - INTERVAL '55 days', 'paid', 1, NOW() - INTERVAL '65 days'),
('b1c2d3e4-f5a6-4789-b012-345678901234', 'a4d5e6f7-a8b9-4012-c345-678901234567', 2083.33, 2083.33, CURRENT_DATE - INTERVAL '45 days', 'paid', 2, NOW() - INTERVAL '65 days'),
('b2d3e4f5-a6b7-4901-c123-456789012345', 'a4d5e6f7-a8b9-4012-c345-678901234567', 2083.33, 2083.33, CURRENT_DATE - INTERVAL '35 days', 'paid', 3, NOW() - INTERVAL '65 days'),
('b3e4f5a6-b7c8-4012-d234-567890123456', 'a4d5e6f7-a8b9-4012-c345-678901234567', 2083.33, 0.00, CURRENT_DATE - INTERVAL '25 days', 'late', 4, NOW() - INTERVAL '65 days'),
('b4f5a6b7-c8d9-4123-e345-678901234567', 'a4d5e6f7-a8b9-4012-c345-678901234567', 2083.33, 0.00, CURRENT_DATE - INTERVAL '15 days', 'late', 5, NOW() - INTERVAL '65 days'),
('b5a6b7c8-d9e0-4234-f456-789012345678', 'a4d5e6f7-a8b9-4012-c345-678901234567', 2083.33, 0.00, CURRENT_DATE - INTERVAL '5 days', 'late', 6, NOW() - INTERVAL '65 days'),
('b6b7c8d9-e0f1-4345-a567-890123456789', 'a4d5e6f7-a8b9-4012-c345-678901234567', 2083.33, 0.00, CURRENT_DATE + INTERVAL '5 days', 'pending', 7, NOW() - INTERVAL '65 days'),
('b7c8d9e0-f1a2-4456-b678-901234567890', 'a4d5e6f7-a8b9-4012-c345-678901234567', 2083.33, 0.00, CURRENT_DATE + INTERVAL '15 days', 'pending', 8, NOW() - INTERVAL '65 days'),
('b8d9e0f1-a2b3-4567-c789-012345678901', 'a4d5e6f7-a8b9-4012-c345-678901234567', 2083.33, 0.00, CURRENT_DATE + INTERVAL '25 days', 'pending', 9, NOW() - INTERVAL '65 days'),
('b9e0f1a2-b3c4-4678-d890-123456789012', 'a4d5e6f7-a8b9-4012-c345-678901234567', 2083.33, 0.00, CURRENT_DATE + INTERVAL '35 days', 'pending', 10, NOW() - INTERVAL '65 days'),
('b0f1a2b3-c4d5-4789-e901-234567890123', 'a4d5e6f7-a8b9-4012-c345-678901234567', 2083.33, 0.00, CURRENT_DATE + INTERVAL '45 days', 'pending', 11, NOW() - INTERVAL '65 days'),
('b1a2b3c4-d5e6-4890-f012-345678901234', 'a4d5e6f7-a8b9-4012-c345-678901234567', 2083.37, 0.00, CURRENT_DATE + INTERVAL '55 days', 'pending', 12, NOW() - INTERVAL '65 days');

-- Venda 5: 5500 em 6x de 916.67 (todas pagas)
INSERT INTO installments (id, sale_id, amount, paid_amount, due_date, status, installment_number, created_at) VALUES
('b2b3c4d5-e6f7-4901-a123-456789012345', 'a5e6f7a8-b9c0-4123-d456-789012345678', 916.67, 916.67, CURRENT_DATE - INTERVAL '50 days', 'paid', 1, NOW() - INTERVAL '60 days'),
('b3c4d5e6-f7a8-4012-b234-567890123456', 'a5e6f7a8-b9c0-4123-d456-789012345678', 916.67, 916.67, CURRENT_DATE - INTERVAL '40 days', 'paid', 2, NOW() - INTERVAL '60 days'),
('b4d5e6f7-a8b9-4123-c345-678901234567', 'a5e6f7a8-b9c0-4123-d456-789012345678', 916.67, 916.67, CURRENT_DATE - INTERVAL '30 days', 'paid', 3, NOW() - INTERVAL '60 days'),
('b5e6f7a8-b9c0-4234-d456-789012345678', 'a5e6f7a8-b9c0-4123-d456-789012345678', 916.67, 916.67, CURRENT_DATE - INTERVAL '20 days', 'paid', 4, NOW() - INTERVAL '60 days'),
('b6f7a8b9-c0d1-4345-e567-890123456789', 'a5e6f7a8-b9c0-4123-d456-789012345678', 916.67, 916.67, CURRENT_DATE - INTERVAL '10 days', 'paid', 5, NOW() - INTERVAL '60 days'),
('b7a8b9c0-d1e2-4456-f678-901234567890', 'a5e6f7a8-b9c0-4123-d456-789012345678', 916.65, 916.65, CURRENT_DATE - INTERVAL '0 days', 'paid', 6, NOW() - INTERVAL '60 days');

-- Venda 6: 4200 em 3x de 1400 (pendentes)
INSERT INTO installments (id, sale_id, amount, paid_amount, due_date, status, installment_number, created_at) VALUES
('b8b9c0d1-e2f3-4567-a789-012345678901', 'a6f7a8b9-c0d1-4234-e567-890123456789', 1400.00, 0.00, CURRENT_DATE - INTERVAL '45 days', 'late', 1, NOW() - INTERVAL '55 days'),
('b9c0d1e2-f3a4-4678-b890-123456789012', 'a6f7a8b9-c0d1-4234-e567-890123456789', 1400.00, 0.00, CURRENT_DATE - INTERVAL '35 days', 'late', 2, NOW() - INTERVAL '55 days'),
('b0d1e2f3-a4b5-4789-c901-234567890123', 'a6f7a8b9-c0d1-4234-e567-890123456789', 1400.00, 0.00, CURRENT_DATE - INTERVAL '25 days', 'late', 3, NOW() - INTERVAL '55 days');

-- Venda 7: 18000 em 8x de 2250 (primeiras pagas, outras pendentes)
INSERT INTO installments (id, sale_id, amount, paid_amount, due_date, status, installment_number, created_at) VALUES
('b1e2f3a4-b5c6-4890-d012-345678901234', 'a7a8b9c0-d1e2-4345-f678-901234567890', 2250.00, 2250.00, CURRENT_DATE - INTERVAL '40 days', 'paid', 1, NOW() - INTERVAL '50 days'),
('b2f3a4b5-c6d7-4901-e123-456789012345', 'a7a8b9c0-d1e2-4345-f678-901234567890', 2250.00, 2250.00, CURRENT_DATE - INTERVAL '30 days', 'paid', 2, NOW() - INTERVAL '50 days'),
('b3a4b5c6-d7e8-4012-f234-567890123456', 'a7a8b9c0-d1e2-4345-f678-901234567890', 2250.00, 0.00, CURRENT_DATE - INTERVAL '20 days', 'late', 3, NOW() - INTERVAL '50 days'),
('b4b5c6d7-e8f9-4123-a345-678901234567', 'a7a8b9c0-d1e2-4345-f678-901234567890', 2250.00, 0.00, CURRENT_DATE - INTERVAL '10 days', 'late', 4, NOW() - INTERVAL '50 days'),
('b5c6d7e8-f9a0-4234-b456-789012345678', 'a7a8b9c0-d1e2-4345-f678-901234567890', 2250.00, 0.00, CURRENT_DATE - INTERVAL '0 days', 'late', 5, NOW() - INTERVAL '50 days'),
('b6d7e8f9-a0b1-4345-c567-890123456789', 'a7a8b9c0-d1e2-4345-f678-901234567890', 2250.00, 0.00, CURRENT_DATE + INTERVAL '10 days', 'pending', 6, NOW() - INTERVAL '50 days'),
('b7e8f9a0-b1c2-4456-d678-901234567890', 'a7a8b9c0-d1e2-4345-f678-901234567890', 2250.00, 0.00, CURRENT_DATE + INTERVAL '20 days', 'pending', 7, NOW() - INTERVAL '50 days'),
('b8f9a0b1-c2d3-4567-e789-012345678901', 'a7a8b9c0-d1e2-4345-f678-901234567890', 2250.00, 0.00, CURRENT_DATE + INTERVAL '30 days', 'pending', 8, NOW() - INTERVAL '50 days');

-- Venda 8: 2800 em 4x de 700 (todas pagas)
INSERT INTO installments (id, sale_id, amount, paid_amount, due_date, status, installment_number, created_at) VALUES
('b8a0b1c2-d3e4-4678-f890-123456789012', 'a8b9c0d1-e2f3-4456-a789-012345678901', 700.00, 700.00, CURRENT_DATE - INTERVAL '35 days', 'paid', 1, NOW() - INTERVAL '45 days'),
('b8b1c2d3-e4f5-4789-a901-234567890123', 'a8b9c0d1-e2f3-4456-a789-012345678901', 700.00, 700.00, CURRENT_DATE - INTERVAL '25 days', 'paid', 2, NOW() - INTERVAL '45 days'),
('b8c2d3e4-f5a6-4890-b012-345678901234', 'a8b9c0d1-e2f3-4456-a789-012345678901', 700.00, 700.00, CURRENT_DATE - INTERVAL '15 days', 'paid', 3, NOW() - INTERVAL '45 days'),
('b8d3e4f5-a6b7-4901-c123-456789012345', 'a8b9c0d1-e2f3-4456-a789-012345678901', 700.00, 700.00, CURRENT_DATE - INTERVAL '5 days', 'paid', 4, NOW() - INTERVAL '45 days');

-- Venda 9: 35000 em 10x de 3500 (primeiras pagas)
INSERT INTO installments (id, sale_id, amount, paid_amount, due_date, status, installment_number, created_at) VALUES
('b9e4f5a6-b7c8-4012-d234-567890123456', 'a9c0d1e2-f3a4-4567-b890-123456789012', 3500.00, 3500.00, CURRENT_DATE - INTERVAL '30 days', 'paid', 1, NOW() - INTERVAL '40 days'),
('b9f5a6b7-c8d9-4123-e345-678901234567', 'a9c0d1e2-f3a4-4567-b890-123456789012', 3500.00, 3500.00, CURRENT_DATE - INTERVAL '20 days', 'paid', 2, NOW() - INTERVAL '40 days'),
('b9a6b7c8-d9e0-4234-f456-789012345678', 'a9c0d1e2-f3a4-4567-b890-123456789012', 3500.00, 0.00, CURRENT_DATE - INTERVAL '10 days', 'late', 3, NOW() - INTERVAL '40 days'),
('b9b7c8d9-e0f1-4345-a567-890123456789', 'a9c0d1e2-f3a4-4567-b890-123456789012', 3500.00, 0.00, CURRENT_DATE - INTERVAL '0 days', 'late', 4, NOW() - INTERVAL '40 days'),
('b9c8d9e0-f1a2-4456-b678-901234567890', 'a9c0d1e2-f3a4-4567-b890-123456789012', 3500.00, 0.00, CURRENT_DATE + INTERVAL '10 days', 'pending', 5, NOW() - INTERVAL '40 days'),
('b9d9e0f1-a2b3-4567-c789-012345678901', 'a9c0d1e2-f3a4-4567-b890-123456789012', 3500.00, 0.00, CURRENT_DATE + INTERVAL '20 days', 'pending', 6, NOW() - INTERVAL '40 days'),
('b9e0f1a3-b3c4-4678-d890-123456789012', 'a9c0d1e2-f3a4-4567-b890-123456789012', 3500.00, 0.00, CURRENT_DATE + INTERVAL '30 days', 'pending', 7, NOW() - INTERVAL '40 days'),
('b9f1a2b3-c4d5-4789-e901-234567890123', 'a9c0d1e2-f3a4-4567-b890-123456789012', 3500.00, 0.00, CURRENT_DATE + INTERVAL '40 days', 'pending', 8, NOW() - INTERVAL '40 days'),
('b9a2b3c4-d5e6-4890-f012-345678901234', 'a9c0d1e2-f3a4-4567-b890-123456789012', 3500.00, 0.00, CURRENT_DATE + INTERVAL '50 days', 'pending', 9, NOW() - INTERVAL '40 days'),
('b9b3c4d5-e6f7-4901-a123-456789012345', 'a9c0d1e2-f3a4-4567-b890-123456789012', 3500.00, 0.00, CURRENT_DATE + INTERVAL '60 days', 'pending', 10, NOW() - INTERVAL '40 days');

-- Venda 10: 3800 em 3x de 1266.67 (pendentes)
INSERT INTO installments (id, sale_id, amount, paid_amount, due_date, status, installment_number, created_at) VALUES
('ba0c4d5e-f7a8-4012-b234-567890123456', 'a0d1e2f3-a4b5-4678-c901-234567890123', 1266.67, 0.00, CURRENT_DATE - INTERVAL '25 days', 'late', 1, NOW() - INTERVAL '35 days'),
('ba1d5e6f-a8b9-4123-c345-678901234567', 'a0d1e2f3-a4b5-4678-c901-234567890123', 1266.67, 0.00, CURRENT_DATE - INTERVAL '15 days', 'late', 2, NOW() - INTERVAL '35 days'),
('ba2e6f7a-b9c0-4234-d456-789012345678', 'a0d1e2f3-a4b5-4678-c901-234567890123', 1266.66, 0.00, CURRENT_DATE - INTERVAL '5 days', 'late', 3, NOW() - INTERVAL '35 days');

-- Venda 11: 7200 em 6x de 1200 (recente, todas pendentes)
INSERT INTO installments (id, sale_id, amount, paid_amount, due_date, status, installment_number, created_at) VALUES
('bb0f7a8b-c0d1-4345-e567-890123456789', 'a1e2f3a4-b5c6-4789-d012-345678901234', 1200.00, 0.00, CURRENT_DATE + INTERVAL '2 days', 'pending', 1, NOW() - INTERVAL '8 days'),
('bb1a8b9c-d1e2-4456-f678-901234567890', 'a1e2f3a4-b5c6-4789-d012-345678901234', 1200.00, 0.00, CURRENT_DATE + INTERVAL '12 days', 'pending', 2, NOW() - INTERVAL '8 days'),
('bb2b9c0d-e2f3-4567-a789-012345678901', 'a1e2f3a4-b5c6-4789-d012-345678901234', 1200.00, 0.00, CURRENT_DATE + INTERVAL '22 days', 'pending', 3, NOW() - INTERVAL '8 days'),
('bb3c0d1e-f3a4-4678-b890-123456789012', 'a1e2f3a4-b5c6-4789-d012-345678901234', 1200.00, 0.00, CURRENT_DATE + INTERVAL '32 days', 'pending', 4, NOW() - INTERVAL '8 days'),
('bb4d1e2f-a4b5-4789-c901-234567890123', 'a1e2f3a4-b5c6-4789-d012-345678901234', 1200.00, 0.00, CURRENT_DATE + INTERVAL '42 days', 'pending', 5, NOW() - INTERVAL '8 days'),
('bb5e2f3a-b5c6-4890-d012-345678901234', 'a1e2f3a4-b5c6-4789-d012-345678901234', 1200.00, 0.00, CURRENT_DATE + INTERVAL '52 days', 'pending', 6, NOW() - INTERVAL '8 days');

-- Venda 12: 3500 em 4x de 875 (recente, todas pendentes)
INSERT INTO installments (id, sale_id, amount, paid_amount, due_date, status, installment_number, created_at) VALUES
('bc0f3a4b-c6d7-4901-e123-456789012345', 'a2f3a4b5-c6d7-4890-e123-456789012345', 875.00, 0.00, CURRENT_DATE + INTERVAL '7 days', 'pending', 1, NOW() - INTERVAL '3 days'),
('bc1a4b5c-d7e8-4012-f234-567890123456', 'a2f3a4b5-c6d7-4890-e123-456789012345', 875.00, 0.00, CURRENT_DATE + INTERVAL '17 days', 'pending', 2, NOW() - INTERVAL '3 days'),
('bc2b5c6d-e8f9-4123-a345-678901234567', 'a2f3a4b5-c6d7-4890-e123-456789012345', 875.00, 0.00, CURRENT_DATE + INTERVAL '27 days', 'pending', 3, NOW() - INTERVAL '3 days'),
('bc3c6d7e-f9a0-4234-b456-789012345678', 'a2f3a4b5-c6d7-4890-e123-456789012345', 875.00, 0.00, CURRENT_DATE + INTERVAL '37 days', 'pending', 4, NOW() - INTERVAL '3 days');

-- Venda 13: 9500 em 5x de 1900 (muito recente, todas pendentes)
INSERT INTO installments (id, sale_id, amount, paid_amount, due_date, status, installment_number, created_at) VALUES
('bd0d7e8f-a0b1-4345-c567-890123456789', 'a3a4b5c6-d7e8-4901-f234-567890123456', 1900.00, 0.00, CURRENT_DATE + INTERVAL '14 days', 'pending', 1, NOW() - INTERVAL '1 day'),
('bd1e8f9a-b1c2-4456-d678-901234567890', 'a3a4b5c6-d7e8-4901-f234-567890123456', 1900.00, 0.00, CURRENT_DATE + INTERVAL '24 days', 'pending', 2, NOW() - INTERVAL '1 day'),
('bd2f9a0b-c2d3-4567-e789-012345678901', 'a3a4b5c6-d7e8-4901-f234-567890123456', 1900.00, 0.00, CURRENT_DATE + INTERVAL '34 days', 'pending', 3, NOW() - INTERVAL '1 day'),
('bd3a0b1c-d3e4-4678-f890-123456789012', 'a3a4b5c6-d7e8-4901-f234-567890123456', 1900.00, 0.00, CURRENT_DATE + INTERVAL '44 days', 'pending', 4, NOW() - INTERVAL '1 day'),
('bd4b1c2d-e4f5-4789-a901-234567890123', 'a3a4b5c6-d7e8-4901-f234-567890123456', 1900.00, 0.00, CURRENT_DATE + INTERVAL '54 days', 'pending', 5, NOW() - INTERVAL '1 day');

-- ============================================
-- PAGAMENTOS (PAYMENTS)
-- ============================================
-- Pagamentos aprovados para parcelas pagas
INSERT INTO payments (id, installment_id, amount, proof_url, status, rejection_reason, created_at) VALUES
-- Pagamentos da venda 1 (parcelas 1-6)
('c1a2b3c4-d5e6-4789-f012-345678901234', 'b1a2b3c4-d5e6-4789-f012-345678901234', 1500.00, 'https://example.com/proofs/payment-001.jpg', 'approved', NULL, NOW() - INTERVAL '70 days'),
('c2b3c4d5-e6f7-4890-a123-456789012345', 'b2b3c4d5-e6f7-4890-a123-456789012345', 1500.00, 'https://example.com/proofs/payment-002.jpg', 'approved', NULL, NOW() - INTERVAL '60 days'),
('c3c4d5e6-f7a8-4901-b234-567890123456', 'b3c4d5e6-f7a8-4901-b234-567890123456', 1500.00, 'https://example.com/proofs/payment-003.jpg', 'approved', NULL, NOW() - INTERVAL '50 days'),
('c4d5e6f7-a8b9-4012-c345-678901234567', 'b4d5e6f7-a8b9-4012-c345-678901234567', 1500.00, 'https://example.com/proofs/payment-004.jpg', 'approved', NULL, NOW() - INTERVAL '40 days'),
('c5e6f7a8-b9c0-4123-d456-789012345678', 'b5e6f7a8-b9c0-4123-d456-789012345678', 1500.00, 'https://example.com/proofs/payment-005.jpg', 'approved', NULL, NOW() - INTERVAL '30 days'),
('c6f7a8b9-c0d1-4234-e567-890123456789', 'b6f7a8b9-c0d1-4234-e567-890123456789', 1500.00, 'https://example.com/proofs/payment-006.jpg', 'approved', NULL, NOW() - INTERVAL '20 days'),

-- Pagamentos da venda 2 (todas as parcelas)
('c7a8b9c0-d1e2-4345-f678-901234567890', 'b1e2f3a4-b5c6-4789-d012-345678901234', 1700.00, 'https://example.com/proofs/payment-007.jpg', 'approved', NULL, NOW() - INTERVAL '65 days'),
('c8b9c0d1-e2f3-4456-a789-012345678901', 'b2f3a4b5-c6d7-4890-e123-456789012345', 1700.00, 'https://example.com/proofs/payment-008.jpg', 'approved', NULL, NOW() - INTERVAL '55 days'),
('c9c0d1e2-f3a4-4567-b890-123456789012', 'b3a4b5c6-d7e8-4901-f234-567890123456', 1700.00, 'https://example.com/proofs/payment-009.jpg', 'approved', NULL, NOW() - INTERVAL '45 days'),
('c0d1e2f3-a4b5-4678-c901-234567890123', 'b4b5c6d7-e8f9-4012-a345-678901234567', 1700.00, 'https://example.com/proofs/payment-010.jpg', 'approved', NULL, NOW() - INTERVAL '35 days'),
('c1e2f3a4-b5c6-4789-d012-345678901234', 'b5c6d7e8-f9a0-4123-b456-789012345678', 1700.00, 'https://example.com/proofs/payment-011.jpg', 'approved', NULL, NOW() - INTERVAL '25 days'),

-- Pagamentos da venda 3 (parcelas 1, 2 e parcial da 3)
('c2f3a4b5-c6d7-4890-e123-456789012345', 'b6d7e8f9-a0b1-4234-c567-890123456789', 800.00, 'https://example.com/proofs/payment-012.jpg', 'approved', NULL, NOW() - INTERVAL '60 days'),
('c3a4b5c6-d7e8-4901-f234-567890123456', 'b7e8f9a0-b1c2-4345-d678-901234567890', 800.00, 'https://example.com/proofs/payment-013.jpg', 'approved', NULL, NOW() - INTERVAL '50 days'),
('c4b5c6d7-e8f9-4012-a345-678901234567', 'b8f9a0b1-c2d3-4456-e789-012345678901', 400.00, 'https://example.com/proofs/payment-014.jpg', 'approved', NULL, NOW() - INTERVAL '40 days'),

-- Pagamentos da venda 4 (primeiras 3 parcelas)
('c5c6d7e8-f9a0-4123-b456-789012345678', 'b0b1c2d3-e4f5-4678-a901-234567890123', 2083.33, 'https://example.com/proofs/payment-015.jpg', 'approved', NULL, NOW() - INTERVAL '55 days'),
('c6d7e8f9-a0b1-4234-c567-890123456789', 'b1c2d3e4-f5a6-4789-b012-345678901234', 2083.33, 'https://example.com/proofs/payment-016.jpg', 'approved', NULL, NOW() - INTERVAL '45 days'),
('c7e8f9a0-b1c2-4345-d678-901234567890', 'b2d3e4f5-a6b7-4901-c123-456789012345', 2083.33, 'https://example.com/proofs/payment-017.jpg', 'approved', NULL, NOW() - INTERVAL '35 days'),

-- Pagamentos da venda 5 (todas as parcelas)
('c8f9a0b1-c2d3-4456-e789-012345678901', 'b2b3c4d5-e6f7-4901-a123-456789012345', 916.67, 'https://example.com/proofs/payment-018.jpg', 'approved', NULL, NOW() - INTERVAL '50 days'),
('c9a0b1c2-d3e4-4567-f890-123456789012', 'b3c4d5e6-f7a8-4012-b234-567890123456', 916.67, 'https://example.com/proofs/payment-019.jpg', 'approved', NULL, NOW() - INTERVAL '40 days'),
('c0b1c2d3-e4f5-4678-a901-234567890123', 'b4d5e6f7-a8b9-4123-c345-678901234567', 916.67, 'https://example.com/proofs/payment-020.jpg', 'approved', NULL, NOW() - INTERVAL '30 days'),
('c1c2d3e4-f5a6-4789-b012-345678901234', 'b5e6f7a8-b9c0-4234-d456-789012345678', 916.67, 'https://example.com/proofs/payment-021.jpg', 'approved', NULL, NOW() - INTERVAL '20 days'),
('c2d3e4f5-a6b7-4890-c123-456789012345', 'b6f7a8b9-c0d1-4345-e567-890123456789', 916.67, 'https://example.com/proofs/payment-022.jpg', 'approved', NULL, NOW() - INTERVAL '10 days'),
('c3e4f5a6-b7c8-4901-d234-567890123456', 'b7a8b9c0-d1e2-4456-f678-901234567890', 916.65, 'https://example.com/proofs/payment-023.jpg', 'approved', NULL, NOW() - INTERVAL '0 days'),

-- Pagamentos da venda 7 (primeiras 2 parcelas)
('c4f5a6b7-c8d9-4012-e345-678901234567', 'b1e2f3a4-b5c6-4890-d012-345678901234', 2250.00, 'https://example.com/proofs/payment-024.jpg', 'approved', NULL, NOW() - INTERVAL '40 days'),
('c5a6b7c8-d9e0-4123-f456-789012345678', 'b2f3a4b5-c6d7-4901-e123-456789012345', 2250.00, 'https://example.com/proofs/payment-025.jpg', 'approved', NULL, NOW() - INTERVAL '30 days'),

-- Pagamentos da venda 8 (todas as parcelas)
('c6b7c8d9-e0f1-4234-a567-890123456789', 'b8a0b1c2-d3e4-4678-f890-123456789012', 700.00, 'https://example.com/proofs/payment-026.jpg', 'approved', NULL, NOW() - INTERVAL '35 days'),
('c7c8d9e0-f1a2-4345-b678-901234567890', 'b8b1c2d3-e4f5-4789-a901-234567890123', 700.00, 'https://example.com/proofs/payment-027.jpg', 'approved', NULL, NOW() - INTERVAL '25 days'),
('c8d9e0f1-a2b3-4456-c789-012345678901', 'b8c2d3e4-f5a6-4890-b012-345678901234', 700.00, 'https://example.com/proofs/payment-028.jpg', 'approved', NULL, NOW() - INTERVAL '15 days'),
('c9e0f1a2-b3c4-4567-d890-123456789012', 'b8d3e4f5-a6b7-4901-c123-456789012345', 700.00, 'https://example.com/proofs/payment-029.jpg', 'approved', NULL, NOW() - INTERVAL '5 days'),

-- Pagamentos da venda 9 (primeiras 2 parcelas)
('c0f1a2b3-c4d5-4678-e901-234567890123', 'b9e4f5a6-b7c8-4012-d234-567890123456', 3500.00, 'https://example.com/proofs/payment-030.jpg', 'approved', NULL, NOW() - INTERVAL '30 days'),
('c9a2b3c4-d5e6-4789-f012-345678901234', 'b9f5a6b7-c8d9-4123-e345-678901234567', 3500.00, 'https://example.com/proofs/payment-031.jpg', 'approved', NULL, NOW() - INTERVAL '20 days'),

-- Pagamentos pendentes (aguardando aprovação)
('ca0b3c4d-e6f7-4890-a123-456789012345', 'b7a8b9c0-d1e2-4456-f678-901234567890', 1500.00, 'https://example.com/proofs/payment-pending-001.jpg', 'pending', NULL, NOW() - INTERVAL '8 days'),
('ca1c4d5e-f7a8-4901-b234-567890123456', 'b8b9c0d1-e2f3-4456-a789-012345678901', 1400.00, 'https://example.com/proofs/payment-pending-002.jpg', 'pending', NULL, NOW() - INTERVAL '5 days'),
('ca2d5e6f-a8b9-4012-c345-678901234567', 'b5c6d7e8-f9a0-4234-b456-789012345678', 2250.00, 'https://example.com/proofs/payment-pending-003.jpg', 'pending', NULL, NOW() - INTERVAL '2 days'),

-- Pagamentos rejeitados
('ca3e6f7a-b9c0-4123-d456-789012345678', 'b6b7c8d9-e0f1-4345-a567-890123456789', 2083.33, 'https://example.com/proofs/payment-rejected-001.jpg', 'rejected', 'Comprovante ilegível, favor enviar novamente', NOW() - INTERVAL '20 days'),
('ca4f7a8b-c0d1-4234-e567-890123456789', 'b7c8d9e0-f1a2-4456-b678-901234567890', 3500.00, 'https://example.com/proofs/payment-rejected-002.jpg', 'rejected', 'Valor não confere com a parcela', NOW() - INTERVAL '12 days'),
('ca5a8b9c-d1e2-4345-f678-901234567890', 'b3c4d5e6-f7a8-4012-b234-567890123456', 1266.67, 'https://example.com/proofs/payment-rejected-003.jpg', 'rejected', 'Comprovante de outra conta', NOW() - INTERVAL '18 days');

-- ============================================
-- FINALIZAÇÃO
-- ============================================
-- Atualizar status de parcelas atrasadas
SELECT mark_late_installments();

-- Mensagem de sucesso
DO $$
BEGIN
    RAISE NOTICE 'Seed executado com sucesso!';
    RAISE NOTICE 'Compradores inseridos: 13';
    RAISE NOTICE 'Vendas inseridas: 13';
    RAISE NOTICE 'Parcelas inseridas: ~100';
    RAISE NOTICE 'Pagamentos inseridos: ~40';
END $$;

