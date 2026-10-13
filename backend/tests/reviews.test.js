const { describe, it, before, after, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const ReviewLog = require("../src/api/models/reviewLog.model");
const { startDb, stopDb, resetDb, api, signup, createLesson, clock } = require("./helpers");

before(startDb);
after(stopDb);
beforeEach(resetDb);

const quizLesson = { title: "Nullish", body: "?? only falls back on null or undefined.", quiz: { prompt: "What is 0 ?? 5?", answer: "0" } };
const choiceLesson = { title: "BFS", body: "Queue.", quiz: { prompt: "BFS uses a?", choices: ["Stack", "Queue"], correctIndex: 1 } };

async function setup() {
  clock.set("2026-03-10T15:00:00Z");
  const maya = await signup("maya");
  const omar = await signup("omar", { timezone: "Asia/Kolkata" });
  const plain = await createLesson(maya);
  const text = await createLesson(maya, quizLesson);
  const choice = await createLesson(maya, choiceLesson);
  return { maya, omar, plain, text, choice };
}

const remember = (who, lesson) => api().post(`/api/lessons/${lesson.id}/remember`).set(...who.auth);
const answer = (who, review, body) => api().post(`/api/reviews/${review.id}/answer`).set(...who.auth).send(body);
const due = (who) => api().get("/api/reviews/due").set(...who.auth);

describe("remember", () => {
  it("creates a card due at the user's next local midnight", async () => {
    const { omar, plain } = await setup();
    const res = await remember(omar, plain);
    assert.equal(res.status, 201);
    assert.equal(res.body.rememberCount, 1);
    const { review } = res.body;
    assert.equal(review.lessonId, plain.id);
    assert.deepEqual(
      { ease: review.ease, interval: review.interval, repetitions: review.repetitions, lapses: review.lapses, mastered: review.mastered },
      { ease: 2.5, interval: 1, repetitions: 0, lapses: 0, mastered: false }
    );
    // 15:00Z on the 10th is 20:30 in Kolkata; next local midnight is the 11th 00:00 IST = 10th 18:30Z.
    assert.equal(review.dueAt, "2026-03-10T18:30:00.000Z");
  });

  it("is idempotent and shows up on the lesson", async () => {
    const { omar, plain } = await setup();
    const first = await remember(omar, plain);
    const again = await remember(omar, plain);
    assert.equal(again.status, 200);
    assert.equal(again.body.review.id, first.body.review.id);
    assert.equal(again.body.rememberCount, 1);
    const res = await api().get(`/api/lessons/${plain.id}`).set(...omar.auth);
    assert.equal(res.body.lesson.rememberCount, 1);
    assert.equal(res.body.lesson.viewer.remembered, true);
    assert.equal(res.body.lesson.viewer.reviewId, first.body.review.id);
  });

  it("forbids remembering your own lesson and needs a login", async () => {
    const { maya, plain } = await setup();
    assert.equal((await remember(maya, plain)).status, 403);
    assert.equal((await api().post(`/api/lessons/${plain.id}/remember`)).status, 401);
  });

  it("un-remembers by deleting the card", async () => {
    const { omar, plain } = await setup();
    await remember(omar, plain).expect(201);
    assert.equal((await api().delete(`/api/lessons/${plain.id}/remember`).set(...omar.auth)).status, 204);
    assert.equal((await api().delete(`/api/lessons/${plain.id}/remember`).set(...omar.auth)).status, 204);
    const res = await api().get("/api/reviews").set(...omar.auth);
    assert.deepEqual(res.body.items, []);
  });
});

describe("due reviews and answers", () => {
  it("lists only due cards, oldest first, with the quiz answer hidden", async () => {
    const { omar, text, choice, plain } = await setup();
    await remember(omar, text).expect(201);
    clock.set("2026-03-11T12:00:00Z");
    await remember(omar, choice).expect(201);
    await remember(omar, plain).expect(201);

    let res = await due(omar);
    assert.equal(res.body.items.length, 1);
    assert.equal(res.headers["x-due-count"], "1");

    clock.set("2026-03-12T00:00:00Z");
    res = await due(omar);
    assert.deepEqual(
      res.body.items.map((r) => r.lesson.title),
      ["Nullish", "BFS", "A useful lesson"]
    );
    for (const card of res.body.items) {
      assert.equal(card.lesson.quiz?.answer, undefined);
      assert.equal(card.lesson.quiz?.correctIndex, undefined);
    }
    // Even after answering the quiz elsewhere, review cards keep the answer hidden.
    await api().post(`/api/lessons/${choice.id}/quiz/answer`).set(...omar.auth).send({ choice: 1 }).expect(200);
    res = await due(omar);
    assert.equal(res.body.items[1].lesson.quiz.correctIndex, undefined);

    res = await api().get("/api/reviews").set(...omar.auth);
    assert.equal(res.body.items.length, 3);
  });

  it("walks a card up the 1, 3, 7, 30 day ladder and marks it mastered", async () => {
    const { omar, plain } = await setup();
    let review = (await remember(omar, plain)).body.review;
    const intervals = [];
    for (let i = 0; i < 3; i += 1) {
      clock.set(review.dueAt);
      const res = await answer(omar, review, { grade: "got" });
      assert.equal(res.status, 200);
      assert.deepEqual(res.body.result, { grade: "got", correct: null, correctAnswer: null });
      review = res.body.review;
      intervals.push(review.interval);
    }
    assert.deepEqual(intervals, [3, 7, 30]);
    assert.equal(review.mastered, true);
    assert.equal(review.repetitions, 3);
    assert.equal(await ReviewLog.countDocuments({ grade: "got" }), 3);
  });

  it("grades quiz answers server-side and reschedules", async () => {
    const { omar, text, choice } = await setup();
    const t = (await remember(omar, text)).body.review;
    const c = (await remember(omar, choice)).body.review;
    clock.set("2026-03-12T00:00:00Z");

    let res = await answer(omar, t, { answer: "5" });
    assert.equal(res.status, 200);
    assert.deepEqual(res.body.result, { grade: "forgot", correct: false, correctAnswer: { answer: "0" } });
    assert.equal(res.body.review.lapses, 1);
    assert.equal(res.body.review.ease, 2.3);

    res = await answer(omar, c, { choice: 1 });
    assert.deepEqual(res.body.result, { grade: "got", correct: true, correctAnswer: { correctIndex: 1, answer: "Queue" } });
    assert.equal(res.body.review.interval, 3);

    // The review answer counts as answering the quiz, so the lesson now reveals it.
    const lesson = await api().get(`/api/lessons/${text.id}`).set(...omar.auth);
    assert.equal(lesson.body.lesson.quiz.answer, "0");
    assert.equal(lesson.body.lesson.viewer.quizCorrect, false);
  });

  it("refuses cards that are not due, and double answers", async () => {
    const { omar, plain } = await setup();
    const review = (await remember(omar, plain)).body.review;
    let res = await answer(omar, review, { grade: "got" });
    assert.equal(res.status, 409);
    assert.equal(res.body.error.code, "NOT_DUE");

    clock.set(review.dueAt);
    await answer(omar, review, { grade: "got" }).expect(200);
    res = await answer(omar, review, { grade: "got" });
    assert.equal(res.status, 409);
    assert.equal(await ReviewLog.countDocuments(), 1);
  });

  it("validates the answer body", async () => {
    const { omar, plain, choice } = await setup();
    const p = (await remember(omar, plain)).body.review;
    const c = (await remember(omar, choice)).body.review;
    clock.set("2026-03-12T00:00:00Z");
    for (const [card, body] of [
      [p, {}],
      [p, { grade: "maybe" }],
      [p, { answer: "x" }], // no quiz on this lesson
      [c, { grade: "got", choice: 1 }],
      [c, { choice: 7 }],
      [c, { answer: "Queue" }], // choice quiz wants a choice
    ]) {
      const res = await answer(omar, card, body);
      assert.equal(res.status, 400, JSON.stringify(body));
      assert.equal(res.body.error.code, "VALIDATION");
    }
    // Self-grading still works on a quiz card.
    assert.equal((await answer(omar, c, { grade: "forgot" })).status, 200);
  });

  it("hides other users' cards and handles bad ids", async () => {
    const { maya, omar, plain } = await setup();
    const review = (await remember(omar, plain)).body.review;
    clock.set(review.dueAt);
    assert.equal((await answer(maya, review, { grade: "got" })).status, 404);
    assert.equal((await answer(omar, { id: "nope" }, { grade: "got" })).status, 404);
    assert.equal((await answer(omar, { id: "0123456789abcdef01234567" }, { grade: "got" })).status, 404);
    assert.equal((await api().get("/api/reviews/due")).status, 401);
  });
});
