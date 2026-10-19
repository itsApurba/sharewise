const { describe, it, before, after, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const { api, signup, createLesson, resetDb, clock } = require("./helpers");
const mongoose = require("mongoose");
const { MongoMemoryReplSet } = require("mongodb-memory-server");
const { seed } = require("../src/seed");
const data = require("../src/seed/data");
const { restoreDemo, HOUR_MS } = require("../src/api/services/demoRestore");
const User = require("../src/api/models/user.model");
const Lesson = require("../src/api/models/lesson.model");
const Deck = require("../src/api/models/deck.model");
const Follow = require("../src/api/models/follow.model");
const Review = require("../src/api/models/review.model");
const ReviewLog = require("../src/api/models/reviewLog.model");
const QuizAttempt = require("../src/api/models/quizAttempt.model");
const DemoState = require("../src/api/models/demoState.model");
const NOW = new Date("2026-10-14T10:00:00Z");
let mongo;
before(async () => {
  mongo = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  await mongoose.connect(mongo.getUri());
  await Promise.all(Object.values(mongoose.models).map((m) => m.init()));
});
after(async () => { clock.reset(); await mongoose.disconnect(); await mongo.stop(); });
beforeEach(async () => { await resetDb(); clock.set(NOW); delete process.env.CRON_SECRET; });
const at = (hours) => new Date(NOW.getTime() + hours * HOUR_MS);
async function initialize() {
  await seed({ now: NOW });
  await restoreDemo({ now: NOW });
}
async function demoLogin() {
  const res = await api().post("/api/auth/login").send({ email: data.users[0].email, password: data.PASSWORD }).expect(200);
  return ["Authorization", `Bearer ${res.body.token}`];
}
async function snapshot(models = [User, Lesson, Deck, Follow, Review, ReviewLog, QuizAttempt]) {
  const result = {};
  for (const model of models) result[model.modelName] = await model.find().sort({ _id: 1 }).select(model === User ? "+passwordHash" : "").lean();
  return JSON.parse(JSON.stringify(result));
}

describe("bounded demo restoration", () => {
  it("restores changed, missing and extra records of every kind and preserves non-demo records and sessions", async () => {
    await initialize();
    const auth = await demoLogin();
    const maya = await User.findOne({ email: data.users[0].email }).select("+passwordHash");
    const expectedHash = maya.passwordHash;
    const canonical = await Lesson.findOne({ author: maya._id });
    const deck = await Deck.findOne({ owner: maya._id });
    const outsider = await signup("outsider");
    const realLesson = await createLesson(outsider);
    await api().post(`/api/lessons/${canonical._id}/remember`).set(...outsider.auth).expect(201);
    await api().post("/api/decks").set(...outsider.auth).send({ title: "Real collection", emoji: "📚", color: "honey" }).expect(201);
    const realDeck = await Deck.findOne({ owner: outsider.user.id });
    const extra = await Lesson.create({ author: maya._id, title: "Extra", body: "Temporary" });
    await api().post(`/api/lessons/${extra._id}/remember`).set(...outsider.auth).expect(201);
    realDeck.lessons = [canonical._id, extra._id]; await realDeck.save();
    await Follow.create({ follower: outsider.user.id, followee: maya._id });
    await QuizAttempt.create({ user: outsider.user.id, lesson: canonical._id, correct: true });
    await ReviewLog.create({ user: outsider.user.id, lesson: canonical._id, grade: "got", interval: 3, reviewedAt: NOW });
    const preserved = {};
    for (const [model, field] of [[User, "_id"], [Lesson, "author"], [Deck, "owner"], [Follow, "follower"], [Review, "user"], [QuizAttempt, "user"], [ReviewLog, "user"]]) {
      preserved[model.modelName] = JSON.stringify(await model.find({ [field]: outsider.user.id }).lean());
    }
    await User.updateOne({ _id: maya._id }, { $set: { name: "Changed", handle: "changed_maya", bio: "Edited" } });
    await Lesson.updateOne({ _id: canonical._id }, { $set: { title: "Renamed", body: "Changed" } });
    const missing = await Lesson.findOne({ _id: { $ne: canonical._id } });
    await Lesson.deleteOne({ _id: missing._id });
    await Deck.deleteOne({ _id: deck._id });
    await Deck.create({ owner: maya._id, title: "Extra deck", emoji: "📚", color: "honey" });
    await Follow.deleteMany({ follower: maya._id });
    await Follow.create({ follower: maya._id, followee: outsider.user.id });
    await Review.deleteMany({ user: maya._id });
    await Review.create({ user: maya._id, lesson: realLesson.id, ease: 2.5, interval: 1, repetitions: 0, dueAt: NOW });
    await ReviewLog.updateMany({ user: maya._id }, { $set: { interval: 999 } });
    await QuizAttempt.deleteMany({ user: maya._id });
    await QuizAttempt.create({ user: maya._id, lesson: realLesson.id, correct: false });
    const response = await api().post("/api/restore").set(...auth).expect(200);
    assert.equal(response.body.restored, true);
    assert.equal((await Lesson.findById(canonical._id)).title, canonical.title);
    assert.ok(await Lesson.findById(missing._id));
    assert.equal(await Lesson.findById(extra._id), null);
    assert.ok(await Deck.findById(deck._id));
    assert.equal(await Lesson.countDocuments({ author: { $ne: outsider.user.id } }), data.lessons.length);
    assert.equal(await Deck.countDocuments({ owner: { $ne: outsider.user.id } }), data.decks.length);
    assert.equal(await Follow.countDocuments({ follower: maya._id, followee: outsider.user.id }), 0);
    assert.equal(await Review.countDocuments({ user: maya._id, lesson: realLesson.id }), 0);
    assert.equal(await ReviewLog.countDocuments({ user: maya._id, interval: 999 }), 0);
    assert.ok(await QuizAttempt.countDocuments({ user: maya._id }));
    assert.equal((await User.findById(maya._id).select("+passwordHash")).passwordHash, expectedHash);
    await api().get("/api/auth/me").set(...auth).expect(200);
    for (const [model, field] of [[User, "_id"], [Lesson, "author"], [Deck, "owner"], [Follow, "follower"], [Review, "user"], [QuizAttempt, "user"], [ReviewLog, "user"]]) {
      assert.equal(JSON.stringify(await model.find({ [field]: outsider.user.id }).lean()), preserved[model.modelName], model.modelName);
    }
    const beforeNoop = await snapshot();
    assert.equal((await restoreDemo({ now: at(1) })).reason, "unchanged");
    assert.deepEqual(await snapshot(), beforeNoop);
  });

  it("recreates missing demo accounts with their same identity and credential without invalidating sessions", async () => {
    // Seed registration is sufficient even before the first restore invocation.
    await seed({ now: NOW });
    const auth = await demoLogin();
    const user = await User.findOne({ email: data.users[0].email }).select("+passwordHash").lean();
    await User.deleteOne({ _id: user._id });
    assert.equal((await restoreDemo()).restored, true);
    const restored = await User.findById(user._id).select("+passwordHash");
    assert.equal(restored.passwordHash, user.passwordHash);
    await api().get("/api/auth/me").set(...auth).expect(200);
    await demoLogin();
  });

  it("serializes simultaneous first and repeated invocations across database sessions", async () => {
    await seed({ now: NOW });
    // Simulate an existing deployment seeded before the registry was introduced.
    await DemoState.deleteMany({});
    const first = await Promise.all(Array.from({ length: 4 }, () => restoreDemo({ now: NOW })));
    assert.equal(first.filter((r) => r.restored).length, 1);
    const before = await snapshot();
    const again = await Promise.all(Array.from({ length: 4 }, () => restoreDemo({ now: at(1) })));
    assert.ok(again.every((r) => r.reason === "unchanged"));
    assert.deepEqual(await snapshot(), before);
    await Lesson.updateOne({}, { $set: { body: "Dirty" } });
    const dirty = await Promise.all([restoreDemo({ now: at(2) }), restoreDemo({ now: at(2), hourly: true })]);
    assert.equal(dirty.filter((r) => r.restored).length, 1);
  });

  it("does not rewrite an unchanged seed or advance fixture dates just because time passed", async () => {
    await seed({ now: NOW });
    const before = await snapshot();
    assert.equal((await restoreDemo({ now: at(48) })).reason, "unchanged");
    assert.deepEqual(await snapshot(), before);
  });

  it("checks at most hourly, restores only changed data, and rejects unauthorized cron requests", async () => {
    await initialize();
    await api().get("/api/restore/hourly").expect(401);
    process.env.CRON_SECRET = "a-long-test-only-cron-secret";
    await api().get("/api/restore/hourly").set("Authorization", "Bearer wrong").expect(401);
    await api().get("/api/restore/hourly").set(...await demoLogin()).expect(401);
    const request = () => api().get("/api/restore/hourly").set("Authorization", `Bearer ${process.env.CRON_SECRET}`).expect(200);
    await Lesson.updateOne({}, { $set: { body: "Hourly change" } });
    clock.set(at(0.99)); assert.equal((await request()).body.reason, "not-due");
    clock.set(at(1)); assert.equal((await request()).body.restored, true);
    const before = await snapshot();
    clock.set(at(2)); assert.equal((await request()).body.reason, "unchanged");
    assert.deepEqual(await snapshot(), before);
    assert.equal((await DemoState.findOne()).checkedAt.getTime(), at(2).getTime());
    // Adjacent UTC hours remain eligible even when the scheduler fires early.
    clock.set(at(3.4)); assert.equal((await request()).body.reason, "unchanged");
    clock.set(at(4.2)); assert.equal((await request()).body.reason, "unchanged");
  });

  it("requires an explicit demo-authenticated POST with no arbitrary selectors and reserves demo emails", async () => {
    await initialize();
    const outsider = await signup("outsider");
    const auth = await demoLogin();
    const before = await snapshot();
    await api().get("/api/restore").set(...auth).expect(404);
    await api().post("/api/restore").expect(401);
    await api().post("/api/restore").set(...outsider.auth).expect(403);
    await api().post("/api/restore").set(...auth).send({ user: outsider.user.id }).expect(400);
    await api().post("/api/restore?user=all").set(...auth).expect(400);
    assert.deepEqual(await snapshot(), before);
    await api().post("/api/auth/signup").send({ name: "Imposter", handle: "imposter", email: data.users[0].email, password: "password123" }).expect(400);
  });

  it("refuses to overwrite a baseline lesson that now belongs to a real user", async () => {
    await initialize();
    const outsider = await signup("outsider");
    const lesson = await Lesson.findOne();
    await Lesson.updateOne({ _id: lesson._id }, { $set: { author: outsider.user.id } });
    const before = await snapshot();
    await assert.rejects(restoreDemo(), /no longer demo-owned/);
    assert.deepEqual(await snapshot(), before);
  });

  it("does not adopt fixture emails with a different password on an older deployment", async () => {
    await seed({ now: NOW });
    await DemoState.deleteMany({});
    await User.updateOne({ email: data.users[0].email }, { $set: { passwordHash: await require("bcryptjs").hash("not-the-demo-password", 10) } });
    const before = await snapshot();
    await assert.rejects(restoreDemo(), /Cannot identify seeded demo account/);
    assert.equal(await DemoState.countDocuments(), 0);
    assert.deepEqual(await snapshot(), before);
  });

  it("fails closed without established seed identity and rolls back handle conflicts", async () => {
    const outsider = await signup("maya");
    await assert.rejects(restoreDemo(), /Cannot identify seeded demo account/);
    assert.equal(await DemoState.countDocuments(), 0);
    await resetDb(); await initialize();
    const maya = await User.findOne({ email: data.users[0].email });
    await User.updateOne({ _id: maya._id }, { $set: { handle: "changed_maya" } });
    const real = await signup("maya");
    const before = await snapshot();
    await assert.rejects(restoreDemo(), /belongs to a non-demo account/);
    assert.deepEqual(await snapshot(), before);
    assert.ok(real.user.id); assert.ok(outsider.user.id);
  });
});
