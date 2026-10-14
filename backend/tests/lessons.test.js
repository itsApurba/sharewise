const { describe, it, before, after, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const QuizAttempt = require("../src/api/models/quizAttempt.model");
const Review = require("../src/api/models/review.model");
const { startDb, stopDb, resetDb, api, signup, createLesson } = require("./helpers");

before(startDb);
after(stopDb);
beforeEach(resetDb);

const full = {
  title: "Prefer const",
  body: "Use const by default.",
  code: { language: "JS", source: "const x = 1;\n\n" },
  link: "https://developer.mozilla.org/",
  tags: ["JS", "#tips", "js"],
  quiz: { prompt: "Default keyword?", choices: ["var", "let", "const"], correctIndex: 2 },
};

describe("lesson CRUD", () => {
  it("creates a lesson with normalized fields", async () => {
    const maya = await signup("maya");
    const res = await api().post("/api/lessons").set(...maya.auth).send(full);
    assert.equal(res.status, 201);
    const { lesson } = res.body;
    assert.equal(lesson.title, "Prefer const");
    assert.deepEqual(lesson.code, { language: "js", source: "const x = 1;" });
    assert.deepEqual(lesson.tags, ["js", "tips"]);
    assert.deepEqual(lesson.author, { id: maya.user.id, name: "Maya", handle: "maya" });
    assert.equal(lesson.rememberCount, 0);
    assert.deepEqual(lesson.viewer, { isAuthor: true, remembered: false, reviewId: null, quizAnswered: false, quizCorrect: null });
    // The author sees their own answer.
    assert.deepEqual(lesson.quiz, { prompt: "Default keyword?", kind: "choice", choices: ["var", "let", "const"], correctIndex: 2, answer: "const" });
  });

  it("defaults optional fields to null and []", async () => {
    const maya = await signup("maya");
    const lesson = await createLesson(maya);
    assert.equal(lesson.code, null);
    assert.equal(lesson.link, null);
    assert.equal(lesson.quiz, null);
    assert.deepEqual(lesson.tags, []);
  });

  it("requires a login to create", async () => {
    const res = await api().post("/api/lessons").send(full);
    assert.equal(res.status, 401);
  });

  it("validates every field with messages", async () => {
    const maya = await signup("maya");
    const res = await api()
      .post("/api/lessons")
      .set(...maya.auth)
      .send({
        title: "x",
        body: "",
        code: { source: "" },
        link: "javascript:alert(1)",
        tags: ["a", "b", "c", "d", "e", "f"],
        quiz: { prompt: "Q?", choices: ["same", "Same"], correctIndex: 5 },
      });
    assert.equal(res.status, 400);
    assert.deepEqual(Object.keys(res.body.error.fields).sort(), ["body", "code.source", "link", "quiz.choices", "quiz.correctIndex", "quiz.prompt", "tags", "title"]);
  });

  it("keeps a markdown body as written, up to 2000 characters", async () => {
    const maya = await signup("maya");
    const body = "**Bold** and `code`:\n\n- one\n\n```js\nconst x = 1;\n```\n<b>raw</b>";
    const ok = await api().post("/api/lessons").set(...maya.auth).send({ title: "Markdown", body: body + "x".repeat(2000 - body.length) });
    assert.equal(ok.status, 201);
    assert.ok(ok.body.lesson.body.startsWith(body));
    const long = await api().post("/api/lessons").set(...maya.auth).send({ title: "Too long", body: "x".repeat(2001) });
    assert.equal(long.status, 400);
    assert.ok(long.body.error.fields.body);
  });

  it("rejects a quiz with both an answer and choices, or neither", async () => {
    const maya = await signup("maya");
    for (const quiz of [{ prompt: "Which?", answer: "a", choices: ["a", "b"], correctIndex: 0 }, { prompt: "Which?" }, "text"]) {
      const res = await api().post("/api/lessons").set(...maya.auth).send({ title: "Quiz", body: "b", quiz });
      assert.equal(res.status, 400, JSON.stringify(quiz));
      assert.ok(res.body.error.fields.quiz);
    }
  });

  it("lets only the author edit, and clears fields with null", async () => {
    const maya = await signup("maya");
    const omar = await signup("omar");
    const lesson = await createLesson(maya, full);

    let res = await api().patch(`/api/lessons/${lesson.id}`).set(...omar.auth).send({ title: "Hijacked" });
    assert.equal(res.status, 403);
    assert.equal(res.body.error.code, "FORBIDDEN");
    assert.equal((await api().patch(`/api/lessons/${lesson.id}`).send({ title: "Anon" })).status, 401);

    res = await api().patch(`/api/lessons/${lesson.id}`).set(...maya.auth).send({ title: "Prefer const, really", code: null, link: null });
    assert.equal(res.status, 200);
    assert.equal(res.body.lesson.title, "Prefer const, really");
    assert.equal(res.body.lesson.body, "Use const by default.");
    assert.equal(res.body.lesson.code, null);
    assert.equal(res.body.lesson.link, null);
    assert.ok(res.body.lesson.quiz);

    assert.equal((await api().patch(`/api/lessons/${lesson.id}`).set(...maya.auth).send({})).status, 400);
    assert.equal((await api().patch(`/api/lessons/${lesson.id}`).set(...maya.auth).send({ title: "" })).status, 400);
  });

  it("lets only the author delete, and removes everyone's cards and quiz answers", async () => {
    const maya = await signup("maya");
    const omar = await signup("omar");
    const lesson = await createLesson(maya, full);
    await api().post(`/api/lessons/${lesson.id}/remember`).set(...omar.auth).expect(201);
    await api().post(`/api/lessons/${lesson.id}/quiz/answer`).set(...omar.auth).send({ choice: 2 }).expect(200);

    assert.equal((await api().delete(`/api/lessons/${lesson.id}`).set(...omar.auth)).status, 403);
    assert.equal((await api().delete(`/api/lessons/${lesson.id}`).set(...maya.auth)).status, 204);
    assert.equal((await api().get(`/api/lessons/${lesson.id}`)).status, 404);
    assert.equal(await Review.countDocuments(), 0);
    assert.equal(await QuizAttempt.countDocuments(), 0);
    assert.equal((await api().delete(`/api/lessons/${lesson.id}`).set(...maya.auth)).status, 404);
  });
});

describe("quiz answers stay hidden until answered", () => {
  it("hides the answer from logged-out viewers and other users", async () => {
    const maya = await signup("maya");
    const omar = await signup("omar");
    const text = await createLesson(maya, { title: "Nullish", body: "b", quiz: { prompt: "0 ?? 5 is?", answer: "0" } });
    const choice = await createLesson(maya, { ...full });

    for (const lesson of [text, choice]) {
      for (const req of [api().get(`/api/lessons/${lesson.id}`), api().get(`/api/lessons/${lesson.id}`).set(...omar.auth)]) {
        const res = await req;
        assert.equal(res.status, 200);
        assert.equal(res.body.lesson.quiz.answer, undefined);
        assert.equal(res.body.lesson.quiz.correctIndex, undefined);
      }
    }
    const explore = await api().get("/api/lessons/explore").set(...omar.auth);
    assert.doesNotMatch(JSON.stringify(explore.body), /correctIndex|"answer"/);
    const anon = await api().get("/api/lessons/explore");
    assert.equal(anon.body.items[0].viewer, null);
    assert.doesNotMatch(JSON.stringify(anon.body), /correctIndex|"answer"/);
  });

  it("grades an answer, records the first attempt and then reveals the answer", async () => {
    const maya = await signup("maya");
    const omar = await signup("omar");
    const lesson = await createLesson(maya, full);

    let res = await api().post(`/api/lessons/${lesson.id}/quiz/answer`).set(...omar.auth).send({ choice: 0 });
    assert.deepEqual(res.body, { correct: false, correctAnswer: { correctIndex: 2, answer: "const" } });
    res = await api().post(`/api/lessons/${lesson.id}/quiz/answer`).set(...omar.auth).send({ choice: 2 });
    assert.equal(res.body.correct, true);

    res = await api().get(`/api/lessons/${lesson.id}`).set(...omar.auth);
    assert.equal(res.body.lesson.quiz.correctIndex, 2);
    assert.equal(res.body.lesson.viewer.quizAnswered, true);
    assert.equal(res.body.lesson.viewer.quizCorrect, false); // the first attempt counts
  });

  it("checks answers for logged-out viewers without recording them", async () => {
    const maya = await signup("maya");
    const lesson = await createLesson(maya, { title: "STAR", body: "b", quiz: { prompt: "A stands for?", answer: "Action" } });
    const res = await api().post(`/api/lessons/${lesson.id}/quiz/answer`).send({ answer: " action. " });
    assert.deepEqual(res.body, { correct: true, correctAnswer: { answer: "Action" } });
    assert.equal(await QuizAttempt.countDocuments(), 0);
  });

  it("rejects the wrong answer shape and lessons without a quiz", async () => {
    const maya = await signup("maya");
    const quiz = await createLesson(maya, full);
    const plain = await createLesson(maya);
    assert.equal((await api().post(`/api/lessons/${quiz.id}/quiz/answer`).send({ answer: "const" })).status, 400);
    assert.equal((await api().post(`/api/lessons/${quiz.id}/quiz/answer`).send({ choice: "2" })).status, 400);
    assert.equal((await api().post(`/api/lessons/${plain.id}/quiz/answer`).send({ answer: "x" })).status, 404);
  });

  it("forgets earlier answers when the quiz changes", async () => {
    const maya = await signup("maya");
    const omar = await signup("omar");
    const lesson = await createLesson(maya, full);
    await api().post(`/api/lessons/${lesson.id}/quiz/answer`).set(...omar.auth).send({ choice: 2 }).expect(200);
    await api()
      .patch(`/api/lessons/${lesson.id}`)
      .set(...maya.auth)
      .send({ quiz: { prompt: "New question?", answer: "yes" } })
      .expect(200);
    const res = await api().get(`/api/lessons/${lesson.id}`).set(...omar.auth);
    assert.equal(res.body.lesson.viewer.quizAnswered, false);
    assert.equal(res.body.lesson.quiz.answer, undefined);
  });
});

describe("explore and tags", () => {
  it("lists newest first, paginates and filters by tag", async () => {
    const maya = await signup("maya");
    for (let i = 1; i <= 5; i += 1) await createLesson(maya, { title: `Lesson ${i}`, tags: i % 2 ? ["css"] : ["js"] });

    let res = await api().get("/api/lessons/explore?limit=2");
    assert.deepEqual(
      res.body.items.map((l) => l.title),
      ["Lesson 5", "Lesson 4"]
    );
    assert.equal(res.body.hasMore, true);
    res = await api().get("/api/lessons/explore?limit=2&page=3");
    assert.deepEqual(
      res.body.items.map((l) => l.title),
      ["Lesson 1"]
    );
    assert.equal(res.body.hasMore, false);

    res = await api().get("/api/lessons/explore?tag=%23JS");
    assert.deepEqual(
      res.body.items.map((l) => l.title),
      ["Lesson 4", "Lesson 2"]
    );

    res = await api().get("/api/lessons/tags");
    assert.deepEqual(res.body.items, [
      { tag: "css", lessons: 3 },
      { tag: "js", lessons: 2 },
    ]);
  });

  it("rejects bad pagination", async () => {
    for (const q of ["page=0", "page=abc", "limit=0", "limit=51", "limit=2.5"]) {
      const res = await api().get(`/api/lessons/explore?${q}`);
      assert.equal(res.status, 400, q);
      assert.equal(res.body.error.code, "VALIDATION");
    }
  });
});
