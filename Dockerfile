FROM node:20-alpine

WORKDIR /app

# Instalar pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Instalar dependências globais úteis para desenvolvimento
# bash é necessário para anexar container ao Cursor
RUN apk add --no-cache git bash

# Copiar script de entrada primeiro
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Copiar arquivos do projeto (se existirem)
# Usar .dockerignore para evitar copiar node_modules, etc
COPY . .

EXPOSE 5175

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["dev"]