# Smart Leads Dashboard

A full-stack **Lead Management Dashboard** built using the **MERN stack** (MongoDB, Express.js, React.js, Node.js) with TypeScript, clean architecture, and a professional user experience.

[![TypeScript](https://img.shields.io/badge/TypeScript-Mandatory-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=node.js)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?style=flat-square&logo=mongodb)](https://mongoosejs.com/)

---

## ✅ Features

| Feature | Status |
|---------|--------|
| JWT Authentication (Register + Login) | ✅ |
| Password Hashing with bcrypt | ✅ |
| Protected Routes with Auth Middleware | ✅ |
| Role-Based Access Control (Admin / Sales) | ✅ |
| Full Leads CRUD | ✅ |
| Advanced Filtering (Status + Source + Search) | ✅ |
| Backend Pagination (skip/limit + metadata) | ✅ |
| Debounced Search | ✅ |
| CSV Export (filtered) | ✅ |
| Dark Mode | ✅ |
| Docker Setup | ✅ |
| Centralized Error Handling | ✅ |
| Request Validation (express-validator) | ✅ |
| Loading + Empty States in UI | ✅ |
| Responsive Design (TailwindCSS) | ✅ |

---

## 🗂️ Project Structure

```
service-hive/
├── backend/
│   ├── src/
│   │   ├── config/         # DB connection
│   │   ├── controllers/    # Route handlers (authController, leadController)
│   │   ├── middleware/     # auth, validate, errorHandler
│   │   ├── models/         # Mongoose models (User, Lead)
│   │   ├── routes/         # Express routers (authRoutes, leadRoutes)
│   │   ├── types/          # Shared TypeScript interfaces
│   │   └── app.ts          # Express app entry
│   ├── .env.example
│   ├── Dockerfile
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── api/            # Axios instance + interceptors
│   │   ├── components/     # Reusable UI (Button, Input, Layout)
│   │   ├── context/        # AuthContext (global auth state)
│   │   ├── hooks/          # useDebounce
│   │   ├── pages/          # LoginPage, RegisterPage, LeadsPage, LeadModal
│   │   ├── types/          # Shared TypeScript interfaces
│   │   ├── App.tsx         # Routes + auth guards
│   │   └── main.tsx
│   ├── Dockerfile
│   └── vite.config.ts
│
├── docker-compose.yml
└── README.md
```

---

## 🔐 Role-Based Access Control

| Action | Admin | Sales |
|--------|-------|-------|
| Register / Login | ✅ | ✅ |
| View Leads | ✅ | ✅ |
| Create Lead | ✅ | ✅ |
| Edit Lead | ✅ | Own leads only |
| Delete Lead | ✅ | ❌ |
| Export CSV | ✅ | ✅ |

---

## 🚀 Setup Instructions

### Prerequisites
- **Node.js** v18+
- **npm** v9+
- **MongoDB** (local or [Atlas](https://www.mongodb.com/atlas))
- **Docker** (optional)

---

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd service-hive
```

---

### 2. Backend Setup

```bash
cd backend
npm install
```

Copy and configure environment variables:

```bash
cp .env.example .env
```

Edit `.env` with your values (see `.env.example` for reference).

Start the backend dev server:

```bash
npm run dev
# Server runs at http://localhost:8000
```

---

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
# App runs at http://localhost:5173
```

> The Vite dev server proxies all `/api` requests to the backend automatically — no CORS issues.

---

### 4. Docker Setup (Full Stack)

Run the entire stack with a single command:

```bash
docker-compose up --build
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost |
| Backend API | http://localhost:8000 |
| MongoDB | localhost:27017 |

---

## 📡 API Documentation

**Base URL (Development):** `http://localhost:8000`

All API responses follow this structure:

```json
{
  "success": true | false,
  "message": "Human-readable message",
  "data": {},
  "meta": {},
  "errors": []
}
```

---

### 🔐 Auth Endpoints

#### POST `/api/auth/register`
Register a new user.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "admin"
}
```

**Responses:**
| Status | Description |
|--------|-------------|
| `201` | Account created. Returns `token` + `user` |
| `400` | Validation failed |
| `409` | Email already exists |

---

#### POST `/api/auth/login`
Login and receive a JWT token.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Responses:**
| Status | Description |
|--------|-------------|
| `200` | Login successful. Returns `token` + `user` |
| `400` | Validation failed |
| `401` | Invalid email or password |

---

#### GET `/api/auth/me`
Get the currently authenticated user's profile.

**Headers:** `Authorization: Bearer <token>`

**Responses:**
| Status | Description |
|--------|-------------|
| `200` | Returns user profile |
| `401` | Token missing, invalid, or expired |

---

### 📋 Leads Endpoints

> All endpoints require: `Authorization: Bearer <token>`

#### GET `/api/leads`
Get paginated leads with filters.

**Query Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `page` | number | Page number (default: 1) |
| `limit` | number | Results per page (default: 10, max: 100) |
| `search` | string | Search by name or email |
| `status` | string | Filter: `New`, `Contacted`, `Qualified`, `Lost` |
| `source` | string | Filter: `Website`, `Instagram`, `Referral` |
| `sort` | string | `latest` (default) or `oldest` |

**Example:** `/api/leads?status=Qualified&source=Instagram&search=Rahul&page=1`

**Response:**
```json
{
  "success": true,
  "message": "Leads fetched successfully",
  "data": [...],
  "meta": {
    "currentPage": 1,
    "totalPages": 5,
    "totalCount": 47,
    "limit": 10,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

---

#### GET `/api/leads/:id`
Get a single lead by ID.

| Status | Description |
|--------|-------------|
| `200` | Returns lead object |
| `404` | Lead not found |

---

#### POST `/api/leads`
Create a new lead.

**Request Body:**
```json
{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "status": "New",
  "source": "Website"
}
```

| Status | Description |
|--------|-------------|
| `201` | Lead created |
| `400` | Validation failed |

---

#### PUT `/api/leads/:id`
Update a lead. Sales users can only update leads they created.

**Request Body (all fields optional):**
```json
{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "status": "Qualified",
  "source": "Referral"
}
```

| Status | Description |
|--------|-------------|
| `200` | Lead updated |
| `403` | Sales user trying to edit someone else's lead |
| `404` | Lead not found |

---

#### DELETE `/api/leads/:id`
Delete a lead. **Admin only.**

| Status | Description |
|--------|-------------|
| `200` | Lead deleted |
| `403` | Not an admin |
| `404` | Lead not found |

---

#### GET `/api/leads/export/csv`
Export filtered leads as a CSV file. Accepts same query params as `GET /api/leads` (except `page`/`limit`).

| Status | Description |
|--------|-------------|
| `200` | Returns CSV file download |

---

### ⚡ Health Check

#### GET `/api/health`
Check if the server is running.

```json
{
  "success": true,
  "message": "Smart Leads API is running 🚀"
}
```

---

## 🏗️ Architecture Highlights

- **TypeScript throughout** — strict interfaces on both frontend and backend with zero `any` usage
- **Traditional 8-step JWT validation** — explicit token extraction, signature verification, expiry check, and payload validation in middleware
- **Centralized error handling** — single error handler catches Mongoose errors (CastError, ValidationError, duplicate key 11000), JWT errors, and generic errors
- **Debounced search** — custom `useDebounce` hook (500ms) prevents excessive API calls while typing
- **RBAC** — `authorizeRoles()` middleware guards delete endpoint for admin-only access
- **React Context** — `AuthContext` provides global auth state with token persistence in `localStorage`
- **Axios interceptors** — auto-attach Bearer token to every request, auto-redirect on 401

---

## 🌐 Environment Variables

See `backend/.env.example` for all required variables.

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Backend server port | `8000` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/smart-leads` |
| `JWT_SECRET` | Secret key for signing JWTs | `your-secret-key` |
| `JWT_EXPIRES_IN` | Token expiry duration | `7d` |
| `NODE_ENV` | Environment | `development` |
| `FRONTEND_URL` | Frontend URL for CORS | `http://localhost:5173` |