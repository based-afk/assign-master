# FocusProject — Project Management System (Web + Mobile)

A high-performance, full-stack project and task management system featuring a shared backend API, a responsive web application, and an Android/iOS mobile application. Designed with an ultra-clean, minimal aesthetic inspired by Apple and Google applications.

---

## 🌟 Architecture & Key Features

```
               ┌────────────────────────────────────────────────────────┐
               │              Unified REST API Backend                  │
               │        (Node.js + Express + TypeScript + Prisma)       │
               └───────────┬────────────────────────────────┬───────────┘
                           │                                │
            HTTP / JWT     │                                │  HTTP / JWT
                           ▼                                ▼
       ┌───────────────────────────────┐        ┌───────────────────────────────┐
       │       Web Application         │        │       Mobile Application      │
       │    (React + Vite + TS)        │        │   (React Native + Expo SDK)   │
       │  • Apple/Google Minimal UI    │        │  • Android Keystore / Keychain│
       │  • Full Project & Task CRUD   │        │  • Pull-to-Refresh & Offline  │
       │  • Search, Filter, Sort       │        │  • Real-time Sync with Web    │
       │  • Interactive Dashboard      │        │  • Expired Session Handling   │
       └───────────────────────────────┘        └───────────────────────────────┘
```

### 1. User Authentication & Security
- **Unified Account:** Single user account authenticates seamlessly across both Web and Mobile.
- **Password Security:** Salted and hashed using `bcryptjs` (10 rounds). Plain text passwords are never stored.
- **JWT Protection:** Protected endpoints enforce Bearer tokens.
- **Secure Hardware Storage:** Mobile app utilizes `expo-secure-store` backed by **Android Keystore** and **iOS Keychain**.
- **Brute-Force Rate Limiting:** `express-rate-limit` guards login and registration routes.
- **SQL Injection Immune:** Prisma ORM parameterized queries protect all database operations.
- **Strict Data Isolation:** Multi-tenant ownership checks ensure users only view and mutate their own records.
- **Graceful Token Expiration:** If a JWT expires, users receive a clear prompt and clean redirect to login.

### 2. Project Management
- Full CRUD: Create, View details, Edit, and Delete projects.
- Attributes: Name, Description, Status (*Not Started, In Progress, Completed*), Start Date, End Date, Created Date.
- Real-time task completion progress bar & statistics per project.
- Search projects by name & filter by status.

### 3. Task Management
- Full CRUD: Create tasks, assign to projects, edit details, and delete.
- Status: *Pending, In Progress, Completed* with **1-click instant completion toggle**.
- Priority: *Low, Medium, High* with sleek pill badges.
- Due dates, descriptions, created dates.
- Multi-filtering by Parent Project, Status, Priority, and Search keyword.

### 4. Interactive Dashboard
- Total Projects, Total Tasks, Completed Tasks, Pending Tasks, Projects In Progress.
- Task completion progress bar and priority distribution breakdown.
- Recent active projects and tasks with live actions.
- Audit & Activity stream (Bonus feature).

### 5. Mobile Experience
- **Cross-Platform:** Runs on Android and iOS (as well as web preview).
- **Pull-to-Refresh:** Swipe down on any screen to re-sync with the backend.
- **Offline / Network Alert:** Clear status banner when backend connection is interrupted.
- **Apple/Google Minimal UI:** Clean San Francisco / Inter typography, subtle borders, high contrast, smooth gestures.

---

## 🚀 Quick Start Instructions

### Prerequisites
- Node.js (v18+)
- npm (v9+)
- (Optional) Docker and Docker Compose

### Demo Account Credentials
For instant evaluation, the database comes pre-seeded with:
- **Email:** `demo@example.com`
- **Password:** `Password123!`

---

## 📦 Setup Step-by-Step

### 1. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Push database schema (default SQLite zero-config)
npm run prisma:push

# Seed database with sample projects and tasks
npm run seed

# Run automated test suite (Jest + Supertest)
npm test

# Start backend dev server (Runs on http://localhost:5000)
npm run dev
```

#### Environment Variables (`backend/.env`)
```env
PORT=5000
NODE_ENV=development
DATABASE_URL="file:./dev.db"
JWT_SECRET="super-secret-jwt-key-for-project-mgmt-app-2026"
JWT_EXPIRES_IN="7d"
CORS_ORIGIN="*"
```

> **Using PostgreSQL instead of SQLite?**
> Simply update `DATABASE_URL` in `backend/.env` to:
> `DATABASE_URL="postgresql://postgres:postgrespassword@localhost:5432/focusproject_db?schema=public"`
> and set `provider = "postgresql"` in `backend/prisma/schema.prisma`.

---

### 2. Web Frontend Setup

```bash
cd web

