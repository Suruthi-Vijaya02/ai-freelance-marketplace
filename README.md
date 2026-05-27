# FreelannceAI — AI Powered Global Freelance Marketplace

A full-stack MERN marketplace with AI skill matching, real-time bidding (Socket.IO), escrow payments, and an admin dashboard.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, Vite, Tailwind CSS v4, React Router, Framer Motion, Recharts |
| Backend | Node.js, Express 5, MongoDB, Mongoose, JWT |
| Real-time | Socket.IO |
| Payments | Stripe / Razorpay (test mode) |
| DevOps | Docker Compose (MongoDB, Redis, API, Client) |

## Project Structure

```
├── client/          React frontend (Vite)
├── server/          Express API
├── shared/          Shared constants
└── docker-compose.yml
```

## Quick Start (Local)

### Prerequisites

- Node.js 20+
- MongoDB running locally (or use Docker)

### 1. Install dependencies

```bash
npm install
cd client && npm install
cd ../server && npm install
cd ..
```

### 2. Environment

Copy and adjust environment files:

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

### 3. Seed database

```bash
npm run seed
```

Demo accounts:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@suruthiviayar.com | admin123 |
| Client | client@demo.com | demo1234 |
| Freelancer | freelancer@demo.com | demo1234 |

### 4. Run development servers

```bash
npm run dev
```

- Frontend: http://localhost:5173
- API: http://localhost:5000/api/health

## Docker (One Command)

```bash
docker-compose up --build
```

Then seed inside the server container:

```bash
docker exec svr-server node utils/seed.js
```

## Pages

1. **Landing** — Hero, stats, AI search, freelancer carousel
2. **Auth** — Login / Signup with role selection
3. **Freelancer Dashboard** — AI match feed, earnings, active projects
4. **Client Dashboard** — Post project, AI descriptions, bid tracker
5. **Project Detail** — Proposals + AI proposal generator
6. **Live Bidding** — Real-time bids with countdown
7. **Messaging** — Chat + collaborative editor placeholder
8. **Profile** — Portfolio, reviews, availability calendar
9. **Payments** — Milestone escrow tracker
10. **Admin** — Stats, fraud alerts, user management

## API Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | JWT signup |
| POST | `/api/auth/login` | JWT login |
| GET | `/api/users/profile` | Get profile |
| PUT | `/api/users/profile` | Update + AI resume parsing |
| GET/POST | `/api/projects` | List / create projects |
| GET | `/api/projects/:id` | Project detail + AI matches |
| POST | `/api/proposals` | Submit proposal |
| GET | `/api/proposals/project/:id` | Project bids |
| POST | `/api/contracts` | Blockchain contract |
| GET/POST | `/api/messages` | Messaging |
| POST | `/api/payments/escrow` | Create escrow |
| POST | `/api/payments/release/:id` | Release milestone |
| GET | `/api/admin/stats` | Admin dashboard |
| GET | `/api/admin/fraud-alerts` | Fraud alerts |

## Design System

| Token | Value |
|-------|-------|
| Background | `#0f172a` |
| Card | `#1e293b` |
| Primary | `#6366f1` |
| Secondary | `#06b6d4` |
| Text | `#f1f5f9` |
| Muted | `#94a3b8` |

## License

MIT
