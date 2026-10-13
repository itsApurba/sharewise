const { describe, it, before, after, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const { startDb, stopDb, resetDb, api, signup, createLesson, clock } = require("./helpers");

before(startDb);
after(stopDb);
beforeEach(resetDb);

const remember = (who, lesson) => api().post(`/api/lessons/${lesson.id}/remember`).set(...who.auth).expect(201);

describe("leaderboards and totals", () => {
  it("ranks lessons by remembers and teachers by distinct learners", async () => {
    clock.set("2026-03-10T12:00:00Z");
    const [maya, omar, priya, sam] = await Promise.all(["maya", "omar", "priya", "sam"].map((h) => signup(h)));
    const popular = await createLesson(maya, { title: "Popular", quiz: { prompt: "Secret?", answer: "hidden" } });
    const niche = await createLesson(maya, { title: "Niche" });
    const omars = await createLesson(omar, { title: "Omar's" });
    await createLesson(omar, { title: "Unremembered" });

    for (const who of [omar, priya, sam]) await remember(who, popular);
    await remember(priya, niche);
    await remember(priya, omars);
    await remember(sam, omars);

    let res = await api().get("/api/analytics/lessons/most-remembered");
    assert.deepEqual(
      res.body.items.map((l) => [l.title, l.rememberCount]),
      [
        ["Popular", 3],
        ["Omar's", 2],
        ["Niche", 1],
      ]
    );
    assert.equal(res.body.items[0].quiz.answer, undefined);
    assert.equal((await api().get("/api/analytics/lessons/most-remembered?limit=1")).body.items.length, 1);

    res = await api().get("/api/analytics/teachers/top");
    assert.deepEqual(
      res.body.items.map((t) => [t.user.handle, t.learners, t.remembers, t.lessons]),
      [
        ["maya", 3, 4, 2], // omar, priya and sam; priya twice
        ["omar", 2, 2, 2],
      ]
    );

    res = await api().get("/api/analytics/community");
    assert.deepEqual(res.body, { users: 4, lessons: 4, remembers: 6, reviewsDone: 0, mastered: 0 });
  });

  it("validates the leaderboard limit", async () => {
    assert.equal((await api().get("/api/analytics/teachers/top?limit=0")).status, 400);
    assert.equal((await api().get("/api/analytics/lessons/most-remembered?limit=21")).status, 400);
  });
});

describe("my stats", () => {
  it("tracks streaks, mastery, due cards and weekly reviews in the user's time zone", async () => {
    // Day 1 is 2026-03-01 in New York (UTC-5 until 2026-03-08).
    clock.set("2026-03-01T15:00:00Z");
    const maya = await signup("maya");
    const omar = await signup("omar", { timezone: "America/New_York" });
    const lessons = [];
    for (let i = 0; i < 3; i += 1) lessons.push(await createLesson(maya, { title: `Lesson ${i}` }));
    const cards = [];
    for (const lesson of lessons) cards.push((await api().post(`/api/lessons/${lesson.id}/remember`).set(...omar.auth)).body.review);
    const stats = async () => (await api().get("/api/analytics/me").set(...omar.auth)).body.stats;

    assert.deepEqual(await stats(), {
      currentStreak: 0,
      bestStreak: 0,
      reviewedToday: false,
      mastered: 0,
      remembered: 3,
      dueToday: 0,
      reviewsThisWeek: 0,
      reviewsByDay: ["02-23", "02-24", "02-25", "02-26", "02-27", "02-28", "03-01"].map((d) => ({ date: `2026-${d}`, count: 0 })),
      timezone: "America/New_York",
    });

    // Day 2, late evening local time (03:30Z on the 3rd is still the 2nd in New York).
    clock.set("2026-03-03T03:30:00Z");
    assert.equal((await stats()).dueToday, 3);
    await api().post(`/api/reviews/${cards[0].id}/answer`).set(...omar.auth).send({ grade: "got" }).expect(200);
    let s = await stats();
    assert.equal(s.currentStreak, 1);
    assert.equal(s.reviewedToday, true);
    assert.equal(s.dueToday, 2);

    // Day 3: still alive before reviewing, then 2 after.
    clock.set("2026-03-03T14:00:00Z");
    s = await stats();
    assert.equal(s.currentStreak, 1);
    assert.equal(s.reviewedToday, false);
    await api().post(`/api/reviews/${cards[1].id}/answer`).set(...omar.auth).send({ grade: "forgot" }).expect(200);
    s = await stats();
    assert.equal(s.currentStreak, 2);
    assert.equal(s.bestStreak, 2);
    assert.equal(s.reviewsThisWeek, 2);
    // Per local day: the 03:30Z answer counts on the 2nd in New York, not the 3rd.
    assert.deepEqual(s.reviewsByDay.slice(-3), [
      { date: "2026-03-01", count: 0 },
      { date: "2026-03-02", count: 1 },
      { date: "2026-03-03", count: 1 },
    ]);
    assert.equal(s.reviewsByDay.length, 7);

    // Day 5: a day was missed, so the streak restarts at 1 while best stays 2.
    clock.set("2026-03-05T14:00:00Z");
    await api().post(`/api/reviews/${cards[2].id}/answer`).set(...omar.auth).send({ grade: "got" }).expect(200);
    s = await stats();
    assert.equal(s.currentStreak, 1);
    assert.equal(s.bestStreak, 2);

    // Push card 0 to mastery: due day 5 (3 days after day 2), then 7 days, then 30.
    let card = cards[0];
    for (const grade of ["got", "got"]) {
      const current = (await api().get("/api/reviews").set(...omar.auth)).body.items.find((r) => r.id === card.id);
      clock.set(current.dueAt);
      card = (await api().post(`/api/reviews/${card.id}/answer`).set(...omar.auth).send({ grade })).body.review;
    }
    assert.equal(card.interval, 30);
    s = await stats();
    assert.equal(s.mastered, 1);
    // The week only covers today and the six days before.
    assert.equal(s.reviewsThisWeek, 1);
    assert.equal(s.reviewsByDay.reduce((sum, d) => sum + d.count, 0), 1);

    const profile = await api().get("/api/users/omar");
    assert.equal(profile.body.stats.mastered, 1);
    assert.equal(profile.body.stats.bestStreak, 2);
  });

  it("requires a login", async () => {
    assert.equal((await api().get("/api/analytics/me")).status, 401);
  });
});
