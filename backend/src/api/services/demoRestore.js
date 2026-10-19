const crypto = require("node:crypto");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const User = require("../models/user.model");
const Lesson = require("../models/lesson.model");
const Deck = require("../models/deck.model");
const Follow = require("../models/follow.model");
const Review = require("../models/review.model");
const ReviewLog = require("../models/reviewLog.model");
const QuizAttempt = require("../models/quizAttempt.model");
const DemoState = require("../models/demoState.model");
const data = require("../../seed/data");
const { simulate, history } = require("../../seed");
const { parseLessonInput } = require("./lessonInput");
const { DAY_MS } = require("../../lib/time");
const { conflict, forbidden } = require("../../lib/errors");
const clock = require("../../lib/clock");

const KEY = "sharewise-demo-v1";
const HOUR_MS = 60 * 60 * 1000;
const owned = [[User, "_id"], [Lesson, "author"], [Deck, "owner"], [Follow, "follower"],
  [Review, "user"], [ReviewLog, "user"], [QuizAttempt, "user"]];
const unsafe = (message) => conflict("DEMO_IDENTITY", message);
const oid = (id) => new mongoose.Types.ObjectId(String(id));
const newId = () => new mongoose.Types.ObjectId();
const isDemoEmail = (email) => data.users.some((u) => u.email === email);

// All reads use ownership indexes; neither fingerprinting nor deletion scans the
// database. Reading the small demo slice also catches raw/admin writes, missing
// rows and extras without fragile hooks on every application mutation.
async function readOwned(manifest, session) {
  const ids = manifest.users.map((u) => oid(u._id));
  const rows = {};
  for (const [model, owner] of owned) {
    rows[model.modelName] = await model.find({ [owner]: { $in: ids } }).session(session).lean();
  }
  return rows;
}

function canonical(value) {
  if (value instanceof Date) return value.toISOString();
  if (value instanceof mongoose.Types.ObjectId) return String(value);
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort().filter((k) => k !== "passwordHash").map((k) => [k, canonical(value[k])]));
  }
  return value;
}
function fingerprint(rows) {
  const normalized = Object.fromEntries(Object.entries(rows).map(([name, docs]) => [name,
    docs.map(canonical).sort((a, b) => String(a._id).localeCompare(String(b._id)))]));
  return crypto.createHash("sha256").update(JSON.stringify(canonical(normalized))).digest("hex");
}

async function identify(session) {
  const users = [];
  // Email is immutable in this app. On first use, require ALL five established
  // fixture emails AND their known seed password; never adopt by editable handle.
  for (const spec of data.users) {
    const user = await User.findOne({ email: spec.email }).select("+passwordHash").session(session).lean();
    if (!user || !await bcrypt.compare(data.PASSWORD, user.passwordHash)) {
      throw unsafe(`Cannot identify seeded demo account ${spec.email}; initialize the established demo seed before enabling restoration.`);
    }
    users.push({ _id: user._id, email: spec.email, passwordHash: user.passwordHash, createdAt: user.createdAt });
  }
  const byHandle = Object.fromEntries(data.users.map((u, i) => [u.handle, users[i]]));
  const lessons = [];
  for (const spec of data.lessons) {
    const row = await Lesson.findOne({ author: byHandle[spec.author]._id, title: spec.title }).session(session).lean();
    lessons.push(row?._id || newId());
  }
  const decks = [];
  for (const spec of data.decks) {
    const row = await Deck.findOne({ owner: byHandle[spec.owner]._id, title: spec.title }).session(session).lean();
    decks.push(row?._id || newId());
  }
  return { users, lessons, decks };
}

function baseline(manifest, now, current) {
  const rows = Object.fromEntries(owned.map(([m]) => [m.modelName, []]));
  const users = {};
  data.users.forEach((spec, i) => {
    const identity = manifest.users[i];
    const previous = current.User.find((u) => String(u._id) === String(identity._id));
    const user = new User({ _id: identity._id, email: identity.email, name: spec.name, handle: spec.handle,
      bio: spec.bio, timezone: spec.timezone, createdAt: previous?.createdAt || identity.createdAt, updatedAt: now, __v: 0 }).toObject();
    rows.User.push(user);
    users[spec.handle] = user;
  });
  data.lessons.forEach(({ author, ago, ...content }, i) => {
    const createdAt = new Date(now.getTime() - ago * DAY_MS);
    rows.Lesson.push(new Lesson({ _id: manifest.lessons[i], author: users[author]._id,
      ...parseLessonInput(content), createdAt, updatedAt: createdAt, __v: 0 }).toObject());
  });
  const byTitle = new Map(rows.Lesson.map((l) => [l.title, l._id]));
  data.decks.forEach(({ owner, lessons, ...content }, i) => {
    rows.Deck.push(new Deck({ _id: manifest.decks[i], owner: users[owner]._id, ...content,
      lessons: lessons.map((title) => byTitle.get(title)), createdAt: now, updatedAt: now, __v: 0 }).toObject());
  });
  for (const spec of data.users) {
    const user = users[spec.handle];
    for (const handle of spec.follows) rows.Follow.push(new Follow({ follower: user._id, followee: users[handle]._id,
      createdAt: now, updatedAt: now, __v: 0 }).toObject());
    const result = simulate(user, new Set(spec.active), rows.Lesson, now);
    rows.Review.push(...result.cards);
    rows.ReviewLog.push(...[...history(user, spec.history, rows.Lesson, now), ...result.logs].map((r) => new ReviewLog(r).toObject()));
    rows.QuizAttempt.push(...result.attempts.map((r) => new QuizAttempt({ ...r, __v: 0 }).toObject()));
  }
  return rows;
}

