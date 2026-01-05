# Setup do Supabase

## 1. Criar Projeto no Supabase

1. Acesse [supabase.com](https://supabase.com)
2. Crie uma nova conta ou faça login
3. Crie um novo projeto
4. Anote a URL do projeto e a chave anônima (anon key)

## 2. Executar Schema SQL

1. No painel do Supabase, vá em **SQL Editor**
2. Copie e cole o conteúdo do arquivo `schema.sql`
3. Execute o script

## 3. Criar Bucket de Storage

1. No painel do Supabase, vá em **Storage**
2. Clique em **Create a new bucket**
3. Nome do bucket: `proofs`
4. Marque como **Public bucket** (desmarcado - privado)
5. Clique em **Create bucket**

## 4. Configurar Políticas de Storage (RLS)

No SQL Editor, execute:

```sql
-- Política para permitir upload público
CREATE POLICY "Public can upload proofs"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'proofs' AND
  auth.role() = 'anon'
);

-- Política para permitir leitura pública
CREATE POLICY "Public can view proofs"
ON storage.objects FOR SELECT
USING (bucket_id = 'proofs');
```

## 5. Configurar Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anonima
```

## 6. Criar Usuário Admin (Opcional)

Para criar o primeiro usuário administrador:

1. No painel do Supabase, vá em **Authentication** > **Users**
2. Clique em **Add user** > **Create new user**
3. Defina email e senha
4. Este usuário poderá fazer login no sistema

## 7. Agendar Tarefa para Marcar Parcelas Atrasadas (Opcional)

Para marcar automaticamente parcelas como atrasadas, você pode:

1. Usar o **Database** > **Functions** do Supabase
2. Criar uma função que executa `SELECT mark_late_installments();`
3. Agendar via cron job externo ou usar Supabase Edge Functions

Ou executar manualmente quando necessário:

```sql
SELECT mark_late_installments();
```

## 8. Popular Banco com Dados de Teste (Opcional)

Para popular o banco de dados com dados de teste e facilitar a navegação e testes:

1. No painel do Supabase, vá em **SQL Editor**
2. Abra o arquivo `seed.sql` deste diretório
3. Copie e cole todo o conteúdo no SQL Editor
4. Execute o script

**⚠️ Atenção:** Este script irá inserir dados de teste. Se você já tiver dados no banco e quiser limpar antes, descomente as linhas `TRUNCATE` no início do arquivo `seed.sql`.

**Dados incluídos no seed:**
- **13 compradores** com diferentes perfis (com/sem CPF, com/sem email)
- **13 vendas** com diferentes status de entrega (pending, sent, delivered)
- **~100 parcelas** com diferentes status (paid, pending, late, partial)
- **~40 pagamentos** com diferentes status (approved, pending, rejected)

Os dados são criados com datas variadas para simular um histórico real, incluindo:
- Vendas antigas com parcelas pagas
- Vendas intermediárias com parcelas atrasadas
- Vendas recentes com parcelas pendentes
- Pagamentos aprovados, pendentes e rejeitados

