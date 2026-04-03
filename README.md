# ⬡ InterviewAI — AI Mock Interview Platform

A full-stack web application that conducts AI-powered mock interviews, evaluates answers in real time, and generates detailed performance reports using Google Gemini.

---

## 📁 Project Structure

```
mock_interview_platform/
├── server/
│   ├── controllers/
│   │   ├── authController.js       # Register, login, get user
│   │   └── interviewController.js  # Start, answer, results, history, delete
│   ├── middleware/
│   │   └── auth.js                 # JWT verification
│   ├── models/
│   │   ├── User.js                 # User schema
│   │   └── Interview.js            # Interview + Q&A schema
│   ├── routes/
│   │   ├── auth.js                 # /api/auth/*
│   │   └── interview.js            # /api/interview/*
│   ├── services/
│   │   └── aiService.js            # Google Gemini AI
│   ├── index.js                    # Express entry point
│   ├── package.json
│   ├── .env.example
│   └── .gitignore
│
└── client/
    ├── public/
    │   └── index.html
    ├── src/
    │   ├── context/
    │   │   └── AuthContext.js      # Global auth state
    │   ├── services/
    │   │   └── api.js              # Axios + JWT interceptor
    │   ├── components/
    │   │   └── shared/
    │   │       ├── Navbar.js
    │   │       └── Navbar.css
    │   ├── pages/
    │   │   ├── Login.js / Register.js / Auth.css
    │   │   ├── Dashboard.js / Dashboard.css
    │   │   ├── Setup.js / Setup.css
    │   │   ├── Interview.js / Interview.css
    │   │   ├── Results.js / Results.css
    │   │   └── History.js / History.css
    │   ├── App.js                  # Router + protected routes
    │   ├── index.js
    │   └── index.css               # Global CSS design system
    ├── package.json
    └── .gitignore
```

---

## ✅ Prerequisites

| Tool | Version | Link |
|------|---------|------|
| Node.js | v18+ | https://nodejs.org |
| npm | v8+ | (bundled with Node) |
| MongoDB | Local or Atlas | https://mongodb.com |
| Gemini API Key | Free | https://aistudio.google.com/app/apikey |

---

## 🔑 Getting Your Keys

### Gemini API Key
1. Visit https://aistudio.google.com/app/apikey
2. Sign in with Google → **Create API Key** → Copy it

### MongoDB (choose one)

**Local (easiest):**
- Download: https://www.mongodb.com/try/download/community
- Connection string: `mongodb://localhost:27017/mock_interview`

**Atlas (free cloud):**
1. https://cloud.mongodb.com → Create free account
2. Create M0 (free) cluster
3. **Database Access** → Add User with username + password
4. **Network Access** → Add IP → Allow Access from Anywhere (`0.0.0.0/0`)
5. **Database** → Connect → Drivers → Copy the connection string
6. Replace `<password>` with your actual password

> ⚠️ **Atlas `querySrv ECONNREFUSED` error?** Your network blocks SRV DNS.
> Solutions below in Troubleshooting section.

---

## 🚀 Installation & Running

### Step 1 — Backend Setup

```bash
cd server
npm install
```

Copy and fill in the env file:
```bash
# Windows:
copy .env.example .env

# Mac / Linux:
cp .env.example .env
```

Edit `.env`:
```env
# Local MongoDB:
MONGODB_URI=mongodb://localhost:27017/mock_interview

# OR Atlas (fill in your password):
# MONGODB_URI=mongodb+srv://username:YOUR_PASSWORD@cluster.mongodb.net/mock_interview

# Generate a secret (run this in terminal):
# node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=paste_64_char_random_hex_here

GEMINI_API_KEY=your_gemini_key_here

PORT=5000
CLIENT_URL=http://localhost:3000
NODE_ENV=development
```

Start the server:
```bash
npm run dev
```

✅ Expected output:
```
✅ MongoDB connected
🚀 Server → http://localhost:5000/api
🌍 Env: development
```

Verify it works:
```
GET http://localhost:5000/api/health
```

---

### Step 2 — Frontend Setup

Open a **new terminal** (keep the server running):

```bash
cd client
npm install
npm start
```

Browser opens at **http://localhost:3000** automatically.

---

## 🌐 API Reference

### Auth (no token required)

| Method | Endpoint | Body |
|--------|----------|------|
| POST | `/api/auth/register` | `{ name, email, password }` |
| POST | `/api/auth/login` | `{ email, password }` |
| GET | `/api/auth/me` | — (needs Bearer token) |
| GET | `/api/health` | — |

Auth endpoints return `{ token, user }`. Store the token and send it in future requests:
```
Authorization: Bearer <token>
```

