# Picollo — Setup Guide

## Arsitektur Project

```
Picollo/
├── backend/          # Laravel 13 (PHP 8.3+)
│   ├── .env          # Config lokal (MySQL)
│   ├── .env.example  # Template config
│   └── env.txt       # Config hosting Vercel (Supabase)
│
└── frontend/         # React + Vite
    ├── .env              # Config lokal (API localhost)
    ├── .env.example      # Template config
    └── .env.production   # Config otomatis saat build
```

## Environment Overview

| | Local (Laragon) | Hosting (Vercel) |
|---|---|---|
| **Database** | MySQL (phpMyAdmin) | Supabase (PostgreSQL) |
| **Backend URL** | `http://localhost:8000` | `https://backend-picollo-pos.vercel.app` |
| **Frontend URL** | `http://localhost:5173` | `https://picollopos.vercel.app` |
| **Config File** | `.env` | `env.txt` + Vercel Env Vars |

---

## 🖥️ Local Development

### Prasyarat
- PHP 8.3+
- Composer
- Node.js 18+
- Laragon (dengan MySQL & phpMyAdmin)

### 1. Backend Setup

```bash
cd backend

# Copy template environment
copy .env.example .env

# Sesuaikan credential database di .env
# DB_CONNECTION=mysql
# DB_HOST=127.0.0.1
# DB_DATABASE=picollo
# DB_USERNAME=root
# DB_PASSWORD=admin123

# Install dependencies
composer install

# Generate app key (jika belum ada)
php artisan key:generate

# Jalankan migrasi
php artisan migrate

# Jalankan seeder (opsional)
php artisan db:seed

# Jalankan server
php artisan serve
```

### 2. Frontend Setup

```bash
cd frontend

# Copy template environment (opsional, default sudah benar)
copy .env.example .env

# Pastikan .env berisi:
# VITE_API_URL=http://127.0.0.1:8000/api

# Install dependencies
npm install

# Jalankan dev server
npm run dev
```

### 3. Akses Aplikasi
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000/api
- **phpMyAdmin**: http://localhost/phpmyadmin

---

## ☁️ Hosting (Vercel)

### Backend Deployment

1. **Push kode ke GitHub**

2. **Buat project Vercel** — sambungkan ke repo, pilih folder `backend` sebagai root

3. **Environment sudah dikonfigurasi di `env.txt`** — file ini dibaca oleh `index.php` saat di Vercel

4. **Konfigurasi penting di `env.txt`:**
   ```
   APP_ENV=production
   APP_DEBUG=false
   DB_CONNECTION=pgsql
   DB_HOST=aws-1-ap-southeast-1.pooler.supabase.com
   FRONTEND_URL=https://picollopos.vercel.app
   CORS_ALLOWED_ORIGINS=https://picollopos.vercel.app
   ```

### Frontend Deployment

1. **Buat project Vercel** — sambungkan ke repo, pilih folder `frontend` sebagai root

2. **Build otomatis membaca `.env.production`:**
   ```
   VITE_API_URL=https://backend-picollo-pos.vercel.app/api
   ```

3. **Tidak perlu set env vars di Vercel Dashboard** — `.env.production` sudah cukup

---

## 🔧 Konfigurasi CORS

CORS dikonfigurasi di `backend/config/cors.php` dan membaca dari environment variable `CORS_ALLOWED_ORIGINS`.

| Environment | Nilai |
|---|---|
| Local | `http://localhost:5173,http://127.0.0.1:5173` |
| Hosting | `https://picollopos.vercel.app` |

Untuk menambahkan domain baru, tambahkan ke `CORS_ALLOWED_ORIGINS` dipisahkan koma:
```
CORS_ALLOWED_ORIGINS=https://picollopos.vercel.app,https://mydomain.com
```

---

## 🔄 Switching Environment

### Dari Local → Hosting
Cukup `git push` — Vercel akan auto-deploy. Tidak perlu ubah kode apapun.

### Dari Hosting → Local
Cukup jalankan:
```bash
# Backend
cd backend && php artisan serve

# Frontend (terminal baru)
cd frontend && npm run dev
```

File `.env` lokal tidak perlu diubah.

---

## ⚠️ Catatan Penting

1. **Jangan commit credential** — file `.env` dan `env.txt` sudah di-gitignore
2. **Database berbeda** — pastikan migrasi jalan di kedua database (MySQL lokal & Supabase PostgreSQL)
3. **JWT Secret** — gunakan secret yang sama di local dan hosting agar token tetap valid
