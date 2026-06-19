# SocialConnect

A full-stack social network platform built with the MERN stack + Supabase. Production-quality UI inspired by Linear, Vercel, and Notion.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + TypeScript |
| Styling | Tailwind CSS + Framer Motion + Three.js |
| Backend | Node.js + Express.js |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (JWT) |
| Storage | Supabase Storage |
| Real-time | Supabase Realtime + Socket.io |
| Deploy | Vercel (frontend) + Render (backend) |

## Project Structure

```
socialconnect/
├── client/                  # React frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── 3d/          # Three.js particle field
│   │   │   ├── feed/        # PostCard, StoriesBar, CreatePostModal
│   │   │   ├── layout/      # Navbar, Sidebar, RightSidebar, AppLayout
│   │   │   └── ui/          # Avatar, Modal, Skeleton, MagneticButton, etc.
│   │   ├── pages/           # Landing, Auth, Feed, Profile, Notifications, Friends, Post, Messages
│   │   ├── hooks/           # Custom React hooks
│   │   ├── store/           # Zustand (auth + ui state)
│   │   ├── lib/             # Supabase client, Axios API, Socket.io, utils
│   │   ├── types/           # TypeScript interfaces
│   │   └── styles/          # Global CSS (glassmorphism, animations, cursor)
│   ├── vercel.json
│   └── .env.example
├── server/                  # Express backend
│   ├── src/
│   │   ├── controllers/     # posts, profiles, friendships, comments, notifications, messages, stories, upload
│   │   ├── middleware/      # auth (JWT), errorHandler
│   │   ├── routes/          # All API routes
│   │   ├── socket/          # Socket.io event handlers
│   │   └── lib/             # Supabase admin client
│   ├── render.yaml
│   └── .env.example
└── supabase/
    └── schema.sql           # Full DB schema with RLS + triggers
```

---

## Quick Start

### 1. Supabase Setup

1. Go to [supabase.com](https://supabase.com) and create a new project
2. In the SQL Editor, run the contents of `supabase/schema.sql`
3. Go to **Settings → API** and copy:
   - `Project URL` → `SUPABASE_URL`
   - `anon public` key → `SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY`
4. Go to **Storage** and create a bucket named `media` (set to public)
5. Go to **Authentication → Providers** and enable Google (optional)

### 2. Backend Setup

```bash
cd server
cp .env.example .env
# Fill in your Supabase credentials in .env
npm install
npm run dev
```

Server runs on `http://localhost:5000`

### 3. Frontend Setup

```bash
cd client
cp .env.example .env
# Fill in your Supabase credentials + API URL in .env
npm install
npm run dev
```

App runs on `http://localhost:5173`

---

## Environment Variables

### `server/.env`

```env
PORT=5000
NODE_ENV=development
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbG...
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...
CLIENT_URL=http://localhost:5173
PRODUCTION_CLIENT_URL=https://your-app.vercel.app
JWT_SECRET=your-random-secret-32-chars-min
```

### `client/.env`

```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbG...
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

---

## Deployment

### Frontend → Vercel

1. Push to GitHub
2. Connect repo on [vercel.com](https://vercel.com)
3. Set **Root Directory** to `client`
4. Add environment variables (same as `client/.env` but with production values)
5. `VITE_API_URL` = your Render backend URL + `/api`

The `vercel.json` in `client/` handles SPA routing rewrites automatically.

### Backend → Render

1. Connect repo on [render.com](https://render.com)
2. Create a new **Web Service**
3. Set **Root Directory** to `server`
4. Build command: `npm install && npm run build`
5. Start command: `npm start`
6. Add environment variables from `server/.env`
7. Set `PRODUCTION_CLIENT_URL` = your Vercel app URL

---

## Features

### Pages
- **Landing** — 3D particle field hero, animated stats, features, testimonials, CTA
- **Auth** — Split-screen login/register with Google OAuth, animated form validation
- **Feed** — Infinite scroll, stories bar, real-time post notifications
- **Profile** — Cover photo, avatar, tabs (Posts/Media/About), edit modal
- **Notifications** — Real-time via Supabase, filter tabs, mark all read
- **Friends** — Friend management, suggestions, live user search
- **Post Detail** — Nested comments, real-time updates via WebSocket
- **Messages** — Real-time chat, typing indicators, online status, read receipts

### UI/UX
- Dark-mode-first with light mode toggle
- Glassmorphism cards + neumorphic elements
- Three.js custom shader particle field with mouse parallax
- Framer Motion page transitions + stagger animations
- Custom animated cursor (desktop)
- Magnetic buttons on hover
- Skeleton loaders (no spinners)
- Emoji reaction picker (6 reactions)
- Section watermarks + noise texture overlay
- Gradient borders + animated gradient text
- Fully accessible (ARIA labels, keyboard navigation)
- Mobile responsive (4 breakpoints)

### Backend
- JWT middleware via Supabase Auth
- Row Level Security on all tables
- Rate limiting (300 req/15min general, 20 req/15min auth)
- Supabase Storage for media uploads (10MB limit)
- Socket.io real-time: messages, typing indicators, online presence
- Supabase Realtime: posts, notifications, likes

---

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/posts/feed` | Optional | Paginated public feed |
| POST | `/api/posts` | Required | Create post |
| GET | `/api/posts/:id` | Optional | Get post + comments |
| POST | `/api/posts/:id/like` | Required | Toggle like/reaction |
| GET | `/api/profiles/search` | Optional | Search users |
| GET | `/api/profiles/:username` | Optional | Get profile |
| PUT | `/api/profiles` | Required | Update own profile |
| POST | `/api/friendships/request` | Required | Send friend request |
| GET | `/api/notifications` | Required | Get notifications |
| PUT | `/api/notifications/read` | Required | Mark as read |
| GET | `/api/messages/conversations` | Required | List conversations |
| GET | `/api/messages/:partnerId` | Required | Get messages |
| POST | `/api/messages` | Required | Send message |
| GET | `/api/stories` | Optional | Get active stories |
| POST | `/api/upload` | Required | Upload media file |

---

## Database Schema

See `supabase/schema.sql` for full schema including:
- Tables: `profiles`, `posts`, `comments`, `likes`, `friendships`, `notifications`, `messages`, `stories`, `story_views`
- Row Level Security policies on every table
- PostgreSQL triggers for automatic counter updates (likes_count, comments_count, posts_count)
- Auto-create profile trigger on new user signup
- Realtime enabled for: `notifications`, `messages`, `posts`, `likes`, `stories`
