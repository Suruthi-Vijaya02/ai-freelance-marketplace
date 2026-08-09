# AI Freelance Marketplace

A full-stack freelance marketplace for connecting clients and freelancers with role-based dashboards, project workflows, real-time messaging, AI-assisted profile and proposal generation, and payment/contract management.

## What’s included

- Authentication and role-based access for clients, freelancers, and admins
- Project creation, browsing, proposal submission, and contract management
- Messaging, live bidding, and interview workflow support
- AI-assisted bio/proposal generation and resume parsing with Gemini-first logic and graceful fallbacks
- Stripe and Razorpay integration for payments and milestone workflows
- Admin tools, fraud detection hooks, and Docker-based local setup

## Tech stack

- Frontend: React 19, Vite, Tailwind CSS, Framer Motion, Lucide React
- Backend: Node.js, Express 5, Mongoose 9, Socket.IO
- Database: MongoDB, Redis
- AI: Google Gemini via the server-side service layer
- Payments: Stripe and Razorpay
- Infrastructure: Docker Compose

## Project structure

```text
ai-freelance-marketplace/
├── client/           # React frontend
├── server/           # Express API and services
├── docker-compose.yml
├── .env.example
└── server/.env.example
```

## Getting started

### Prerequisites

- Node.js 18+
- MongoDB running locally or reachable via URI
- Redis running locally or reachable via URI
- Optional: Docker Desktop for containerized setup

### Option 1 — Local development

1. Install dependencies at the repo root:

```bash
npm install
```

2. Create the server environment file:

```bash
cp server/.env.example server/.env
```

3. Update the values in server/.env for your local MongoDB, Redis, JWT, and Gemini settings.

4. Start the app:

```bash
npm run dev
```

This runs the backend and frontend together. The default local URLs are:

- Frontend: http://localhost:5173
- Backend: http://localhost:5000

### Option 2 — Docker Compose

```bash
docker compose up --build
```

This starts MongoDB, Redis, the API server, and the Vite client.

## Useful scripts

- npm run dev — run frontend and backend together
- npm run dev:client — run only the frontend
- npm run dev:server — run only the backend
- npm run build — build the frontend for production
- npm run seed — seed demo data through the server utility

## Environment notes

The server expects configuration values such as:

- MONGODB_URI
- JWT_SECRET
- REDIS_URL
- GEMINI_API_KEY
- STRIPE_SECRET_KEY
- RAZORPAY_KEY_ID
- RAZORPAY_KEY_SECRET
- CLIENT_URL

See [server/.env.example](server/.env.example) for the expected template.

## Current status

The current implementation includes the core marketplace workflows and supporting AI/payment integrations. The app has been verified locally with a successful frontend build and a healthy backend health check response from /api/health.
