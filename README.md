# Sharewise

**Learn from the people you follow: share short lessons, tap "Remember this" on the ones worth keeping, and Sharewise brings them back for review right before you would forget them.**

**Live app:** https://sharewise.vercel.app · **API:** https://sharewise-api.vercel.app/api

## Try it

Log in with any seeded demo account. Every account uses the password **`sharewise123`**.

| Name | Email | Password | What to try |
| --- | --- | --- | --- |
| Maya Chen | `maya@sharewise.dev` | `sharewise123` | Clear her review queue: swipe a card right for "Got it" or left for "Forgot", or use the keys. Then check her streak and the heatmap on Stats. Her JavaScript lessons have highlighted code with a copy button, and she curates the "JavaScript gotchas" deck. |
| Omar Haddad | `omar@sharewise.dev` | `sharewise123` | Write a lesson with markdown and a code snippet, using the Write/Preview toggle. Open his "Git rescue kit" deck and add another lesson to it with **Add to deck**. |
| Priya Nair | `priya@sharewise.dev` | `sharewise123` | The most consistent reviewer, so her profile heatmap is the fullest. Answer a multiple-choice quiz on Review with the lettered keys. She owns the "Interview patterns" deck. |
| Sam Okafor | `sam@sharewise.dev` | `sharewise123` | A light reviewer with CSS lessons. Open Lena's "Career habits" deck and tap **Remember all** to fill his queue in one go. |
| Lena Vogel | `lena@sharewise.dev` | `sharewise123` | Her older review history is weekdays only, which shows on her heatmap. Her career lessons include text-answer quizzes. She curates the "Career habits" deck. |

