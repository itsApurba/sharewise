/**
 * The idempotent demo seed (see API.md, "Demo seed"). Demo users, lessons and decks are
 * upserted; the demo users' follows, cards, quiz answers and review history are
 * rebuilt by replaying three weeks of reviews through the real scheduler, ending
 * yesterday, so streaks, mastered lessons and due reviews exist today. Older review
 * history (to HISTORY_DAYS ago) is logged straight from each user's `history` pattern
 * so the twelve-week activity heatmap is filled in.
 */
const crypto = require("node:crypto");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const Deck = require("../api/models/deck.model");
const Follow = require("../api/models/follow.model");
const Lesson = require("../api/models/lesson.model");
const QuizAttempt = require("../api/models/quizAttempt.model");
const Review = require("../api/models/review.model");
const ReviewLog = require("../api/models/reviewLog.model");
const User = require("../api/models/user.model");
const { parseLessonInput } = require("../api/services/lessonInput");
const { newCard, schedule, isDue } = require("../api/services/srs");
const { DAY_MS, startOfLocalDay } = require("../lib/time");
const data = require("./data");

const HOUR_MS = 60 * 60 * 1000;
const FIRST_DAY = -21;
const HISTORY_DAYS = 84;
const MAX_REMEMBERS = 12;
/** Reviews each demo user has waiting today, at least. */
const DUE_TODAY = 2;
/**
 * Card kinds every demo user has due today, so the Review screen shows both ways of
 * answering on day one: swipe or keys on a plain lesson, lettered keys on a choice quiz.
 */
const DUE_KINDS = ["plain", "choice"];

const kindOf = (lesson) => lesson.quiz?.kind || "plain";

/** A stable pseudo-random integer, so every seed run makes the same choices. */
const hash = (...parts) => crypto.createHash("sha1").update(parts.join("|")).digest().readUInt32BE(0);

async function upsertUsers() {
  const passwordHash = await bcrypt.hash(data.PASSWORD, 10);
  const users = {};
  for (const { name, handle, email, bio, timezone } of data.users) {
    const user = (await User.findOne({ email })) || new User({ email });
    user.set({ name, handle, bio, timezone, passwordHash });
    await user.save();
    users[handle] = user;
  }
  return users;
}

async function upsertLessons(users, now) {
  const lessons = [];
  for (const { author, ago, ...content } of data.lessons) {
    const input = parseLessonInput(content);
    const createdAt = new Date(now.getTime() - ago * DAY_MS);
    const lesson = (await Lesson.findOne({ author: users[author]._id, title: input.title })) || new Lesson({ author: users[author]._id });
    lesson.set({ code: null, link: null, tags: [], quiz: null, ...input, createdAt, updatedAt: createdAt });
    await lesson.save({ timestamps: false });
    lessons.push(lesson);
  }
  return lessons;
}

async function upsertDecks(users, lessons, now) {
  const byTitle = new Map(lessons.map((l) => [l.title, l._id]));
  for (const { owner, lessons: titles, ...content } of data.decks) {
    const deck = (await Deck.findOne({ owner: users[owner]._id, title: content.title })) || new Deck({ owner: users[owner]._id });
    deck.set({ ...content, lessons: titles.map((title) => byTitle.get(title)), createdAt: now, updatedAt: now });
    await deck.save({ timestamps: false });
  }
  return data.decks.length;
}

/**
 * Replays one user's reviews from FIRST_DAY to yesterday. The user remembers two
 * lessons on the first day, then one more in the evening whenever their next active
 * day (or today) would otherwise have nothing due, so active days become review days.
 */
