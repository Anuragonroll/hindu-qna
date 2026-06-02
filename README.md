# Pariprashna · परिप्रश्न

A full-stack Q&A platform for Hinduism, Sanatan Dharma, and related topics. "Pariprashna" (परिप्रश्न) means *inquiry* in Sanskrit — a place to ask, to seek, and to find authentic answers.

Built with the MERN stack, featuring guru/scholar verification, AI-powered answers (Groq + Gemini, grounded in vedabase.io scripture), and Stack Exchange-style features.

## Features

### Core Q&A
- Ask and answer questions with Markdown support
- Upvote/downvote system
- Comments on questions and answers
- Tags for categorization
- Search and filtering

### Guru/Scholar System
- Separate login portal for gurus
- Three tiers: Scholar → Guru → Acharya
- Verify answers with "Guru Verified" badge
- Featured answers by gurus

### Reputation & Privileges
- Earn reputation through upvotes and accepted answers
- Unlock privileges as reputation grows
- Badge system (Bronze, Silver, Gold)

### AI Assistant
- Groq (llama-3.1-8b-instant) primary, Gemini 2.5 Flash fallback
- Retrieval-augmented over the vedabase.io scripture database
- Shlokas auto-attached when gurus type `@BG 7.8` or `@SB 1.2.3`
- Scripture citations linked directly to vedabase.io

### Additional Features
- Bounties for answers
- Review queues for moderation
- User profiles with activity
- Bookmarks/favorites

## Tech Stack

- **Frontend:** React.js, Tailwind CSS, react-markdown, prism syntax highlighter
- **Backend:** Node.js, Express.js, JWT, Passport.js
- **Database:** MongoDB (main DB + vedabase.io verses DB for RAG)
- **Auth:** Email/password, Google OAuth, GitHub OAuth
- **AI:** Groq SDK + Google Generative AI (Gemini)
- **Scraper:** Cheerio (vedabase.io)

## Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB running on `mongodb://localhost:27017` (or update `MONGODB_URI`)
- (Optional) Groq and/or Gemini API keys for AI features

### One-time setup

```bash
# from the project root
npm run install:all        # installs server + client deps, plus concurrently
cp server/.env server/.env.local   # (optional) local overrides
```

### Run in development

```bash
npm run dev                # starts server (port 5001) + client (port 3000) together
```

The React dev server proxies `/api/*` calls to the Express server, so CORS works out of the box. If you prefer to run them separately:

```bash
npm run dev:server         # Express on http://localhost:5001
npm run dev:client         # React on http://localhost:3000
```

### Seed the database

```bash
npm run seed:gurus         # creates ~20 verified gurus + 1 admin user
```

Default seeded credentials:

| Role  | Email                          | Password   |
|-------|--------------------------------|------------|
| Admin | `admin@pariprashna.local`        | `admin123` |
| Guru  | `sarvapriyananda@pariprashna.local` | `guru123` |

### Production build

```bash
npm run build              # builds the client into client/build
NODE_ENV=production npm start  # server serves the built client on the same port
```

## Environment Variables

`server/.env`:

```
PORT=5001
MONGODB_URI=mongodb://localhost:27017/pariprashna
JWT_SECRET=any_long_random_string_change_me
CLIENT_URL=http://localhost:3000
GROQ_API_KEY=                 # optional, used for AI chat
GEMINI_API_KEY=               # optional, fallback for AI chat
GOOGLE_CLIENT_ID=             # optional, Google OAuth
GOOGLE_CLIENT_SECRET=         # optional
GITHUB_CLIENT_ID=             # optional, GitHub OAuth
GITHUB_CLIENT_SECRET=         # optional
```

`client/.env` (optional, defaults to `http://localhost:5001/api`):

```
REACT_APP_API_URL=http://localhost:5001/api
```

## API Endpoints

### Auth
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login user
- `POST /api/auth/guru-login` - Guru login
- `GET /api/auth/google` - Google OAuth
- `GET /api/auth/github` - GitHub OAuth

### Questions
- `GET /api/questions` - Get all questions
- `POST /api/questions` - Create question
- `GET /api/questions/:id` - Get question
- `PUT /api/questions/:id` - Update question
- `DELETE /api/questions/:id` - Delete question
- `POST /api/questions/:id/vote` - Vote on question
- `POST /api/questions/:id/accept/:answerId` - Accept answer

### Answers
- `POST /api/answers/:questionId` - Create answer
- `PUT /api/answers/:id` - Update answer
- `DELETE /api/answers/:id` - Delete answer
- `POST /api/answers/:id/vote` - Vote on answer

### Guru
- `GET /api/guru/dashboard` - Guru dashboard
- `GET /api/guru/pending` - Pending verifications
- `POST /api/guru/verify/:answerId` - Verify answer

### AI
- `POST /api/ai/chat` - Chat with AI
- `GET /api/ai/history/:sessionId` - Get chat history

## License

MIT
