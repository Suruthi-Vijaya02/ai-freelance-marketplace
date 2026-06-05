# AI Freelance Marketplace 
 
 An AI-powered freelance platform built with the MERN stack. Features real-time collaboration, WebRTC video interviews, AI skill matching, resume parsing, Stripe escrow payments, and blockchain-inspired contract verification. 
 
 ## Features 
 - JWT authentication with 3 user roles: freelancer, client, admin 
 - AI skill matching engine (keyword overlap scoring) 
 - AI proposal generator (template-based, per freelancer profile) 
 - Resume parser (PDF upload → keyword skill extraction) 
 - Real-time chat and live bidding via Socket.IO 
 - WebRTC peer-to-peer video interview room 
 - Stripe escrow payment with manual capture per milestone 
 - SHA-256 contract fingerprinting (tamper-evident) 
 - Admin dashboard with fraud detection middleware 
 - Docker setup (client, server, MongoDB, Redis) 
 
 ## Tech Stack 
 | Layer | Technologies | 
 |---|---| 
 | Frontend | React 19, Vite, Tailwind CSS v4, Framer Motion, Recharts, Lucide React | 
 | Backend | Node.js, Express 5, Mongoose 9 | 
 | Auth | JWT (jsonwebtoken), bcryptjs | 
 | Real-time | Socket.IO, WebRTC (RTCPeerConnection) | 
 | Payments | Stripe (manual capture), Razorpay | 
 | Database | MongoDB, Redis | 
 | Infra | Docker, docker-compose | 
 
 ## Project Structure 
 ``` 
 ai-freelance-marketplace/ 
 ├── client/          # React frontend (Vite) 
 │   └── src/ 
 │       ├── components/   # Reusable UI, layout, bidding, interview 
 │       ├── context/      # AuthContext (JWT state) 
 │       ├── pages/        # Page-level components per role 
 │       ├── services/     # Axios API service layer 
 │       └── utils/        # Helpers and motion variants 
 ├── server/          # Express backend 
 │   ├── config/      # MongoDB connection 
 │   ├── controllers/ # Request handlers per resource 
 │   ├── middleware/  # Auth, role, fraud detection 
 │   ├── models/      # Mongoose schemas 
 │   ├── routes/      # Express route definitions 
 │   └── services/    # AI, socket, blockchain, payment logic 
 ├── docker-compose.yml 
 └── .env.example 
 ``` 
 
 ## Setup Instructions 
 
 ### Option 1 — Docker (recommended) 
 ```bash 
 git clone 
 cd ai-freelance-marketplace 
 cp .env.example .env 
 # Fill in your values in .env 
 docker-compose up 
 ``` 
 
 ### Option 2 — Manual 
 ```bash 
 # Root 
 npm install 
 
 # Backend 
 cd server 
 npm install 
 npm run dev 
 
 # Frontend (new terminal) 
 cd client 
 npm install 
 npm run dev 
 ``` 
 
 Frontend runs on http://localhost:5173 
 Backend runs on http://localhost:5000 
 
 ## Environment Variables 
 See `.env.example` for all required variables. 
 
 ## Status 
 | Feature | Status | 
 |---|---| 
 | Authentication & Role Guards | ✅ Complete | 
 | Freelancer & Client Profiles | ✅ Complete | 
 | Job Posting (CRUD) | ✅ Complete | 
 | Proposal & Bidding System | ✅ Complete | 
 | AI Skill Matching | ✅ Complete | 
 | AI Proposal Generator | ✅ Complete | 
 | Resume Parser | ✅ Complete | 
 | Real-time Chat | ✅ Complete | 
 | Live Video Interview (WebRTC) | ✅ Complete | 
 | Escrow Payment (Stripe) | 🔶 Partial — capture route in progress | 
 | Blockchain Contract Hash | 🔶 Partial — SHA-256 done, ledger write pending | 
 | Admin Dashboard | ✅ Complete | 
 | Fraud Detection | ✅ Complete | 
 | Docker Setup | ✅ Complete | 
 | Collaborative Editor | 🔲 Planned — Yjs + Monaco + Socket.IO | 
 | Multi-currency Display | 🔲 Planned | 
