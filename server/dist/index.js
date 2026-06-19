"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const morgan_1 = __importDefault(require("morgan"));
const dotenv_1 = __importDefault(require("dotenv"));
const posts_1 = __importDefault(require("./routes/posts"));
const profiles_1 = __importDefault(require("./routes/profiles"));
const friendships_1 = __importDefault(require("./routes/friendships"));
const comments_1 = __importDefault(require("./routes/comments"));
const notifications_1 = __importDefault(require("./routes/notifications"));
const messages_1 = __importDefault(require("./routes/messages"));
const stories_1 = __importDefault(require("./routes/stories"));
const upload_1 = __importDefault(require("./routes/upload"));
const errorHandler_1 = require("./middleware/errorHandler");
const handlers_1 = require("./socket/handlers");
dotenv_1.default.config();
const app = (0, express_1.default)();
const httpServer = (0, http_1.createServer)(app);
// ── CORS ──────────────────────────────────────────────────
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    process.env.CLIENT_URL || '',
    process.env.PRODUCTION_CLIENT_URL || '',
    'https://connectify-fawn.vercel.app',
].filter(Boolean);
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        }
        else {
            callback(null, true); // allow all in production for now
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
// ── SOCKET.IO ─────────────────────────────────────────────
const io = new socket_io_1.Server(httpServer, {
    cors: { origin: '*', methods: ['GET', 'POST'], credentials: true },
});
(0, handlers_1.setupSocketHandlers)(io);
app.set('io', io);
// ── MIDDLEWARE ────────────────────────────────────────────
app.use((0, helmet_1.default)({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use((0, compression_1.default)());
app.use((0, morgan_1.default)('dev'));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
// ── HEALTH ────────────────────────────────────────────────
app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
// ── ROUTES ────────────────────────────────────────────────
app.use('/api/posts', posts_1.default);
app.use('/api/profiles', profiles_1.default);
app.use('/api/friendships', friendships_1.default);
app.use('/api/posts/:postId/comments', comments_1.default);
app.use('/api/notifications', notifications_1.default);
app.use('/api/messages', messages_1.default);
app.use('/api/stories', stories_1.default);
app.use('/api/upload', upload_1.default);
// ── ERRORS ────────────────────────────────────────────────
app.use(errorHandler_1.notFound);
app.use(errorHandler_1.errorHandler);
// ── START ─────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
    console.log(`SocialConnect API running on port ${PORT}`);
});
exports.default = app;
//# sourceMappingURL=index.js.map