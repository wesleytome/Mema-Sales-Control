.PHONY: help build up down restart logs shell bash status clean deploy \
	init init-full setup-tailwind setup-shadcn add-component \
	install lint typecheck build-app build-dev build-prod preview

# =========================
# CONFIGURAÇÕES
# =========================

COMPOSE ?= docker-compose
SERVICE ?= mema-sales-control
ENTRYPOINT ?= /usr/local/bin/docker-entrypoint.sh

define require_project
	@if [ ! -f package.json ]; then \
		echo "⚠️  Projeto não encontrado. Execute 'make init' primeiro."; \
		exit 1; \
	fi
endef

# =========================
# AJUDA
# =========================

help: ## Mostra esta mensagem de ajuda
	@echo "Comandos disponíveis:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
	awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'

# =========================
# DOCKER
# =========================

build: ## Constrói a imagem Docker
	$(COMPOSE) build

up: ## Inicia os containers (sem iniciar o dev server)
	$(COMPOSE) up -d

down: ## Para e remove os containers
	$(COMPOSE) down

restart: ## Reinicia os containers
	$(COMPOSE) restart

logs: ## Mostra os logs do container
	$(COMPOSE) logs -f $(SERVICE)

shell: ## Abre um shell interativo no container (sh)
	$(COMPOSE) exec $(SERVICE) sh

bash: ## Abre bash no container
	$(COMPOSE) exec $(SERVICE) bash

status: ## Mostra o status dos containers
	$(COMPOSE) ps

clean: ## Remove containers, volumes e imagens locais
	$(COMPOSE) down -v --rmi local

deploy: ## Down + build + up
	$(COMPOSE) down -v && $(COMPOSE) up -d --build

# =========================
# DEV
# =========================

dev: ## Inicia o servidor de desenvolvimento
	$(call require_project)
	$(COMPOSE) exec $(SERVICE) $(ENTRYPOINT) dev

install: ## Instala dependências dentro do container
	$(call require_project)
	$(COMPOSE) exec $(SERVICE) pnpm install

lint: ## Roda ESLint dentro do container
	$(call require_project)
	$(COMPOSE) exec $(SERVICE) pnpm run lint

typecheck: ## Roda TypeScript check
	$(call require_project)
	$(COMPOSE) exec $(SERVICE) pnpm exec tsc -b

build-app: ## Build padrão (pnpm run build)
	$(call require_project)
	$(COMPOSE) exec $(SERVICE) pnpm run build

build-dev: ## Build modo development
	$(call require_project)
	$(COMPOSE) exec $(SERVICE) pnpm run build:dev

build-prod: ## Build modo production
	$(call require_project)
	$(COMPOSE) exec $(SERVICE) pnpm run build:prod

preview: ## Preview do build via Vite
	$(call require_project)
	$(COMPOSE) exec $(SERVICE) pnpm run preview

# =========================
# SETUP
# =========================

init: ## Cria projeto Vite interativamente
	$(COMPOSE) run --rm $(SERVICE) init

init-full: ## Cria projeto React + Vite + TypeScript + Tailwind automaticamente
	$(COMPOSE) run --rm $(SERVICE) init-full

setup-tailwind: ## Configura Tailwind CSS
	$(call require_project)
	$(COMPOSE) exec $(SERVICE) $(ENTRYPOINT) setup-tailwind

setup-shadcn: ## Configura shadcn/ui
	$(call require_project)
	$(COMPOSE) exec $(SERVICE) $(ENTRYPOINT) setup-shadcn

add-component: ## Adiciona componente do shadcn/ui (uso: make add-component COMPONENT=button)
	@if [ -z "$(COMPONENT)" ]; then \
		echo "❌ Especifique o componente: make add-component COMPONENT=button"; \
		exit 1; \
	fi
	$(call require_project)
	$(COMPOSE) exec $(SERVICE) $(ENTRYPOINT) add-component $(COMPONENT)
