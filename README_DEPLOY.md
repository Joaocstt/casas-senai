# Guia de Deploy VPS - Arcanum

Este guia descreve como rodar a aplicação Arcanum em um servidor VPS usando apenas o endereço IP (sem necessidade de domínio).

## Pré-requisitos
1. **Docker** e **Docker Compose** instalados na VPS.
2. Portas **80** (HTTP) e **5432** (Postgres) abertas no firewall da VPS.

## Estrutura de Arquivos
Certifique-se de que os seguintes arquivos estão no servidor:
- `docker-compose.yml` (na raiz)
- Pasta `backend/` (com seu Dockerfile)
- Pasta `frontend/` (com seu Dockerfile e nginx.conf)

## Como Rodar

### 1. Iniciar os Containers
Na raiz do projeto, execute:
```bash
docker compose up -d --build
```

### 2. Verificar o Status
Aguarde alguns instantes para o banco de dados iniciar e o backend rodar as migrações. Verifique os logs:
```bash
docker compose logs -f backend
```

### 3. (Opcional) Popular o Banco de Dados (Seeds)
Se as Casas (Leão, Lobo, etc) não aparecerem, você pode rodar o script de seed:
```bash
docker exec -it arcanum-backend npx prisma db seed
```

## Acessando a Aplicação
Abra o navegador e digite o **IP da sua VPS**:
`http://seu-ip-da-vps`

O frontend será carregado e fará chamadas automáticas para o backend através do proxy configurado no Nginx.

## Notas de Configuração
- **Frontend**: O `useCasas` e `useSocket` foram ajustados para usar caminhos relativos. Isso permite que a aplicação funcione em qualquer IP sem reconfigurar o código.
- **Backend**: As migrações do Prisma (`prisma migrate deploy`) rodam automaticamente no startup do container do backend.
- **Banco de Dados**: Os dados são persistidos no volume `postgres_data`.
