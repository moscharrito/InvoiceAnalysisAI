# ClaimScan Production Deployment Guide

## Overview
- **Frontend**: Deploy to Vercel
- **Backend**: Deploy to Railway (recommended) or Render
- **Database**: PostgreSQL (production) / SQLite (development)

---

## Step 1: Update Database for Production (PostgreSQL)

### 1.1 Update Prisma Schema

Edit `Backend/prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"  // Change from "sqlite"
  url      = env("DATABASE_URL")
}
```

### 1.2 Update .env for Production

```env
# Production Database (get from Railway/Render)
DATABASE_URL="postgresql://user:password@host:5432/claimscan?sslmode=require"

# Azure Form Recognizer
AZURE_ENDPOINT=https://your-resource.cognitiveservices.azure.com/
AZURE_KEY=your-api-key

# Server
PORT=5000
NODE_ENV=production
FRONTEND_URL=https://your-frontend.vercel.app
```

---

## Step 2: Deploy Backend to Railway

### 2.1 Prerequisites
- GitHub account with code pushed
- Railway account (https://railway.app)

### 2.2 Steps

1. **Push code to GitHub**
   ```bash
   git add .
   git commit -m "Prepare for production deployment"
   git push origin main
   ```

2. **Create Railway Project**
   - Go to https://railway.app
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your repository
   - Choose the `Backend` folder as root

3. **Add PostgreSQL Database**
   - In Railway dashboard, click "New" → "Database" → "PostgreSQL"
   - Railway auto-creates `DATABASE_URL` environment variable

4. **Set Environment Variables**
   In Railway project settings → Variables:
   ```
   AZURE_ENDPOINT=https://moshoodai.cognitiveservices.azure.com/
   AZURE_KEY=your-key-here
   NODE_ENV=production
   PORT=5000
   FRONTEND_URL=https://your-app.vercel.app
   ```

5. **Configure Build Settings**
   - Build Command: `npm install && npx prisma generate && npx prisma db push && npm run build`
   - Start Command: `npm start`

6. **Get Backend URL**
   - Railway provides a URL like: `https://claimscan-backend-production.up.railway.app`

---

## Step 3: Deploy Frontend to Vercel

### 3.1 Steps

1. **Go to Vercel**
   - https://vercel.com
   - Click "Import Project" → Select your GitHub repo

2. **Configure Project**
   - Root Directory: `Frontend`
   - Framework: Next.js (auto-detected)

3. **Set Environment Variables**
   ```
   NEXT_PUBLIC_API_URL=https://your-railway-backend.up.railway.app/api
   ```

4. **Deploy**
   - Click "Deploy"
   - Vercel builds and deploys automatically

---

## Step 4: Update CORS in Backend

Edit `Backend/src/index.ts` to include your production URLs:

```typescript
const allowedOrigins = [
  'http://localhost:3000',
  'https://your-app.vercel.app',
  'https://claimscan.vercel.app',
  process.env.FRONTEND_URL
].filter(Boolean);
```

---

## Step 5: Database Migrations

### For Development (SQLite)
```bash
cd Backend
npx prisma db push
```

### For Production (PostgreSQL)
```bash
cd Backend
npx prisma migrate deploy
```

### Create Migration File
```bash
npx prisma migrate dev --name init
```

---

## Quick Deploy Commands

### Local Development
```bash
# Terminal 1 - Backend
cd Backend
npm install
npx prisma generate
npx prisma db push
npm run dev

# Terminal 2 - Frontend
cd Frontend
npm install
npm run dev
```

### Production Build Test
```bash
# Backend
cd Backend
npm run build
npm start

# Frontend
cd Frontend
npm run build
npm start
```

---

## Environment Variables Summary

### Backend (.env)
| Variable | Development | Production |
|----------|-------------|------------|
| DATABASE_URL | file:./dev.db | postgresql://... |
| AZURE_ENDPOINT | Your Azure endpoint | Same |
| AZURE_KEY | Your Azure key | Same |
| PORT | 5000 | 5000 |
| NODE_ENV | development | production |
| FRONTEND_URL | http://localhost:3000 | https://your-app.vercel.app |

### Frontend (.env.local)
| Variable | Development | Production |
|----------|-------------|------------|
| NEXT_PUBLIC_API_URL | http://localhost:5000/api | https://your-backend.railway.app/api |

---

## Troubleshooting

### "Cannot connect to server"
- Ensure backend is running: `npm run dev` in Backend folder
- Check if port 5000 is available
- Verify CORS settings allow your frontend URL

### "Database error"
- Run `npx prisma generate` after any schema changes
- Run `npx prisma db push` to sync database
- Check DATABASE_URL is correct

### "Azure OCR not working"
- Verify AZURE_ENDPOINT and AZURE_KEY in .env
- Check Azure resource is active and has quota

---

## Alternative: Docker Deployment

Create `Backend/Dockerfile`:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npx prisma generate
RUN npm run build
EXPOSE 5000
CMD ["npm", "start"]
```

Build and run:
```bash
docker build -t claimscan-backend .
docker run -p 5000:5000 --env-file .env claimscan-backend
```
