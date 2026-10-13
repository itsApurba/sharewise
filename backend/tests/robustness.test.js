// Regression tests for the backend bugs in the dev-setup report: crashes on bad ids or
// missing fields, hanging requests, 200s with error bodies, and a generic 500 for validation.
const { describe, it, before, after, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const { startDb, stopDb, resetDb, api, signup, createLesson } = require("./helpers");

before(startDb);
after(stopDb);
beforeEach(resetDb);

const alive = () => api().get("/api/").expect(200);

describe("bad input never crashes or hangs the server", () => {
  it("answers 404 for malformed and unknown ids on every id route", async () => {
    const maya = await signup("maya");
    const routes = [
      ["get", "/api/lessons/bad-id"],
      ["patch", "/api/lessons/bad-id"],
      ["delete", "/api/lessons/bad-id"],
      ["post", "/api/lessons/bad-id/remember"],
      ["delete", "/api/lessons/bad-id/remember"],
      ["post", "/api/lessons/bad-id/quiz/answer"],
      ["post", "/api/reviews/bad-id/answer"],
      ["get", "/api/lessons/0123456789abcdef01234567"],
      ["patch", "/api/lessons/0123456789abcdef01234567"],
      ["post", "/api/lessons/0123456789abcdef01234567/remember"],
    ];
    for (const [method, path] of routes) {
      const res = await api()[method](path).set(...maya.auth).timeout(5000).send({ title: "Valid title", grade: "got" });
      assert.equal(res.status, 404, `${method} ${path}`);
      assert.equal(res.body.error.code, "NOT_FOUND");
    }
    await alive();
  });

  it("rejects malformed JSON with 400", async () => {
    const res = await api().post("/api/auth/login").set("Content-Type", "application/json").send('{"email": ');
    assert.equal(res.status, 400);
    assert.equal(res.body.error.code, "BAD_JSON");
    await alive();
  });

  it("rejects non-object bodies on writes", async () => {
    const maya = await signup("maya");
    let res = await api().post("/api/lessons").set(...maya.auth).set("Content-Type", "application/json").send("[1,2]");
    assert.equal(res.status, 400);
    res = await api().post("/api/lessons").set(...maya.auth).set("Content-Type", "application/json").send('"text"');
    assert.equal(res.status, 400);
    res = await api().patch("/api/users/me").set(...maya.auth).set("Content-Type", "application/json").send("null");
    assert.equal(res.status, 400);
    await alive();
  });

  it("handles operator-shaped values as plain bad input", async () => {
    const maya = await signup("maya");
    let res = await api().post("/api/auth/login").send({ email: { $ne: null }, password: { $ne: null } });
    assert.equal(res.status, 400);
    // Express 5 parses queries flat, so bracket keys stay literal names and are ignored.
    res = await api().get("/api/users/maya/lessons?page[$gt]=1");
    assert.equal(res.status, 200);
    res = await api().get("/api/lessons/explore?tag[$ne]=x");
    assert.equal(res.status, 200);
    res = await api().patch("/api/users/me").set(...maya.auth).send({ bio: { $set: "x" } });
    assert.equal(res.status, 400);
    await alive();
  });

  it("answers unknown routes with a JSON 404", async () => {
    const res = await api().get("/api/posts");
    assert.equal(res.status, 404);
    assert.equal(res.body.error.code, "NOT_FOUND");
  });

  it("answers oversized bodies with 413", async () => {
    const maya = await signup("maya");
    const res = await api().post("/api/lessons").set(...maya.auth).send({ title: "Big", body: "x".repeat(200 * 1024) });
    assert.equal(res.status, 413);
    await alive();
  });
});

describe("the old user-id-in-the-body paths are gone", () => {
  it("ignores an author field and uses the token's user", async () => {
    const maya = await signup("maya");
    const omar = await signup("omar");
    const lesson = await createLesson(maya, { author: omar.user.id, user_id: omar.user.id });
    assert.equal(lesson.author.handle, "maya");
  });

  it("removed the unauthenticated user and post routes", async () => {
    const maya = await signup("maya");
    assert.equal((await api().put(`/api/users/${maya.user.id}`).send({ name: "x" })).status, 404);
    assert.equal((await api().delete(`/api/users/${maya.user.id}`)).status, 404);
    assert.equal((await api().post("/api/posts").send({ content: "x" })).status, 404);
  });
});
