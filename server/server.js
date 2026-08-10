import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Ensure server/.env is loaded regardless of the current working directory.
// This makes dotenv loading robust when the process is started from the repository root.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const serverEnvPath = path.resolve(__dirname, '.env');
const rootEnvPath = path.resolve(__dirname, '..', '.env');

dotenv.config({ path: serverEnvPath });
dotenv.config({ path: rootEnvPath });

// Safe diagnostics only: confirm presence without printing actual values.
console.log('[env] GEMINI_API_KEY exists:', !!process.env.GEMINI_API_KEY, 'length:', process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.length : 0);
console.log('[blockchain] config loaded:', !!process.env.SEPOLIA_RPC_URL, !!process.env.BLOCKCHAIN_PRIVATE_KEY, !!process.env.BLOCKCHAIN_CONTRACT_ADDRESS);
import express from 'express';
import cors from 'cors';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import { connectDB } from './config/db.js';
import { initSocketHandlers } from './services/socketService.js';

import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import projectRoutes from './routes/projectRoutes.js';
import proposalRoutes from './routes/proposalRoutes.js';
import contractRoutes from './routes/contractRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import interviewRoutes from './routes/interviewRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import { getPlatformStats } from './controllers/statsController.js';
import geminiRoutes from "./routes/geminiRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";
import collaborationRoutes from "./routes/collaborationRoutes.js";

const app = express();
const server = createServer(app);
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';
const allowedOrigins = new Set([CLIENT_URL, 'http://localhost:5174']);
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.has(origin) || origin.startsWith('http://localhost:')) {
      return callback(null, true);
    }
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
};

const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.has(origin) || origin.startsWith('http://localhost:')) {
        return callback(null, true);
      }
      callback(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'POST'],
  },
});

app.use(cors(corsOptions));
// increase body parser limits to handle large uploads
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

app.get('/api/health', (_, res) => res.json({ status: 'ok', service: 'FreelannceAI API' }));
app.get('/api/stats', getPlatformStats);

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/proposals', proposalRoutes);
app.use('/api/contracts', contractRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/interviews', interviewRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/gemini', geminiRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/collaboration', collaborationRoutes);
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: err.message || 'Internal server error' });
});

initSocketHandlers(io);
app.set('io', io);

const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB:', err.message);
    process.exit(1);
  });