async function assertSafe(manifest, desired, session) {
  const ids = manifest.users.map((u) => oid(u._id));
  for (const identity of manifest.users) {
    const user = await User.findById(identity._id).session(session);
    if (user && user.email !== identity.email) throw unsafe("A registered demo ID has changed identity; refusing restoration.");
  }
  // Do not steal a handle/email or overwrite an ID now owned by a non-demo user.
  if (await User.exists({ _id: { $nin: ids }, $or: [
    { handle: { $in: data.users.map((u) => u.handle) } }, { email: { $in: data.users.map((u) => u.email) } },
  ] }).session(session)) throw unsafe("A demo handle or email belongs to a non-demo account; resolve the collision before restoring.");
  for (const [model, owner] of owned.slice(1)) {
    if (await model.exists({ _id: { $in: desired[model.modelName].map((r) => r._id) }, [owner]: { $nin: ids } }).session(session)) {
      throw unsafe("A baseline record is no longer demo-owned; refusing restoration.");
    }
  }
}

/** Called only by the explicit seed CLI, after it has established demo ownership.
 * Keeping IDs here allows restoration even if a demo user is later deleted.
 */
async function registerSeed({ users, lessons, now }) {
  const manifest = {
    users: data.users.map((spec) => {
      const user = users[spec.handle];
      return { _id: user._id, email: spec.email, passwordHash: user.passwordHash, createdAt: user.createdAt };
    }),
    lessons: lessons.map((lesson) => lesson._id),
    decks: [],
  };
  for (const spec of data.decks) {
    const deck = await Deck.findOne({ owner: users[spec.owner]._id, title: spec.title });
    manifest.decks.push(deck._id);
  }
  const current = await readOwned(manifest, null);
  // The seed upserts content but intentionally leaves extra lessons/decks. Do
  // not bless those extras as baseline: the first restore must remove them.
  const clean = current.Lesson.length === lessons.length && current.Deck.length === data.decks.length;
  await DemoState.updateOne({ _id: KEY }, { $set: { manifest, fingerprint: clean ? fingerprint(current) : null,
    restoredAt: clean ? now : null, checkedAt: clean ? now : null, revision: 0 } }, { upsert: true });
}

/** The only restore path, used by the manual POST and hourly cron.
 * Transactions provide all-or-nothing safety on Atlas. Writing the singleton
 * first serializes cross-instance invocations; Mongo retries write conflicts.
 */
async function restoreDemo({ now = clock.now(), hourly = false, actor } = {}) {
  // Establish the singleton before the transaction so simultaneous first calls
  // can converge on its unique key instead of failing with a duplicate insert.
  if (!await DemoState.exists({ _id: KEY })) {
    const manifest = await identify(null);
    try {
      await DemoState.updateOne({ _id: KEY }, { $setOnInsert: { manifest, revision: 0 } }, { upsert: true });
    } catch (error) {
      if (error.code !== 11000) throw error;
    }
  }
  return mongoose.connection.transaction(async (session) => {
    const state = await DemoState.findById(KEY).session(session);
    // UTC hour buckets tolerate scheduler jitter (e.g. 10:19 then 11:17).
    if (hourly && state.checkedAt && Math.floor(now.getTime() / HOUR_MS) <= Math.floor(state.checkedAt.getTime() / HOUR_MS)) {
      return { restored: false, reason: "not-due" };
    }
    const manifest = state.manifest;
    if (actor && !manifest.users.some((u) => String(u._id) === String(actor._id) && u.email === actor.email)) {
      throw forbidden("Only a seeded demo account may restore the demo community");
    }
    // A shared write forces simultaneous readers to retry against the winner's
    // fingerprint, rather than restoring twice or observing a partial rebuild.
    state.revision += 1;
    await state.save({ session });
    const current = await readOwned(manifest, session);
    if (state.fingerprint && fingerprint(current) === state.fingerprint) {
      if (hourly) { state.checkedAt = now; await state.save({ session }); }
      return { restored: false, reason: "unchanged", restoredAt: state.restoredAt };
    }
    const desired = baseline(manifest, now, current);
    await assertSafe(manifest, desired, session);
    const ids = manifest.users.map((u) => oid(u._id));
    for (const [model, owner] of owned) {
      const docs = desired[model.modelName];
      if (model === User) {
        for (const user of docs) {
          const { _id, ...profile } = user;
          const identity = manifest.users.find((u) => String(u._id) === String(_id));
          await User.collection.updateOne({ _id }, { $set: profile, $setOnInsert: { passwordHash: identity.passwordHash } }, { upsert: true, session });
        }
      } else {
        // Deliberately do NOT use cascade helpers: another user's cards, follows,
        // history and decks remain untouched even when referencing demo content.
        await model.deleteMany({ [owner]: { $in: ids } }).session(session);
        if (docs.length) await model.collection.insertMany(docs, { session });
      }
    }
    state.fingerprint = fingerprint(desired);
    state.restoredAt = now;
    state.checkedAt = now;
    await state.save({ session });
    return { restored: true, restoredAt: now };
  });
}

module.exports = { restoreDemo, registerSeed, isDemoEmail, HOUR_MS };