function simulate(user, active, lessons, now) {
  const tz = user.timezone;
  const candidates = lessons
    .filter((l) => String(l.author) !== String(user._id))
    .sort((a, b) => hash(user.handle, a.title) - hash(user.handle, b.title));
  const at = (day, hour) => new Date(startOfLocalDay(now, tz, day).getTime() + hour * HOUR_MS);
  const cards = [];
  const logs = [];
  const attempts = new Map();

  // A `kind` top-up for today may go past MAX_REMEMBERS.
  const remember = (when, kind) => {
    const index = candidates.findIndex((l) => l.createdAt < when && (!kind || kindOf(l) === kind));
    if (index === -1 || (!kind && cards.length === MAX_REMEMBERS)) return;
    const [lesson] = candidates.splice(index, 1);
    cards.push({ _id: new mongoose.Types.ObjectId(), user: user._id, lesson, ...newCard(when, tz), createdAt: when });
  };
  const dueCount = (when) => cards.filter((c) => isDue(c, when)).length;

  remember(at(FIRST_DAY, 9));
  remember(at(FIRST_DAY, 9));
  for (let day = FIRST_DAY; day < 0; day += 1) {
    if (active.has(day)) {
      const answerAt = at(day, 12);
      for (const card of cards.filter((c) => isDue(c, answerAt))) {
        const grade = hash(user.handle, card.lesson.title, day) % 5 === 0 ? "forgot" : "got";
        Object.assign(card, schedule(card, grade, answerAt, tz));
        logs.push({ user: user._id, lesson: card.lesson._id, grade, interval: card.interval, reviewedAt: answerAt });
        const key = String(card.lesson._id);
        if (card.lesson.quiz && !attempts.has(key)) {
          attempts.set(key, { user: user._id, lesson: card.lesson._id, correct: grade === "got", createdAt: answerAt, updatedAt: answerAt });
        }
      }
    }
    const next = day + 1;
    const wanted = next === 0 ? DUE_TODAY : active.has(next) ? 1 : 0;
    for (let n = dueCount(at(next, 12)); n < wanted && cards.length < MAX_REMEMBERS; n += 1) remember(at(day, 18));
  }
  const dueToday = cards.filter((c) => isDue(c, at(0, 12)));
  for (const kind of DUE_KINDS) {
    if (!dueToday.some((c) => kindOf(c.lesson) === kind)) remember(at(-1, 18), kind);
  }
  return {
    cards: cards.map(({ lesson, createdAt, ...card }) => ({ ...card, lesson: lesson._id, createdAt, updatedAt: card.lastReviewedAt || createdAt, __v: 0 })),
    logs,
    attempts: [...attempts.values()],
  };
}

/**
 * Review log rows for the days before the simulation. They only feed history (heatmap, streaks,
 * review totals); the cards themselves come from `simulate`.
 */
function history(user, { rate, peak, weekdays = false }, lessons, now) {
  const tz = user.timezone;
  const pool = lessons.filter((l) => String(l.author) !== String(user._id));
  const logs = [];
  for (let day = 1 - HISTORY_DAYS; day < FIRST_DAY; day += 1) {
    const start = startOfLocalDay(now, tz, day);
    const weekday = new Date(start.getTime() + 12 * HOUR_MS).toLocaleDateString("en-US", { weekday: "short", timeZone: tz });
    if (weekdays && (weekday === "Sat" || weekday === "Sun")) continue;
    if (hash(user.handle, "history", day) % 100 >= rate * 100) continue;
    const count = 1 + (hash(user.handle, "count", day) % peak);
    for (let n = 0; n < count; n += 1) {
      const lesson = pool[hash(user.handle, day, n) % pool.length];
      const grade = hash(user.handle, "grade", day, n) % 5 === 0 ? "forgot" : "got";
      logs.push({ user: user._id, lesson: lesson._id, grade, interval: grade === "got" ? 6 : 1, reviewedAt: new Date(start.getTime() + (8 + n) * HOUR_MS) });
    }
  }
  return logs;
}

/** Seeds the demo community as of `now`. Safe to run repeatedly. */
async function seed({ now = new Date() } = {}) {
  await Promise.all(Object.values(mongoose.models).map((model) => model.init()));
  const users = await upsertUsers();
  const lessons = await upsertLessons(users, now);
  const decks = await upsertDecks(users, lessons, now);
  const ids = Object.values(users).map((u) => u._id);

  await Promise.all([
    Follow.deleteMany({ follower: { $in: ids } }),
    Review.deleteMany({ user: { $in: ids } }),
    ReviewLog.deleteMany({ user: { $in: ids } }),
    QuizAttempt.deleteMany({ user: { $in: ids } }),
  ]);

  const follows = [];
  const cards = [];
  const logs = [];
  const attempts = [];
  for (const spec of data.users) {
    const user = users[spec.handle];
    for (const handle of spec.follows) {
      follows.push({ follower: user._id, followee: users[handle]._id, createdAt: now, updatedAt: now });
    }
    const result = simulate(user, new Set(spec.active), lessons, now);
    cards.push(...result.cards);
    logs.push(...history(user, spec.history, lessons, now), ...result.logs);
    attempts.push(...result.attempts);
  }
  await Promise.all([
    Follow.collection.insertMany(follows),
    cards.length && Review.collection.insertMany(cards),
    logs.length && ReviewLog.collection.insertMany(logs),
    attempts.length && QuizAttempt.collection.insertMany(attempts),
  ]);
  return { users: ids.length, lessons: lessons.length, decks, follows: follows.length, reviews: cards.length, reviewLogs: logs.length };
}

module.exports = { seed };
