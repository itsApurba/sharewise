# Sharewise API

The contract between the backend and the UI. Every route lives under `/api`
(for example `POST /api/auth/login`). Bodies are JSON (`Content-Type: application/json`,
at most 100 kB), and every response body is JSON except `204 No Content`.
`GET /api/` is a health check that answers `{ "ok": true }`. CORS allows any origin (auth is a bearer token, not a cookie)
and exposes the `X-Due-Count` header.

Contents: [Conventions](#conventions) · [Auth](#auth) · [Users, profiles and follows](#users-profiles-and-follows) ·
[Lessons](#lessons) · [Remember and reviews](#remember-and-reviews) · [Feed](#feed) ·
[Analytics](#analytics) · [Spaced repetition](#spaced-repetition-sm-2-rules) ·
[Feed mixing rule](#feed-mixing-rule) · [Streaks and time zones](#streaks-and-time-zones) · [Demo seed](#demo-seed)

## Conventions

### Authentication

Sign up or log in to get a token, then send it on every request that needs a user:

```
Authorization: Bearer <token>
```

Tokens are HS256 JWTs signed with `JWT_SECRET`. They last `JWT_EXPIRATION_MINUTES`
(default 10080, one week). There is no refresh endpoint; on a `401` the UI logs in again.

Each route is marked:

- **auth**: a valid token is required, otherwise `401`.
- **optional**: works logged out; with a valid token the response adds viewer-specific fields
  (`viewer`, revealed quiz answers). A token that is sent but invalid or expired is still a `401`.
- **public**: no token is read.

Every write acts as the authenticated user. No route takes a user id in the body.

### Ids

Lessons and review cards are addressed by `id` (a 24-character hex string).
Users are addressed by `handle` in URLs; user `id`s appear in responses but no route needs one.
A malformed id in a URL is a `404`, the same as an id that does not exist.

### Errors

Every error has this shape, and the status code always matches it (there are no `200`s with an error body):

```json
{ "error": { "code": "VALIDATION", "message": "Validation failed", "fields": { "handle": "Handle must be 3-20 characters: lowercase letters, digits or _" } } }
```

`fields` (field name to message) appears on validation and duplicate errors. Nested fields use dots, such as `quiz.prompt`.

| Status | `code` | When |
|---|---|---|
| 400 | `VALIDATION` | A missing, malformed or out-of-range field, query parameter or grade. |
| 400 | `BAD_JSON` | The body is not valid JSON. |
| 401 | `UNAUTHORIZED` | No token on an auth route, an invalid or expired token, or a wrong email or password. |
| 403 | `FORBIDDEN` | Editing or deleting someone else's lesson, or remembering your own. |
| 404 | `NOT_FOUND` | No such lesson, review, user, quiz or route (including malformed ids). |
| 409 | `DUPLICATE` | Sign-up or profile edit with an email or handle that is taken (`fields` names it). |
| 409 | `NOT_DUE` | Answering a review card that is not due yet or was just answered. |
| 413 | `TOO_LARGE` | The body is over 100 kB. |
| 500 | `INTERNAL` | A bug. The message is generic; details go to the server log only. |

### Pagination

List routes take `?page=` (from 1, default 1) and `?limit=` (1 to 50, default 20); anything else is a `400`.
They answer:

```json
{ "items": [], "page": 1, "limit": 20, "hasMore": false }
```

### Shared shapes

**UserSummary**: `{ "id": "…", "name": "Maya Chen", "handle": "maya" }`

**PublicUser**: UserSummary plus `bio` (string, may be empty) and `createdAt`.

**Me**: PublicUser plus `email` and `timezone` (an IANA name such as `"Asia/Kolkata"`, default `"UTC"`). Only ever returned to that user. No response ever contains a password or its hash.

**Lesson**:

```json
{
  "id": "6ace83ec57e5b8f31734fcfc",
  "title": "Prefer const",
  "body": "Use const by default; reach for let only when you reassign.",
  "code": { "language": "js", "source": "const total = items.length;" },
  "link": "https://developer.mozilla.org/…",
  "tags": ["js", "tips"],
  "quiz": { "prompt": "Which keyword should be your default?", "kind": "choice", "choices": ["var", "let", "const"] },
  "author": { "id": "…", "name": "Maya Chen", "handle": "maya" },
  "rememberCount": 3,
  "createdAt": "2026-10-14T09:00:00.000Z",
  "updatedAt": "2026-10-14T09:00:00.000Z",
  "viewer": { "isAuthor": false, "remembered": true, "reviewId": "…", "quizAnswered": false, "quizCorrect": null }
}
```

- `code`, `link` and `quiz` are `null` when absent. `tags` may be empty.
- `rememberCount` is how many people currently remember the lesson.
- `viewer` is `null` when logged out.
- **Quiz answers.** `quiz` always has `prompt` and `kind` (`"text"` or `"choice"`); a choice quiz also has `choices`.
  The answer is added only when the viewer is the author, or the viewer has answered this quiz before
  (`viewer.quizAnswered`): a text quiz then adds `answer`, a choice quiz adds `correctIndex` and `answer`
  (the text of the correct choice). Review cards never include the answer, even then.
  Logged-out viewers never see it in a lesson; they learn it only from the answer route's response.

**Review** (a card for a lesson the user remembers):

```json
{
  "id": "…", "lessonId": "…",
  "ease": 2.5, "interval": 1, "repetitions": 0, "lapses": 0,
  "dueAt": "2026-10-15T00:00:00.000Z", "lastReviewedAt": null,
  "mastered": false, "createdAt": "…",
  "lesson": { "…": "Lesson, quiz answer hidden" }
}
```

`interval` is in days. `mastered` is `interval >= 21`. Routes that list cards include `lesson`;
the remember and answer routes return the card without it.

## Auth

### `POST /auth/signup` (public)

```json
{ "name": "Maya Chen", "handle": "maya", "email": "maya@example.com", "password": "at least 8", "bio": "optional", "timezone": "optional IANA name" }
```

| Field | Rule |
|---|---|
| `name` | required, 1-50 characters after trimming |
| `handle` | required, 3-20 characters of `a-z 0-9 _`; stored lowercase; unique (so never `me`, which `/users/me` uses) |
| `email` | required, a valid address; stored lowercase; unique; cannot be changed later |
| `password` | required, 8-72 characters; stored as a bcrypt hash |
| `bio` | optional, at most 200 characters (the same limit everywhere) |
| `timezone` | optional IANA name, default `UTC`; drives due dates and streak days. Matched case-insensitively and stored with its IANA spelling (`asia/kolkata` is stored as `Asia/Kolkata`); UTC offsets such as `+01:00` and unknown names are a `400` |

`201 { "token": "…", "user": Me }`. Errors: `400` with every invalid field in `fields`; `409 DUPLICATE` when the email or handle is taken.

### `POST /auth/login` (public)

`{ "email": "…", "password": "…" }` (email is case-insensitive) → `200 { "token": "…", "user": Me }`.
A missing field is `400`; an unknown email or wrong password is `401` "Invalid email or password".

### `GET /auth/me` (auth)

`200 { "user": Me }`.

## Users, profiles and follows

| Route | Access | Response |
|---|---|---|
| `GET /users?q=` | public | Page of PublicUser, sorted by handle. `q` matches name or handle, case-insensitive. |
| `PATCH /users/me` | auth | Body: any of `name`, `handle`, `bio`, `timezone` (same rules as sign-up). `200 { "user": Me }`. Sending `email` or `password` is a `400`; an empty body is a `400`; a taken handle is `409`. |
| `DELETE /users/me` | auth | `204`. Deletes the account, the user's lessons (and everyone's review cards and quiz answers on them), the user's own cards, review history, quiz answers and follows in both directions. Other users keep their own review history. |
| `GET /users/:handle` | optional | Profile, below. `404` for an unknown handle. |
| `GET /users/:handle/lessons` | optional | Page of Lesson, newest first. |
| `GET /users/:handle/followers` | public | Page of PublicUser, most recent follow first. |
| `GET /users/:handle/following` | public | Page of PublicUser, most recent follow first. |
| `POST /users/:handle/follow` | auth | `201` when new, `200` when already following: `{ "user": UserSummary, "isFollowing": true, "followers": 4 }`. Following yourself is a `400`. |
| `DELETE /users/:handle/follow` | auth | `204` (also when you were not following). |

Profile:

```json
{
  "user": PublicUser,
  "counts": { "lessons": 6, "followers": 3, "following": 2 },
  "stats": { "currentStreak": 5, "bestStreak": 9, "mastered": 4 },
  "viewer": { "isSelf": false, "isFollowing": true }
}
```

`viewer` is `null` when logged out. `stats` follow [Streaks and time zones](#streaks-and-time-zones) in the profile owner's time zone.

## Lessons

### Lesson input

| Field | Rule |
|---|---|
| `title` | required on create, 3-120 characters |
| `body` | required on create, 1-2000 characters. Stored as written; clients render it as a safe markdown subset: paragraphs, `-` / `1.` lists, fenced ```` ``` ```` code blocks with a language, `**bold**`, `*italic*`, `` `inline code` ``, `[text](https://…)` and bare http(s) URLs. Raw HTML is shown as text, and only http(s) links become links |
| `code` | optional `{ "language": "js", "source": "…" }` or `null`. `source` 1-2000 characters (trailing whitespace trimmed); `language` a short lowercase name (`a-z 0-9 + # . -`, up to 20), default `"text"` |
| `link` | optional `http(s)` URL up to 500 characters, or `null` / `""` for none |
| `tags` | optional array of up to 5 tags. Each is trimmed, lowercased and stripped of a leading `#`; duplicates collapse. A tag is 1-24 characters of `a-z 0-9 + # . -`, starting with a letter or digit |
| `quiz` | optional, or `null` for none. Text: `{ "prompt": "…", "answer": "…" }`. Multiple choice: `{ "prompt": "…", "choices": ["…", "…"], "correctIndex": 1 }`. `prompt` 3-200 characters; `answer` and each choice 1-100 characters; 2-4 distinct choices; send `answer` or `choices`, never both |

### Routes

| Route | Access | Response |
|---|---|---|
| `GET /lessons/explore?tag=&page=&limit=` | optional | Page of Lesson, newest first, everyone's lessons (the logged-out home page). `tag` filters by one tag. |
| `GET /lessons/tags` | public | `{ "items": [{ "tag": "js", "lessons": 7 }] }`, most used first. |
| `POST /lessons` | auth | Lesson input → `201 { "lesson": Lesson }`. |
| `GET /lessons/:id` | optional | `200 { "lesson": Lesson }`. |
| `PATCH /lessons/:id` | auth, author only | Any subset of lesson input (send `null` to clear `code`, `link` or `quiz`) → `200 { "lesson": Lesson }`. Changing `quiz` clears everyone's earlier answers to it. An empty body is a `400`; a non-author gets `403`. |
| `DELETE /lessons/:id` | auth, author only | `204`. Also deletes everyone's review cards and quiz answers for it. A non-author gets `403`. |
| `POST /lessons/:id/quiz/answer` | optional | Check an answer outside the review queue (below). |

### `POST /lessons/:id/quiz/answer` (optional)

Body `{ "choice": 1 }` for a choice quiz (0-based index) or `{ "answer": "text" }` for a text quiz.
`200 { "correct": true, "correctAnswer": { "answer": "const", "correctIndex": 2 } }`
(`correctIndex` only for choice quizzes). A lesson without a quiz is `404`; the wrong body for the quiz kind is `400`.

When a logged-in viewer who is not the author answers, their **first** answer is recorded:
from then on the lesson shows them the answer and `viewer.quizAnswered` / `viewer.quizCorrect`.
It does not touch the review schedule.

Text answers are compared after normalizing both sides: case-insensitive, surrounding whitespace trimmed,
runs of whitespace collapsed to one space, and trailing `.`, `!` and `?` ignored.

## Remember and reviews

| Route | Access | Response |
|---|---|---|
| `POST /lessons/:id/remember` | auth | Creates the viewer's card: `201 { "review": Review, "rememberCount": 4 }`. Already remembered: `200` with the existing card, unchanged. Remembering your own lesson is `403`. |
| `DELETE /lessons/:id/remember` | auth | `204`. Deletes the card ("un-remember"); review history stays for streaks. Also `204` when not remembered. |
| `GET /reviews` | auth | Page of Review (with `lesson`), every card the user has, soonest due first. |
| `GET /reviews/due` | auth | Page of Review (with `lesson`) with `dueAt <= now`, most overdue first. The `X-Due-Count` header holds the total due. |
| `POST /reviews/:id/answer` | auth, card owner | Answer a due card (below). Someone else's card is a `404`. |

### `POST /reviews/:id/answer`

Send exactly one of:

- `{ "grade": "got" }` or `{ "grade": "forgot" }`: self-graded, for any card (including "I give up" on a quiz).
- `{ "choice": 2 }` for a choice quiz, or `{ "answer": "text" }` for a text quiz: graded on the server.
  Correct counts as `got`, wrong as `forgot`.

```json
{
  "review": Review,
  "result": { "grade": "got", "correct": true, "correctAnswer": { "answer": "const", "correctIndex": 2 } }
}
```

`correct` is `null` for a self-graded answer. `correctAnswer` is `null` when the lesson has no quiz,
otherwise it reveals the answer (as in the quiz answer route). A quiz answer also records the first quiz attempt.

Errors: `400` for a bad or missing grade, both a grade and an answer, a quiz answer on a lesson with no quiz,
or the wrong answer type; `409 NOT_DUE` when `dueAt` is still in the future, or when a concurrent
submit already answered this due card (each due card is answered once).

## Feed

### `GET /feed?page=&limit=` (auth)

```json
{
  "items": [
    { "type": "review", "review": Review },
    { "type": "lesson", "lesson": Lesson },
    { "type": "lesson", "lesson": Lesson }
  ],
  "page": 1, "limit": 20, "hasMore": true,
  "dueCount": 3
}
```

`dueCount` is the number of reviews due now. Each item is typed: `lesson` items carry a Lesson (quiz answers per the usual rule),
`review` items carry a Review whose lesson hides the quiz answer. After answering a review, refetch from page 1:
answered cards leave the feed and later pages shift. Logged-out visitors use `GET /lessons/explore` instead.

## Analytics

| Route | Access | Response |
|---|---|---|
| `GET /analytics/lessons/most-remembered?limit=` | optional | `{ "items": [Lesson] }` ordered by `rememberCount`, highest first (ties: older lesson id first). Only lessons remembered at least once. |
| `GET /analytics/teachers/top?limit=` | public | `{ "items": [{ "user": PublicUser, "learners": 4, "remembers": 9, "lessons": 6 }] }`. `learners` is the number of distinct people who remember at least one of the author's lessons (the ranking key; ties by `remembers`). |
| `GET /analytics/me` | auth | `{ "stats": MyStats }`, below. |
| `GET /analytics/community` | public | `{ "users": 5, "lessons": 26, "remembers": 40, "reviewsDone": 120, "mastered": 9 }`: counts of users, lessons, live review cards, answered reviews and mastered cards. |

`limit` on the leaderboards is 1-20, default 5.

MyStats:

```json
{
  "currentStreak": 5, "bestStreak": 9, "reviewedToday": false,
  "mastered": 4, "remembered": 12, "dueToday": 3, "reviewsThisWeek": 17,
  "reviewsByDay": [{ "date": "2026-10-08", "count": 2 }, "… 7 entries …", { "date": "2026-10-14", "count": 3 }],
  "timezone": "Asia/Kolkata"
}
```

- `mastered`: cards with `interval >= 21` days. `remembered`: all of the user's cards.
- `dueToday`: cards with `dueAt <= now`. Since cards come due at local midnight, that is everything due today or overdue.
- `reviewsThisWeek`: answers given from local midnight six days ago until now (today plus the six days before it).
- `reviewsByDay`: the same window split by local day: always 7 entries, oldest first, today last, each
  `{ "date": "YYYY-MM-DD", "count": n }` (days with no answers have `count: 0`). Days follow the streak rule below.
- `currentStreak`, `bestStreak`, `reviewedToday`: see [Streaks and time zones](#streaks-and-time-zones).

## Spaced repetition (SM-2 rules)

A binary-grade variant of SM-2 (`src/api/services/srs.js`). Every card has
`ease` (starts 2.5), `interval` (days), `repetitions` (successful answers in a row), `lapses` and `dueAt`.

1. **Remember:** `ease = 2.5`, `interval = 1`, `repetitions = 0`, `lapses = 0`, due in 1 day.
2. **Got it** (or a correct quiz answer): `repetitions += 1`, then
   - `repetitions` 1 → `interval = 3`; 2 → `7`; 3 → `30`;
   - `repetitions` 4 or more → `interval = max(interval + 1, round(interval × ease))`;
   - then `ease = min(3.0, ease + 0.1)`.
3. **Forgot** (or a wrong quiz answer): `repetitions = 0`, `interval = 1`, `lapses += 1`, `ease = max(1.3, ease − 0.2)`.
4. **Due date:** `dueAt` is local midnight, in the user's time zone, `interval` calendar days after the day of the answer
   (or of remembering). So a card remembered at 23:00 is due at the next midnight, and one answered "got" at 08:00
   on day 1 with `interval = 3` is due at 00:00 on day 4.
5. **Due:** a card is due when `dueAt <= now`. Only due cards can be answered.
6. **Mastered:** `interval >= 21` days. With no lapses that is reached after the third "got" in a row.
7. Ease uses two decimals (rounded after each change).

So a lesson you keep getting right comes back after 1 day, then 3 days, then 1 week, then about a month (30 days),
then about 2.5 months (`round(30 × 2.8) = 84`), and so on. A "forgot" sends it back to tomorrow and lowers its ease.

## Feed mixing rule

`src/api/services/feed.js`, `mixFeed`. For viewer V at time `now`:

1. **Followed lessons:** lessons by authors V follows, newest first.
2. **Discovery lessons:** lessons by everyone else except V, newest first.
3. Both lesson streams leave out V's own lessons and lessons V already remembers (those come back as reviews).
4. **Reviews:** V's cards with `dueAt <= now`, most overdue first (ties by card id).
5. **Lessons** are merged as 2 followed, then 1 discovery, repeating.
6. **The feed** is 1 review, then 2 lessons, repeating, starting with a review.
7. When any stream runs out, the rest of the other stream continues in its own order
   (so a viewer who follows nobody gets discovery lessons, and someone with 10 due reviews and 2 lessons
   gets R L L R R R …).
8. The merged sequence is paged with `page` and `limit`. Each stream considers at most its 500 newest
   (or most overdue) entries.

Example, with followed `F1 F2 F3`, discovery `D1 D2` and reviews `R1 R2`:
lessons `F1 F2 D1 F3 D2`, feed `R1 F1 F2 R2 D1 F3 D2`.

## Streaks and time zones

Every user has a `timezone` (IANA, default `UTC`, set at sign-up or with `PATCH /users/me`).
Days are calendar days in that zone. Streak days and "this week" use the user's **current** zone, including
for past answers. A card's `dueAt` is computed with the zone the user had when they remembered or answered it.

- A **review day** is a local day on which the user answered at least one review (`POST /reviews/:id/answer`).
  Remembering a lesson or answering a quiz outside the review queue does not count.
- **currentStreak**: the number of consecutive review days ending today. If there is no review yet today,
  it counts back from yesterday instead, so the streak stays alive until the day ends; with no review today
  or yesterday it is 0.
- **bestStreak**: the longest run of consecutive review days ever (at least `currentStreak`).
- **reviewedToday**: whether today is already a review day.

## Demo seed

`npm run seed` (needs `MONGO_URI`) loads a demo community: 5 users, 26 lessons on JS, CSS, Git, DSA and career
(quizzes on half of them), follows, and three weeks of simulated review history, so streaks, mastered lessons and
due reviews exist on the first day. Every demo user has at least one lesson without a quiz and one multiple-choice
quiz due today, so both ways of answering on the Review screen (swipe or keys, lettered choices) show up. Every demo user's password is **`sharewise123`**:

| Name | Email | Handle |
|---|---|---|
| Maya Chen | `maya@sharewise.dev` | `maya` |
| Omar Haddad | `omar@sharewise.dev` | `omar` |
| Priya Nair | `priya@sharewise.dev` | `priya` |
| Sam Okafor | `sam@sharewise.dev` | `sam` |
| Lena Vogel | `lena@sharewise.dev` | `lena` |

The seed is idempotent: it upserts the demo users and lessons by email and title (restoring their seeded content and
password), then rebuilds the demo users' follows, cards, quiz answers and review history relative to the current time.
Running it again gives the same state. It does not touch other users or their data.
