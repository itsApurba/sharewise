const { describe, it, before, after, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const Deck = require("../src/api/models/deck.model");
const Review = require("../src/api/models/review.model");
const { seed } = require("../src/seed");
const data = require("../src/seed/data");
const { startDb, stopDb, resetDb, api, signup, createLesson, clock } = require("./helpers");

before(startDb);
after(stopDb);
beforeEach(resetDb);

const createDeck = (who, body) => api().post("/api/decks").set(...who.auth).send(body);
const addLesson = (who, deckId, lessonId) => api().post(`/api/decks/${deckId}/lessons`).set(...who.auth).send({ lessonId });

describe("decks", () => {
  it("creates a deck with defaults and validates input", async () => {
    const maya = await signup("maya");
    let res = await createDeck(maya, { title: "  JS gotchas " });
    assert.equal(res.status, 201);
    assert.equal(res.body.deck.title, "JS gotchas");
    assert.equal(res.body.deck.emoji, "📚");
    assert.equal(res.body.deck.color, "ember");
    assert.deepEqual(res.body.deck.viewer, { isOwner: true, remembered: 0, toRemember: 0 });

    res = await createDeck(maya, { title: "x", emoji: "ab", color: "neon" });
    assert.equal(res.status, 400);
    assert.deepEqual(Object.keys(res.body.error.fields).sort(), ["color", "emoji", "title"]);
    assert.equal((await createDeck(maya, { title: "Fine", emoji: "👩‍💻" })).status, 201);
    assert.equal((await api().post("/api/decks").send({ title: "Anon" })).status, 401);
  });

  it("adds anyone's lessons, removes them, and only the owner may change it", async () => {
    const maya = await signup("maya");
    const omar = await signup("omar");
    const mine = await createLesson(maya, { title: "Mine" });
    const theirs = await createLesson(omar, { title: "Theirs" });
    const deck = (await createDeck(maya, { title: "Mixed" })).body.deck;

    assert.equal((await addLesson(maya, deck.id, theirs.id)).status, 201);
    assert.equal((await addLesson(maya, deck.id, mine.id)).status, 201);
    const again = await addLesson(maya, deck.id, theirs.id);
    assert.equal(again.status, 200);
    assert.deepEqual(again.body.deck.lessonIds, [theirs.id, mine.id]);
    const upper = await addLesson(maya, deck.id, theirs.id.toUpperCase());
    assert.equal(upper.status, 200);
    assert.deepEqual(upper.body.deck.lessonIds, [theirs.id, mine.id]);

    assert.equal((await addLesson(omar, deck.id, theirs.id)).status, 403);
    assert.equal((await addLesson(maya, deck.id, "0123456789abcdef01234567")).status, 404);
    assert.equal((await api().patch(`/api/decks/${deck.id}`).set(...omar.auth).send({ title: "Mine now" })).status, 403);

    const page = await api().get(`/api/decks/${deck.id}`);
    assert.deepEqual(page.body.lessons.map((l) => l.title), ["Theirs", "Mine"]);
    assert.equal(page.body.deck.viewer, null);

    assert.equal((await api().delete(`/api/decks/${deck.id}/lessons/${theirs.id}`).set(...maya.auth)).status, 204);
    const updated = await api().patch(`/api/decks/${deck.id}`).set(...maya.auth).send({ color: "plum", description: "Now plum" });
    assert.equal(updated.status, 200);
    assert.equal(updated.body.deck.color, "plum");
    assert.deepEqual(updated.body.deck.lessonIds, [mine.id]);

    const listed = await api().get("/api/users/maya/decks");
    assert.deepEqual(listed.body.items.map((d) => d.title), ["Mixed"]);
    assert.equal((await api().delete(`/api/decks/${deck.id}`).set(...omar.auth)).status, 403);
    assert.equal((await api().delete(`/api/decks/${deck.id}`).set(...maya.auth)).status, 204);
    assert.equal((await api().get(`/api/decks/${deck.id}`)).status, 404);
  });

  it("remembers every lesson in one tap, skipping your own and ones already remembered", async () => {
    clock.set("2026-10-14T10:00:00Z");
    const maya = await signup("maya");
    const omar = await signup("omar");
    const lessons = [];
    for (const title of ["One", "Two", "Three"]) lessons.push(await createLesson(maya, { title }));
    const own = await createLesson(omar, { title: "Own" });
    const deck = (await createDeck(maya, { title: "Three things" })).body.deck;
    for (const l of [...lessons, own]) await addLesson(maya, deck.id, l.id).expect(201);

    await api().post(`/api/lessons/${lessons[0].id}/remember`).set(...omar.auth).expect(201);
    let res = await api().get(`/api/decks/${deck.id}`).set(...omar.auth);
    assert.deepEqual(res.body.deck.viewer, { isOwner: false, remembered: 1, toRemember: 2 });

    res = await api().post(`/api/decks/${deck.id}/remember`).set(...omar.auth);
    assert.equal(res.status, 201);
    assert.equal(res.body.remembered, 2);
    assert.equal(res.body.skipped, 2);
    assert.deepEqual(res.body.deck.viewer, { isOwner: false, remembered: 3, toRemember: 0 });
    assert.equal(res.body.deck.rememberCount, 3);
    assert.equal(await Review.countDocuments({ user: omar.user.id }), 3);

    res = await api().post(`/api/decks/${deck.id}/remember`).set(...omar.auth);
    assert.equal(res.status, 200);
    assert.equal(res.body.remembered, 0);
  });

  it("ranks popular decks by remember count and drops deleted lessons and users' decks", async () => {
    const maya = await signup("maya");
    const omar = await signup("omar");
    const lena = await signup("lena");
    const a = await createLesson(maya, { title: "Lesson A" });
    const b = await createLesson(maya, { title: "Lesson B" });
    const quiet = (await createDeck(omar, { title: "Quiet" })).body.deck;
    const loud = (await createDeck(lena, { title: "Loud" })).body.deck;
    await createDeck(lena, { title: "Empty" });
    await addLesson(omar, quiet.id, a.id);
    await addLesson(lena, loud.id, b.id);
    await api().post(`/api/lessons/${b.id}/remember`).set(...omar.auth);
    await api().post(`/api/lessons/${b.id}/remember`).set(...lena.auth);

    let res = await api().get("/api/decks/popular");
    assert.deepEqual(res.body.items.map((d) => [d.title, d.rememberCount]), [["Loud", 2], ["Quiet", 0]]);

    await api().delete(`/api/lessons/${b.id}`).set(...maya.auth).expect(204);
    assert.deepEqual((await Deck.findById(loud.id)).lessons, []);
    res = await api().get("/api/decks/popular");
    assert.deepEqual(res.body.items.map((d) => d.title), ["Quiet"]);

    await api().delete("/api/users/me").set(...omar.auth).expect(204);
    assert.equal(await Deck.countDocuments({ title: "Quiet" }), 0);
  });

  it("seeds demo decks whose lessons all exist", async () => {
    const now = new Date("2026-10-14T10:00:00Z");
    clock.set(now);
    await seed({ now });
    await seed({ now });
    assert.equal(await Deck.countDocuments(), data.decks.length);
    const res = await api().get("/api/decks/popular");
    assert.equal(res.body.items.length, data.decks.length);
    for (const deck of res.body.items) {
      const spec = data.decks.find((d) => d.title === deck.title);
      assert.equal(deck.lessonCount, spec.lessons.length, deck.title);
    }
    assert.ok(res.body.items[0].rememberCount > 0);
  });
});
