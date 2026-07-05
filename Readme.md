# 📝 Scalable Todo App

A full-stack Node.js + Express + PostgreSQL + Redis application with Dockerized local development setup.

It uses:

- 🐘 PostgreSQL for persistent storage
- ⚡ Redis for caching
- 🚀 Express API backend
- 🐳 Docker Compose for orchestration

## 📦 Tech Stack

- Node.js (Express)
- PostgreSQL 16
- Redis 7
- Docker & Docker Compose

## 🚀 Local Setup (Docker)

### 1. Clone the repository

```bash
git clone https://github.com/CodeBuster09/scalable-todo-app.git
cd scalable-todo-app
```

### 2. Create environment file

Create a `.env` file in the project root:

```bash
touch .env
```

Add the following:

```env
PORT=

# PostgreSQL
DB_HOST=
DB_PORT=
DB_USER=
DB_PASSWORD=
DB_NAME=

# Redis
REDIS_URL=
```

### 3. Start the application

```bash
docker compose up --build
```

This will start:

- 🐘 PostgreSQL on `localhost:5432`
- ⚡ Redis on `localhost:6379`
- 🚀 Node.js API on `http://localhost:3000`

### 4. Run in background

```bash
docker compose up -d
```

### 5. Stop containers

```bash
docker compose down
```

## 📡 API Endpoints

### Health check

```
GET /
```

Response:

```
Hello World!
```

### Get all todos (cached with Redis)

```
GET /todos
```

- First request → fetched from PostgreSQL
- Next requests → served from Redis cache

### Create a todo

```
POST /todos
```

Body:

```json
{
  "title": "Learn Docker",
  "description": "Build scalable apps using containers"
}
```

## 🐳 Docker Architecture

```
┌──────────────┐
│   Node App   │
│  Express API │
└──────┬───────┘
       │
       │
 ┌─────▼─────┐      ┌───────────┐
 │ PostgreSQL │      │   Redis   │
 │  Database  │      │  Cache    │
 └────────────┘      └───────────┘
```

## ⚠️ Important Notes

- Always use `DB_HOST=postgres` (NOT `localhost`) inside Docker
- Always use `REDIS_URL=redis://redis:6379`
- Use `docker compose` (not `docker-compose`)

## 🧠 Common Issues

**❌ Connection refused to Postgres**
✔ Fix: ensure `DB_HOST=postgres`

**❌ Redis ENOTFOUND**
✔ Fix: ensure Redis service is running in the same compose network

**❌ docker-compose not found**
✔ Fix: use `docker compose` instead

## 🛠️ Development Tips

Rebuild containers:

```bash
docker compose up --build
```

View logs:

```bash
docker compose logs -f
```

## 📌 Future Improvements

- [ ] JWT authentication
- [ ] User-based todos
- [ ] Rate limiting with Redis
- [ ] CI/CD pipeline (GitHub Actions → EC2)
- [ ] Production Nginx reverse proxy