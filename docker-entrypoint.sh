#!/bin/sh
set -e

# Se projeto existe, instalar dependências se necessário
if [ -f package.json ]; then
  if [ ! -d node_modules ] || [ ! -f node_modules/.pnpm ]; then
    echo "📥 Instalando dependências..."
    pnpm install
  fi
fi

# Se não houver argumentos ou for um comando de shell, executar diretamente
if [ $# -eq 0 ] || [ "$1" = "sh" ] || [ "$1" = "/bin/sh" ] || [ "$1" = "bash" ] || [ "$1" = "/bin/bash" ]; then
  exec "$@"
fi

# Executar comando passado como argumento
case "$1" in
  dev)
    if [ ! -f package.json ]; then
      echo ""
      echo "⚠️  Projeto não encontrado!"
      echo ""
      echo "📝 FASE DE SETUP:"
      echo "  1. Execute: make init"
      echo "  2. Configure Tailwind: make setup-tailwind"
      echo "  3. Configure shadcn/ui: make setup-shadcn"
      echo "  4. Depois: make dev"
      echo ""
      echo "💡 Após commitar no GitHub, este passo não será mais necessário."
      echo ""
      exit 1
    fi
    echo "🚀 Iniciando servidor de desenvolvimento..."
    exec pnpm run dev -- --host --port 5175
    ;;
  build)
    if [ ! -f package.json ]; then
      echo "❌ Projeto não encontrado. Execute 'make init' primeiro."
      exit 1
    fi
    echo "🏗️  Construindo projeto..."
    exec pnpm run build
    ;;
  preview)
    if [ ! -f package.json ]; then
      echo "❌ Projeto não encontrado."
      exit 1
    fi
    echo "👀 Visualizando build..."
    exec pnpm run preview -- --host --port 4173
    ;;
  init)
    # Comando apenas para fase inicial - será removido depois
    echo "📦 Criando projeto Vite interativamente..."
    echo "💡 Este comando é apenas para setup inicial."
    echo ""
    exec pnpm create vite .
    ;;
  init-full)
    # Cria projeto React + Vite + Tailwind + configura aliases (tudo automático)
    if [ -f package.json ]; then
      echo "⚠️  Projeto já existe. Use 'make init' para criar um novo projeto."
      exit 1
    fi
    
    echo "🚀 Criando projeto React + Vite + TypeScript..."
    pnpm create vite . --template react-ts --yes
    
    echo "📦 Instalando dependências..."
    pnpm install
    
    echo "🎨 Instalando e configurando Tailwind CSS..."
    pnpm add -D tailwindcss postcss autoprefixer tailwindcss-animate
    
    # Criar postcss.config.js
    cat > postcss.config.js << 'EOF'
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
EOF
    
    # Criar tailwind.config.js otimizado para shadcn
    cat > tailwind.config.js << 'EOF'
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      colors: {},
    },
  },
  plugins: [require("tailwindcss-animate")],
}
EOF
    
    # Configurar src/index.css com Tailwind
    cat > src/index.css << 'EOF'
@tailwind base;
@tailwind components;
@tailwind utilities;
EOF
    
    # Configurar aliases no tsconfig.app.json
    node -e "
      const fs = require('fs');
      const config = JSON.parse(fs.readFileSync('tsconfig.app.json', 'utf8'));
      if (!config.compilerOptions) config.compilerOptions = {};
      config.compilerOptions.baseUrl = '.';
      config.compilerOptions.paths = { '@/*': ['./src/*'] };
      fs.writeFileSync('tsconfig.app.json', JSON.stringify(config, null, 2) + '\n');
    "
    
    # Configurar aliases no vite.config.ts
    node -e "
      const fs = require('fs');
      let content = fs.readFileSync('vite.config.ts', 'utf8');
      if (!content.includes('import path')) {
        content = \"import path from 'path'\\n\" + content;
      }
      if (!content.includes('resolve:')) {
        content = content.replace(
          /plugins: \[react\(\)\],/,
          \"plugins: [react()],\\n  resolve: {\\n    alias: {\\n      '@': path.resolve(__dirname, './src'),\\n    },\\n  },\"
        );
      }
      fs.writeFileSync('vite.config.ts', content);
    "
    
    echo ""
    echo "✅ Projeto criado com sucesso!"
    echo ""
    echo "📝 Próximos passos:"
    echo "   1. Execute: pnpm dlx shadcn@latest init"
    echo "   2. Escolha suas preferências (style, colors, etc.)"
    echo "   3. Adicione componentes: pnpm dlx shadcn@latest add button"
    echo ""
    ;;
  setup-tailwind)
    if [ ! -f package.json ]; then
      echo "❌ Projeto não encontrado."
      exit 1
    fi
    echo "🎨 Configurando Tailwind CSS..."
    pnpm add -D tailwindcss postcss autoprefixer
    
    # Criar arquivos de configuração manualmente (mais confiável)
    echo "📝 Criando arquivos de configuração..."
    
    # Criar postcss.config.js
    cat > postcss.config.js << 'EOF'
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
EOF
    echo "✅ postcss.config.js criado"
    
    # Configuração do Tailwind otimizada para shadcn/ui
    cat > tailwind.config.js << 'EOF'
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      colors: {},
    },
  },
  plugins: [require("tailwindcss-animate")],
}
EOF
    echo "✅ tailwind.config.js criado"
    
    # Instalar tailwindcss-animate (necessário para shadcn)
    echo "📦 Instalando tailwindcss-animate..."
    pnpm add -D tailwindcss-animate

    # Adicionar diretivas do Tailwind no início do index.css (preservando conteúdo existente)
    if [ -f src/index.css ]; then
      if ! grep -q "@tailwind base" src/index.css; then
        # Criar arquivo temporário com as diretivas no início
        {
          echo "@tailwind base;"
          echo "@tailwind components;"
          echo "@tailwind utilities;"
          echo ""
          cat src/index.css
        } > src/index.css.tmp
        mv src/index.css.tmp src/index.css
        echo "✅ Diretivas do Tailwind adicionadas ao src/index.css"
      else
        echo "ℹ️  Tailwind já configurado em src/index.css"
      fi
    else
      # Se não existir, criar com as diretivas
      cat > src/index.css << 'EOF'
