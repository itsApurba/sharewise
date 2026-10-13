const { describe, it, before, after, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const jwt = require("jwt-simple");
const User = require("../src/api/models/user.model");
const { startDb, stopDb, resetDb, api, signup } = require("./helpers");

before(startDb);
after(stopDb);
beforeEach(resetDb);

const valid = { name: "Maya Chen", handle: "Maya_C", email: "Maya@Example.com", password: "correct horse", bio: "Hi", timezone: "Asia/Kolkata" };

describe("sign-up", () => {
  it("creates the user, returns a token and never the password", async () => {
    const res = await api().post("/api/auth/signup").send(valid);
    assert.equal(res.status, 201);
    assert.ok(res.body.token);
    assert.deepEqual(Object.keys(res.body.user).sort(), ["bio", "createdAt", "email", "handle", "id", "name", "timezone"]);
    assert.equal(res.body.user.handle, "maya_c");
    assert.equal(res.body.user.email, "maya@example.com");
    assert.equal(res.body.user.timezone, "Asia/Kolkata");
    assert.doesNotMatch(JSON.stringify(res.body), /correct horse|passwordHash/);

    const stored = await User.findOne({ handle: "maya_c" }).select("+passwordHash").lean();
    assert.match(stored.passwordHash, /^\$2[aby]\$10\$/);
  });

  it("defaults bio and timezone", async () => {
    const res = await api().post("/api/auth/signup").send({ ...valid, bio: undefined, timezone: undefined });
    assert.equal(res.status, 201);
    assert.equal(res.body.user.bio, "");
    assert.equal(res.body.user.timezone, "UTC");
  });

  it("reports every invalid field at once", async () => {
    const res = await api().post("/api/auth/signup").send({ handle: "no", email: "nope", password: "short", bio: "x".repeat(201), timezone: "Mars/Base" });
    assert.equal(res.status, 400);
    assert.equal(res.body.error.code, "VALIDATION");
    assert.deepEqual(Object.keys(res.body.error.fields).sort(), ["bio", "email", "handle", "name", "password", "timezone"]);
  });

  it("rejects an empty body with 400, not a crash", async () => {
    const res = await api().post("/api/auth/signup");
    assert.equal(res.status, 400);
    assert.ok(res.body.error.fields.email);
  });

  it("rejects wrong types", async () => {
    const res = await api().post("/api/auth/signup").send({ ...valid, name: 42, email: ["a@b.co"] });
    assert.equal(res.status, 400);
    assert.ok(res.body.error.fields.name);
    assert.ok(res.body.error.fields.email);
  });

  it("answers 409 for a taken email or handle", async () => {
    await api().post("/api/auth/signup").send(valid).expect(201);
    let res = await api().post("/api/auth/signup").send({ ...valid, handle: "other" });
    assert.equal(res.status, 409);
    assert.equal(res.body.error.code, "DUPLICATE");
    assert.ok(res.body.error.fields.email);

    res = await api().post("/api/auth/signup").send({ ...valid, email: "other@example.com", handle: "MAYA_C" });
    assert.equal(res.status, 409);
    assert.ok(res.body.error.fields.handle);
  });
});

describe("login and me", () => {
  it("logs in case-insensitively and returns me", async () => {
    await api().post("/api/auth/signup").send(valid).expect(201);
    const res = await api().post("/api/auth/login").send({ email: "MAYA@example.com", password: "correct horse" });
    assert.equal(res.status, 200);
    assert.equal(res.body.user.handle, "maya_c");

    const me = await api().get("/api/auth/me").set("Authorization", `Bearer ${res.body.token}`);
    assert.equal(me.status, 200);
    assert.equal(me.body.user.email, "maya@example.com");
    assert.equal(me.body.user.passwordHash, undefined);
  });

  it("answers 401 for a wrong password or unknown email, 400 for missing fields", async () => {
    await api().post("/api/auth/signup").send(valid).expect(201);
    let res = await api().post("/api/auth/login").send({ email: valid.email, password: "wrong password" });
    assert.equal(res.status, 401);
    assert.equal(res.body.error.message, "Invalid email or password");
    res = await api().post("/api/auth/login").send({ email: "nobody@example.com", password: "whatever1" });
    assert.equal(res.status, 401);
    res = await api().post("/api/auth/login").send({});
    assert.equal(res.status, 400);
    assert.deepEqual(Object.keys(res.body.error.fields).sort(), ["email", "password"]);
  });

  it("rejects missing, malformed, forged, expired and orphaned tokens", async () => {
    const { token, user } = await signup("maya");
    assert.equal((await api().get("/api/auth/me")).status, 401);
    assert.equal((await api().get("/api/auth/me").set("Authorization", token)).status, 401);
    assert.equal((await api().get("/api/auth/me").set("Authorization", "Bearer not.a.jwt")).status, 401);

    const forged = jwt.encode({ sub: user.id, exp: Math.floor(Date.now() / 1000) + 60 }, "other-secret", "HS256");
    assert.equal((await api().get("/api/auth/me").set("Authorization", `Bearer ${forged}`)).status, 401);

    const expired = jwt.encode({ sub: user.id, exp: Math.floor(Date.now() / 1000) - 60 }, "test-secret", "HS256");
    const res = await api().get("/api/auth/me").set("Authorization", `Bearer ${expired}`);
    assert.equal(res.status, 401);
    assert.equal(res.body.error.message, "Invalid or expired token");

    await User.deleteOne({ _id: user.id });
    assert.equal((await api().get("/api/auth/me").set("Authorization", `Bearer ${token}`)).status, 401);
  });
});

describe("PATCH /users/me", () => {
  it("updates profile fields and keeps the bio limit at 200", async () => {
    const maya = await signup("maya");
    let res = await api().patch("/api/users/me").set(...maya.auth).send({ name: "Maya C", bio: "x".repeat(200), timezone: "Europe/Berlin" });
    assert.equal(res.status, 200);
    assert.equal(res.body.user.bio.length, 200);
    assert.equal(res.body.user.timezone, "Europe/Berlin");

    res = await api().patch("/api/users/me").set(...maya.auth).send({ bio: "x".repeat(201) });
    assert.equal(res.status, 400);
    assert.match(res.body.error.fields.bio, /200/);
  });

  it("stores time zones canonically and rejects offsets", async () => {
    const maya = await signup("maya", { timezone: "america/new_york" });
    assert.equal((await api().get("/api/auth/me").set(...maya.auth)).body.user.timezone, "America/New_York");
    let res;
    for (const [handle, timezone] of [["omar", "asia/kolkata"], ["priya", "ASIA/KOLKATA"], ["noor", "Asia/Kolkata"], ["lee", "Asia/kolkata"]]) {
      const user = await signup(handle, { timezone });
      assert.equal(user.user.timezone, "Asia/Kolkata");
      res = await api().get("/api/analytics/me").set(...user.auth);
      assert.equal(res.status, 200);
      assert.equal(res.body.stats.timezone, "Asia/Kolkata");
    }

    res = await api().patch("/api/users/me").set(...maya.auth).send({ timezone: "europe/berlin" });
    assert.equal(res.status, 200);
    assert.equal(res.body.user.timezone, "Europe/Berlin");
    res = await api().get("/api/analytics/me").set(...maya.auth);
    assert.equal(res.status, 200);
    assert.equal(res.body.stats.timezone, "Europe/Berlin");
    assert.equal((await api().get("/api/users/maya")).status, 200);

    res = await api().patch("/api/users/me").set(...maya.auth).send({ timezone: "+01:00" });
    assert.equal(res.status, 400);
    assert.ok(res.body.error.fields.timezone);
    res = await api().post("/api/auth/signup").send({ name: "Sam", handle: "sam", email: "sam@example.com", password: "correct horse", timezone: "-05:00" });
    assert.equal(res.status, 400);
    assert.ok(res.body.error.fields.timezone);
  });

  it("does not need a bio (the old crash)", async () => {
    const maya = await signup("maya");
    const res = await api().patch("/api/users/me").set(...maya.auth).send({ name: "Only Name" });
    assert.equal(res.status, 200);
    assert.equal(res.body.user.name, "Only Name");
  });

  it("refuses email, password, empty and blank-name changes", async () => {
    const maya = await signup("maya");
    let res = await api().patch("/api/users/me").set(...maya.auth).send({ email: "new@example.com", password: "newpassword" });
    assert.equal(res.status, 400);
    assert.ok(res.body.error.fields.email && res.body.error.fields.password);
    assert.equal((await api().patch("/api/users/me").set(...maya.auth).send({})).status, 400);
    res = await api().patch("/api/users/me").set(...maya.auth).send({ name: "   " });
    assert.equal(res.status, 400);
    assert.ok(res.body.error.fields.name);
  });

  it("answers 409 for a taken handle", async () => {
    const maya = await signup("maya");
    await signup("omar");
    const res = await api().patch("/api/users/me").set(...maya.auth).send({ handle: "omar" });
    assert.equal(res.status, 409);
    assert.ok(res.body.error.fields.handle);
  });
});
