const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const Lesson = require("../src/api/models/lesson.model");
const Review = require("../src/api/models/review.model");
const User = require("../src/api/models/user.model");
const { seed } = require("../src/seed");
const data = require("../src/seed/data");
const { startDb, stopDb, api, signup, createLesson, clock } = require("./helpers");

before(startDb);
after(stopDb);

const NOW = new Date("2026-10-14T10:00:00Z");

describe("demo seed", () => {
  it("has 4-5 users and 20-30 lessons across the core tags, about half with quizzes", () => {
    assert.ok(data.users.length >= 4 && data.users.length <= 5);
    assert.ok(data.lessons.length >= 20 && data.lessons.length <= 30);
    const tags = new Set(data.lessons.flatMap((l) => l.tags));
    for (const tag of ["js", "css", "git", "dsa", "career"]) assert.ok(tags.has(tag), tag);
    const quizzes = data.lessons.filter((l) => l.quiz).length;
    assert.ok(quizzes >= data.lessons.length * 0.4 && quizzes <= data.lessons.length * 0.6);
  });

  it("is idempotent and leaves other users alone", async () => {
    clock.set(NOW);
    const outsider = await signup("outsider");
    const first = await seed({ now: NOW });
    const own = await createLesson(outsider, { title: "Outsider lesson" });
    const mayaLesson = await Lesson.findOne({ title: "Debounce search inputs" });
    await api().post(`/api/lessons/${mayaLesson._id}/remember`).set(...outsider.auth).expect(201);

    const second = await seed({ now: NOW });
    assert.deepEqual(second, first);
    assert.equal(await User.countDocuments(), 6);
    assert.equal(await Lesson.countDocuments(), data.lessons.length + 1);
    assert.ok(await Lesson.findById(own.id));
    assert.equal(await Review.countDocuments({ user: outsider.user.id }), 1);
  });

  it("gives every demo user a working login, due reviews today and history", async () => {
    clock.set(NOW);
    await seed({ now: NOW });
    const streaks = {};
    for (const { email, handle } of data.users) {
      const login = await api().post("/api/auth/login").send({ email, password: data.PASSWORD });
      assert.equal(login.status, 200, email);
      const auth = ["Authorization", `Bearer ${login.body.token}`];
      const { stats } = (await api().get("/api/analytics/me").set(...auth)).body;
      assert.ok(stats.dueToday >= 2, `${handle} has reviews due`);
      assert.ok(stats.bestStreak >= 2, `${handle} has history`);
      const activity = (await api().get(`/api/users/${handle}/activity`)).body;
      assert.ok(activity.activeDays >= 15, `${handle} has a lively heatmap (${activity.activeDays} days)`);
      streaks[handle] = stats.currentStreak;

      const feed = (await api().get("/api/feed").set(...auth)).body;
      assert.equal(feed.items[0].type, "review");
      assert.ok(feed.items.some((item) => item.type === "lesson"));
    }
    assert.ok(Object.values(streaks).filter((n) => n >= 3).length >= 3, JSON.stringify(streaks));
    const community = (await api().get("/api/analytics/community")).body;
    assert.ok(community.mastered > 0);
  });
});
