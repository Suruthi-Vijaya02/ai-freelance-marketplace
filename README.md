# 🤝 FreelanceAI — AI-Powered Freelance Marketplace

<div align="center">

[![React](https://img.shields.io/badge/React_19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![Node.js](https://img.shields.io/badge/Node.js_20+-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://mongodb.com)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_v4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Socket.io](https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socketdotio&logoColor=white)](https://socket.io)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://docker.com)

</div>

---

## 📌 Overview

FreelanceAI is a **full-stack intelligent freelance marketplace** that automates the end-to-end hiring lifecycle — from AI-driven talent discovery and resume parsing to real-time collaboration, WebRTC video interviews, milestone-based escrow payments, and tamper-evident contract verification.

The platform serves **three distinct user roles** with role-based access control (RBAC):

| Role | Core Capabilities |
|---|---|
| 🧑‍💻 **Freelancer** | AI-matched project discovery, proposal generation, resume upload & parsing, real-time chat, video interviews, milestone delivery, escrow payments |
| 🏢 **Client** | Project posting, AI-candidate matching, proposal review, interview scheduling, contract signing with escrow, milestone approval & payment release |
| 🛠️ **Admin** | Full platform analytics, user management, fraud detection monitoring, transaction oversight |

---

## ✨ How It Works

1. **Client posts a project** with requirements, skills, and budget
2. **AI Matching Engine** scores and ranks freelancers by skill overlap, availability, and past performance
3. **Freelancer browses** AI-recommended projects and submits a **template-based AI proposal**
4. **Client reviews proposals**, schedules a **WebRTC video interview**, and negotiates terms
5. **Contract is signed** with SHA-256 fingerprinting for tamper-evidence; escrow funded via **Stripe**
6. **Freelancer delivers** milestones; client approves → funds auto-released from escrow
7. **Admin monitors** platform health via fraud-detection middleware and analytics dashboard

---

## 🚀 Feature Matrix

| Feature | Description | Status |
|---|---|---|
| **JWT Authentication & RBAC** | Secure login/register with 3 roles; protected routes via middleware | ✅ Complete |
| **Freelancer & Client Profiles** | Editable profiles with portfolio, skills, ratings, and verification | ✅ Complete |
| **Job Posting (CRUD)** | Full project lifecycle: create, read, update, delete with skill tags | ✅ Complete |
| **Proposal & Bidding System** | Freelancers submit proposals; clients review, shortlist, accept | ✅ Complete |
| **AI Skill Matching Engine** | Keyword-overlap scoring algorithm matching freelancers to projects | ✅ Complete |
| **AI Proposal Generator** | Template-based generation personalized from freelancer profile data | ✅ Complete |
| **Resume Parser** | PDF upload → keyword extraction → auto-populate skills & experience | ✅ Complete |
| **Real-Time Chat** | Socket.IO bidirectional messaging with typing indicators & read receipts | ✅ Complete |
| **Live Video Interview** | WebRTC peer-to-peer video room with signaling via Socket.IO | ✅ Complete |
| **Escrow Payments (Stripe)** | Milestone-based escrow; manual capture per milestone approval | 🔶 Partial — capture route in progress |
| **Blockchain Contract Hash** | SHA-256 contract fingerprinting for tamper-evidence | 🔶 Partial — on-chain ledger write pending |
| **Admin Dashboard** | Analytics, user management, fraud alerts, transaction monitoring | ✅ Complete |
| **Fraud Detection Middleware** | Pattern analysis on users, projects, and transactions | ✅ Complete |
| **Docker Orchestration** | Multi-service compose: client, server, MongoDB, Redis | ✅ Complete |
| **Collaborative Editor** | Yjs + Monaco + Socket.IO real-time document editing | 🔲 Planned |
| **Multi-Currency Display** | Dynamic currency conversion and display | 🔲 Planned |

---

## 🏗️ Architecture & Project Structure

```
ai-freelance-marketplace/
│
├── client/                    # React 19 Frontend (Vite)
│   └── src/
│       ├── components/
│       │   ├── ui/            # Buttons, Cards, Modals, Inputs, Forms
│       │   ├── layout/        # Navbar, Sidebar, DashboardLayout
│       │   ├── bidding/       # Proposal cards, bid submission UI
│       │   └── interview/     # WebRTC video room, call controls
│       ├── context/
│       │   └── AuthContext.js # JWT auth state, role guards, logout
│       ├── pages/
│       │   ├── freelancer/  # Dashboard, Projects, Proposals, Profile
│       │   ├── client/      # Dashboard, Post Project, Candidates, Contracts
│       │   └── admin/       # Analytics, Users, Fraud Alerts, Transactions
│       ├── services/          # Axios API abstraction layer
│       └── utils/             # Formatters, validators, Framer Motion variants
│
├── server/                    # Node.js + Express 5 Backend
│   ├── config/
│   │   └── db.js              # MongoDB + Redis connection setup
│   ├── controllers/           # Route handlers per resource
│   │   ├── authController.js
│   │   ├── projectController.js
│   │   ├── proposalController.js
│   │   ├── contractController.js
│   │   ├── paymentController.js
│   │   ├── messageController.js
│   │   └── adminController.js
│   ├── middleware/
│   │   ├── auth.js            # JWT verification
│   │   ├── roleGuard.js       # Role-based access control
│   │   ├── fraudDetection.js  # Suspicious pattern detection
│   │   └── upload.js          # Multer file upload config
│   ├── models/                # Mongoose schemas
│   │   ├── User.js
│   │   ├── Project.js
│   │   ├── Proposal.js
│   │   ├── Contract.js
│   │   ├── Message.js
│   │   └── Transaction.js
│   ├── routes/                # Express route definitions
│   ├── services/
│   │   ├── aiMatching.js      # Skill overlap scoring engine
│   │   ├── aiProposal.js      # Template-based proposal generator
│   │   ├── resumeParser.js    # PDF keyword extraction
│   │   ├── socketService.js   # Socket.IO event handlers
│   │   ├── webrtcService.js   # Signaling & peer management
│   │   ├── paymentService.js  # Stripe escrow logic
│   │   └── blockchain.js      # SHA-256 fingerprinting
│   └── server.js              # App entry point
│
├── docker-compose.yml         # Full-stack orchestration
├── .env.example               # Environment variable template
└── README.md                  # This file
```

---

## ⚙️ Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | React 19, Vite, Tailwind CSS v4 | Component UI, fast builds, utility styling |
| **Animation** | Framer Motion | Declarative page transitions & micro-interactions |
| **Icons** | Lucide React | Consistent, lightweight iconography |
| **Charts** | Recharts | Admin dashboard analytics visualization |
| **Backend** | Node.js, Express 5, Mongoose 9 | REST API, schema modeling |
| **Auth** | JWT (jsonwebtoken), bcryptjs | Stateless session, password hashing |
| **Real-Time** | Socket.IO, WebRTC (RTCPeerConnection) | Chat, notifications, video signaling |
| **Payments** | Stripe (manual capture), Razorpay | Escrow funding & milestone release |
| **Database** | MongoDB (primary), Redis (sessions/cache) | Document store, session management |
| **Infra** | Docker, docker-compose | Containerized local development |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** >= 20
- **MongoDB** (local or Atlas)
- **Redis** (local or cloud)
- **Docker** (optional, recommended)

### Option 1 — Docker (Recommended)

```bash
# 1. Clone the repository
git clone https://github.com/Suruthi-Vijaya02/ai-freelance-marketplace.git
cd ai-freelance-marketplace

# 2. Configure environment variables
cp .env.example .env
# Edit .env with your MongoDB URI, JWT secret, Stripe keys, etc.

# 3. Build and run all services
docker-compose up --build
```

Services will be available at:
- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:5000
- **MongoDB:** localhost:27017
- **Redis:** localhost:6379

### Option 2 — Manual Setup

```bash
# 1. Root dependencies
npm install

# 2. Backend setup
cd server
npm install
cp .env.example .env
# Fill in required variables
npm run dev

# 3. Frontend setup (new terminal)
cd client
npm install
cp .env.example .env
npm run dev
```

---

## 🔐 Environment Variables

Copy `.env.example` to `.env` and configure the following:

| Variable | Description | Required |
|---|---|---|
| `MONGO_URI` | MongoDB connection string | ✅ Yes |
| `JWT_SECRET` | Secret key for JWT signing | ✅ Yes |
| `JWT_EXPIRES_IN` | Token expiration (e.g., `7d`) | ✅ Yes |
| `REDIS_URL` | Redis connection URL | ✅ Yes |
| `STRIPE_SECRET_KEY` | Stripe API secret key | 🔶 For payments |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook endpoint secret | 🔶 For payments |
| `RAZORPAY_KEY_ID` | Razorpay API key | 🔶 For payments |
| `RAZORPAY_KEY_SECRET` | Razorpay API secret | 🔶 For payments |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | 🔶 For file uploads |
| `CLOUDINARY_API_KEY` | Cloudinary API key | 🔶 For file uploads |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | 🔶 For file uploads |
| `CLIENT_URL` | Frontend origin (CORS) | ✅ Yes |

---

## 📡 API Reference

### Authentication
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | Public | Register new user (freelancer/client) |
| `POST` | `/api/auth/login` | Public | Login, returns JWT + user object |
| `GET` | `/api/auth/me` | Bearer | Get current authenticated user |
| `POST` | `/api/auth/logout` | Bearer | Invalidate token / clear session |

### Projects
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/projects` | Optional | List all projects with filters |
| `GET` | `/api/projects/:id` | Optional | Get single project details |
| `POST` | `/api/projects` | Client | Create new project posting |
| `PUT` | `/api/projects/:id` | Client | Update own project |
| `DELETE` | `/api/projects/:id` | Client | Delete own project |

### Proposals
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/proposals` | Auth | List proposals (role-filtered) |
| `POST` | `/api/proposals` | Freelancer | Submit proposal to project |
| `PUT` | `/api/proposals/:id/status` | Client | Accept/reject proposal |
| `POST` | `/api/proposals/ai-generate` | Freelancer | AI-generated proposal draft |

### Contracts
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/contracts` | Auth | Create contract from accepted proposal |
| `GET` | `/api/contracts/:id` | Auth | Get contract with SHA-256 fingerprint |
| `PUT` | `/api/contracts/:id/milestone` | Auth | Update milestone status |

### Messages
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/messages/:conversationId` | Auth | Get chat history |
| `POST` | `/api/messages` | Auth | Send message (also triggers Socket.IO) |

### Payments
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/payments/escrow` | Client | Fund escrow for contract |
| `POST` | `/api/payments/capture` | Client | Release milestone payment |
| `GET` | `/api/payments/transactions` | Auth | Get transaction history |

### Admin
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/admin/stats` | Admin | Platform analytics overview |
| `GET` | `/api/admin/users` | Admin | List all users with filters |
| `GET` | `/api/admin/fraud-alerts` | Admin | Suspicious activity reports |
| `GET` | `/api/admin/transactions` | Admin | All platform transactions |

### AI Services
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/ai/match` | Auth | Get AI-matched freelancers for project |
| `POST` | `/api/ai/parse-resume` | Freelancer | Extract skills from uploaded PDF |

---

## 🧪 Testing & Seeding

```bash
# Seed the database with sample users, projects, and proposals
cd server
node utils/seed.js

# Run backend tests (if configured)
npm test
```

---

## 🐳 Docker Services

| Service | Container | Port | Description |
|---|---|---|---|
| `client` | React + Vite dev server | `5173` | Frontend application |
| `server` | Node.js + Express API | `5000` | Backend REST API |
| `mongodb` | MongoDB 7 | `27017` | Primary document database |
| `redis` | Redis 7 | `6379` | Session store & cache |

<div align="center">

Built with passion by **[Suruthi Vijaya](https://github.com/Suruthi-Vijaya02)**

</div>