### Interview (Bearer token required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/interview/start` | Start session, returns first question |
| POST | `/api/interview/answer` | Submit answer, get feedback + next question |
| GET | `/api/interview/result/:id` | Full interview result |
| GET | `/api/interview/history?page=1&limit=10` | Paginated history |
| DELETE | `/api/interview/:id` | Delete an interview |

**Start body:**
```json
{
  "role": "Frontend Developer",
  "difficulty": "intermediate",
  "experience": "2 years with React and TypeScript",
  "totalQuestions": 5
}
```

**Answer body:**
```json
{ "interviewId": "64abc123...", "answer": "I would use useCallback to..." }
```

---

## 🔧 Troubleshooting

### ❌ MongoDB `querySrv ECONNREFUSED`

Your DNS provider blocks SRV records. Three fixes:

**Fix 1 — Change DNS to Google (recommended)**
- Windows: `Win + R` → `ncpa.cpl` → Right-click your connection → Properties
- Double-click IPv4 → Use these DNS:
  - Preferred: `8.8.8.8`
  - Alternate: `8.8.4.4`
- Then run: `ipconfig /flushdns` in PowerShell
- Restart the server

**Fix 2 — Use direct MongoDB connection string**
- Atlas → Connect → Drivers → look for `mongodb://` (not `mongodb+srv://`)
- Use that string in your `.env`

**Fix 3 — Use local MongoDB**
```env
MONGODB_URI=mongodb://localhost:27017/mock_interview
```

---

### ❌ `Missing required environment variable`
- Make sure `.env` exists (not just `.env.example`)
- All three must be filled: `MONGODB_URI`, `JWT_SECRET`, `GEMINI_API_KEY`

### ❌ Gemini AI not working
- Verify API key at https://aistudio.google.com/app/apikey
- Free tier has rate limits — wait 60 seconds and retry
- Make sure your internet can reach `generativelanguage.googleapis.com`

### ❌ CORS error in browser
- Make sure `CLIENT_URL=http://localhost:3000` is in server `.env`
- Restart the server after changing `.env`

### ❌ Port 5000 already in use
```bash
# Windows PowerShell:
netstat -ano | findstr :5000
taskkill /PID <PID_NUMBER> /F

# Mac/Linux:
lsof -ti:5000 | xargs kill
```

### ❌ `npm install` errors
```bash
node --version   # Must be v18 or higher
npm --version    # Must be v8 or higher
```

---

## 🗺️ User Flow

```
Register / Login
       ↓
   Dashboard  ←──────────────────────────┐
   (stats + recent sessions)             │
       ↓                                 │
  Setup Interview                        │
  (role, difficulty, experience,         │
   number of questions)                  │
       ↓                                 │
  AI generates questions via Gemini      │
       ↓                                 │
  Interview Session                      │
  (answer each question)                 │
       ↓                                 │
  AI evaluates each answer               │
  (scores: technical/communication/      │
   confidence + written feedback)        │
       ↓                                 │
  Final Report generated by AI           │
       ↓                                 │
  Results Page                           │
  (overall %, strengths, weaknesses,     │
   suggestions, per-question review)     │
       ↓                                 │
  History Page ───────────────────────── ┘
  (view all past sessions, delete)
```

---

## 🛡️ Security

- Passwords hashed with **bcrypt** (cost 10)
- **JWT tokens** expire in 7 days
- **Rate limiting**: 20 auth requests / 15 min · 120 API requests / min
- **Helmet** sets secure HTTP headers (XSS, CSP, etc.)
- **CORS** restricted to your `CLIENT_URL`
- **Input validation** on every endpoint
- **User isolation**: every DB query filters by `userId`

---

## 🧩 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, React Router v6, Axios |
| Styles | Custom CSS, CSS variables, Syne + DM Sans fonts |
| Backend | Node.js 18, Express 4 |
| Database | MongoDB + Mongoose |
| AI | Google Gemini 3 Flash |
| Auth | JWT + bcryptjs |
| Security | Helmet, express-rate-limit |
| Dev | nodemon |

---

## 🚢 Production Deployment

### Backend → Railway / Render / Fly.io
1. Push the `server/` folder to GitHub
2. Connect repo to platform
3. Set all env vars in platform dashboard
4. Set `NODE_ENV=production`
5. Set `CLIENT_URL=https://your-frontend.vercel.app`
6. Start command: `npm start`

### Frontend → Vercel / Netlify
1. Push the `client/` folder to GitHub
2. Build command: `npm run build` · Publish dir: `build`
3. Add env var: `REACT_APP_API_URL=https://your-backend.railway.app/api`
4. In `client/src/services/api.js`, change:
   ```js
   baseURL: process.env.REACT_APP_API_URL || '/api'
   ```

---

## 📄 License

MIT — free to use, modify and distribute.
