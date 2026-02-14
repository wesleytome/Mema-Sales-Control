# Sistema de Gestão de Vendas Parceladas

Sistema completo para gestão de vendas parceladas com controle de compradores, vendas, parcelas e aprovação de comprovantes de pagamento.

## 🚀 Tecnologias

- **Frontend**: React 19 + Vite + TypeScript
- **UI**: Tailwind CSS + shadcn/ui
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Roteamento**: React Router
- **Data Fetching**: TanStack Query
- **Formulários**: React Hook Form + Zod

## 📋 Pré-requisitos

- Docker e docker-compose
- Conta no Supabase (gratuita)

## 🛠️ Instalação e execução (via Docker)

1. Clone o repositório
2. Suba os containers:
```bash
make up
```

3. Configure o Supabase:
   - Siga as instruções em `supabase/README.md`
   - Execute o schema SQL em `supabase/schema.sql`
   - Crie o bucket de storage `proofs`

4. Configure as variáveis de ambiente:
```bash
cp .env.example .env
```

Edite o `.env` com suas credenciais do Supabase:
```env
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anonima
```

5. Inicie o servidor de desenvolvimento:
```bash
pnpm dev
```

## 📁 Estrutura do Projeto

```
src/
├── components/        # Componentes React
│   ├── ui/           # Componentes shadcn/ui
│   ├── layout/        # Layout, Sidebar, etc
│   ├── buyers/        # Componentes de compradores
│   ├── sales/         # Componentes de vendas
│   └── ...
├── pages/             # Páginas da aplicação
│   ├── admin/         # Páginas autenticadas
│   ├── public/        # Páginas públicas
│   └── auth/          # Autenticação
├── hooks/             # Custom hooks
├── lib/               # Utilitários e configurações
├── types/             # TypeScript types
└── contexts/          # React contexts
```

## 🎯 Funcionalidades

### Área Administrativa (Autenticada)

- **Dashboard**: Visão geral com cards operacionais e alertas
- **Compradores**: CRUD completo de compradores
- **Vendas**: CRUD de vendas com criação de parcelas
  - Modo automático: divide o valor em N parcelas iguais
  - Modo manual: cria parcelas com valores e datas personalizadas
- **Pagamentos**: Fila de aprovação de comprovantes
  - Visualizar comprovante
  - Aprovar ou rejeitar pagamento
  - Atualização automática de status das parcelas

### Área Pública

- **Página de Upload**: `/pay/:saleId`
  - Visualização da venda e parcelas
  - Upload de comprovante de pagamento
  - Suporte a pagamentos parciais
  - Aceita imagens (JPG, PNG) e PDF

## 🔒 Segurança

- Autenticação via Supabase Auth
- Row Level Security (RLS) configurado
- Políticas de acesso:
  - Admin: acesso total (após login)
  - Público: apenas visualização de vendas específicas e upload de comprovantes

## 📱 Responsividade

O sistema é totalmente responsivo e funciona bem em:
- Desktop
- Tablet
- Mobile

## 🚢 Deploy

### Vercel (Recomendado)

1. Conecte seu repositório ao Vercel
2. Configure as variáveis de ambiente
3. Deploy automático a cada push

### Outros

O projeto pode ser deployado em qualquer plataforma que suporte aplicações React estáticas (Netlify, Cloudflare Pages, etc).

## 📝 Licença

Este projeto é privado e de uso interno.