# Install dependencies
npm install

# Start Vite dev server
npm run dev
# The web app is now live at http://localhost:5173
```

---

### 3. Mobile App Setup (Expo / React Native)

```bash
cd mobile

# Install dependencies
npm install

# Start Expo development server
npm start
```

#### Connecting the Mobile App to the Backend:
- **Deployed Backend (Production):** The mobile app is pre-configured to connect directly to the live Render backend: `https://assign-master.onrender.com/api`.
- **Android Emulator (Local):** Connects to `http://10.0.2.2:5000/api`.
- **Physical Device / Expo Go (Local):** Ensure your phone is on the same Wi-Fi network and set base URL in `mobile/src/services/api.ts` to your machine's LAN IP (e.g. `http://192.168.1.50:5000/api`).
- **Web Preview / iOS Simulator:** Connects to `http://localhost:5000/api`.

---

## 🌐 Live Deployments & Submission Deliverables

- **Live Backend API:** `https://assign-master.onrender.com/api`
- **Live Web Application:** Deployed on Cloudflare Pages (see Pages dashboard URL)
- **Mobile EAS Build Link / APK:** `https://expo.dev/accounts/subhasis_1187/projects/focusproject-mobile/builds/248c9528-7121-4778-a855-3111c8998eab`
- **Database Schema & ER Diagram:** [docs/SCHEMA.md](docs/SCHEMA.md)
- **REST API Documentation:** [docs/API.md](docs/API.md)

---

## 🐳 Docker Support (One-Command Launch)

To start PostgreSQL, the Backend API, and the Web application all together in containers:

```bash
docker compose up --build
```
- **Web App:** `http://localhost:3000`
- **Backend API:** `http://localhost:5000/api`
- **PostgreSQL Database:** `localhost:5432`

---

## 🧪 Testing

The backend includes full integration and unit test coverage verifying authentication, ownership security isolation, project CRUD, task filters, and dashboard calculations.

```bash
cd backend
npm test
```

Test Results Summary:
- Authentication & password hashing tests: **Passed**
- Multi-tenant ownership isolation: **Passed**
- Project & task CRUD with filtering: **Passed**
- Dashboard metrics accuracy: **Passed**

---

## 📂 Project Structure

```
.
├── backend/
│   ├── prisma/
│   │   └── schema.prisma        # Database schema models
│   ├── src/
│   │   ├── config/              # Environment config
│   │   ├── controllers/         # Auth, Project, Task, Dashboard logic
│   │   ├── middlewares/         # JWT Auth, Zod Validation, Rate Limiters
│   │   ├── routes/              # REST endpoint definitions
│   │   ├── validators/          # Zod schema definitions
│   │   ├── seed.ts              # Realistic database seeder
│   │   ├── server.ts            # Server entrypoint
│   │   └── app.ts               # Express app factory
│   ├── tests/                   # Jest + Supertest integration tests
│   └── Dockerfile
├── web/
│   ├── src/
│   │   ├── api/                 # API client & auth interceptor
│   │   ├── components/          # StatCards, Modals, Navbar, Banners
│   │   ├── context/             # AuthContext state provider
│   │   ├── views/               # Dashboard, Projects, Tasks, Auth screens
│   │   ├── index.css            # Apple/Google minimal design system tokens
│   │   └── App.tsx
│   └── Dockerfile
├── mobile/
│   ├── src/
│   │   ├── components/          # StatusBadge, PriorityBadge, Modals, Banner
│   │   ├── context/             # AuthContext with SecureStore
│   │   ├── screens/             # Auth, Dashboard, Projects, Tasks
│   │   ├── services/            # SecureStore storage & Mobile API client
│   │   └── types/
│   └── App.tsx                  # Root navigation & tabs
├── docs/
│   ├── API.md                   # Complete REST API documentation
│   └── SCHEMA.md                # Relational Schema & Mermaid ER Diagram
├── docker-compose.yml           # Full-stack container orchestration
└── package.json                 # Monorepo scripts
```

---

## 📋 API & Database Reference
- [REST API Documentation](docs/API.md)
- [Database Schema & ER Diagram](docs/SCHEMA.md)
