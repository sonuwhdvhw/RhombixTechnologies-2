import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

import postsRouter from './routes/posts';
import profilesRouter from './routes/profiles';
import friendshipsRouter from './routes/friendships';
import commentsRouter from './routes/comments';
import notificationsRouter from './routes/notifications';
import messagesRouter from './routes/messages';
import storiesRouter from './routes/stories';
import uploadRouter from './routes/upload';

import { errorHandler, notFound } from './middleware/errorHandler';
import { setupSocketHandlers } from './socket/handlers';

dotenv.config();

const app = express();
const httpServer = createServer(app);

// ─── CORS ────────────────────────────────────────────────────
const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:5173',
  process.env.PRODUCTION_CLIENT_URL || '',
].filter(Boolean);

const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS blocked: ${origin}`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));

// ─── SOCKET.IO ───────────────────────────────────────────────
const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

setupSocketHandlers(io);

// Make io available to routes
app.set('io', io);

// ─── MIDDLEWARE ──────────────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(compression());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── RATE LIMITING ───────────────────────────────────────────
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many auth attempts, please try again later.' },
});

app.use('/api', generalLimiter);

// ─── HEALTH CHECK ────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── API ROUTES ──────────────────────────────────────────────
app.use('/api/posts', postsRouter);
app.use('/api/profiles', profilesRouter);
app.use('/api/friendships', friendshipsRouter);
app.use('/api/posts/:postId/comments', commentsRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/messages', messagesRouter);
app.use('/api/stories', storiesRouter);
app.use('/api/upload', uploadRouter);

// ─── ERROR HANDLING ──────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ─── START SERVER ────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  console.log(`
  ╔═══════════════════════════════════════╗
  ║      SocialConnect API Server         ║
  ║      Running on port ${PORT}            ║
  ║      ENV: ${process.env.NODE_ENV}     ║
  ╚═══════════════════════════════════════╝
  `);
});

export { app, io };