Anyone can also sign up for a new account; after sign-up Sharewise suggests people to follow. `npm run seed` resets the demo accounts locally (see [Getting started](#getting-started)).

| Lesson with code (desktop) | Stats (desktop) |
| --- | --- |
| ![A lesson with a highlighted JavaScript snippet](docs/screenshots/lesson-desktop.png) | ![Stats with streak, weekly chart and review activity](docs/screenshots/stats-desktop.png) |

| Review (mobile) | Profile (mobile) |
| --- | --- |
| <img src="docs/screenshots/review-mobile.png" alt="A review card with Forgot and Got it buttons and a swipe hint" width="300"> | <img src="docs/screenshots/profile-mobile.png" alt="A profile with streak, mastered count and review activity heatmap" width="300"> |

## How it works

```
Share a lesson ──> Others tap "Remember this" ──> Card due tomorrow ──> Review: Got it / Forgot
                                                          ^                         │
                                                          └── next due date ◄───────┘
                                                                                    │
                                                    streaks, mastered count, Stats ◄┘
```

1. **Share.** Anyone writes a short lesson: a title, a markdown body, and optionally a code snippet, a link, up to five tags and a quiz (a text answer or 2-4 choices).
2. **Remember.** Readers tap **Remember this** on a lesson worth keeping (not their own). That creates a review card due the next day. Decks let you remember a whole collection at once.
3. **Review.** Due cards show up on the Review screen and mixed into the Feed. You answer by grading yourself ("Got it" or "Forgot") or by answering the lesson's quiz, which the server grades.
4. **Space it out.** A binary-grade SM-2 variant schedules the next review. Each "Got it" in a row pushes the card out to 3 days, then 7, then 30, then roughly `interval × ease` (ease starts at 2.5). A "Forgot" sends it back to tomorrow and lowers its ease. Cards come due at local midnight in your time zone.
5. **Track it.** A card is **mastered** once its interval reaches 21 days. Your **streak** counts consecutive days, in your time zone, on which you answered at least one review. Stats, profiles and the activity heatmap all count answered reviews.

The **Feed** mixes one due review with two new lessons, repeating; of the new lessons, two come from people you follow for every one from someone else. Lessons you already remember come back only as reviews.

The full rules, data shapes and endpoints are in the API reference: [`backend/API.md`](backend/API.md).

## Features

The UI is mobile-first: a bottom tab bar on phones, an icon rail on tablets and a full sidebar on desktop, in light and dark mode.

- **Feed**: due reviews mixed with new lessons from people you follow and from the rest of the community, with a count of reviews due today.
- **Explore**: every lesson, newest first, filterable by tag, plus a **Popular decks** row. Explore and deck pages work without logging in.
- **Lessons**: bodies render as safe markdown (lists, bold, italic, inline code, links and fenced code blocks), with syntax-highlighted code and a copy button. The composer has a **Write/Preview** toggle and a card preview. Authors see their quiz answer; readers see it after they answer.
- **Review**: one card at a time with progress. Swipe right for "Got it" and left for "Forgot", or use the keys: Space/Enter to show the lesson, `1`/`←`/`F` for Forgot, `2`/`→`/`G` for Got it, `A`-`D` or `1`-`4` for a quiz choice, and Enter for the next card.
- **Decks**: curated, ordered collections of up to 50 lessons by anyone, with an emoji and a cover colour. **Remember all** adds every lesson you do not remember yet in one tap. Add lessons from any lesson page with **Add to deck**.
- **Stats**: current and best streak, mastered and due counts, reviews this week by day, a twelve-week **review activity heatmap**, the most remembered lessons, top teachers and community totals.
- **Profiles**: bio, streak and mastered count, the review activity heatmap, the user's decks, and lessons, followers and following tabs. Follow or unfollow from here.
- **Account**: sign up, log in, edit your name, handle, bio and time zone.

## Tech stack

| Layer | Stack |
| --- | --- |
| Frontend | React 19, Vite 8, Chakra UI 3, React Router 7, TanStack React Query 5, Axios 1, highlight.js 11, React Icons 5, ESLint 10 |
| Backend | Node.js 22, Express 5, Mongoose 9, JWT (`jwt-simple`), bcryptjs 3, Winston 3 |
| Database | MongoDB (MongoDB Atlas in production) |
| Tests | `node:test`, Supertest, `mongodb-memory-server` |
| Hosting | Vercel (two projects: frontend and backend) |

## Getting started

### Prerequisites

- Node.js 22.12 or later, with npm
- MongoDB running locally, or a MongoDB Atlas connection string
- Git

### 1. Clone and install

```bash
git clone https://github.com/itsApurba/sharewise.git
cd sharewise
(cd backend && npm install)
(cd frontend && npm install)
```

### 2. Configure environment variables

Backend: copy the example file and adjust it.

```bash
cp backend/.env.example backend/.env
```

| Variable | Default in `.env.example` | Notes |
| --- | --- | --- |
| `NODE_ENV` | `development` | |
| `PORT` | `3939` | |
| `JWT_SECRET` | `supersecret` | Use a long random value, e.g. `openssl rand -base64 48`. |
| `JWT_EXPIRATION_MINUTES` | `10080` | Session lifetime (one week). |
| `MONGO_URI` | `mongodb://mongodb:27017/test` | The `mongodb` host is for Docker. For a local MongoDB use e.g. `mongodb://localhost:27017/sharewise`. `MONGODB_URI` also works. |
| `CORS_ORIGIN` | empty | Comma-separated allowed origins. Empty allows all. |

Frontend: copy its example file. `VITE_BACKEND_URL` is the backend origin **without `/api`**; the app appends `/api` itself.

```bash
cp frontend/.env.example frontend/.env    # VITE_BACKEND_URL=http://localhost:3939
```

### 3. Seed the demo data

```bash
cd backend
npm run seed
```

This loads the five demo accounts above with 26 lessons, 4 decks, follows, and twelve weeks of review history, so streaks, the heatmaps, mastered lessons and due reviews exist on the first day. It upserts the demo users, lessons and decks and rebuilds their follows, cards and history relative to now, without touching other users, so run it again any time to reset the demo.

### 4. Run it

In two terminals:

```bash
cd backend && npm run dev     # API on http://localhost:3939/api
cd frontend && npm run dev    # app on http://localhost:5173
```

Open http://localhost:5173 and log in with a demo account.

### 5. Tests and lint

```bash
cd backend && npm test        # starts its own in-memory MongoDB, no .env needed
cd frontend && npm run lint
```

## Deploy to Vercel

Sharewise deploys as two Vercel projects from this repository. Create each with **Add New → Project**, import the repo, and set its **Root Directory**.

### Backend project (Root Directory `backend`)

`backend/api/index.js` is the serverless function and `backend/vercel.json` rewrites `/api/*` to it, so routes stay at `https://<backend>.vercel.app/api/...`. Each instance connects to MongoDB once and reuses the connection on warm requests. A missing required variable or an unreachable database answers `503`, and the function log says which.

Set these under **Settings → Environment Variables**, then redeploy:

| Variable | Required | Value |
| --- | --- | --- |
| `MONGO_URI` or `MONGODB_URI` | yes | Atlas connection string including the database name, e.g. `mongodb+srv://user:pass@cluster.mongodb.net/sharewise`. The Vercel MongoDB Atlas integration sets `MONGODB_URI` for you. If both are set, `MONGO_URI` wins. |
| `JWT_SECRET` | yes | A long random value, e.g. `openssl rand -base64 48`. Changing it logs everyone out. |
| `JWT_EXPIRATION_MINUTES` | no | Session lifetime in minutes (default one week). |
| `CORS_ORIGIN` | no | Comma-separated allowed origins, e.g. `https://sharewise.vercel.app`. Unset allows every origin. |
| `NODE_ENV` | no | Vercel already runs functions with `production`. |

**MongoDB Atlas:** Vercel functions have no fixed outbound IP. Under **Network Access**, allow `0.0.0.0/0` (access from anywhere) so the function can connect. The integration may do this for you.

**Demo data (one time):** seed Atlas from your machine. A variable set in the shell wins over `backend/.env`:

```bash
cd backend
npm install
MONGODB_URI='mongodb+srv://user:pass@cluster.mongodb.net/sharewise' npm run seed
```

### Frontend project (Root Directory `frontend`)

Vercel detects Vite and builds `dist`. `frontend/vercel.json` rewrites every path to `index.html`, so deep links such as `/stats` or `/deck/<id>` load the app instead of a 404.

| Variable | Required | Value |
| --- | --- | --- |
| `VITE_BACKEND_URL` | yes | The backend origin **without `/api`**, e.g. `https://<backend>.vercel.app`. The app appends `/api` itself. |

`VITE_BACKEND_URL` is compiled into the bundle, so redeploy the frontend after changing it, then set the backend's `CORS_ORIGIN` to the frontend's URL.

## API

The backend API is documented in [`backend/API.md`](backend/API.md): auth, users and follows, lessons and quizzes, remembering and reviews, decks, the feed, analytics, and the spaced-repetition, feed-mixing and streak rules.
