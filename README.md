# Pubs Publishing System

Fullstack Song Publishing System built with Node.js, Express, MySQL, and React (Vite).

## Features
- **Clean Architecture** Backend
- **Role-based Access Control** (Admin & User)
- **Song Management** with Status Workflow
- **Excel Report Processing** for Revenue
- **Analytics Dashboard**
- **Modern UI** with Tailwind CSS (Orchid Theme)

## Project Structure
```
/backend          # Node.js Express API
  /src
    /config       # Database connection
    /controllers  # Request handlers
    /services     # Business logic
    /models       # Database queries
    /routes       # API routes
    /middleware   # Auth & Uploads
    /utils        # Helpers (Migration)
/frontend         # React Vite TypeScript App
```

## Setup & Installation

### Backend
1. Navigate to `backend` folder.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure `.env`:
   ```
   cp .env.example .env
   ```
   Edit `.env` with your database credentials.
4. Run Migrations & Seed Admin:
   ```bash
   npm run migrate
   ```
   *Default Admin:* `admin@mail.com` / `admin123`
5. Start Server:
   ```bash
   npm start
   ```

### Frontend
1. Navigate to `frontend` folder.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start Development Server:
   ```bash
   npm run dev
   ```

## API Documentation
- **Auth**: `POST /api/auth/login`, `POST /api/auth/register`
- **Songs**: `GET /api/songs`, `POST /api/songs` (Admin/User), `PUT /api/songs/:id` (Admin)
- **Reports**: `POST /api/reports/upload` (Admin, Excel file), `GET /api/reports`
- **Dashboard**: `GET /api/dashboard/stats`

## Deployment Guide

### 1. Database (Plesk / VPS)
1. Create a MySQL database in Plesk/phpMyAdmin.
2. Import `backend/schema.sql` manually or run `npm run migrate` if you have SSH access and configured `.env`.

### 2. Backend Deployment (Plesk VPS)
1. Upload the `backend` folder to your server (e.g., via Git or FTP).
2. Install Node.js on Plesk if not installed (Extensions > Node.js).
3. Set **Document Root** to `backend/src`.
4. Set **Application Startup File** to `src/app.js`.
5. Run `npm install` via the "Run Node.js commands" button or SSH.
6. Create `.env` file in the `backend` root with production DB credentials.
7. Restart the Node.js app.
8. Ensure the app is accessible (e.g., `https://api.yourdomain.com`).

### 3. Frontend Deployment (Vercel)
1. Push your code to GitHub/GitLab.
2. Go to Vercel Dashboard -> Add New Project.
3. Import the repository.
4. Select `frontend` as the **Root Directory**.
5. Framework Preset: **Vite**.
6. Build Command: `npm run build`.
7. Output Directory: `dist`.
8. **Environment Variables**:
   Add `VITE_API_URL` set to your backend URL (e.g., `https://api.yourdomain.com`).
   *Note: You need to update `frontend/src/services/api.ts` to use `import.meta.env.VITE_API_URL || 'http://localhost:5000/api'`.*
9. Deploy.

## Development Notes
- **Admin Validation**: When changing song status to `accepted`, `song_id` is mandatory.
- **Uploads**: Reports, Contracts, and Logos are stored in `backend/uploads`. Ensure this folder has write permissions on the server.
