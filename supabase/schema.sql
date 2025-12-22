-- Sistema de Gestão de Vendas Parceladas
-- Schema SQL para Supabase

-- Tabela de compradores
CREATE TABLE buyers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de vendas
CREATE TYPE delivery_status AS ENUM ('pending', 'sent', 'delivered');

CREATE TABLE sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    buyer_id UUID NOT NULL REFERENCES buyers(id) ON DELETE CASCADE,
    product_description TEXT NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    sale_date DATE NOT NULL DEFAULT CURRENT_DATE,
    delivery_status delivery_status DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de parcelas
CREATE TYPE installment_status AS ENUM ('pending', 'paid', 'late', 'partial');

CREATE TABLE installments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    paid_amount DECIMAL(10, 2) DEFAULT 0,
    due_date DATE NOT NULL,
    status installment_status DEFAULT 'pending',
    installment_number INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de pagamentos
CREATE TYPE payment_status AS ENUM ('pending', 'approved', 'rejected');

CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    installment_id UUID NOT NULL REFERENCES installments(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    proof_url TEXT NOT NULL,
    status payment_status DEFAULT 'pending',
    rejection_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_sales_buyer_id ON sales(buyer_id);
CREATE INDEX idx_installments_sale_id ON installments(sale_id);
CREATE INDEX idx_installments_due_date ON installments(due_date);
CREATE INDEX idx_installments_status ON installments(status);
CREATE INDEX idx_payments_installment_id ON payments(installment_id);
CREATE INDEX idx_payments_status ON payments(status);

-- Função para atualizar status de parcelas automaticamente
CREATE OR REPLACE FUNCTION update_installment_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Atualiza paid_amount da parcela
    UPDATE installments
    SET paid_amount = COALESCE(
        (SELECT SUM(amount) FROM payments 
         WHERE installment_id = NEW.installment_id 
         AND status = 'approved'),
        0
    )
    WHERE id = NEW.installment_id;
    
    -- Atualiza status da parcela baseado no paid_amount
    UPDATE installments
    SET status = CASE
        WHEN paid_amount >= amount THEN 'paid'
        WHEN paid_amount > 0 THEN 'partial'
        WHEN due_date < CURRENT_DATE THEN 'late'
        ELSE 'pending'
    END
    WHERE id = NEW.installment_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar status quando pagamento é inserido com status 'approved'
CREATE TRIGGER trigger_update_installment_status_insert
AFTER INSERT ON payments
FOR EACH ROW
WHEN (NEW.status = 'approved')
EXECUTE FUNCTION update_installment_status();

-- Trigger para atualizar status quando pagamento é atualizado para/ou era 'approved'
CREATE TRIGGER trigger_update_installment_status_update
AFTER UPDATE OF status ON payments
FOR EACH ROW
WHEN (NEW.status = 'approved' OR OLD.status = 'approved')
EXECUTE FUNCTION update_installment_status();

-- Função para marcar parcelas como atrasadas automaticamente
CREATE OR REPLACE FUNCTION mark_late_installments()
RETURNS void AS $$
BEGIN
    UPDATE installments
    SET status = 'late'
    WHERE status = 'pending'
    AND due_date < CURRENT_DATE
    AND paid_amount < amount;
END;
$$ LANGUAGE plpgsql;

-- Row Level Security (RLS) Policies

-- Habilitar RLS em todas as tabelas
ALTER TABLE buyers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE installments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Políticas para buyers (apenas admin autenticado)
CREATE POLICY "Admin can view all buyers"
    ON buyers FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Admin can insert buyers"
    ON buyers FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Admin can update buyers"
    ON buyers FOR UPDATE
    USING (auth.role() = 'authenticated');

CREATE POLICY "Admin can delete buyers"
    ON buyers FOR DELETE
    USING (auth.role() = 'authenticated');

-- Políticas para sales (apenas admin autenticado)
CREATE POLICY "Admin can view all sales"
    ON sales FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Admin can insert sales"
    ON sales FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Admin can update sales"
    ON sales FOR UPDATE
    USING (auth.role() = 'authenticated');

CREATE POLICY "Admin can delete sales"
    ON sales FOR DELETE
    USING (auth.role() = 'authenticated');

-- Políticas para installments (admin + público para visualização)
CREATE POLICY "Admin can view all installments"
    ON installments FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Public can view installments by sale"
    ON installments FOR SELECT
    USING (
        sale_id IN (
            SELECT id FROM sales WHERE id = sale_id
        )
    );

CREATE POLICY "Admin can insert installments"
    ON installments FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Admin can update installments"
    ON installments FOR UPDATE
    USING (auth.role() = 'authenticated');

CREATE POLICY "Admin can delete installments"
    ON installments FOR DELETE
    USING (auth.role() = 'authenticated');

-- Políticas para payments
CREATE POLICY "Admin can view all payments"
    ON payments FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Public can insert payments"
    ON payments FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Admin can update payments"
    ON payments FOR UPDATE
    USING (auth.role() = 'authenticated');

-- Política pública para visualizar sales específicas (para página pública)
CREATE POLICY "Public can view sale by id"
    ON sales FOR SELECT
    USING (true);

-- NOTA: Após executar este schema, você precisa:
-- 1. Criar o bucket 'proofs' no Storage do Supabase
-- 2. Configurar as políticas de Storage (veja README.md)
-- 3. Criar um usuário admin no Authentication

