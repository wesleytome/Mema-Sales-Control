# 🚀 Guia Passo a Passo: Criar Projeto no Supabase

Este guia vai te ajudar a criar um projeto no Supabase e obter todas as credenciais necessárias para o seu projeto.

## 📋 Pré-requisitos

- Uma conta no Supabase (gratuita)
- Navegador web atualizado

---

## 🔹 PASSO 1: Criar Conta no Supabase

1. Acesse o site do Supabase: **[https://supabase.com](https://supabase.com)**
2. Clique no botão **"Start your project"** ou **"Sign In"** (no canto superior direito)
3. Você pode criar conta usando:
   - **GitHub** (recomendado - mais rápido)
   - **Email e senha**
   - **Google**

---

## 🔹 PASSO 2: Criar Novo Projeto

1. Após fazer login, você verá o **Dashboard** do Supabase
2. Clique no botão **"New Project"** (ou **"New"** > **"Project"**)
3. Preencha os dados do projeto:
   - **Name**: Dê um nome para seu projeto (ex: "sistema-vendas", "meu-projeto")
   - **Database Password**: Crie uma senha forte para o banco de dados
     - ⚠️ **IMPORTANTE**: Anote esta senha! Você precisará dela depois
   - **Region**: Escolha a região mais próxima de você
     - Para Brasil: **South America (São Paulo)**
   - **Pricing Plan**: Selecione **Free** (plano gratuito)
4. Clique em **"Create new project"**
5. ⏳ Aguarde alguns minutos enquanto o projeto é criado (pode levar 2-5 minutos)

---

## 🔹 PASSO 3: Obter as Credenciais (URL e Chave Anônima)

Após o projeto ser criado:

1. No painel do projeto, clique no ícone de **⚙️ Settings** (Configurações) no menu lateral esquerdo
2. Clique em **"API"** no submenu
3. Você verá duas informações importantes:

   ### 📍 **Project URL** (URL do Projeto)
   - Está na seção **"Project URL"**
   - Formato: `https://xxxxxxxxxxxxx.supabase.co`
   - **Copie esta URL** - você precisará dela

   ### 🔑 **anon public** (Chave Anônima)
   - Está na seção **"Project API keys"**
   - Procure pela chave com o rótulo **"anon"** e **"public"**
   - Clique no ícone de **👁️** (olho) para revelar a chave
   - **Copie esta chave** - você precisará dela

   ⚠️ **IMPORTANTE**: 
   - Use sempre a chave **"anon public"** (não a chave "service_role")
   - A chave "service_role" é muito poderosa e não deve ser usada no frontend

---

## 🔹 PASSO 4: Configurar Variáveis de Ambiente no Projeto

1. Na raiz do seu projeto, crie um arquivo chamado **`.env`**
2. Adicione as seguintes linhas (substitua pelos valores que você copiou):

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua_chave_anon_aqui
```

**Exemplo real:**
```env
VITE_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYzODk2NzI4MCwiZXhwIjoxOTU0NTQzMjgwfQ.exemplo123456789
```

3. **Salve o arquivo**

⚠️ **IMPORTANTE**: 
- O arquivo `.env` já está no `.gitignore` (não será commitado)
- Nunca compartilhe suas credenciais publicamente
- Se você usar Git, certifique-se de que `.env` está no `.gitignore`

---

## 🔹 PASSO 5: Executar o Schema SQL no Banco de Dados

1. No painel do Supabase, clique em **"SQL Editor"** no menu lateral
2. Clique em **"New query"** (Nova consulta)
3. Abra o arquivo `supabase/schema.sql` do seu projeto
4. **Copie todo o conteúdo** do arquivo `schema.sql`
5. **Cole no SQL Editor** do Supabase
6. Clique em **"Run"** (ou pressione `Ctrl+Enter` / `Cmd+Enter`)
7. ✅ Você deve ver a mensagem de sucesso: "Success. No rows returned"

---

## 🔹 PASSO 6: Criar Bucket de Storage (para upload de comprovantes)

1. No painel do Supabase, clique em **"Storage"** no menu lateral
2. Clique em **"Create a new bucket"**
3. Configure o bucket:
   - **Name**: `proofs` (nome exato, sem espaços)
   - **Public bucket**: Deixe **desmarcado** (privado)
4. Clique em **"Create bucket"**

---

## 🔹 PASSO 7: Configurar Políticas de Storage (RLS)

1. No painel do Supabase, vá em **"SQL Editor"** novamente
2. Clique em **"New query"**
3. Cole e execute o seguinte SQL:

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

4. Clique em **"Run"**

---

## 🔹 PASSO 8: Criar Primeiro Usuário Admin (Opcional)

Para poder fazer login no sistema:

1. No painel do Supabase, clique em **"Authentication"** no menu lateral
2. Clique em **"Users"**
3. Clique em **"Add user"** > **"Create new user"**
4. Preencha:
   - **Email**: Seu email (ex: admin@exemplo.com)
   - **Password**: Uma senha forte
   - **Auto Confirm User**: ✅ Marque esta opção (para não precisar confirmar email)
5. Clique em **"Create user"**

Agora você pode usar este email e senha para fazer login no sistema!

---

## ✅ Verificação Final

Para verificar se tudo está funcionando:

1. Certifique-se de que o arquivo `.env` está configurado corretamente
2. Reinicie o servidor de desenvolvimento:
   ```bash
   # Pare o servidor (Ctrl+C) e inicie novamente
   pnpm dev
   ```
3. Tente fazer login no sistema com o usuário que você criou

---

## 🆘 Problemas Comuns

### ❌ Erro: "Variáveis de ambiente não encontradas"
- Verifique se o arquivo `.env` está na raiz do projeto
- Verifique se os nomes das variáveis estão corretos: `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`
- Reinicie o servidor de desenvolvimento após criar/editar o `.env`

### ❌ Erro ao executar o schema SQL
- Verifique se não há erros de sintaxe no SQL
- Certifique-se de executar todo o conteúdo do arquivo `schema.sql`
- Se já executou antes, pode dar erro de "já existe". Isso é normal, ignore.

### ❌ Não consigo fazer login
- Verifique se criou o usuário no Authentication
- Verifique se marcou "Auto Confirm User" ao criar o usuário
- Verifique se está usando o email e senha corretos

---

## 📚 Próximos Passos

Após completar este guia, você pode:

1. ✅ Testar o sistema fazendo login
2. ✅ Criar compradores, vendas e parcelas
3. ✅ Testar o upload de comprovantes de pagamento
4. ✅ Explorar o painel do Supabase para ver os dados

---

## 🔗 Links Úteis

- [Documentação do Supabase](https://supabase.com/docs)
- [Dashboard do Supabase](https://app.supabase.com)
- [Guia de Autenticação](https://supabase.com/docs/guides/auth)

---

**Pronto!** 🎉 Seu projeto está configurado e pronto para uso!

