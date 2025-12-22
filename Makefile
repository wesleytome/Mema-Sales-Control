.PHONY: help build up down restart logs shell status clean init init-full setup-tailwind setup-shadcn add-component

help: ## Mostra esta mensagem de ajuda
	@echo "Comandos disponíveis:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'

build: ## Constrói a imagem Docker
	docker-compose build

up: ## Inicia os containers (sem iniciar o dev server)
	docker-compose up -d

dev: ## Inicia o servidor de desenvolvimento
	@if [ ! -f package.json ]; then \
		echo "⚠️  Projeto não encontrado. Execute 'make init' primeiro."; \
		exit 1; \
	fi
	docker-compose exec mema-sales-control /usr/local/bin/docker-entrypoint.sh dev

down: ## Para e remove os containers
	docker-compose down

restart: ## Reinicia os containers
	docker-compose restart

logs: ## Mostra os logs do container
	docker-compose logs -f mema-sales-control

shell: ## Abre um shell interativo no container (sh)
	docker-compose exec mema-sales-control sh

bash: ## Abre bash no container (útil para anexar ao Cursor)
	docker-compose exec mema-sales-control bash

status: ## Mostra o status dos containers
	docker-compose ps

clean: ## Remove containers, volumes e imagens
	docker-compose down -v --rmi local

deploy: ## Deploy completo (down + up)
	docker-compose down -v && docker-compose up -d --build

init: ## Cria o projeto Vite interativamente (dentro do container)
	@echo "🚀 Iniciando criação interativa do projeto..."
	@echo ""
	@echo "Você será guiado pelo processo de criação do Vite."
	@echo "Escolha:"
	@echo "  - Nome do projeto (ou use '.' para o diretório atual)"
	@echo "  - Framework: React"
	@echo "  - Variante: JavaScript ou TypeScript"
	@echo ""
	docker-compose run --rm mema-sales-control init

init-full: ## Cria projeto React + Vite + TypeScript + Tailwind automaticamente (tudo configurado)
	@echo "🚀 Criando projeto completo automaticamente..."
	@echo "   React + Vite + TypeScript + Tailwind + Aliases configurados"
	@echo ""
	docker-compose run --rm mema-sales-control init-full

setup-tailwind: ## Configura Tailwind CSS no projeto existente
	docker-compose exec mema-sales-control /usr/local/bin/docker-entrypoint.sh setup-tailwind

setup-shadcn: ## Configura shadcn/ui no projeto (requer Tailwind configurado)
	docker-compose exec mema-sales-control /usr/local/bin/docker-entrypoint.sh setup-shadcn

add-component: ## Adiciona um componente do shadcn/ui (uso: make add-component COMPONENT=button)
	@if [ -z "$(COMPONENT)" ]; then \
		echo "❌ Especifique o componente: make add-component COMPONENT=button"; \
		exit 1; \
	fi
	docker-compose exec mema-sales-control /usr/local/bin/docker-entrypoint.sh add-component $(COMPONENT)