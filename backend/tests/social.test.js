const { describe, it, before, after, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const Follow = require("../src/api/models/follow.model");
const Lesson = require("../src/api/models/lesson.model");
const QuizAttempt = require("../src/api/models/quizAttempt.model");
const Review = require("../src/api/models/review.model");
const ReviewLog = require("../src/api/models/reviewLog.model");
const User = require("../src/api/models/user.model");
const { startDb, stopDb, resetDb, api, signup, createLesson, clock } = require("./helpers");

before(startDb);
after(stopDb);
beforeEach(resetDb);

const follow = (who, handle) => api().post(`/api/users/${handle}/follow`).set(...who.auth);

describe("follows and profiles", () => {
  it("follows idempotently and counts both ways", async () => {
    const maya = await signup("maya");
    const omar = await signup("omar");
    let res = await follow(omar, "MAYA");
    assert.equal(res.status, 201);
    assert.deepEqual(res.body, { user: { id: maya.user.id, name: "Maya", handle: "maya" }, isFollowing: true, followers: 1 });
    res = await follow(omar, "maya");
    assert.equal(res.status, 200);
    assert.equal(res.body.followers, 1);

    res = await api().get("/api/users/maya/followers");
    assert.deepEqual(
      res.body.items.map((u) => u.handle),
      ["omar"]
    );
    res = await api().get("/api/users/omar/following");
    assert.deepEqual(
      res.body.items.map((u) => u.handle),
      ["maya"]
    );
    assert.equal(res.body.items[0].email, undefined);

    assert.equal((await api().delete("/api/users/maya/follow").set(...omar.auth)).status, 204);
    assert.equal((await api().delete("/api/users/maya/follow").set(...omar.auth)).status, 204);
    assert.equal(await Follow.countDocuments(), 0);
  });

  it("refuses to follow yourself, unknown users and anonymous follows", async () => {
    const maya = await signup("maya");
    assert.equal((await follow(maya, "maya")).status, 400);
    assert.equal((await follow(maya, "ghost")).status, 404);
    assert.equal((await api().post("/api/users/maya/follow")).status, 401);
  });

  it("shows a profile with counts, stats and viewer flags", async () => {
    clock.set("2026-03-10T12:00:00Z");
    const maya = await signup("maya");
    const omar = await signup("omar");
    await createLesson(maya, { title: "First" });
    await createLesson(maya, { title: "Second" });
    await follow(omar, "maya").expect(201);

    let res = await api().get("/api/users/maya").set(...omar.auth);
    assert.equal(res.status, 200);
    assert.deepEqual(res.body.counts, { lessons: 2, followers: 1, following: 0 });
    assert.deepEqual(res.body.stats, { currentStreak: 0, bestStreak: 0, mastered: 0 });
    assert.deepEqual(res.body.viewer, { isSelf: false, isFollowing: true });
    assert.equal(res.body.user.email, undefined);

    res = await api().get("/api/users/maya");
    assert.equal(res.body.viewer, null);
    res = await api().get("/api/users/maya").set(...maya.auth);
    assert.deepEqual(res.body.viewer, { isSelf: true, isFollowing: false });

    res = await api().get("/api/users/maya/lessons?limit=1");
    assert.deepEqual(
      res.body.items.map((l) => l.title),
      ["Second"]
    );
    assert.equal(res.body.hasMore, true);
    assert.equal((await api().get("/api/users/nobody")).status, 404);
  });

  it("searches people by name or handle", async () => {
    await signup("maya");
    await signup("omar");
    const res = await api().get("/api/users?q=MA");
    assert.deepEqual(
      res.body.items.map((u) => u.handle),
      ["maya", "omar"]
    );
    assert.deepEqual(
      (await api().get("/api/users?q=oma")).body.items.map((u) => u.handle),
      ["omar"]
    );
    assert.equal((await api().get("/api/users?q=(")).status, 200);
  });
});

describe("deleting your account", () => {
  it("removes the user's lessons, cards, history, answers and follows, but not other users' history", async () => {
    clock.set("2026-03-10T12:00:00Z");
    const maya = await signup("maya");
    const omar = await signup("omar");
    const mine = await createLesson(maya, { quiz: { prompt: "Yes or no?", answer: "yes" } });
    const theirs = await createLesson(omar);
    await follow(omar, "maya").expect(201);
    await follow(maya, "omar").expect(201);
    const omarCard = (await api().post(`/api/lessons/${mine.id}/remember`).set(...omar.auth)).body.review;
    await api().post(`/api/lessons/${theirs.id}/remember`).set(...maya.auth).expect(201);
    await api().post(`/api/lessons/${mine.id}/quiz/answer`).set(...omar.auth).send({ answer: "yes" }).expect(200);
    clock.set(omarCard.dueAt);
    await api().post(`/api/reviews/${omarCard.id}/answer`).set(...omar.auth).send({ grade: "got" }).expect(200);

    assert.equal((await api().delete("/api/users/me").set(...maya.auth)).status, 204);

    assert.equal(await User.countDocuments({ handle: "maya" }), 0);
    assert.equal(await Lesson.countDocuments(), 1);
    assert.equal(await Review.countDocuments(), 0);
    assert.equal(await QuizAttempt.countDocuments(), 0);
    assert.equal(await Follow.countDocuments(), 0);
    assert.equal(await ReviewLog.countDocuments({ user: omar.user.id }), 1); // omar keeps his streak history
    assert.equal((await api().get("/api/auth/me").set(...maya.auth)).status, 401);
    assert.equal((await api().get("/api/users/maya")).status, 404);
  });
});

describe("feed", () => {
  it("mixes due reviews with followed and discovery lessons", async () => {
    clock.set("2026-03-10T12:00:00Z");
    const viewer = await signup("viewer");
    const friend = await signup("friend");
    const stranger = await signup("stranger");
    await createLesson(stranger, { title: "D-old" });
    const toReview = await createLesson(friend, { title: "Reviewed", quiz: { prompt: "Answer?", answer: "secret" } });
    await follow(viewer, "friend").expect(201);
    await api().post(`/api/lessons/${toReview.id}/remember`).set(...viewer.auth).expect(201);
    await createLesson(viewer, { title: "Mine" });

    clock.set("2026-03-12T12:00:00Z");
    for (const title of ["F-1", "F-2", "F-3"]) await createLesson(friend, { title });
    await createLesson(stranger, { title: "D-new" });

    const res = await api().get("/api/feed").set(...viewer.auth);
    assert.equal(res.status, 200);
    assert.equal(res.body.dueCount, 1);
    const labels = res.body.items.map((item) => (item.type === "review" ? `R:${item.review.lesson.title}` : item.lesson.title));
    // Followed are newest first, discovery newest first; own and remembered lessons are left out.
    assert.deepEqual(labels, ["R:Reviewed", "F-3", "F-2", "D-new", "F-1", "D-old"]);
    assert.equal(res.body.items[0].review.lesson.quiz.answer, undefined);
    assert.equal(res.body.hasMore, false);

    const page2 = await api().get("/api/feed?limit=4&page=2").set(...viewer.auth);
    assert.deepEqual(
      page2.body.items.map((item) => item.lesson.title),
      ["F-1", "D-old"]
    );
    assert.equal(page2.body.hasMore, false);
    assert.equal((await api().get("/api/feed?limit=4").set(...viewer.auth)).body.hasMore, true);
  });

  it("drops a review from the feed once answered", async () => {
    clock.set("2026-03-10T12:00:00Z");
    const viewer = await signup("viewer");
    const friend = await signup("friend");
    const lesson = await createLesson(friend);
    const card = (await api().post(`/api/lessons/${lesson.id}/remember`).set(...viewer.auth)).body.review;
    clock.set(card.dueAt);
    assert.equal((await api().get("/api/feed").set(...viewer.auth)).body.dueCount, 1);
    await api().post(`/api/reviews/${card.id}/answer`).set(...viewer.auth).send({ grade: "got" }).expect(200);
    const res = await api().get("/api/feed").set(...viewer.auth);
    assert.equal(res.body.dueCount, 0);
    assert.deepEqual(res.body.items, []);
  });

  it("requires a login", async () => {
    assert.equal((await api().get("/api/feed")).status, 401);
  });
});
