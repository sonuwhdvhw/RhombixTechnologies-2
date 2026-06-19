import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
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

// ── CORS ──────────────────────────────────────────────────
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  process.env.CLIENT_URL || '',
  process.env.PRODUCTION_CLIENT_URL || '',
  'https://connectify-fawn.vercel.app',
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true); // allow all in production for now
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ── SOCKET.IO ─────────────────────────────────────────────
const io = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'], credentials: true },
});
setupSocketHandlers(io);
app.set('io', io);

// ── MIDDLEWARE ────────────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(compression());
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── HEALTH ────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── ROUTES ────────────────────────────────────────────────
app.use('/api/posts', postsRouter);
app.use('/api/profiles', profilesRouter);
app.use('/api/friendships', friendshipsRouter);
app.use('/api/posts/:postId/comments', commentsRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/messages', messagesRouter);
app.use('/api/stories', storiesRouter);
app.use('/api/upload', uploadRouter);

// ── ERRORS ────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ── START ─────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`SocialConnect API running on port ${PORT}`);
});

export default app;
