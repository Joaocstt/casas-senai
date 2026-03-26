# Arcanum do Mérito - Full-Stack

Sistema de gerenciamento de pontuação para as casas do Arcanum do Mérito.

## Estrutura do Projeto

- `frontend/`: Aplicação React com Vite e TailwindCSS.
- `backend/`: API Node.js com Express, Prisma (PostgreSQL) e Socket.io.
- `docker-compose.yml`: Configuração para rodar todo o stack em silos (containers).

## Como Rodar

### Com Docker (Recomendado)

Certifique-se de ter o Docker e Docker Compose instalados.

1.  Na raiz do projeto, execute:
    ```bash
    docker-compose up --build
    ```
2.  Acesse o Placar: `http://localhost/placar/lobo`
3.  Acesse o Admin: `http://localhost/login`

### Desenvolvimento Local

#### Backend
1. `cd backend`
2. `npm install`
3. Configure o `.env` com sua URL do PostgreSQL.
4. `npx prisma migrate dev`
5. `npm run dev`

#### Frontend
1. `cd frontend`
2. `npm install`
3. `npm run dev`

## Credenciais Seed
- **Admin**: `admin@arcanum.com`
- **Senha**: `admin123`