@tailwind base;
@tailwind components;
@tailwind utilities;
EOF
      echo "✅ Arquivo src/index.css criado com diretivas do Tailwind"
    fi
    
    echo "✅ Tailwind CSS configurado com sucesso!"
    echo "💡 Próximo passo: execute 'make setup-shadcn' para configurar shadcn/ui"
    ;;
  setup-shadcn)
    if [ ! -f package.json ]; then
      echo "❌ Projeto não encontrado."
      exit 1
    fi
    if [ ! -f tailwind.config.js ]; then
      echo "❌ Tailwind não configurado. Execute 'make setup-tailwind' primeiro."
      exit 1
    fi
    echo "🎨 Configurando shadcn/ui..."
    
    # Verificar se já existe components.json
    if [ -f components.json ]; then
      echo "ℹ️  shadcn/ui já está configurado (components.json existe)"
      echo "💡 Para adicionar componentes, use: pnpm dlx shadcn@latest add [component-name]"
      exit 0
    fi
    
    # Criar estrutura de diretórios
    mkdir -p src/components/ui
    mkdir -p src/lib
    
    # Criar components.json com configuração padrão
    cat > components.json << 'EOF'
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.js",
    "css": "src/index.css",
    "baseColor": "slate",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  }
}
EOF

    # Criar arquivo utils.ts necessário para shadcn
    cat > src/lib/utils.ts << 'EOF'
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
EOF

    # Instalar dependências necessárias do shadcn
    echo "📦 Instalando dependências do shadcn/ui..."
    pnpm add clsx tailwind-merge
    pnpm add -D @types/node
    
    # Configurar path alias no tsconfig.app.json usando Node.js
    if [ -f tsconfig.app.json ]; then
      if ! grep -q '"@/\*"' tsconfig.app.json; then
        # Usar Node.js para modificar o JSON de forma segura
        node -e "
          const fs = require('fs');
          const config = JSON.parse(fs.readFileSync('tsconfig.app.json', 'utf8'));
          if (!config.compilerOptions) config.compilerOptions = {};
          config.compilerOptions.baseUrl = '.';
          config.compilerOptions.paths = { '@/*': ['./src/*'] };
          fs.writeFileSync('tsconfig.app.json', JSON.stringify(config, null, 2) + '\n');
        "
        echo "✅ Path alias '@/*' configurado no tsconfig.app.json"
      else
        echo "ℹ️  Path alias já configurado no tsconfig.app.json"
      fi
    fi
    
    # Configurar path alias no vite.config.ts usando Node.js
    if [ -f vite.config.ts ]; then
      if ! grep -q "@/" vite.config.ts; then
        # Usar Node.js para modificar o arquivo TypeScript de forma mais segura
        node -e "
          const fs = require('fs');
          let content = fs.readFileSync('vite.config.ts', 'utf8');
          
          // Adicionar import path se não existir
          if (!content.includes('import path')) {
            content = \"import path from 'path'\\n\" + content;
          }
          
          // Adicionar resolve se não existir
          if (!content.includes('resolve:')) {
            content = content.replace(
              /plugins: \[react\(\)\],/,
              \"plugins: [react()],\\n  resolve: {\\n    alias: {\\n      '@': path.resolve(__dirname, './src'),\\n    },\\n  },\"
            );
          }
          
          fs.writeFileSync('vite.config.ts', content);
        "
        echo "✅ Path alias '@' configurado no vite.config.ts"
      else
        echo "ℹ️  Path alias já configurado no vite.config.ts"
      fi
    fi
    
    echo ""
    echo "✅ shadcn/ui configurado com sucesso!"
    echo ""
    echo "📝 Próximos passos:"
    echo "   1. Configure o path alias '@/*' no tsconfig.json e vite.config.ts (se necessário)"
    echo "   2. Adicione componentes: pnpm dlx shadcn@latest add button"
    echo "   3. Ou use: make add-component COMPONENT=button"
    ;;
  add-component)
    if [ ! -f components.json ]; then
      echo "❌ shadcn/ui não configurado. Execute 'make setup-shadcn' primeiro."
      exit 1
    fi
    if [ -z "$2" ]; then
      echo "❌ Especifique o nome do componente."
      echo "   Uso: make add-component COMPONENT=button"
      exit 1
    fi
    echo "➕ Adicionando componente: $2"
    pnpm dlx shadcn@latest add "$2" --yes
    ;;
  *)
    # Se não for um comando especial, executar diretamente
    exec "$@"
    ;;
esac

